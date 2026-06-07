import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  enviarEmailClientePausada, enviarEmailClienteReactivada,
  enviarEmailAdminClientePausado, enviarEmailClienteEntregaCompletada,
} from "@/lib/emails";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
}

const ESTADOS_VALIDOS = [
  "pago_realizado", "onboarding_pendiente", "esperando_material",
  "material_recibido", "material_invalido", "validado",
  "en_edicion", "revision", "completado", "pausado", "cancelado"
];

// GET — listar orders con filtros
export async function GET(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { searchParams } = req.nextUrl;
  const estado = searchParams.get("estado");

  let query = supabaseAdmin.from("orders").select("*").order("creado_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data, total: data?.length ?? 0 });
}

// PATCH — acciones sobre orders
export async function PATCH(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { accion, order_id, venta_id, estado, agente_codigo, motivo, nota } = await req.json();

  const log = async (a: string, detalle?: string) => {
    try {
      await supabaseAdmin.from("activity_logs").insert({
        admin: "admin", accion: a, objetivo_tipo: "order", objetivo_id: order_id, detalle,
      });
    } catch (e) { console.error(e); }
  };

  // Cambiar estado del order
  if (accion === "cambiar_estado") {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    const updates: Record<string, any> = { estado };
    if (estado === "material_invalido") updates.notas_admin = motivo || "Material no válido";
    if (estado === "en_edicion") updates.fecha_validacion = new Date().toISOString();
    if (estado === "completado") {
      updates.fecha_entrega = new Date().toISOString();
      updates.review_shown_at = null; // reset so banner shows again in client portal
      // Increment completions counter (we read current value first)
      const { data: current } = await supabaseAdmin
        .from("orders").select("review_completions").eq("id", order_id).single();
      updates.review_completions = ((current?.review_completions) || 0) + 1;
    }

    const { data, error } = await supabaseAdmin.from("orders").update(updates).eq("id", order_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log(`estado_${estado}`, motivo);

    // Si completado → email de entrega al cliente
    if (estado === "completado" && data.cliente_email) {
      await enviarEmailClienteEntregaCompletada({
        email: data.cliente_email,
        nombre: data.cliente_nombre,
        plan: data.plan || "Plan VitalSoft",
        driveFolder: data.drive_folder || null,
        completions: data.review_completions || 1,
      }).catch(console.error);
    }

    // Si material inválido → email al cliente
    if (estado === "material_invalido" && data.cliente_email) {
      await resend.emails.send({
        from: FROM,
        to: data.cliente_email,
        subject: `Revisión necesaria en tu material — VitalSoft`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;background:#0d0d0d;color:#f0f0f0;padding:28px;border-radius:12px">
            <div style="color:#d4f53c;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px">VitalSoft</div>
            <h2 style="font-size:18px;font-weight:500;margin-bottom:8px">Necesitamos revisar tu material</h2>
            <p style="color:#888;font-size:13px;line-height:1.7;margin-bottom:16px">
              Hemos revisado el material que nos enviaste y encontramos algunos problemas que necesitan corrección antes de empezar la edición.
            </p>
            ${motivo ? `<div style="background:#1a1a1a;border-radius:8px;padding:14px;margin-bottom:16px;font-size:13px;color:#aaa">${motivo}</div>` : ""}
            <p style="color:#888;font-size:13px;line-height:1.7">
              Por favor, sube el material corregido a tu carpeta Drive. El plazo de entrega empezará de nuevo cuando validemos el nuevo material.
            </p>
            <p style="color:#555;font-size:11px;margin-top:20px">¿Tienes dudas? Escríbenos a <a href="mailto:${process.env.ADMIN_EMAIL}" style="color:#d4f53c">${process.env.ADMIN_EMAIL}</a></p>
          </div>`,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, order: data });
  }

  // Asignar agente a una venta manualmente
  if (accion === "asignar_agente") {
    if (!agente_codigo || !venta_id) return NextResponse.json({ error: "agente_codigo y venta_id requeridos" }, { status: 400 });

    // Verificar que el agente existe y está aprobado
    const { data: agente, error: agenteErr } = await supabaseAdmin
      .from("agentes").select("*").eq("codigo", agente_codigo.toUpperCase()).single();
    if (agenteErr || !agente) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    if (!agente.aprobado || agente.bloqueado) return NextResponse.json({ error: "El agente no está activo" }, { status: 400 });

    // Actualizar venta
    const { data: venta, error: ventaErr } = await supabaseAdmin
      .from("ventas")
      .update({ agente_id: agente.id, agente_codigo: agente.codigo, notas_admin: `Agente asignado manualmente: ${nota || ""}` })
      .eq("id", venta_id).select().single();
    if (ventaErr) return NextResponse.json({ error: ventaErr.message }, { status: 500 });

    // Actualizar order también
    if (order_id) {
      await supabaseAdmin.from("orders").update({ agente_codigo: agente.codigo }).eq("id", order_id);
    }

    await log("agente_asignado_manual", `Agente ${agente.codigo} asignado a venta ${venta_id}. Motivo: ${nota || "sin nota"}`);

    return NextResponse.json({ success: true, venta, agente });
  }

  // Añadir nota interna al order
  if (accion === "añadir_nota") {
    const { data, error } = await supabaseAdmin.from("orders")
      .update({ notas_admin: nota }).eq("id", order_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("nota_añadida", nota);
    return NextResponse.json({ success: true, order: data });
  }

  // ── Pausar suscripción ─────────────────────────────────────────────────
  if (accion === "pausar") {
    const pauseDays = 30;
    const pauseUntil = new Date(Date.now() + pauseDays * 86400000);
    const pauseUntilStr = pauseUntil.toLocaleDateString("es-ES");

    const { data, error } = await supabaseAdmin.from("orders")
      .update({
        is_paused: true,
        paused_at: new Date().toISOString(),
        pause_until: pauseUntil.toISOString(),
        pause_reason: motivo || null,
        estado: "pausado",
      })
      .eq("id", order_id)
      .not("estado", "eq", "cancelado")
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("suscripcion_pausada", `Hasta ${pauseUntilStr}. Motivo: ${motivo || "sin motivo"}`);

    await Promise.allSettled([
      enviarEmailClientePausada({
        email: data.cliente_email,
        nombre: data.cliente_nombre,
        pauseUntil: pauseUntilStr,
        motivo,
      }),
      enviarEmailAdminClientePausado({
        clienteEmail: data.cliente_email,
        pauseUntil: pauseUntilStr,
        motivo,
      }),
    ]);

    return NextResponse.json({ success: true, order: data });
  }

  // ── Reactivar suscripción manualmente ──────────────────────────────────
  if (accion === "reactivar") {
    const { data, error } = await supabaseAdmin.from("orders")
      .update({
        is_paused: false,
        paused_at: null,
        pause_until: null,
        pause_reason: null,
        estado: "esperando_material",
      })
      .eq("id", order_id)
      .eq("is_paused", true)
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("suscripcion_reactivada", "Reactivación manual por admin");

    await enviarEmailClienteReactivada({
      email: data.cliente_email,
      nombre: data.cliente_nombre,
    }).catch(console.error);

    return NextResponse.json({ success: true, order: data });
  }

  // ── Otorgar crédito por error (service credit) ──────────────────────────
  // Delegamos a /api/admin/credits para mantener separación de concerns
  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
