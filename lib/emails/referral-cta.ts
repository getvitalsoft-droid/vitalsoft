// lib/emails/referral-cta.ts
// Bloque HTML para añadir al final de los emails existentes:
//   - email de pago realizado
//   - email de entrega completada
//   - email de renovación
//   - onboarding final
//
// Uso en cualquier email existente:
//   import { referralCtaHtml } from '@/lib/emails/referral-cta'
//   const cta = await referralCtaHtml(stripeCustomerId, clienteEmail)
//   // añadir `cta` justo antes del cierre del </body> del email

import { getOrCreateRefCode } from '@/lib/referrals'

export async function referralCtaHtml(
  stripeCustomerId: string,
  email: string
): Promise<string> {
  let refLink = 'https://vitalsoft.pro'
  try {
    const code = await getOrCreateRefCode(stripeCustomerId, email)
    refLink = `https://vitalsoft.pro?client_ref=${code}`
  } catch {
    // Fallo silencioso — no romper el email principal
  }

  return `
<div style="margin-top:32px;padding:20px 24px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
  <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">
    ¿Conoces a otro creador que publique contenido largo?
  </p>
  <p style="margin:0 0 14px;font-size:13px;color:#6b7280;line-height:1.5;">
    Invítalo con tu link personal y, si contrata VitalSoft, recibes crédito 
    para descontar de tu siguiente mensualidad.
  </p>
  <a href="${refLink}"
     style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;
            padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;">
    Compartir mi link →
  </a>
  <p style="margin:10px 0 0;font-size:11px;color:#9ca3af;">${refLink}</p>
</div>`
}
