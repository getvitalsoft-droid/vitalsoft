import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import {
  enviarEmailAdmin, enviarEmailAdminPagoFallido, enviarEmailAdminCancelacion, enviarEmailAdminReembolso,
  enviarEmailAgente, enviarEmailClientePagoRealizado, enviarEmailClienteRenovacion,
  enviarEmailClientePagoFallido, enviarEmailClienteCancelacion, enviarEmailClienteReembolso,
  // Referidos
  enviarEmailReferidoRegistrado, enviarEmailAdminNuevoReferido,
} from "@/lib/emails";
import { registerReferral, lookupRefCode, handleReferralRefund, getOrCreateRefCode } from "@/lib/referrals";
import { maybeRequestReview } from "@/lib/reviews";
import { enviarEmailPedirResena } from "@/lib/emails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
export const dynamic = "force-dynamic";
const HOLD_DIAS = 7;
const ONBOARDING_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding`;

async function log(accion: string, detalle: string, tipo = "evento") {
  try {
    await supabase.from("activity_logs").insert({ admin: "stripe_webhook", accion, objetivo_tipo: tipo, detalle });
  } catch (e) { console.error("[Log]", e); }
}

async function logEmail(destinatario: string, tipo_email: string, evento: string, resend_id?: string, error?: string) {
  try {
    await supabase.from("email_logs").insert({
      destinatario, tipo_email, evento,
      estado: error ? "fallido" : "enviado",
      resend_id, error,
    });
  } catch (e) { console.error("[LogEmail]", e); }
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

      // ── Nuevo pago ────────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const clienteEmail = session.customer_email || meta.email || "";
        const agenteCodigoRaw = session.client_reference_id || "";
        const agenteCodigo = agenteCodigoRaw.startsWith("ref_") ? agenteCodigoRaw.replace("ref_", "").toUpperCase() : null;
        const importe = (session.amount_total || 0) / 100;
        const plan = meta.videos ? `${meta.videos} clips/mes` : "Plan VitalSoft";
        const clips = meta.videos ? parseInt(meta.videos) : null;
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

        // Idempotencia
        const { data: existing } = await supabase.from("orders").select("id").eq("stripe_session_id", session.id).single();
        if (existing) break;

        let agente = null;
        if (agenteCodigo) {
          const { data } = await supabase.from("agentes").select("*").eq("codigo", agenteCodigo).single();
          agente = data;
        }
        const agenteEsBloqueado = !!(agente && agente.bloqueado);
        const sospechoso = !!(agente && agente.email === clienteEmail) || agenteEsBloqueado;
        const sospechosoMotivo = agenteEsBloqueado
          ? "agente_bloqueado"
          : (agente && agente.email === clienteEmail ? "mismo email que agente" : null);
        // Agente bloqueado no genera comisión bajo ningún concepto
        const comision = agente && !sospechoso ? Math.round(importe * 0.20 * 100) / 100 : 0;
        const revisiones = clips && clips <= 10 ? 1 : clips && clips <= 20 ? 2 : clips && clips <= 30 ? 3 : 4;

        if (agenteEsBloqueado) {
          await log("agente_bloqueado_venta_rechazada", `Agente ${agenteCodigo} bloqueado · cliente ${clienteEmail} · €${importe}`, "venta");
        }

        const { data: order } = await supabase.from("orders").insert({
          cliente_email: clienteEmail,
          cliente_nombre: meta.nombre || null,
          stripe_customer_id: stripeCustomerId,
          stripe_session_id: session.id,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          plan, clips_mensuales: clips, importe,
          estado: "onboarding_pendiente",
          agente_codigo: agenteCodigo || null,
          revisiones_incluidas: revisiones,
        }).select().single();

        await supabase.from("ventas").insert({
          agente_id: agente?.id || null,
          agente_codigo: agenteCodigo || null,
          cliente_email: clienteEmail, plan, importe,
          // Bloqueado → venta inválida sin comisión
          estado: agenteEsBloqueado ? "invalida" : "pendiente_validacion",
          stripe_session_id: session.id,
          disponible_at: agenteEsBloqueado ? null : new Date(Date.now() + HOLD_DIAS * 86400000).toISOString(),
          sospechoso, sospechoso_motivo: sospechosoMotivo,
        });

        // Marcar lead como comprado si hay agente con ownership activo
        if (agenteCodigo) {
          await supabase.from("leads")
            .update({ comprado: true, comprado_at: new Date().toISOString(), orden_id: order?.id })
            .eq("email", clienteEmail)
            .eq("agente_codigo", agenteCodigo)
            .gte("ownership_hasta", new Date().toISOString());
        }

        // Drive — no bloqueante
        if (order?.id) {
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/drive`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-internal-secret": process.env.CRON_SECRET || "" },
            body: JSON.stringify({ clienteNombre: meta.nombre || clienteEmail.split("@")[0], clienteEmail, plan, orderId: order.id }),
          }).catch(e => console.error("[Drive] Error:", e));
        }

        // ── Sistema de referidos de clientes ──────────────────────────────
        // El código de referido del CLIENTE llega en meta.client_ref
        // (distinto de agenteCodigo que viene de client_reference_id para agentes)
        const clientRef = meta.client_ref;
        if (clientRef && clienteEmail && stripeCustomerId) {
          try {
            const referrer = await lookupRefCode(clientRef);
            if (referrer) {
              const { referral, suspicious } = await registerReferral({
                referrerStripeCustomerId: referrer.stripe_customer_id,
                referrerEmail: referrer.email,
                referredEmail: clienteEmail,
                referredStripeCustomerId: stripeCustomerId,
                stripeSessionId: session.id,
                orderId: order?.id,
                amountPaid: importe,
              });
              // Emails de referido (no bloquean el webhook)
              await Promise.allSettled([
                sendEmail(
                  () => enviarEmailReferidoRegistrado({ referrerEmail: referrer.email, referredEmail: clienteEmail, creditAmount: referral.credit_amount ?? 0 }),
                  referrer.email, "referido_registrado", event.type
                ),
                sendEmail(
                  () => enviarEmailAdminNuevoReferido({ referrerEmail: referrer.email, referredEmail: clienteEmail, amountPaid: importe, creditAmount: referral.credit_amount ?? 0, isSuspicious: suspicious, suspiciousReason: referral.suspicious_reason }),
                  process.env.ADMIN_EMAIL!, "admin_nuevo_referido", event.type
                ),
              ]);
              await log("referido_registrado", `${referrer.email} → ${clienteEmail} · crédito €${referral.credit_amount}${suspicious ? " ⚠️ sospechoso" : ""}`);
            }
          } catch (refErr) {
            // Nunca fallar el webhook por error de referidos
            console.error("[Referral] Error en checkout:", refErr);
            await log("referral_error", String(refErr));
          }
        }

        await log("venta_registrada", `${clienteEmail} · €${importe} · agente:${agenteCodigo || "directo"}${sospechoso ? " ⚠️" : ""}`);
        await sendEmail(() => enviarEmailClientePagoRealizado({ email: clienteEmail, nombre: meta.nombre, plan, importe, onboardingUrl: `${ONBOARDING_URL}?session=${session.id}` }), clienteEmail, "cliente_pago_realizado", event.type);
        await sendEmail(() => enviarEmailAdmin({ clienteEmail, plan, importe, agente, comision, sospechoso }), process.env.ADMIN_EMAIL!, "admin_nueva_venta", event.type);
        if (agente && !sospechoso) await sendEmail(() => enviarEmailAgente({ agente, clienteEmail, plan, importe, comision }), agente.email, "agente_nueva_comision", event.type);
        break;
      }

      // ── Primer pago (Elements) + Renovaciones ─────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const billingReason = (invoice as any).billing_reason;
        const clienteEmail = invoice.customer_email || "";
        const importe = (invoice.amount_paid || 0) / 100;

        // ── Primer pago via Stripe Elements ─────────────────────────────────
        // checkout.session.completed solo se dispara en Checkout hosted.
        // Elements crea suscripciones directamente → primer pago llega aquí.
        if (billingReason === "subscription_create" && invoice.subscription) {
          const subId = String(invoice.subscription);
          const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as any)?.id;

          // Idempotencia: si ya existe un order con esta suscripción, no duplicar
          const { data: existingOrder } = await supabase.from("orders")
            .select("id").eq("stripe_subscription_id", subId).single();
          if (existingOrder) break;

          // Obtener metadata de la suscripción (nombre, email, videos, ref...)
          const sub = await stripe.subscriptions.retrieve(subId);
          const meta = sub.metadata || {};
          const metaEmail = meta.email || clienteEmail;
          const nombre = meta.nombre || undefined;
          const videos = meta.videos ? parseInt(meta.videos) : null;
          const plan = videos ? `${videos} clips/mes` : "Plan VitalSoft";
          const agenteCodigo = meta.agente_codigo || null;
          const clientRef = meta.client_ref || null;
          const revisiones = videos && videos <= 10 ? 1 : videos && videos <= 20 ? 2 : videos && videos <= 30 ? 3 : 4;

          let agente = null;
          if (agenteCodigo) {
            const { data } = await supabase.from("agentes").select("*").eq("codigo", agenteCodigo).single();
            agente = data;
          }
          const agenteEsBloqueadoEl = !!(agente && agente.bloqueado);
          const sospechosoEl = !!(agente && agente.email === metaEmail) || agenteEsBloqueadoEl;
          const sospechosoMotivoEl = agenteEsBloqueadoEl
            ? "agente_bloqueado"
            : (agente && agente.email === metaEmail ? "mismo email que agente" : null);
          const comision = agente && !sospechosoEl ? Math.round(importe * 0.20 * 100) / 100 : 0;

          if (agenteEsBloqueadoEl) {
            await log("agente_bloqueado_venta_rechazada_elements", `Agente ${agenteCodigo} bloqueado · cliente ${metaEmail} · €${importe}`, "venta");
          }

          const { data: order } = await supabase.from("orders").insert({
            cliente_email: metaEmail,
            cliente_nombre: nombre,
            stripe_customer_id: customerId || null,
            stripe_subscription_id: subId,
            stripe_session_id: invoice.id,
            plan, clips_mensuales: videos, importe,
            estado: "onboarding_pendiente",
            agente_codigo: agenteCodigo || null,
            revisiones_incluidas: revisiones,
          }).select().single();

          await supabase.from("ventas").insert({
            agente_id: agente?.id || null,
            agente_codigo: agenteCodigo || null,
            cliente_email: metaEmail, plan, importe,
            estado: agenteEsBloqueadoEl ? "invalida" : "pendiente_validacion",
            stripe_session_id: invoice.id,
            disponible_at: agenteEsBloqueadoEl ? null : new Date(Date.now() + HOLD_DIAS * 86400000).toISOString(),
            sospechoso: sospechosoEl, sospechoso_motivo: sospechosoMotivoEl,
          });

          // Drive — no bloqueante
          if (order?.id) {
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/drive`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-internal-secret": process.env.CRON_SECRET || "" },
              body: JSON.stringify({ clienteNombre: nombre || metaEmail.split("@")[0], clienteEmail: metaEmail, plan, orderId: order.id }),
            }).catch(e => console.error("[Drive] Error:", e));
          }

          // Referido de cliente
          if (clientRef && metaEmail && customerId) {
            try {
              const referrer = await lookupRefCode(clientRef);
              if (referrer) {
                const { referral, suspicious } = await registerReferral({
                  referrerStripeCustomerId: referrer.stripe_customer_id,
                  referrerEmail: referrer.email,
                  referredEmail: metaEmail,
                  referredStripeCustomerId: customerId,
                  stripeSessionId: invoice.id,
                  orderId: order?.id,
                  amountPaid: importe,
                });
                await Promise.allSettled([
                  sendEmail(() => enviarEmailReferidoRegistrado({ referrerEmail: referrer.email, referredEmail: metaEmail, creditAmount: referral.credit_amount ?? 0 }), referrer.email, "referido_registrado", event.type),
                  sendEmail(() => enviarEmailAdminNuevoReferido({ referrerEmail: referrer.email, referredEmail: metaEmail, amountPaid: importe, creditAmount: referral.credit_amount ?? 0, isSuspicious: suspicious, suspiciousReason: referral.suspicious_reason }), process.env.ADMIN_EMAIL!, "admin_nuevo_referido", event.type),
                ]);
              }
            } catch (refErr) { console.error("[Referral] Elements:", refErr); }
          }

          await log("venta_registrada_elements", `${metaEmail} · €${importe} · agente:${agenteCodigo || "directo"}`);
          await sendEmail(() => enviarEmailClientePagoRealizado({ email: metaEmail, nombre, plan, importe, onboardingUrl: `${ONBOARDING_URL}?session=${invoice.id}` }), metaEmail, "cliente_pago_realizado", event.type);
          await sendEmail(() => enviarEmailAdmin({ clienteEmail: metaEmail, plan, importe, agente, comision, sospechoso: sospechosoEl }), process.env.ADMIN_EMAIL!, "admin_nueva_venta", event.type);
          if (agente && !sospechosoEl) await sendEmail(() => enviarEmailAgente({ agente, clienteEmail: metaEmail, plan, importe, comision }), agente.email, "agente_nueva_comision", event.type);
          break;
        }

        // ── Renovación mensual ───────────────────────────────────────────────
        // Idempotencia: evitar procesar la misma factura dos veces
        const { data: invoiceLog } = await supabase.from("activity_logs")
          .select("id").eq("accion", "renovacion").eq("detalle", `invoice:${invoice.id}`).single();
        if (invoiceLog) break; // ya procesada

        const periodo = invoice.period_end ? new Date(invoice.period_end * 1000).toLocaleDateString("es-ES") : "";

        let orderRenovado = null;
        if (invoice.subscription) {
          const { data } = await supabase.from("orders")
            .update({ estado: "esperando_material", revisiones_usadas: 0 })
            .eq("stripe_subscription_id", String(invoice.subscription))
            .neq("estado", "cancelado")
            .select("id, stripe_customer_id, cliente_nombre").single();
          orderRenovado = data;
        }

        // Pedir reseña en renovaciones (si no se ha pedido antes y REVIEW_URL configurado)
        if (orderRenovado?.stripe_customer_id && clienteEmail) {
          try {
            const shouldAsk = await maybeRequestReview(orderRenovado.stripe_customer_id, clienteEmail, orderRenovado.id);
            if (shouldAsk && process.env.NEXT_PUBLIC_REVIEW_URL) {
              await sendEmail(
                () => enviarEmailPedirResena({ email: clienteEmail, nombre: orderRenovado.cliente_nombre, reviewUrl: process.env.NEXT_PUBLIC_REVIEW_URL! }),
                clienteEmail, "pedir_resena", event.type
              );
            }
          } catch (revErr) {
            console.error("[Review] Error en renovación:", revErr);
          }
        }

        await log("renovacion", `invoice:${invoice.id}`, "invoice");
        await log("renovacion_cliente", `${clienteEmail} · €${importe}`);
        await sendEmail(() => enviarEmailClienteRenovacion({ email: clienteEmail, plan: "Plan VitalSoft", importe, periodo }), clienteEmail, "cliente_renovacion", event.type);
        break;
      }

      // ── Cambio de plan ───────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const prevSub = event.data.previous_attributes as any;
        if (!prevSub?.items) break;
        const item = sub.items.data[0];
        const nuevoImporte = item?.price?.unit_amount ? item.price.unit_amount / 100 : null;
        if (nuevoImporte && sub.id) {
          await supabase.from("orders")
            .update({ importe: nuevoImporte, actualizado_at: new Date().toISOString() })
            .eq("stripe_subscription_id", sub.id).neq("estado", "cancelado");
          await log("cambio_plan", `Sub ${sub.id} · nuevo importe: €${nuevoImporte}`);
        }
        break;
      }

      // ── Pago fallido ──────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const clienteEmail = invoice.customer_email || "";
        const importe = (invoice.amount_due || 0) / 100;
        const failedBillingReason = (invoice as any).billing_reason;
        if (invoice.subscription) {
          // Primera suscripción fallida → no marcar como pausado (nunca estuvo activo)
          // Renovación fallida → sí marcar como pausado
          const nuevoEstado = failedBillingReason === "subscription_create" ? "pago_fallido" : "pausado";
          await supabase.from("orders")
            .update({ estado: nuevoEstado })
            .eq("stripe_subscription_id", String(invoice.subscription))
            .neq("estado", "cancelado");
        }
        await log("pago_fallido", `${clienteEmail} · €${importe}`);
        await sendEmail(() => enviarEmailClientePagoFallido({ email: clienteEmail, plan: "Plan VitalSoft", importe }), clienteEmail, "cliente_pago_fallido", event.type);
        await sendEmail(() => enviarEmailAdminPagoFallido({ clienteEmail, importe }), process.env.ADMIN_EMAIL!, "admin_pago_fallido", event.type);
        break;
      }

      // ── Cancelación ───────────────────────────────────────────────────────
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

      // ── Reembolso ─────────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // billing_details.email is often null for subscription charges - look up by customer
        let clienteEmail = charge.billing_details?.email || charge.receipt_email || "";
        if (!clienteEmail && charge.customer) {
          try {
            const customerId = typeof charge.customer === "string" ? charge.customer : (charge.customer as any).id;
            const customer = await stripe.customers.retrieve(customerId);
            if ("email" in customer && customer.email) clienteEmail = customer.email;
          } catch (e) { console.error("[Refund] customer lookup failed:", e); }
        }
        const importe = (charge.amount_refunded || 0) / 100;

        // Invalidar comisión de agente si existe
        if (clienteEmail) {
          const { data: ventasPendientes } = await supabase
            .from("ventas").select("id, agente_codigo")
            .eq("cliente_email", clienteEmail)
            .in("estado", ["pendiente_validacion", "disponible"]);

          if (ventasPendientes && ventasPendientes.length > 0) {
            for (const venta of ventasPendientes) {
              await supabase.from("ventas")
                .update({ estado: "reembolsada", notas_admin: `Reembolso procesado · €${importe}` })
                .eq("id", venta.id);
              await log("comision_invalidada_refund", `Venta ${venta.id} · agente ${venta.agente_codigo || "directo"} · refund €${importe}`, "venta");
            }
          }
        }

        // Invalidar crédito de referido si existe para esta sesión
        // Buscamos por customer email ya que charge no siempre tiene session_id directo
        if (clienteEmail) {
          try {
            const { data: referralPorEmail } = await supabase.from("client_referrals")
              .select("id, status").eq("referred_email", clienteEmail.toLowerCase())
              .in("status", ["pendiente_validacion", "disponible"]).limit(1);
            if (referralPorEmail && referralPorEmail.length > 0) {
              await supabase.from("client_referrals").update({
                status: "reembolsado",
                notes: `Crédito cancelado por refund de €${importe}`,
              }).eq("id", referralPorEmail[0].id);
              await log("referido_credito_cancelado_refund", `Referido de ${clienteEmail} · €${importe}`);
            }
          } catch (refErr) {
            console.error("[Referral] Error en refund:", refErr);
          }
        }

        await log("reembolso", `${clienteEmail || "desconocido"} · €${importe}`);
        if (clienteEmail) {
          await sendEmail(() => enviarEmailClienteReembolso({ email: clienteEmail, importe }), clienteEmail, "cliente_reembolso", event.type);
        }
        await sendEmail(() => enviarEmailAdminReembolso({ clienteEmail: clienteEmail || "email desconocido", importe }), process.env.ADMIN_EMAIL!, "admin_reembolso", event.type);
        break;
      }
    }
  } catch (err) {
    console.error(`[Webhook] Error en ${event.type}:`, err);
    await log("webhook_error", `${event.type}: ${String(err)}`);
  }

  return NextResponse.json({ received: true });
}
