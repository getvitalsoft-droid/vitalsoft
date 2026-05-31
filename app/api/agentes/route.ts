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

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase.from("agentes").select("*, ventas(*)").order("creado_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agentes: data, total: data?.length ?? 0 });
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

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { accion, agente_id, venta_id, motivo_bloqueo, notas_admin } = await req.json();

  if (accion === "aprobar") {
    const { data, error } = await supabase.from("agentes").update({ aprobado: true, bloqueado: false, aprobado_at: new Date().toISOString(), notas_admin }).eq("id", agente_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("aprobar_agente", agente_id, notas_admin);
    try { await enviarEmailBienvenidaAgente({ agente: data, links: buildLinks(data.codigo) }); } catch (e) { console.error(e); }
    return NextResponse.json({ success: true, agente: data });
  }
  if (accion === "bloquear") {
    const { data, error } = await supabase.from("agentes").update({ aprobado: false, bloqueado: true, bloqueado_at: new Date().toISOString(), motivo_bloqueo, notas_admin }).eq("id", agente_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("bloquear_agente", agente_id, motivo_bloqueo);
    try { await enviarEmailAgenteBloqueo({ agente: data, motivo: motivo_bloqueo }); } catch (e) { console.error(e); }
    return NextResponse.json({ success: true, agente: data });
  }
  if (accion === "reactivar") {
    const { data, error } = await supabase.from("agentes").update({ aprobado: true, bloqueado: false }).eq("id", agente_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("reactivar_agente", agente_id);
    return NextResponse.json({ success: true, agente: data });
  }
  if (accion === "marcar_pagado") {
    const { data: venta, error } = await supabase.from("ventas").update({ estado: "pagada", pagado_at: new Date().toISOString(), pagado_por: "admin" }).eq("id", venta_id).select("*, agentes(*)").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("marcar_pagado", venta_id, undefined, "venta");
    if (venta.agentes) {
      const comision = Math.round(Number(venta.importe) * 0.20 * 100) / 100;
      try { await enviarEmailAgenteComisionPagada({ agente: venta.agentes, comision, plan: venta.plan }); } catch (e) { console.error(e); }
    }
    return NextResponse.json({ success: true, venta });
  }
  if (accion === "invalidar_venta") {
    const { data, error } = await supabase.from("ventas").update({ estado: "invalida", notas_admin: motivo_bloqueo }).eq("id", venta_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("invalidar_venta", venta_id, motivo_bloqueo, "venta");
    return NextResponse.json({ success: true, venta: data });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
