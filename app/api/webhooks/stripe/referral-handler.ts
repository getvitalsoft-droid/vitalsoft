// app/api/webhooks/stripe/referral-handler.ts
// Integrar en tu webhook Stripe existente — NO reemplaza nada.
//
// En checkout.session.completed, añadir al final:
//   await handleCheckoutReferral(session, orderId)
//
// En charge.refunded (o payment_intent.refunded), añadir:
//   await handleStripeRefundForReferral(sessionId)

import Stripe from 'stripe'
import { registerReferral, lookupRefCode, handleReferralRefund } from '@/lib/referrals'
import {
  sendReferralRegisteredEmail,
  sendAdminNewReferralEmail,
} from '@/lib/emails/referral-emails'

export async function handleCheckoutReferral(
  session: Stripe.Checkout.Session,
  orderId: string
) {
  try {
    // El código llega en session.metadata.client_ref
    // Añadir al crear la sesión Stripe: metadata: { client_ref: req.cookies.client_ref ?? '' }
    const refCode = session.metadata?.client_ref
    if (!refCode) return

    const referrer = await lookupRefCode(refCode)
    if (!referrer) return

    const referredEmail = session.customer_details?.email ?? ''
    const referredStripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : undefined
    const amountPaid = (session.amount_total ?? 0) / 100 // centavos → euros

    const { referral, suspicious } = await registerReferral({
      referrerStripeCustomerId: referrer.stripe_customer_id,
      referrerEmail: referrer.email,
      referredEmail,
      referredStripeCustomerId,
      stripeSessionId: session.id,
      orderId,
      amountPaid,
    })

    // Emails — siempre enviar (admin decide si es válido)
    await Promise.allSettled([
      sendReferralRegisteredEmail({
        referrerEmail: referrer.email,
        referredEmail,
        amountPaid,
        creditAmount: referral.credit_amount ?? 0,
      }),
      sendAdminNewReferralEmail({
        referrerEmail: referrer.email,
        referredEmail,
        amountPaid,
        creditAmount: referral.credit_amount ?? 0,
        isSuspicious: suspicious,
        suspiciousReason: referral.suspicious_reason,
        referralId: referral.id,
      }),
    ])
  } catch (err) {
    // Nunca fallar el webhook por un error de referidos
    console.error('[referral] handleCheckoutReferral error:', err)
  }
}

export async function handleStripeRefundForReferral(stripeSessionId: string) {
  try {
    await handleReferralRefund(stripeSessionId)
  } catch (err) {
    console.error('[referral] handleStripeRefundForReferral error:', err)
  }
}
