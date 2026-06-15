import { NextRequest, NextResponse } from "next/server";
import { supabase, generarCodigo } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";
import {
  enviarEmailBienvenidaAgente, enviarEmailAgenteBloqueo,
  enviarEmailAgenteComisionPagada, enviarEmailAdminNuevoPendiente,
} from "@/lib/emails";

function buildLinks(codigo: string) {
  const base = "https://vitalsoft.pro";
  return {
    general: `${base}?ref=${codigo}`,
    starter: `${base}/pagar?ref=${codigo}&clips=10`,
    growth:  `${base}/pagar?ref=${codigo}&clips=20`,
    scale:   `${base}/pagar?ref=${codigo}&clips=30`,
    pro:     `${base}/pagar?ref=${codigo}&clips=40`,
  };
}

async function log(accion: string, objetivo_id?: string, detalle?: string, tipo = "agente") {
  try {
    await supabase.from("activity_logs").insert({ admin: "system", accion, objetivo_tipo: tipo, objetivo_id, detalle });
  } catch (e) { console.error("Log error:", e); }
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`agentes:${ip}`, LIMITS.agentesRegistro);
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });

  try {
    const { nombre, email } = await req.json();
    if (!nombre?.trim() || !email?.trim()) return NextResponse.json({ error: "Nombre y email requeridos." }, { status: 400 });
    const emailLower = email.trim().toLowerCase();

    const { data: existente } = await supabase.from("agentes").select("*, ventas(*)").eq("email", emailLower).single();
    if (existente) {
      if (existente.bloqueado) return NextResponse.json({ error: "Cuenta desactivada. Contacta con VitalSoft." }, { status: 403 });
      return NextResponse.json({ agente: existente, aprobado: existente.aprobado, pendiente: !existente.aprobado, mensaje: existente.aprobado ? `¡Bienvenido de nuevo ${existente.nombre}!` : "Solicitud pendiente de aprobación.", links: existente.aprobado ? buildLinks(existente.codigo) : null });
    }

    let codigo = generarCodigo(nombre);
    const { data: cod } = await supabase.from("agentes").select("id").eq("codigo", codigo).single();
    if (cod) codigo = generarCodigo(nombre + Date.now());

    const { data: nuevo, error: err } = await supabase.from("agentes").insert({ nombre: nombre.trim(), email: emailLower, codigo, aprobado: false }).select().single();
    if (err) return NextResponse.json({ error: err.message }, { status: 500 });

    await log("solicitud_agente", nuevo.id, `${nombre} (${emailLower}) IP:${ip}`);
    try { await enviarEmailAdminNuevoPendiente({ nombre: nuevo.nombre, email: nuevo.email }); } catch (e) { console.error(e); }

    return NextResponse.json({ agente: { ...nuevo, ventas: [] }, aprobado: false, pendiente: true, mensaje: "Solicitud recibida. Te avisaremos en 24–48h.", links: null }, { status: 201 });
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }); }
}

