// POST /api/cliente/clips-extra
// Compra clips adicionales este mes.
// modo: "unico" — cobro único por los clips extra
// modo: "mensual" — mismo cobro único + upgrade de la suscripción al nuevo plan

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

  const { clips_extra, modo } = await req.json();

  if (!clips_extra || clips_extra < 1 || clips_extra > 100) {
    return NextResponse.json({ error: "Número de clips no válido (1-100)" }, { status: 400 });
  }
  if (!["unico", "mensual"].includes(modo)) {
    return NextResponse.json({ error: "modo debe ser 'unico' o 'mensual'" }, { status: 400 });
  }

  // Obtener order activo
  const { data: order } = await sb
    .from("orders")
    .select("id, stripe_customer_id, stripe_subscription_id, clips_mensuales, plan")
    .eq("cliente_email", email)
    .not("stripe_subscription_id", "is", null)
    .not("estado", "in", '("cancelado","pausado")')
    .order("creado_at", { ascending: false })
    .limit(1)
    .single();

  if (!order?.stripe_customer_id) {
    return NextResponse.json({ error: "No se encontró suscripción activa" }, { status: 404 });
  }

  // Calcular precio de los clips extra
  // Precio por clip = tarifa del plan personalizado para esa cantidad
  const clipsMensuales = order.clips_mensuales || 20;
  const precioActual = calcPrice(clipsMensuales);
  const precioPorClip = precioActual / clipsMensuales;
  const precioExtra = Math.round(precioPorClip * clips_extra * 100); // en céntimos

  // Crear PaymentIntent para cobro único
  const paymentIntent = await stripe.paymentIntents.create({
    amount: precioExtra,
    currency: "eur",
    customer: order.stripe_customer_id,
    payment_method_types: ["card"],
    description: `VitalSoft — ${clips_extra} clips extra (${modo === "mensual" ? "+ upgrade plan" : "pago único"})`,
    metadata: {
      order_id: order.id,
      clips_extra: clips_extra.toString(),
      modo,
      email,
    },
  });

  // Si es mensual, también actualizamos el plan
  if (modo === "mensual") {
    const nuevosClips = clipsMensuales + clips_extra;
    const lookupKey = `vitalsoft_${nuevosClips}_clips`;
    const nuevoPrecio = calcPrice(nuevosClips);

    let priceId: string;
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    if (existing.data.length > 0) {
      priceId = existing.data[0].id;
    } else {
      const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
      const productId = process.env.STRIPE_PRODUCT_ID ||
        (subscription.items.data[0].price.product as string);
      const newPrice = await stripe.prices.create({
        currency: "eur",
        unit_amount: Math.round(nuevoPrecio * 100),
        recurring: { interval: "month" },
        product: productId,
        lookup_key: lookupKey,
        transfer_lookup_key: true,
      });
      priceId = newPrice.id;
    }

    const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
    await stripe.subscriptions.update(order.stripe_subscription_id, {
      items: [{ id: subscription.items.data[0].id, price: priceId }],
      proration_behavior: "none",
      billing_cycle_anchor: "unchanged",
    });

    // Actualizar BD
    const PLAN_NOMBRES: Record<number, string> = { 10: "Starter", 20: "Growth", 30: "Scale", 40: "Pro" };
    const planNombre = [10, 20, 30, 40].includes(nuevosClips)
      ? PLAN_NOMBRES[nuevosClips] + ` · ${nuevosClips} clips/mes`
      : `Personalizado · ${nuevosClips} clips/mes`;

    await sb.from("orders").update({
      clips_mensuales: nuevosClips,
      importe: nuevoPrecio,
      plan: planNombre,
    }).eq("id", order.id);
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    precioExtra: precioExtra / 100,
    clips_extra,
    modo,
  });
}
