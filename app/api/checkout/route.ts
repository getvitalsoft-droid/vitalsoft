import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { buscarAgente } from "@/lib/agentes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const CUSTOM_PRODUCT_ID = "prod_UZb2VZCsFBQfmJ";

export async function POST(req: NextRequest) {
  try {
    const { name, email, social, notes, videos, price, ref } = await req.json();
    if (!email || !videos || !price) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    // Buscar agente referido
    const agente = ref ? buscarAgente(ref) : null;

    // Crear precio dinámico
    const stripePrice = await stripe.prices.create({
      currency: "eur",
      product: CUSTOM_PRODUCT_ID,
      unit_amount: Math.round(price * 100),
      recurring: { interval: "month" },
      metadata: { videos: String(videos) },
    });

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?pago=ok&videos=${videos}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/#calculadora`,
      client_reference_id: agente ? `ref_${agente.codigo}` : `custom_${videos}v`,
      metadata: {
        nombre: name || "",
        email,
        social: social || "",
        videos: String(videos),
        precio: String(price),
        notas: notes || "",
        agente_codigo: agente?.codigo || "",
        agente_nombre: agente?.nombre || "",
      },
    });

    console.log("[VitalSoft] Checkout creado:", { email, videos, price, agente: agente?.codigo });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[VitalSoft] Error checkout:", err);
    return NextResponse.json({ error: "Error al crear la sesión de pago." }, { status: 500 });
  }
}
