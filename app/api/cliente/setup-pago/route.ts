// POST /api/cliente/setup-pago
// Crea un SetupIntent de Stripe para que el cliente actualice su método de pago.
// GET  /api/cliente/setup-pago
// Devuelve el clientSecret del SetupIntent para renderizar Stripe Elements.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyClientToken } from "@/lib/cliente-token";

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

  // Obtener stripe_customer_id del order activo
  const { data: order } = await sb
    .from("orders")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("cliente_email", email)
    .not("stripe_subscription_id", "is", null)
    .order("creado_at", { ascending: false })
    .limit(1)
    .single();

  if (!order?.stripe_customer_id) {
    return NextResponse.json({ error: "No se encontró cliente en Stripe" }, { status: 404 });
  }

  // Crear SetupIntent para actualizar método de pago
  const setupIntent = await stripe.setupIntents.create({
    customer: order.stripe_customer_id,
    payment_method_types: ["card"],
    usage: "off_session", // Para pagos recurrentes futuros
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}

// Confirmar que el nuevo método de pago se aplicó a la suscripción
export async function PATCH(req: NextRequest) {
  const clienteToken = req.headers.get("x-cliente-token");
  if (!clienteToken) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const email = verifyClientToken(clienteToken);
  if (!email) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { setupIntentId } = await req.json();

  const { data: order } = await sb
    .from("orders")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("cliente_email", email)
    .not("stripe_subscription_id", "is", null)
    .order("creado_at", { ascending: false })
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "Order no encontrado" }, { status: 404 });

  // Obtener el payment method del SetupIntent confirmado
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  if (setupIntent.status !== "succeeded") {
    return NextResponse.json({ error: "El pago no fue confirmado" }, { status: 400 });
  }

  const paymentMethodId = setupIntent.payment_method as string;

  // Establecer como método de pago predeterminado del cliente y la suscripción
  await stripe.customers.update(order.stripe_customer_id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  await stripe.subscriptions.update(order.stripe_subscription_id, {
    default_payment_method: paymentMethodId,
  });

  (async () => {
    await sb.from("activity_logs").insert({
      admin: email,
      accion: "cambio_metodo_pago",
      objetivo_tipo: "order",
      objetivo_id: order.stripe_customer_id,
      detalle: `Nuevo método de pago: ${paymentMethodId}`,
    });
  })().catch(console.error);

  return NextResponse.json({ ok: true });
}
