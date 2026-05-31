// app/api/checkout-elements/route.ts
// Crea un PaymentIntent/SetupIntent para Stripe Elements.
// En lugar de redirigir a checkout.stripe.com, el formulario
// de tarjeta se renderiza dentro de vitalsoft.pro.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const CUSTOM_PRODUCT_ID = "prod_UZb2VZCsFBQfmJ";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`checkout-elements:${ip}`, LIMITS.checkout);
  if (!allowed) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  try {
    const { name, email, social, notes, videos, price, ref, client_ref } = await req.json();
    if (!email || !videos || !price) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Crear o recuperar customer de Stripe
    let customerId: string;
    const existing = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name: name || undefined,
        metadata: { social: social || "", ref: ref || "", client_ref: client_ref || "" },
      });
      customerId = customer.id;
    }

    // Crear Price dinámico
    const stripePrice = await stripe.prices.create({
      currency: "eur",
      product: CUSTOM_PRODUCT_ID,
      unit_amount: Math.round(price * 100),
      recurring: { interval: "month" },
      metadata: { videos: String(videos) },
    });

    // Crear Subscription con payment_behavior: "default_incomplete"
    // Esto genera un PaymentIntent que podemos usar con Elements
    const notasCompletas = [
      name && `Nombre: ${name}`,
      social && `Canal: ${social}`,
      notes,
    ].filter(Boolean).join(" | ");

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: stripePrice.id }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        nombre: name || "",
        email: email.toLowerCase(),
        social: social || "",
        videos: String(videos),
        precio: String(price),
        notas: notasCompletas,
        agente_codigo: ref || "",
        client_ref: client_ref || "",
      },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
      throw new Error("No se pudo crear el PaymentIntent");
    }

    // Guardar agente ref si existe
    let agenteNombre = "";
    if (ref) {
      const { data: agente } = await supabase
        .from("agentes")
        .select("nombre")
        .eq("codigo", ref.toUpperCase())
        .single();
      agenteNombre = agente?.nombre || "";
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId,
      // Metadata para el webhook cuando confirme el pago
      metadata: { name, email, social, videos, price, ref, client_ref, agenteNombre, notas: notasCompletas },
    });
  } catch (err: any) {
    console.error("[CheckoutElements]", err.message);
    return NextResponse.json({ error: "Error al preparar el pago" }, { status: 500 });
  }
}
