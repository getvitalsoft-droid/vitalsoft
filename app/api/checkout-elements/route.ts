// app/api/checkout-elements/route.ts
// Prepara el pago con Stripe Elements.
//
// FLUJO CORRECTO:
// 1. Usuario rellena formulario (nombre, email, clips)
// 2. Abre overlay → este endpoint crea SOLO un SetupIntent (sin suscripción, sin cargo)
// 3. Usuario introduce tarjeta → Stripe confirma el SetupIntent
// 4. Con el método de pago guardado, creamos la suscripción real en el webhook
//    payment_method.attached → o bien lo hacemos en el onSuccess del cliente
//
// PRECIO: reutilizamos precios existentes por lookup_key para no crear duplicados.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const CUSTOM_PRODUCT_ID = "prod_UZb2VZCsFBQfmJ";

// Obtener o crear un Price reutilizable por lookup_key
// Así nunca se duplican: 100 opciones = máximo 100 precios en Stripe, no uno por visita
async function getOrCreatePrice(amountEur: number, videos: number): Promise<string> {
  const lookupKey = `vitalsoft-${videos}clips-${amountEur}eur`;

  // Buscar precio existente por lookup_key
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });

  if (existing.data.length > 0 && existing.data[0].active) {
    return existing.data[0].id;
  }

  // Crear precio nuevo con lookup_key para que futuras llamadas lo reutilicen
  const price = await stripe.prices.create({
    currency: "eur",
    product: CUSTOM_PRODUCT_ID,
    unit_amount: Math.round(amountEur * 100),
    recurring: { interval: "month" },
    lookup_key: lookupKey,
    transfer_lookup_key: true, // si ya existe uno antiguo, lo reemplaza
    metadata: { videos: String(videos), precio_eur: String(amountEur) },
  });

  return price.id;
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`checkout-elements:${ip}`, LIMITS.checkout);
  if (!allowed) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  try {
    const { name, email, social, notes, videos, price, ref, client_ref } = await req.json();
    if (!email || !videos || !price) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();

    // Crear o recuperar Customer (idempotente — mismo email = mismo customer)
    let customerId: string;
    const existing = await stripe.customers.list({ email: emailNorm, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
      // Actualizar nombre si no lo tenía
      if (!existing.data[0].name && name) {
        await stripe.customers.update(customerId, { name });
      }
    } else {
      const customer = await stripe.customers.create({
        email: emailNorm,
        name: name || undefined,
        metadata: {
          social: social || "",
          ref: ref || "",
          client_ref: client_ref || "",
        },
      });
      customerId = customer.id;
    }

    // Obtener o crear precio (reutilizable por lookup_key)
    const priceId = await getOrCreatePrice(price, videos);

    const notasCompletas = [
      name && `Nombre: ${name}`,
      social && `Canal: ${social}`,
      notes,
    ].filter(Boolean).join(" | ");

    // CREAR SUSCRIPCIÓN con payment_behavior: "default_incomplete"
    // Esto NO cobra al cliente — crea una suscripción pendiente de confirmar el pago.
    // La suscripción pasa a "active" SOLO cuando el cliente completa el pago con su tarjeta.
    // Si el cliente cierra el overlay sin pagar, la suscripción queda "incomplete"
    // y Stripe la cancela automáticamente después de 23 horas.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card", "sepa_debit"],
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        nombre: name || "",
        email: emailNorm,
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
      // Limpiar la suscripción incompleta si algo falló
      await stripe.subscriptions.cancel(subscription.id);
      throw new Error("No se pudo crear el PaymentIntent");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId,
    });

  } catch (err: any) {
    console.error("[CheckoutElements]", err.message);
    return NextResponse.json({ error: "Error al preparar el pago" }, { status: 500 });
  }
}
