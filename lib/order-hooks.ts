// lib/order-hooks.ts
// Llamar cuando un order pasa al estado `completado` en tu panel admin.
// Si usas una route API para cambiar estados, añadir esta llamada allí.

import { maybeRequestReview } from '@/lib/reviews'
import { sendReviewRequestEmail } from '@/lib/emails/referral-emails'

export async function onOrderCompleted(params: {
  orderId: string
  stripeCustomerId: string
  clienteEmail: string
  clienteNombre?: string
}) {
  const { orderId, stripeCustomerId, clienteEmail, clienteNombre } = params

  const shouldAsk = await maybeRequestReview(stripeCustomerId, clienteEmail, orderId)

  if (shouldAsk && process.env.NEXT_PUBLIC_REVIEW_URL) {
    await sendReviewRequestEmail({
      customerEmail: clienteEmail,
      customerName: clienteNombre,
      reviewUrl: process.env.NEXT_PUBLIC_REVIEW_URL,
    }).catch((err) => console.error('[review] Error enviando email de reseña:', err))
  }
}
