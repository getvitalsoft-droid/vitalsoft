// Endpoint exclusivo para el panel admin — autenticado por sesión Supabase JWT
// No usa ADMIN_TOKEN visible en el cliente
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  enviarEmailBienvenidaAgente, enviarEmailAgenteBloqueo,
  enviarEmailAgenteComisionPagada,
} from "@/lib/emails";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
}

function buildLinks(codigo: string) {
  const base = "https://vitalsoft.pro";
  return { general: `${base}?ref=${codigo}`, starter: `${base}/starter?ref=${codigo}`, growth: `${base}/growth?ref=${codigo}`, scale: `${base}/scale?ref=${codigo}`, pro: `${base}/pro?ref=${codigo}` };
}

export async function GET(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("agentes").select("*, ventas(*)").order("creado_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agentes: data, total: data?.length ?? 0 });
}

export async function PATCH(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { accion, agente_id, venta_id, motivo_bloqueo, notas_admin } = await req.json();

  const log = async (a: string, id: string, detalle?: string, tipo = "agente") => {
    try {
      await supabaseAdmin.from("activity_logs").insert({ admin: "admin", accion: a, objetivo_tipo: tipo, objetivo_id: id, detalle });
    } catch (e) { console.error(e); }
  };

  if (accion === "aprobar") {
    const { data, error } = await supabaseAdmin.from("agentes").update({ aprobado: true, bloqueado: false, aprobado_at: new Date().toISOString(), notas_admin }).eq("id", agente_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("aprobar_agente", agente_id, notas_admin);
    await enviarEmailBienvenidaAgente({ agente: data, links: buildLinks(data.codigo) }).catch(console.error);
    return NextResponse.json({ success: true, agente: data });
  }
  if (accion === "bloquear") {
    const { data, error } = await supabaseAdmin.from("agentes").update({ aprobado: false, bloqueado: true, bloqueado_at: new Date().toISOString(), motivo_bloqueo, notas_admin }).eq("id", agente_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("bloquear_agente", agente_id, motivo_bloqueo);
    await enviarEmailAgenteBloqueo({ agente: data, motivo: motivo_bloqueo }).catch(console.error);
    return NextResponse.json({ success: true, agente: data });
  }
  if (accion === "reactivar") {
    const { data, error } = await supabaseAdmin.from("agentes").update({ aprobado: true, bloqueado: false }).eq("id", agente_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("reactivar_agente", agente_id);
    return NextResponse.json({ success: true, agente: data });
  }
  if (accion === "marcar_pagado") {
    const { data: venta, error } = await supabaseAdmin.from("ventas").update({ estado: "pagada", pagado_at: new Date().toISOString(), pagado_por: "admin" }).eq("id", venta_id).select("*, agentes(*)").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("marcar_pagado", venta_id, undefined, "venta");
    if (venta.agentes) {
      const comision = Math.round(Number(venta.importe) * 0.20 * 100) / 100;
      await enviarEmailAgenteComisionPagada({ agente: venta.agentes, comision, plan: venta.plan }).catch(console.error);
    }
    return NextResponse.json({ success: true, venta });
  }
  if (accion === "invalidar_venta") {
    const { data, error } = await supabaseAdmin.from("ventas").update({ estado: "invalida", notas_admin: motivo_bloqueo }).eq("id", venta_id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("invalidar_venta", venta_id, motivo_bloqueo, "venta");
    return NextResponse.json({ success: true, venta: data });
  }
  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
