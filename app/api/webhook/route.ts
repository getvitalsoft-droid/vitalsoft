import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { enviarEmailAdmin, enviarEmailAgente } from "@/lib/emails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

// Next.js 14 App Router — deshabilitar body parsing para webhooks Stripe
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("[Webhook] Firma inválida:", err.message);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const clienteEmail = session.customer_email || meta.email || "";
    const agenteCodigoRaw = session.client_reference_id || "";
    const agenteCodigo = agenteCodigoRaw.startsWith("ref_")
      ? agenteCodigoRaw.replace("ref_", "")
      : null;
    const importe = (session.amount_total || 0) / 100;
    const plan = meta.videos ? `${meta.videos} vídeos/mes` : "Plan VitalSoft";

    console.log("[Webhook] Pago completado:", { clienteEmail, agenteCodigo, importe, plan });

    // Buscar agente
    let agente = null;
    if (agenteCodigo) {
      const { data } = await supabase
        .from("agentes")
        .select("*")
        .eq("codigo", agenteCodigo.toUpperCase())
        .single();
      agente = data;
    }

    const comision = agente ? Math.round(importe * 0.20 * 100) / 100 : 0;

    // Guardar venta en Supabase
    await supabase.from("ventas").insert({
      agente_id: agente?.id || null,
      agente_codigo: agenteCodigo || null,
      cliente_email: clienteEmail,
      plan,
      importe,
      estado: "pendiente",
      stripe_session_id: session.id,
    });

    // Enviar emails
    try {
      await enviarEmailAdmin({ clienteEmail, plan, importe, agente, comision });
      if (agente) await enviarEmailAgente({ agente, clienteEmail, plan, importe, comision });
    } catch (emailErr) {
      console.error("[Webhook] Error emails:", emailErr);
    }
  }

  return NextResponse.json({ received: true });
}
