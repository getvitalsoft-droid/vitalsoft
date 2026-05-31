// app/api/cliente/creditos/route.ts
// Aplicar créditos disponibles al Customer Balance de Stripe.
// Stripe descuenta el saldo automáticamente en la siguiente factura.
// Llamado por los crons y por el admin al marcar "aplicado".

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

// Verificar que viene de un cron autorizado o del admin
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret === process.env.CRON_SECRET) return true;
  const adminToken = req.headers.get("x-admin-token");
  return adminToken === process.env.ADMIN_SECRET_TOKEN;
}

/**
 * POST — Aplica UN crédito específico al Customer Balance de Stripe.
 * Body: { credit_id, credit_type: "loyalty" | "service" | "referral", notes? }
 * 
 * Stripe Customer Balance funciona así:
 *   - Saldo negativo = crédito a favor del cliente
 *   - stripe.customers.createBalanceTransaction(cus_id, { amount: -5000, currency: "eur" })
 *   - En la siguiente factura Stripe descuenta ese saldo automáticamente
 *   - No hay que hacer nada más
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { credit_id, credit_type, notes } = await req.json();
  if (!credit_id || !credit_type) {
    return NextResponse.json({ error: "credit_id y credit_type requeridos" }, { status: 400 });
  }

  const tabla =
    credit_type === "loyalty" ? "loyalty_credits" :
    credit_type === "service" ? "service_credits" :
    "client_referrals";

  // Obtener crédito
  const { data: credit } = await sb
    .from(tabla)
    .select("*")
    .eq("id", credit_id)
    .single();

  if (!credit) return NextResponse.json({ error: "Crédito no encontrado" }, { status: 404 });

  const amount = credit_type === "referral" ? credit.credit_amount : credit.amount;
  const customerEmail = credit_type === "referral" ? credit.referrer_email : credit.customer_email;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Importe inválido" }, { status: 400 });
  }

  // Obtener stripe_customer_id del order
  const { data: order } = await sb
    .from("orders")
    .select("stripe_customer_id")
    .eq("cliente_email", customerEmail)
    .not("stripe_customer_id", "is", null)
    .not("estado", "eq", "cancelado")
    .order("fecha_pago", { ascending: false })
    .limit(1)
    .single();

  if (!order?.stripe_customer_id) {
    return NextResponse.json({ error: "No se encontró el cliente en Stripe" }, { status: 404 });
  }

  // Aplicar a Stripe Customer Balance
  // amount negativo = crédito a favor del cliente
  const amountCents = -Math.round(amount * 100);
  const description = notes ||
    (credit_type === "loyalty" ? `Crédito antigüedad ${credit.milestone?.replace("_", " ")}` :
     credit_type === "service" ? `Crédito servicio: ${credit.reason}` :
     `Crédito referido`);

  await stripe.customers.createBalanceTransaction(order.stripe_customer_id, {
    amount: amountCents,
    currency: "eur",
    description,
  });

  // Marcar como aplicado en BD
  const updateData: Record<string, any> = {
    status: "aplicado",
    applied_at: new Date().toISOString(),
  };
  if (notes) updateData.notes = notes;

  if (credit_type === "referral") {
    await sb.from("client_referrals").update(updateData).eq("id", credit_id);
  } else {
    await sb.from(tabla).update(updateData).eq("id", credit_id);
  }

  // Log
  await sb.from("activity_logs").insert({
    admin: "sistema",
    accion: `${credit_type}_credito_aplicado_stripe`,
    objetivo_tipo: credit_type,
    objetivo_id: credit_id,
    detalle: `€${amount} aplicado al Customer Balance de ${customerEmail} (${order.stripe_customer_id})`,
  });

  return NextResponse.json({ success: true, applied: amount, customer: order.stripe_customer_id });
}
