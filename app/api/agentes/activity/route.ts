import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "../magic/route";
import { rateLimit, getIP } from "@/lib/rateLimit";

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

  // Registrar último acceso
  await supabase.from("agentes").update({ ultimo_acceso: new Date().toISOString() }).eq("id", agente.id);

  const { data: ventas } = await supabase.from("ventas").select("*").eq("agente_id", agente.id).order("creado_at", { ascending: false });

  return NextResponse.json({ agente, ventas: ventas || [] });
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`agente-activity:${ip}`, { windowMs: 60 * 60 * 1000, max: 30 });
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });

  const agente = await getAgenteFromToken(req);
  if (!agente) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { accion, mensaje, pausa_hasta } = await req.json();

  if (accion === "reporte") {
    if (!mensaje?.trim()) return NextResponse.json({ error: "Mensaje requerido." }, { status: 400 });
    await supabase.from("activity_logs").insert({
      admin: agente.email, accion: "reporte_agente",
      objetivo_tipo: "agente", objetivo_id: agente.id,
      detalle: mensaje.trim(),
    });
    await supabase.from("agentes").update({ ultimo_reporte: new Date().toISOString(), ultimo_acceso: new Date().toISOString() }).eq("id", agente.id);
    return NextResponse.json({ ok: true });
  }

  if (accion === "pausar") {
    const hasta = pausa_hasta || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("agentes").update({ pausado: true, pausado_hasta: hasta, ultimo_acceso: new Date().toISOString() }).eq("id", agente.id);
    await supabase.from("activity_logs").insert({ admin: agente.email, accion: "agente_pausa", objetivo_tipo: "agente", objetivo_id: agente.id, detalle: `Pausa hasta ${hasta}` });
    return NextResponse.json({ ok: true });
  }

  if (accion === "reactivar") {
    await supabase.from("agentes").update({ pausado: false, pausado_hasta: null, ultimo_acceso: new Date().toISOString() }).eq("id", agente.id);
    await supabase.from("activity_logs").insert({ admin: agente.email, accion: "agente_reactivacion", objetivo_tipo: "agente", objetivo_id: agente.id });
    return NextResponse.json({ ok: true });
  }

  if (accion === "ping") {
    // Señal de actividad — evita que la cuenta pase a inactiva
    await supabase.from("agentes").update({ ultimo_acceso: new Date().toISOString() }).eq("id", agente.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
