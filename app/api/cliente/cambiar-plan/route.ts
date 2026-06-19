// POST /api/cliente/cambiar-plan
// Cambia el plan de la suscripción activa del cliente.
// Para planes fijos (10/20/30/40 clips) usa lookup_key de Stripe.
// Para planes personalizados (calculadora) crea precio dinámico.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyClientToken } from "@/lib/cliente-token";
import { calcPrice } from "@/lib/stripe";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  const clienteToken = req.headers.get("x-cliente-token");
  if (!clienteToken) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const email = verifyClientToken(clienteToken);
  if (!email) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { clips } = await req.json();
  if (!clips || clips < 1 || clips > 100) {
    return NextResponse.json({ error: "Número de clips no válido (1-100)" }, { status: 400 });
  }

  // Obtener order activo
  const { data: order } = await sb
    .from("orders")
    .select("id, stripe_subscription_id, clips_mensuales, plan, estado")
    .eq("cliente_email", email)
    .not("stripe_subscription_id", "is", null)
    .not("estado", "in", '("cancelado","pausado")')
    .order("creado_at", { ascending: false })
    .limit(1)
    .single();

  if (!order?.stripe_subscription_id) {
    return NextResponse.json({ error: "No se encontró suscripción activa" }, { status: 404 });
  }

  if (order.clips_mensuales === clips) {
    return NextResponse.json({ error: "Ya estás en ese plan" }, { status: 400 });
  }

  // Obtener o crear precio en Stripe
  const precio = calcPrice(clips);
  const lookupKey = `vitalsoft_${clips}_clips`;

  let priceId: string;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data.length > 0) {
    priceId = existing.data[0].id;
  } else {
    // Si no hay STRIPE_PRODUCT_ID, usar el producto del plan actual
    const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
    const productId = process.env.STRIPE_PRODUCT_ID || 
      (subscription.items.data[0].price.product as string);
    
    const newPrice = await stripe.prices.create({
      currency: "eur",
      unit_amount: Math.round(precio * 100),
      recurring: { interval: "month" },
      product: productId,
      lookup_key: lookupKey,
      transfer_lookup_key: true,
    });
    priceId = newPrice.id;
  }

  // Actualizar suscripción sin prorrateado ni cambio de fecha
  const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
  await stripe.subscriptions.update(order.stripe_subscription_id, {
    items: [{ id: subscription.items.data[0].id, price: priceId }],
    proration_behavior: "none",
    billing_cycle_anchor: "unchanged",
  });

  // Actualizar BD
  const PLAN_NOMBRES: Record<number, string> = { 10: "Starter", 20: "Growth", 30: "Scale", 40: "Pro" };
  const planNombre = [10, 20, 30, 40].includes(clips)
    ? PLAN_NOMBRES[clips] + ` · ${clips} clips/mes`
    : `Personalizado · ${clips} clips/mes`;

  await sb.from("orders").update({
    clips_mensuales: clips,
    importe: precio,
    plan: planNombre,
  }).eq("id", order.id);

  (async () => {
    await sb.from("activity_logs").insert({
      admin: email,
      accion: "cambio_plan_cliente",
      objetivo_tipo: "order",
      objetivo_id: order.id,
      detalle: `${order.clips_mensuales} → ${clips} clips/mes (€${precio}/mes)`,
    });
  })().catch(console.error);

  return NextResponse.json({ ok: true, clips, precio, plan: planNombre });
}
