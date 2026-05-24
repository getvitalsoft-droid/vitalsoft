// ─────────────────────────────────────────────────────────────────────────────
// VitalSoft — Stripe Webhook
// POST /api/webhook
// Escucha pagos completados y registra ventas + envía emails
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { enviarEmailAdmin, enviarEmailAgente } from "@/lib/emails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

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

  // Solo procesamos el primer pago de una suscripción
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

    // Buscar agente en Supabase
    let agente = null;
    if (agenteCodigo) {
      const { data } = await supabase
        .from("agentes")
        .select("*")
        .eq("codigo", agenteCodigo.toUpperCase())
        .single();
      agente = data;
    }

    // Calcular comisión (20% del primer pago)
    const comision = agente ? Math.round(importe * 0.20 * 100) / 100 : 0;

    // Registrar venta en Supabase
    const { error: ventaError } = await supabase.from("ventas").insert({
      agente_id: agente?.id || null,
      agente_codigo: agenteCodigo || null,
      cliente_email: clienteEmail,
      plan,
      importe,
      estado: "pendiente",
      stripe_session_id: session.id,
    });

    if (ventaError) console.error("[Webhook] Error guardando venta:", ventaError.message);

    // Enviar emails
    try {
      await enviarEmailAdmin({ clienteEmail, plan, importe, agente, comision });
      if (agente) await enviarEmailAgente({ agente, clienteEmail, plan, importe, comision });
    } catch (emailErr) {
      console.error("[Webhook] Error enviando emails:", emailErr);
    }
  }

  return NextResponse.json({ received: true });
}

// Importante: deshabilitar bodyParser para webhooks de Stripe
export const config = { api: { bodyParser: false } };
