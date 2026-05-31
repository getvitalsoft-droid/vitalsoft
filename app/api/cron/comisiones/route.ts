import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { enviarEmailAgenteComisionDisponible, enviarEmailClienteReactivada } from "@/lib/emails";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "getvitalsoft@gmail.com";
const SITE = "https://vitalsoft.pro";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultados: Record<string, number> = {
    comisiones_liberadas: 0, comisiones_bloqueadas: 0, recordatorios_onboarding: 0,
    pausas_reactivadas: 0, errores: 0,
  };

  // ── 1. Liberar comisiones cuyo hold venció ────────────────────────────────
  try {
    const { data: ventas, error } = await supabase
      .from("ventas")
      .select("*, agentes(*)")
      .eq("estado", "pendiente_validacion")
      .eq("sospechoso", false)
      .lte("disponible_at", new Date().toISOString());

    if (!error && ventas) {
      for (const venta of ventas) {
        try {
          if (venta.agentes?.bloqueado) {
            await supabase.from("ventas").update({ estado: "invalida", notas_admin: "Agente bloqueado al liberar comisión" }).eq("id", venta.id);
            await supabase.from("activity_logs").insert({ admin: "cron", accion: "comision_bloqueada", objetivo_tipo: "venta", objetivo_id: venta.id, detalle: `Agente ${venta.agente_codigo} bloqueado` });
            resultados.comisiones_bloqueadas++;
            continue;
          }
          await supabase.from("ventas").update({ estado: "disponible" }).eq("id", venta.id);
          await supabase.from("activity_logs").insert({ admin: "cron", accion: "comision_disponible", objetivo_tipo: "venta", objetivo_id: venta.id, detalle: `€${(Number(venta.importe) * 0.20).toFixed(2)} disponible · agente ${venta.agente_codigo || "directo"}` });
          if (venta.agentes) {
            const comision = Math.round(Number(venta.importe) * 0.20 * 100) / 100;
            await enviarEmailAgenteComisionDisponible({ agente: venta.agentes, comision, plan: venta.plan });
          }
          resultados.comisiones_liberadas++;
        } catch (err) {
          console.error(`[Cron] Error venta ${venta.id}:`, err);
          resultados.errores++;
        }
      }
    }
  } catch (err) { console.error("[Cron] Error comisiones:", err); }

  // ── 2. Detectar orders atascados en onboarding_pendiente (más de 48h) ────
  try {
    const limite48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: atascados } = await supabase
      .from("orders")
      .select("id, cliente_email, plan, stripe_session_id, fecha_pago")
      .eq("estado", "onboarding_pendiente")
      .lt("fecha_pago", limite48h);

    if (atascados && atascados.length > 0) {
      // Email admin con resumen de atascados
      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `⚠️ ${atascados.length} cliente(s) sin completar onboarding`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;background:#0d0d0d;color:#f0f0f0;padding:28px;border-radius:12px">
            <div style="color:#d4f53c;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px">VitalSoft Admin</div>
            <h2 style="font-size:18px;font-weight:500;margin-bottom:8px">Clientes sin onboarding (+48h)</h2>
            <p style="color:#666;font-size:13px;margin-bottom:20px">Estos clientes pagaron hace más de 48h y no han completado el formulario de configuración.</p>
            <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:16px">
              ${atascados.map(o => `
                <div style="padding:8px 0;border-bottom:1px solid #2a2a2a;font-size:13px">
                  <strong>${o.cliente_email}</strong> · ${o.plan}<br>
                  <span style="color:#666;font-size:12px">Pagó el ${new Date(o.fecha_pago).toLocaleDateString("es-ES")}</span>
                  <a href="${SITE}/onboarding?session=${o.stripe_session_id}" style="display:inline-block;margin-left:8px;color:#d4f53c;font-size:12px">Link onboarding →</a>
                </div>
              `).join("")}
            </div>
            <a href="${SITE}/admin" style="display:inline-block;background:#d4f53c;color:#080808;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Ver en admin →</a>
          </div>`,
      });

      // Recordatorio por email a cada cliente atascado (solo 1 vez — si no tiene log de recordatorio)
      for (const order of atascados) {
        try {
          const { data: yaEnviado } = await supabase
            .from("email_logs")
            .select("id")
            .eq("destinatario", order.cliente_email)
            .eq("tipo_email", "recordatorio_onboarding")
            .single();

          if (!yaEnviado) {
            await resend.emails.send({
              from: FROM,
              to: order.cliente_email,
              subject: `Configura tu proyecto VitalSoft — solo tarda 2 minutos`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;background:#0d0d0d;color:#f0f0f0;padding:28px;border-radius:12px">
                  <div style="color:#d4f53c;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px">VitalSoft</div>
                  <h2 style="font-size:18px;font-weight:500;margin-bottom:8px">Tu suscripción está activa</h2>
                  <p style="color:#888;font-size:13px;line-height:1.7;margin-bottom:20px">
                    Falta un paso para empezar: necesitamos la información de tu proyecto para producir tus clips.<br>
                    Solo tarda 2 minutos.
                  </p>
                  <a href="${SITE}/onboarding?session=${order.stripe_session_id}" style="display:inline-block;background:#d4f53c;color:#080808;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Completar configuración →</a>
                  <p style="color:#444;font-size:11px;margin-top:20px">El plazo de entrega empieza cuando recibimos tu material, no antes.</p>
                </div>`,
            });

            await supabase.from("email_logs").insert({
              destinatario: order.cliente_email,
              tipo_email: "recordatorio_onboarding",
              evento: "cron_diario",
              estado: "enviado",
            });

            resultados.recordatorios_onboarding++;
          }
        } catch (err) {
          console.error(`[Cron] Error recordatorio ${order.cliente_email}:`, err);
        }
      }
    }
  } catch (err) { console.error("[Cron] Error onboarding check:", err); }


  // ── 3. Reactivar pausas vencidas ─────────────────────────────────────────
  try {
    const { data: pausadas } = await supabase
      .from("orders")
      .select("id, cliente_email, cliente_nombre")
      .eq("is_paused", true)
      .lte("pause_until", new Date().toISOString());

    if (pausadas) {
      for (const order of pausadas) {
        try {
          await supabase.from("orders").update({
            is_paused: false,
            paused_at: null,
            pause_until: null,
            pause_reason: null,
            estado: "esperando_material",
          }).eq("id", order.id);

          await supabase.from("activity_logs").insert({
            admin: "cron", accion: "pausa_reactivada_automaticamente",
            objetivo_tipo: "order", objetivo_id: order.id,
            detalle: `Pausa de 30 días vencida · ${order.cliente_email}`,
          });

          await enviarEmailClienteReactivada({
            email: order.cliente_email,
            nombre: order.cliente_nombre,
          }).catch(e => console.error("[Cron] Email reactivacion:", e));
        } catch (err) {
          console.error(`[Cron] Error reactivando pausa ${order.id}:`, err);
          resultados.errores++;
        }
      }
    }
  } catch (err) { console.error("[Cron] Error check pausas:", err); }

  return NextResponse.json(resultados);
}
