import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const CUSTOM_PRODUCT_ID = "prod_UZb2VZCsFBQfmJ";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`checkout:${ip}`, LIMITS.checkout);
  if (!allowed) return NextResponse.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });

  try {
    const { name, email, social, notes, videos, price, ref } = await req.json();
    if (!email || !videos || !price) return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });

    let agente = null;
    if (ref) {
      const { data } = await supabase.from("agentes").select("nombre,codigo").eq("codigo", ref.toUpperCase()).single();
      agente = data;
    }

    const stripePrice = await stripe.prices.create({
      currency: "eur", product: CUSTOM_PRODUCT_ID,
      unit_amount: Math.round(price * 100),
      recurring: { interval: "month" },
      metadata: { videos: String(videos) },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?pago=ok&videos=${videos}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/#calculadora`,
      client_reference_id: ref ? `ref_${ref}` : `custom_${videos}v`,
      metadata: { nombre: name || "", email, social: social || "", videos: String(videos), precio: String(price), notas: notes || "", agente_codigo: ref || "", agente_nombre: agente?.nombre || "" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Checkout] Error:", err);
    return NextResponse.json({ error: "Error al crear la sesión de pago." }, { status: 500 });
  }
}
