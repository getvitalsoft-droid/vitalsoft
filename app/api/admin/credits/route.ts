// app/api/admin/credits/route.ts
// Gestión unificada de créditos: loyalty (antigüedad) + service (error/incidencia)
// GET  → listar todos los créditos con stats
// POST → otorgar service_credit manualmente
// PATCH → marcar como aplicado / cancelar

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  enviarEmailLoyaltyCredit,
  enviarEmailServiceCredit,
} from "@/lib/emails";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return false;
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
}

// ── GET — stats + listado ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [loyalty, service] = await Promise.all([
    sb.from("loyalty_credits").select("*").order("created_at", { ascending: false }),
    sb.from("service_credits").select("*").order("created_at", { ascending: false }),
  ]);

  const calcStats = (rows: any[]) => rows.reduce((acc, r) => {
    const amt = Number(r.amount ?? 0);
    if (r.status === "disponible" || r.status === "pendiente") { acc.pendiente.count++; acc.pendiente.total += amt; }
    else if (r.status === "aplicado") { acc.aplicado.count++; acc.aplicado.total += amt; }
    return acc;
  }, { pendiente: { count: 0, total: 0 }, aplicado: { count: 0, total: 0 } });

  return NextResponse.json({
    loyalty: loyalty.data ?? [],
    service: service.data ?? [],
    stats: {
      loyalty: calcStats(loyalty.data ?? []),
      service: calcStats(service.data ?? []),
    },
  });
}

// ── POST — crear service_credit manualmente ────────────────────────────────
export async function POST(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { order_id, amount, reason, notes } = await req.json();
  if (!order_id || !amount || !reason?.trim()) {
    return NextResponse.json({ error: "order_id, amount y reason son obligatorios" }, { status: 400 });
  }
  if (Number(amount) <= 0 || Number(amount) > 500) {
    return NextResponse.json({ error: "Importe debe ser entre 1€ y 500€" }, { status: 400 });
  }

  // Obtener datos del cliente desde el order
  const { data: order, error: orderErr } = await sb
    .from("orders").select("stripe_customer_id, cliente_email, cliente_nombre").eq("id", order_id).single();
  if (orderErr || !order) return NextResponse.json({ error: "Order no encontrado" }, { status: 404 });

  const { data: credit, error } = await sb.from("service_credits").insert({
    order_id,
    stripe_customer_id: order.stripe_customer_id,
    customer_email: order.cliente_email,
    amount: Number(amount),
    reason,
    notes: notes || null,
    created_by: "admin",
    status: "disponible",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log
  await sb.from("activity_logs").insert({
    admin: "admin", accion: "service_credit_otorgado",
    objetivo_tipo: "order", objetivo_id: order_id,
    detalle: `€${amount} · ${reason}`,
  });

  // Email al cliente
  await enviarEmailServiceCredit({
    email: order.cliente_email,
    nombre: order.cliente_nombre,
    amount: Number(amount),
    reason,
  }).catch(console.error);

  return NextResponse.json({ success: true, credit });
}

// ── PATCH — marcar aplicado / cancelar ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { accion, credit_id, credit_type, notes } = await req.json();
  // credit_type: "loyalty" | "service"
  if (!credit_id || !credit_type) return NextResponse.json({ error: "credit_id y credit_type requeridos" }, { status: 400 });

  const tabla = credit_type === "loyalty" ? "loyalty_credits" : "service_credits";

  if (accion === "marcar_aplicado") {
    if (!notes?.trim()) return NextResponse.json({ error: "Nota obligatoria al aplicar" }, { status: 400 });
    const { data, error } = await sb.from(tabla)
      .update({ status: "aplicado", applied_at: new Date().toISOString(), notes })
      .eq("id", credit_id).not("status", "eq", "aplicado").select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await sb.from("activity_logs").insert({
      admin: "admin", accion: `${credit_type}_credit_aplicado`,
      objetivo_tipo: credit_type, objetivo_id: credit_id, detalle: notes,
    });
    return NextResponse.json({ success: true, credit: data });
  }

  if (accion === "cancelar") {
    if (!notes?.trim()) return NextResponse.json({ error: "Motivo obligatorio al cancelar" }, { status: 400 });
    const { data, error } = await sb.from(tabla)
      .update({ status: "cancelado", notes })
      .eq("id", credit_id).not("status", "in", '("aplicado","cancelado")').select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, credit: data });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
