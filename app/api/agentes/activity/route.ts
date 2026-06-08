import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/agente-token";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { enviarEmailBienvenidaPortalAgente } from "@/lib/emails";

async function getAgenteFromToken(req: NextRequest) {
  const token = req.headers.get("x-agente-token") || req.nextUrl.searchParams.get("token");
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const { data } = await supabase.from("agentes").select("*").eq("id", payload.agenteId).single();
  return data || null;
}

export async function GET(req: NextRequest) {
  const agente = await getAgenteFromToken(req);
  if (!agente) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ahora = new Date().toISOString();

  // Detectar primer acceso al portal
  const esPrimerAcceso = !agente.primer_acceso_portal;
  if (esPrimerAcceso) {
    await supabase.from("agentes").update({
      ultimo_acceso: ahora,
      primer_acceso_portal: ahora,
    }).eq("id", agente.id);

    // Email de bienvenida al portal — una sola vez
    enviarEmailBienvenidaPortalAgente({
      email: agente.email,
      nombre: agente.nombre,
      codigo: agente.codigo,
    }).catch(console.error);
  } else {
    await supabase.from("agentes").update({ ultimo_acceso: ahora }).eq("id", agente.id);
  }

  const { data: ventas } = await supabase
    .from("ventas").select("*").eq("agente_id", agente.id).order("creado_at", { ascending: false });

  return NextResponse.json({ agente, ventas: ventas || [] });
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`agente-activity:${ip}`, { windowMs: 60 * 60 * 1000, max: 30 });
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });

  const agente = await getAgenteFromToken(req);
  if (!agente) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Leer body UNA sola vez
  const body = await req.json();
  const { accion, mensaje, ausente_hasta, metodo_cobro, datos_cobro, contacto_alternativo } = body;

  if (accion === "actualizar_perfil") {
    const updates: Record<string, unknown> = { ultimo_acceso: new Date().toISOString() };
    if (metodo_cobro !== undefined) updates.metodo_cobro = metodo_cobro;
    if (datos_cobro !== undefined) updates.datos_cobro = datos_cobro;
    if (contacto_alternativo !== undefined) updates.contacto_alternativo = contacto_alternativo;
    const { data: updated } = await supabase.from("agentes").update(updates).eq("id", agente.id).select().single();
    return NextResponse.json({ ok: true, agente: updated });
  }

  if (accion === "obtener_ultimo_reporte") {
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
    inicioSemana.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("activity_logs")
      .select("detalle, creado_at")
      .eq("accion", "reporte_agente")
      .eq("objetivo_id", agente.id)
      .gte("creado_at", inicioSemana.toISOString())
      .order("creado_at", { ascending: false })
      .limit(1)
      .single();
    return NextResponse.json({ ok: true, texto: data?.detalle || "" });
  }

  if (accion === "reporte") {
    if (!mensaje?.trim()) return NextResponse.json({ error: "Mensaje requerido." }, { status: 400 });
    await supabase.from("activity_logs").insert({
      admin: agente.email, accion: "reporte_agente",
      objetivo_tipo: "agente", objetivo_id: agente.id,
      detalle: mensaje.trim(),
    });
    await supabase.from("agentes").update({
      ultimo_reporte: new Date().toISOString(),
      ultimo_acceso: new Date().toISOString(),
      reportes_sin_rellenar: 0,
    }).eq("id", agente.id);
    return NextResponse.json({ ok: true });
  }

  if (accion === "ausente") {
    if (!ausente_hasta) return NextResponse.json({ error: "Fecha requerida." }, { status: 400 });
    await supabase.from("agentes").update({
      ausente_hasta,
      estado_agente: "ausente",
      ultimo_acceso: new Date().toISOString(),
    }).eq("id", agente.id);
    await supabase.from("activity_logs").insert({
      admin: agente.email, accion: "agente_ausente",
      objetivo_tipo: "agente", objetivo_id: agente.id,
      detalle: `Ausente hasta ${ausente_hasta}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (accion === "volver_ausente") {
    await supabase.from("agentes").update({
      ausente_hasta: null,
      estado_agente: "activo",
      ultimo_acceso: new Date().toISOString(),
    }).eq("id", agente.id);
    return NextResponse.json({ ok: true });
  }

  if (accion === "ping") {
    await supabase.from("agentes").update({ ultimo_acceso: new Date().toISOString() }).eq("id", agente.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
