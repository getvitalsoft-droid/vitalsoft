// lib/emails/referral-emails.ts
// 6 emails nuevos: 3 para cliente referrer, 2 para admin, 1 para reseña

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'VitalSoft <hola@vitalsoft.pro>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@vitalsoft.pro'

function wrap(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:0}
.c{max-width:580px;margin:40px auto;background:#fff;border-radius:8px;padding:40px}
.logo{font-size:20px;font-weight:700;color:#111827;margin-bottom:32px}
h2{font-size:19px;color:#111827;margin:0 0 16px}
p{font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px}
.box{background:#111827;color:#fff;border-radius:8px;padding:20px;text-align:center;margin:20px 0}
.amount{font-size:32px;font-weight:700;color:#22c55e}
.label{font-size:12px;color:#9ca3af;margin-top:4px}
.info{background:#f0fdf4;border-left:3px solid #22c55e;padding:12px 16px;border-radius:4px;margin:16px 0}
.warn{background:#fef2f2;border-left:3px solid #ef4444;padding:12px 16px;border-radius:4px;margin:16px 0}
.btn{display:inline-block;background:#111827;color:#fff!important;text-decoration:none;padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;margin:8px 0}
.footer{margin-top:36px;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px}
</style></head><body><div class="c">
<div class="logo">VitalSoft</div>
${content}
<div class="footer">VitalSoft · vitalsoft.pro · Recibes este email porque eres cliente de VitalSoft.</div>
</div></body></html>`
}

// ── Email 1: Referido registrado (para referrer) ─────────────

export async function sendReferralRegisteredEmail(p: {
  referrerEmail: string
  referredEmail: string
  amountPaid: number
  creditAmount: number
}) {
  return resend.emails.send({
    from: FROM,
    to: p.referrerEmail,
    subject: `Tu referido ha comprado — crédito de ${p.creditAmount.toFixed(2)}€ pendiente`,
    html: wrap(`
      <h2>🎉 ¡Tu referido ha comprado!</h2>
      <p><strong>${p.referredEmail}</strong> acaba de contratar VitalSoft gracias a tu recomendación.</p>
      <div class="box">
        <div class="amount">+${p.creditAmount.toFixed(2)}€</div>
        <div class="label">Crédito generado · Pendiente de validación</div>
      </div>
      <div class="info">
        <strong>¿Qué significa "pendiente"?</strong><br>
        Tu crédito se activa una vez confirmado el pago (habitualmente en 7-14 días).
        Si hay algún problema con el pago, el crédito se cancela automáticamente.
      </div>
      <p>Te avisaremos en cuanto esté disponible para descontarlo de tu siguiente mensualidad.</p>
    `),
  })
}

// ── Email 2: Crédito disponible (para referrer) ──────────────

export async function sendCreditAvailableEmail(p: {
  referrerEmail: string
  creditAmount: number
}) {
  return resend.emails.send({
    from: FROM,
    to: p.referrerEmail,
    subject: `Tu crédito de ${p.creditAmount.toFixed(2)}€ ya está disponible`,
    html: wrap(`
      <h2>✅ Tu crédito ya está disponible</h2>
      <p>Tu crédito por referido ha sido validado.</p>
      <div class="box">
        <div class="amount">${p.creditAmount.toFixed(2)}€</div>
        <div class="label">Disponible para tu próxima factura</div>
      </div>
      <p>Nuestro equipo lo aplicará en tu <strong>próximo ciclo de facturación</strong>. No tienes que hacer nada.</p>
      <p>Si tienes dudas, responde a este email.</p>
    `),
  })
}

// ── Email 3: Crédito aplicado (para referrer) ────────────────

export async function sendCreditAppliedEmail(p: {
  referrerEmail: string
  creditAmount: number
}) {
  return resend.emails.send({
    from: FROM,
    to: p.referrerEmail,
    subject: `Tu crédito de ${p.creditAmount.toFixed(2)}€ ha sido aplicado`,
    html: wrap(`
      <h2>💳 Tu crédito ha sido aplicado</h2>
      <p>Hemos aplicado <strong>${p.creditAmount.toFixed(2)}€</strong> de descuento a tu factura de este mes.</p>
      <div class="info">
        Si en los próximos días no ves el descuento reflejado, responde a este email.
      </div>
      <p>¿Conoces a otro creador que publique contenido largo? Puedes seguir refiriendo y acumulando créditos.</p>
    `),
  })
}

// ── Email 4: Admin — nuevo referido ─────────────────────────

export async function sendAdminNewReferralEmail(p: {
  referrerEmail: string
  referredEmail: string
  amountPaid: number
  creditAmount: number
  isSuspicious: boolean
  suspiciousReason?: string | null
  referralId: string
}) {
  const adminUrl = `https://vitalsoft.pro/admin/referrals`
  const suspiciousBlock = p.isSuspicious
    ? `<div class="warn">⚠️ <strong>SOSPECHOSO:</strong> ${p.suspiciousReason}</div>`
    : ''

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[VitalSoft] Nuevo referido: ${p.referrerEmail} → ${p.referredEmail}`,
    html: wrap(`
      <h2>🔔 Nuevo referido de cliente</h2>
      ${suspiciousBlock}
      <p>
        <strong>Referrer:</strong> ${p.referrerEmail}<br>
        <strong>Referido:</strong> ${p.referredEmail}<br>
        <strong>Importe pagado:</strong> ${p.amountPaid.toFixed(2)}€<br>
        <strong>Crédito generado:</strong> ${p.creditAmount.toFixed(2)}€
      </p>
      <a href="${adminUrl}" class="btn">Ver referidos en admin →</a>
    `),
  })
}

// ── Email 5: Admin — crédito listo para aplicar ──────────────

export async function sendAdminCreditReadyEmail(p: {
  referrerEmail: string
  creditAmount: number
  referralId: string
}) {
  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[VitalSoft] Crédito de ${p.creditAmount.toFixed(2)}€ listo para aplicar — ${p.referrerEmail}`,
    html: wrap(`
      <h2>💳 Crédito disponible para aplicar</h2>
      <p>
        El crédito de <strong>${p.creditAmount.toFixed(2)}€</strong> para 
        <strong>${p.referrerEmail}</strong> está validado y listo para aplicar.
      </p>
      <a href="https://vitalsoft.pro/admin/referrals" class="btn">Aplicar en admin →</a>
    `),
  })
}

// ── Email 6: Solicitud de reseña ─────────────────────────────

export async function sendReviewRequestEmail(p: {
  customerEmail: string
  customerName?: string
  reviewUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: p.customerEmail,
    subject: '¿Nos dejas una reseña rápida? (menos de 1 minuto)',
    html: wrap(`
      <h2>¿Nos dejas una reseña rápida?</h2>
      <p>Hola${p.customerName ? ` ${p.customerName}` : ''},</p>
      <p>Llevas un tiempo trabajando con VitalSoft y tu opinión nos importa mucho.</p>
      <p>Si el servicio te ha funcionado bien, ¿podrías dejarnos una reseña honesta? Tarda menos de 1 minuto y ayuda a otros creadores a tomar su decisión.</p>
      <a href="${p.reviewUrl}" class="btn">Dejar reseña →</a>
      <p style="font-size:13px;color:#9ca3af;margin-top:20px">Si prefieres no hacerlo, no pasa nada. Puedes ignorar este email sin problema.</p>
    `),
  })
}
