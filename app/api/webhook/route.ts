import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import {
  enviarEmailAdmin, enviarEmailAdminPagoFallido, enviarEmailAdminCancelacion, enviarEmailAdminReembolso,
  enviarEmailAgente, enviarEmailClientePagoRealizado, enviarEmailClienteRenovacion,
  enviarEmailClientePagoFallido, enviarEmailClienteCancelacion, enviarEmailClienteReembolso,
} from "@/lib/emails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
export const dynamic = "force-dynamic";
const HOLD_DIAS = 7;
const OWNERSHIP_DIAS = 30;
const ONBOARDING_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding`;

async function log(accion: string, detalle: string, tipo = "evento") {
  await supabase.from("activity_logs").insert({ admin: "stripe_webhook", accion, objetivo_tipo: tipo, detalle }).catch(console.error);
}

async function logEmail(destinatario: string, tipo_email: string, evento: string, resend_id?: string, error?: string) {
  await supabase.from("email_logs").insert({
    destinatario, tipo_email, evento,
    estado: error ? "fallido" : "enviado",
    resend_id, error,
  }).catch(console.error);
}

async function sendEmail(fn: () => Promise<any>, destinatario: string, tipo: string, evento: string) {
  try {
    const result = await fn();
    await logEmail(destinatario, tipo, evento, result?.data?.id);
  } catch (err: any) {
    console.error(`[Email] ${tipo} falló:`, err.message);
    await logEmail(destinatario, tipo, evento, undefined, err.message);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const clienteEmail = session.customer_email || meta.email || "";
        const agenteCodigoRaw = session.client_reference_id || "";
        const agenteCodigo = agenteCodigoRaw.startsWith("ref_") ? agenteCodigoRaw.replace("ref_", "").toUpperCase() : null;
        const importe = (session.amount_total || 0) / 100;
        const plan = meta.videos ? `${meta.videos} clips/mes` : "Plan VitalSoft";
        const clips = meta.videos ? parseInt(meta.videos) : null;

        // Idempotencia
        const { data: existing } = await supabase.from("orders").select("id").eq("stripe_session_id", session.id).single();
        if (existing) break;

        // Buscar agente referido
        let agente = null;
        if (agenteCodigo) {
          const { data } = await supabase.from("agentes").select("*").eq("codigo", agenteCodigo).single();
          agente = data;
        }
        const sospechoso = !!(agente && agente.email === clienteEmail);
        const comision = agente && !sospechoso ? Math.round(importe * 0.20 * 100) / 100 : 0;

        // Calcular revisiones según plan
        const revisiones = clips && clips <= 10 ? 1 : clips && clips <= 20 ? 2 : clips && clips <= 30 ? 3 : 4;

        // Crear order
        const { data: order } = await supabase.from("orders").insert({
          cliente_email: clienteEmail,
          cliente_nombre: meta.nombre || null,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_session_id: session.id,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          plan, clips_mensuales: clips, importe,
          estado: "onboarding_pendiente",
          agente_codigo: agenteCodigo || null,
          revisiones_incluidas: revisiones,
        }).select().single();

        // Registrar venta (para agentes)
        await supabase.from("ventas").insert({
          agente_id: agente?.id || null, agente_codigo: agenteCodigo || null,
          cliente_email: clienteEmail, plan, importe,
          estado: "pendiente_validacion",
          stripe_session_id: session.id,
          disponible_at: new Date(Date.now() + HOLD_DIAS * 86400000).toISOString(),
          sospechoso, sospechoso_motivo: sospechoso ? "mismo email que agente" : null,
        });

        // Ownership de leads — marcar lead como comprado
        if (agenteCodigo) {
          await supabase.from("leads")
            .update({ comprado: true, comprado_at: new Date().toISOString(), orden_id: order?.id })
            .eq("email", clienteEmail)
            .eq("agente_codigo", agenteCodigo)
            .gte("ownership_hasta", new Date().toISOString());
        }

        await log("venta_registrada", `${clienteEmail} · €${importe} · agente:${agenteCodigo || "directo"}${sospechoso ? " ⚠️" : ""}`);

        // Emails
        await sendEmail(() => enviarEmailClientePagoRealizado({ email: clienteEmail, nombre: meta.nombre, plan, importe, onboardingUrl: `${ONBOARDING_URL}?session=${session.id}` }), clienteEmail, "cliente_pago_realizado", event.type);
        await sendEmail(() => enviarEmailAdmin({ clienteEmail, plan, importe, agente, comision, sospechoso }), process.env.ADMIN_EMAIL!, "admin_nueva_venta", event.type);
        if (agente && !sospechoso) await sendEmail(() => enviarEmailAgente({ agente, clienteEmail, plan, importe, comision }), agente.email, "agente_nueva_comision", event.type);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).billing_reason === "subscription_create") break;
        const clienteEmail = invoice.customer_email || "";
        const importe = (invoice.amount_paid || 0) / 100;
        const periodo = invoice.period_end ? new Date(invoice.period_end * 1000).toLocaleDateString("es-ES") : "";

        // Resetear clips usados del mes anterior si existe el order
        if (invoice.subscription) {
          await supabase.from("orders")
            .update({ estado: "esperando_material", revisiones_usadas: 0 })
            .eq("stripe_subscription_id", String(invoice.subscription))
            .neq("estado", "cancelado");
        }

        await log("renovacion", `${clienteEmail} · €${importe}`);
        await sendEmail(() => enviarEmailClienteRenovacion({ email: clienteEmail, plan: "Plan VitalSoft", importe, periodo }), clienteEmail, "cliente_renovacion", event.type);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const clienteEmail = invoice.customer_email || "";
        const importe = (invoice.amount_due || 0) / 100;

        if (invoice.subscription) {
          await supabase.from("orders").update({ estado: "pausado" }).eq("stripe_subscription_id", String(invoice.subscription));
        }

        await log("pago_fallido", `${clienteEmail} · €${importe}`);
        await sendEmail(() => enviarEmailClientePagoFallido({ email: clienteEmail, plan: "Plan VitalSoft", importe }), clienteEmail, "cliente_pago_fallido", event.type);
        await sendEmail(() => enviarEmailAdminPagoFallido({ clienteEmail, importe }), process.env.ADMIN_EMAIL!, "admin_pago_fallido", event.type);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        let clienteEmail = "";
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if ("email" in customer && customer.email) clienteEmail = customer.email;
        }
        const fechaFin = sub.current_period_end ? new Date(sub.current_period_end * 1000).toLocaleDateString("es-ES") : "";

        await supabase.from("orders").update({ estado: "cancelado" }).eq("stripe_subscription_id", sub.id);
        await log("cancelacion", `${clienteEmail} · sub ${sub.id}`);
        if (clienteEmail) {
          await sendEmail(() => enviarEmailClienteCancelacion({ email: clienteEmail, plan: "Plan VitalSoft", fechaFin }), clienteEmail, "cliente_cancelacion", event.type);
          await sendEmail(() => enviarEmailAdminCancelacion({ clienteEmail }), process.env.ADMIN_EMAIL!, "admin_cancelacion", event.type);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const clienteEmail = charge.billing_details?.email || charge.receipt_email || "";
        const importe = (charge.amount_refunded || 0) / 100;
        await log("reembolso", `${clienteEmail} · €${importe}`);
        if (clienteEmail) await sendEmail(() => enviarEmailClienteReembolso({ email: clienteEmail, importe }), clienteEmail, "cliente_reembolso", event.type);
        await sendEmail(() => enviarEmailAdminReembolso({ clienteEmail, importe }), process.env.ADMIN_EMAIL!, "admin_reembolso", event.type);
        break;
      }
    }
  } catch (err) {
    console.error(`[Webhook] Error en ${event.type}:`, err);
    await log("webhook_error", `${event.type}: ${String(err)}`);
  }

  return NextResponse.json({ received: true });
}
