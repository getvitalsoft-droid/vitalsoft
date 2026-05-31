// ═══════════════════════════════════════════════════════════════════════════
// VitalSoft — Sistema centralizado de emails (Resend)
//
// ARQUITECTURA:
//   Stripe → webhook → /api/webhook → aquí → Resend → email final
//
// MAPA COMPLETO DE EMAILS (21 total):
// ─────────────────────────────────────────────────────────────────────────
// CLIENTE:
//   enviarEmailClientePagoRealizado   ← checkout.session.completed
//   enviarEmailClienteRenovacion      ← invoice.paid (no primer pago)
//   enviarEmailClientePagoFallido     ← invoice.payment_failed
//   enviarEmailClienteCancelacion     ← customer.subscription.deleted
//   enviarEmailClienteReembolso       ← charge.refunded
//
// AGENTES:
//   enviarEmailBienvenidaAgente       ← PATCH /api/agentes (aprobar)
//   enviarEmailAgente                 ← checkout.session.completed
//   enviarEmailAgenteComisionDisp     ← cron/manual cuando pasan 7 días
//   enviarEmailAgenteComisionPagada   ← PATCH /api/agentes (marcar_pagado)
//   enviarEmailAgenteBloqueo          ← PATCH /api/agentes (bloquear)
//
// ADMIN:
//   enviarEmailAdmin                  ← checkout.session.completed
//   enviarEmailAdminPagoFallido       ← invoice.payment_failed
//   enviarEmailAdminCancelacion       ← customer.subscription.deleted
//   enviarEmailAdminReembolso         ← charge.refunded
//   enviarEmailAdminNuevoPendiente    ← POST /api/agentes (nuevo registro)
//
// REFERIDOS DE CLIENTES (nuevos):
//   enviarEmailReferidoRegistrado     ← checkout.session.completed (cuando hay client_ref)
//   enviarEmailCreditoDisponible      ← PATCH /api/admin/referrals (release_credit)
//   enviarEmailCreditoAplicado        ← PATCH /api/admin/referrals (apply_credit)
//   enviarEmailAdminNuevoReferido     ← checkout.session.completed (cuando hay client_ref)
//   enviarEmailAdminCreditoListo      ← PATCH /api/admin/referrals (release_credit)
//
// RESEÑAS EXTERNAS (nuevo):
//   enviarEmailPedirResena            ← cuando order pasa a completado
// ═══════════════════════════════════════════════════════════════════════════

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "getvitalsoft@gmail.com";
const SITE = "https://vitalsoft.pro";

// ─── Estilos base compartidos ──────────────────────────────────────────────
const BASE_STYLE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#f0f0f0;border-radius:14px;overflow:hidden`;
const HEADER = (titulo: string, subtitulo: string, emoji = "") => `
  <div style="background:#111;padding:20px 32px 20px;border-bottom:1px solid #222">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <img src="https://vitalsoft.pro/logo-email.png" alt="VitalSoft" width="36" height="36" style="border-radius:8px;display:block" />
      <span style="font-size:16px;font-weight:800;color:#f0f0f0"><span style="color:#d4f53c">Vital</span>Soft</span>
    </div>
    <div style="font-size:22px;font-weight:800;margin-bottom:4px">${emoji ? emoji + " " : ""}${titulo}</div>
    <div style="font-size:13px;color:#666">${subtitulo}</div>
  </div>`;
const BODY_OPEN = `<div style="padding:28px 32px">`;
const BODY_CLOSE = `</div>`;
const CARD = (contenido: string) => `<div style="background:#1a1a1a;border-radius:10px;padding:18px 20px;margin:16px 0">${contenido}</div>`;
const ROW = (label: string, value: string, accent = false) => `<p style="margin:6px 0;font-size:13px"><span style="color:#666">${label}:</span> <strong style="${accent ? "color:#d4f53c" : ""}">${value}</strong></p>`;
const BTN = (texto: string, url: string) => `<a href="${url}" style="display:inline-block;background:#d4f53c;color:#080808;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:800;font-size:13px;margin-top:16px">${texto} →</a>`;
const ALERTA = (texto: string, tipo: "warn" | "error" = "warn") => `<div style="background:${tipo === "error" ? "#ff4444" : "#f59e0b"};color:white;padding:12px 16px;border-radius:8px;margin:12px 0;font-size:13px;font-weight:600">${texto}</div>`;
const FOOTER_HTML = `<div style="padding:20px 32px;border-top:1px solid #1a1a1a;font-size:11px;color:#333">VitalSoft · <a href="${SITE}" style="color:#444">${SITE}</a> · <a href="mailto:${ADMIN_EMAIL}" style="color:#444">${ADMIN_EMAIL}</a></div>`;
const WRAP = (header: string, body: string) => `<div style="${BASE_STYLE}">${header}${BODY_OPEN}${body}${BODY_CLOSE}${FOOTER_HTML}</div>`;

interface Agente { nombre: string; email: string; codigo: string; }

// ════════════════════════════════════════════════════════════════════════════
// EMAILS CLIENTE
// ════════════════════════════════════════════════════════════════════════════

/** Disparado por: checkout.session.completed (primer pago) */
export async function enviarEmailClientePagoRealizado({
  email, nombre, plan, importe, onboardingUrl,
}: {
  email: string; nombre?: string; plan: string; importe: number; onboardingUrl?: string;
}) {
  const body = `
    ${CARD(`
      ${ROW("Plan contratado", plan)}
      ${ROW("Importe", `€${importe}/mes`, true)}
      ${ROW("Renovación", "Mensual automática")}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7;margin:16px 0">
      <strong style="color:#f0f0f0">Siguiente paso:</strong> completa el formulario de configuración para que podamos empezar a producir tus clips.
      El plazo de entrega (24–48h) empieza cuando recibimos y validamos tu material.
    </p>
    ${onboardingUrl ? BTN("Configurar mi proyecto →", onboardingUrl) : ""}
    <p style="font-size:12px;color:#444;margin-top:16px">
      ¿Tienes dudas? Responde a este email o escríbenos a <a href="mailto:${ADMIN_EMAIL}" style="color:#d4f53c">${ADMIN_EMAIL}</a>
    </p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `✅ Pago confirmado — Bienvenido a VitalSoft`,
    html: WRAP(HEADER("¡Bienvenido a VitalSoft!", `Hola${nombre ? ` ${nombre}` : ""}, tu suscripción está activa.`, "✅"), body),
  });
}

/** Disparado por: invoice.paid (renovaciones) */
export async function enviarEmailClienteRenovacion({
  email, plan, importe, periodo,
}: {
  email: string; plan: string; importe: number; periodo: string;
}) {
  const body = `
    ${CARD(`
      ${ROW("Plan", plan)}
      ${ROW("Renovado hasta", periodo)}
      ${ROW("Importe", `€${importe}`, true)}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Tu suscripción se ha renovado correctamente. Puedes subir nuevo material a tu carpeta Drive en cualquier momento.
    </p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `🔄 Suscripción renovada — VitalSoft`,
    html: WRAP(HEADER("Suscripción renovada", `Siguiente período hasta ${periodo}.`, "🔄"), body),
  });
}

/** Disparado por: invoice.payment_failed */
export async function enviarEmailClientePagoFallido({
  email, plan, importe,
}: {
  email: string; plan: string; importe: number;
}) {
  const body = `
    ${ALERTA("No hemos podido procesar tu pago de este mes.")}
    ${CARD(`${ROW("Plan", plan)}${ROW("Importe pendiente", `€${importe}`, true)}`)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Stripe intentará el cobro de nuevo en los próximos días. 
      Si el problema persiste, actualiza tu método de pago desde el portal de Stripe.
    </p>
    ${BTN("Actualizar método de pago", "https://billing.stripe.com")}`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `⚠️ Problema con tu pago — VitalSoft`,
    html: WRAP(HEADER("Pago fallido", "No pudimos procesar tu suscripción.", "⚠️"), body),
  });
}

/** Disparado por: customer.subscription.deleted */
export async function enviarEmailClienteCancelacion({
  email, plan, fechaFin,
}: {
  email: string; plan: string; fechaFin: string;
}) {
  const body = `
    ${CARD(`${ROW("Plan cancelado", plan)}${ROW("Acceso hasta", fechaFin)}`)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Lamentamos que te vayas. Sigues teniendo acceso hasta el ${fechaFin}. 
      Si cambias de opinión, puedes reactivar en cualquier momento.
    </p>
    ${BTN("Volver a contratar", SITE)}`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `Suscripción cancelada — VitalSoft`,
    html: WRAP(HEADER("Suscripción cancelada", "Esperamos verte pronto.", "👋"), body),
  });
}

/** Disparado por: charge.refunded */
export async function enviarEmailClienteReembolso({
  email, importe,
}: {
  email: string; importe: number;
}) {
  const body = `
    ${CARD(`${ROW("Importe reembolsado", `€${importe}`, true)}${ROW("Plazo", "3-10 días hábiles")}`)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Hemos procesado tu reembolso. El tiempo de acreditación depende de tu banco.
    </p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `💳 Reembolso procesado — €${importe}`,
    html: WRAP(HEADER("Reembolso procesado", "Tu dinero está de vuelta.", "💳"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS AGENTES
// ════════════════════════════════════════════════════════════════════════════

/** Disparado por: PATCH /api/agentes accion=aprobar */
export async function enviarEmailBienvenidaAgente({
  agente,
  links,
}: {
  agente: Agente;
  links?: { general: string; starter: string; growth: string; scale: string; pro: string };
}) {
  const refLink = links?.general || `${SITE}?ref=${agente.codigo}`;
  const linksHtml = links ? CARD(`
    ${ROW("Link general", links.general)}
    ${ROW("Starter", links.starter)}
    ${ROW("Growth", links.growth)}
    ${ROW("Scale", links.scale)}
    ${ROW("Pro", links.pro)}
  `) : "";
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">Hola <strong>${agente.nombre}</strong>, tu cuenta ha sido activada.</p>
    ${CARD(`
      ${ROW("Tu código de referido", agente.codigo, true)}
      ${ROW("Comisión por venta", "20% del primer pago")}
      ${ROW("Retención de seguridad", "7 días")}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Comparte tu link de referido y gana comisión por cada cliente que contrate.
      Tu link: <strong style="color:#d4f53c">${refLink}</strong>
    </p>
    ${linksHtml}
    ${BTN("Ver mi panel de agente", `${SITE}/agentes`)}`;

  return await resend.emails.send({
    from: FROM, to: agente.email,
    subject: `🚀 ¡Cuenta de agente VitalSoft activa!`,
    html: WRAP(HEADER("¡Ya eres agente!", "Tu cuenta ha sido aprobada.", "🚀"), body),
  });
}

/** Disparado por: checkout.session.completed (cuando hay agente referido) */
export async function enviarEmailAgente({
  agente, clienteEmail, plan, importe, comision,
}: {
  agente: Agente; clienteEmail: string; plan: string; importe: number; comision: number;
}) {
  const disponibleEn = new Date(Date.now() + 7 * 86400000).toLocaleDateString("es-ES");
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">Hola <strong>${agente.nombre}</strong>, tu código <strong style="color:#d4f53c">${agente.codigo}</strong> ha generado una venta.</p>
    ${CARD(`
      ${ROW("Plan vendido", plan)}
      ${ROW("Importe total", `€${importe}`)}
      ${ROW("Tu comisión (20%)", `€${comision}`, true)}
      ${ROW("Disponible para cobrar el", disponibleEn)}
    `)}
    <p style="font-size:12px;color:#555;line-height:1.7">
      La comisión queda retenida 7 días para verificar el pago. Recibirás otro email cuando esté disponible para cobrar.
    </p>
    ${BTN("Ver mis comisiones", `${SITE}/agentes`)}`;

  return await resend.emails.send({
    from: FROM, to: agente.email,
    subject: `🎉 Nueva comisión de €${comision} — VitalSoft`,
    html: WRAP(HEADER("¡Nueva comisión!", `Has generado una venta con ${agente.codigo}`, "🎉"), body),
  });
}

/** Disparado por: cron o proceso automático cuando venta.disponible_at <= now() */
export async function enviarEmailAgenteComisionDisponible({
  agente, comision, plan,
}: {
  agente: Agente; comision: number; plan: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">Hola <strong>${agente.nombre}</strong>, tu comisión ya está disponible para cobrar.</p>
    ${CARD(`
      ${ROW("Plan", plan)}
      ${ROW("Comisión disponible", `€${comision}`, true)}
      ${ROW("Estado", "Lista para cobrar")}
    `)}
    <p style="font-size:13px;color:#888">El equipo de VitalSoft procesará tu pago próximamente. Recibirás confirmación cuando se realice la transferencia.</p>
    ${BTN("Ver mi panel", `${SITE}/agentes`)}`;

  return await resend.emails.send({
    from: FROM, to: agente.email,
    subject: `💰 Comisión disponible — €${comision}`,
    html: WRAP(HEADER("Comisión disponible", "Tu comisión ya está lista para cobrar.", "💰"), body),
  });
}

/** Disparado por: PATCH /api/agentes accion=marcar_pagado */
export async function enviarEmailAgenteComisionPagada({
  agente, comision, plan,
}: {
  agente: Agente; comision: number; plan: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">Hola <strong>${agente.nombre}</strong>, hemos procesado tu pago.</p>
    ${CARD(`
      ${ROW("Plan", plan)}
      ${ROW("Comisión pagada", `€${comision}`, true)}
      ${ROW("Fecha", new Date().toLocaleDateString("es-ES"))}
    `)}
    <p style="font-size:13px;color:#888">La transferencia ha sido enviada. Puede tardar 1–3 días hábiles en aparecer en tu cuenta.</p>
    ${BTN("Ver mi historial", `${SITE}/agentes`)}`;

  return await resend.emails.send({
    from: FROM, to: agente.email,
    subject: `✅ Comisión pagada — €${comision}`,
    html: WRAP(HEADER("Comisión pagada", "Hemos enviado tu pago.", "✅"), body),
  });
}

/** Disparado por: PATCH /api/agentes accion=bloquear */
export async function enviarEmailAgenteBloqueo({
  agente, motivo,
}: {
  agente: Agente; motivo?: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">Hola <strong>${agente.nombre}</strong>, tu cuenta de agente ha sido desactivada.</p>
    ${motivo ? CARD(ROW("Motivo", motivo)) : ""}
    <p style="font-size:13px;color:#888">Si crees que es un error, contacta con nosotros en <a href="mailto:${ADMIN_EMAIL}" style="color:#d4f53c">${ADMIN_EMAIL}</a>.</p>`;

  return await resend.emails.send({
    from: FROM, to: agente.email,
    subject: `Cuenta de agente desactivada — VitalSoft`,
    html: WRAP(HEADER("Cuenta desactivada", "Tu acceso como agente ha sido suspendido.", "🔒"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS ADMIN
// ════════════════════════════════════════════════════════════════════════════

/** Disparado por: checkout.session.completed */
export async function enviarEmailAdmin({
  clienteEmail, plan, importe, agente, comision, sospechoso = false,
}: {
  clienteEmail: string; plan: string; importe: number;
  agente: Agente | null; comision: number; sospechoso?: boolean;
}) {
  const alertaHtml = sospechoso
    ? ALERTA("⚠️ POSIBLE AUTO-REFERIDO — Revisar antes de pagar comisión. El email del cliente coincide con el del agente.", "error")
    : "";

  const agenteHtml = agente
    ? CARD(`${ROW("Agente", `${agente.nombre} (${agente.codigo})`)}${ROW("Email agente", agente.email)}${ROW("Comisión (20%)", `€${comision} — disponible en 7 días`, true)}`)
    : CARD(`<p style="color:#555;font-size:13px;margin:0">Venta directa — sin agente referido</p>`);

  const body = `
    ${alertaHtml}
    ${CARD(`${ROW("Cliente", clienteEmail)}${ROW("Plan", plan)}${ROW("Importe", `€${importe}`, true)}`)}
    ${agenteHtml}
    ${BTN("Ver panel admin", `${SITE}/admin`)}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `${sospechoso ? "⚠️ REVISAR — " : ""}💰 Nueva venta — €${importe}`,
    html: WRAP(HEADER("Nueva venta", `${clienteEmail} acaba de contratar.`, "💰"), body),
  });
}

/** Disparado por: invoice.payment_failed */
export async function enviarEmailAdminPagoFallido({
  clienteEmail, importe, plan,
}: {
  clienteEmail: string; importe: number; plan?: string;
}) {
  const body = `
    ${ALERTA("Un cliente no ha podido renovar su suscripción este mes.", "warn")}
    ${CARD(`${ROW("Cliente", clienteEmail)}${plan ? ROW("Plan", plan) : ""}${ROW("Importe pendiente", `€${importe}`, true)}`)}
    <p style="font-size:13px;color:#888">Stripe reintentará el cobro automáticamente. Si persiste, el cliente recibirá un aviso.</p>
    ${BTN("Ver en Stripe", "https://dashboard.stripe.com/subscriptions")}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `⚠️ Pago fallido — ${clienteEmail}`,
    html: WRAP(HEADER("Pago fallido", "Un cliente no pudo renovar.", "⚠️"), body),
  });
}

/** Disparado por: customer.subscription.deleted */
export async function enviarEmailAdminCancelacion({
  clienteEmail, plan,
}: {
  clienteEmail: string; plan?: string;
}) {
  const body = `
    ${CARD(`${ROW("Cliente", clienteEmail)}${plan ? ROW("Plan cancelado", plan) : ""}`)}
    <p style="font-size:13px;color:#888">El cliente ha cancelado su suscripción. Sigue teniendo acceso hasta el final del período pagado.</p>`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `👋 Cancelación — ${clienteEmail}`,
    html: WRAP(HEADER("Suscripción cancelada", `${clienteEmail} ha cancelado.`, "👋"), body),
  });
}

/** Disparado por: charge.refunded */
export async function enviarEmailAdminReembolso({
  clienteEmail, importe, motivo,
}: {
  clienteEmail: string; importe: number; motivo?: string;
}) {
  const body = `
    ${CARD(`${ROW("Cliente", clienteEmail)}${ROW("Importe reembolsado", `€${importe}`, true)}${motivo ? ROW("Motivo", motivo) : ""}`)}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `💳 Reembolso procesado — €${importe}`,
    html: WRAP(HEADER("Reembolso procesado", `Se ha reembolsado €${importe} a ${clienteEmail}.`, "💳"), body),
  });
}

/** Disparado por: POST /api/agentes (nuevo registro pendiente) */
export async function enviarEmailAdminNuevoPendiente({
  nombre, email,
}: {
  nombre: string; email: string;
}) {
  const body = `
    ${CARD(`${ROW("Nombre", nombre)}${ROW("Email", email)}`)}
    <p style="font-size:13px;color:#888">Revisa el perfil y aprueba o rechaza desde el panel de administración.</p>
    ${BTN("Revisar en admin", `${SITE}/admin`)}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `👤 Nuevo agente pendiente — ${nombre}`,
    html: WRAP(HEADER("Nuevo agente pendiente", `${nombre} quiere unirse al programa.`, "👤"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS REFERIDOS DE CLIENTES
// ════════════════════════════════════════════════════════════════════════════

/** Disparado por: checkout.session.completed cuando hay client_ref en metadata */
export async function enviarEmailReferidoRegistrado({
  referrerEmail, referredEmail, creditAmount,
}: {
  referrerEmail: string; referredEmail: string; creditAmount: number;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      <strong style="color:#f0f0f0">${referredEmail}</strong> acaba de contratar VitalSoft gracias a tu recomendación.
    </p>
    ${CARD(`
      ${ROW("Crédito generado", `€${creditAmount.toFixed(2)}`, true)}
      ${ROW("Estado", "Pendiente de validación")}
      ${ROW("Disponible en", "7–14 días")}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Tu crédito se activa una vez confirmado el pago. Si hay algún problema con el pago del referido,
      el crédito se cancela automáticamente. Te avisaremos cuando esté listo para descontar de tu próxima mensualidad.
    </p>`;

  return await resend.emails.send({
    from: FROM, to: referrerEmail,
    subject: `🎉 Tu referido ha comprado — crédito de €${creditAmount.toFixed(2)} pendiente`,
    html: WRAP(HEADER("¡Tu referido ha comprado!", "Crédito generado, pendiente de validación.", "🎉"), body),
  });
}

/** Disparado por: admin libera crédito */
export async function enviarEmailCreditoDisponible({
  referrerEmail, creditAmount,
}: {
  referrerEmail: string; creditAmount: number;
}) {
  const body = `
    ${CARD(`
      ${ROW("Crédito disponible", `€${creditAmount.toFixed(2)}`, true)}
      ${ROW("Aplicación", "Próximo ciclo de facturación")}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Nuestro equipo lo aplicará automáticamente como descuento en tu siguiente mes. No tienes que hacer nada.
    </p>
    <p style="font-size:12px;color:#555;margin-top:16px">¿Tienes dudas? Responde a este email.</p>`;

  return await resend.emails.send({
    from: FROM, to: referrerEmail,
    subject: `✅ Tu crédito de €${creditAmount.toFixed(2)} ya está disponible`,
    html: WRAP(HEADER("Crédito disponible", "Tu crédito por referido está validado.", "✅"), body),
  });
}

/** Disparado por: admin marca crédito como aplicado */
export async function enviarEmailCreditoAplicado({
  referrerEmail, creditAmount,
}: {
  referrerEmail: string; creditAmount: number;
}) {
  const body = `
    ${CARD(`
      ${ROW("Crédito aplicado", `€${creditAmount.toFixed(2)}`, true)}
      ${ROW("Fecha", new Date().toLocaleDateString("es-ES"))}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Hemos aplicado el descuento a tu factura de este mes.
      Si en los próximos días no lo ves reflejado, responde a este email.
    </p>
    <p style="font-size:13px;color:#888;margin-top:12px">
      ¿Conoces a otro creador que publique contenido largo? Puedes seguir refiriendo y acumulando créditos.
    </p>`;

  return await resend.emails.send({
    from: FROM, to: referrerEmail,
    subject: `💳 Tu crédito de €${creditAmount.toFixed(2)} ha sido aplicado`,
    html: WRAP(HEADER("Crédito aplicado", "El descuento ya está en tu factura.", "💳"), body),
  });
}

/** Disparado por: checkout.session.completed (admin — nuevo referido) */
export async function enviarEmailAdminNuevoReferido({
  referrerEmail, referredEmail, amountPaid, creditAmount, isSuspicious, suspiciousReason,
}: {
  referrerEmail: string; referredEmail: string; amountPaid: number;
  creditAmount: number; isSuspicious: boolean; suspiciousReason?: string | null;
}) {
  const alertaHtml = isSuspicious
    ? ALERTA(`⚠️ REFERIDO SOSPECHOSO: ${suspiciousReason || "revisar manualmente"}`, "error")
    : "";

  const body = `
    ${alertaHtml}
    ${CARD(`
      ${ROW("Referrer", referrerEmail)}
      ${ROW("Referido", referredEmail)}
      ${ROW("Importe pagado", `€${amountPaid.toFixed(2)}`)}
      ${ROW("Crédito generado", `€${creditAmount.toFixed(2)}`, true)}
    `)}
    ${BTN("Gestionar en admin", `${SITE}/admin/referrals`)}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `${isSuspicious ? "⚠️ SOSPECHOSO — " : ""}🔔 Nuevo referido: ${referrerEmail}`,
    html: WRAP(HEADER("Nuevo referido de cliente", `${referrerEmail} ha referido a ${referredEmail}.`, "🔔"), body),
  });
}

/** Disparado por: admin libera crédito (notificación al admin también) */
export async function enviarEmailAdminCreditoListo({
  referrerEmail, creditAmount,
}: {
  referrerEmail: string; creditAmount: number;
}) {
  const body = `
    ${CARD(`
      ${ROW("Cliente", referrerEmail)}
      ${ROW("Crédito a aplicar", `€${creditAmount.toFixed(2)}`, true)}
    `)}
    <p style="font-size:13px;color:#888">Aplica el descuento manualmente en Stripe o marca como aplicado desde el panel.</p>
    ${BTN("Ir a referidos", `${SITE}/admin/referrals`)}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `💳 Crédito listo para aplicar — €${creditAmount.toFixed(2)} · ${referrerEmail}`,
    html: WRAP(HEADER("Crédito listo para aplicar", "Acción requerida en el panel.", "💳"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAIL RESEÑAS EXTERNAS
// ════════════════════════════════════════════════════════════════════════════

/** Disparado por: order completado (si NEXT_PUBLIC_REVIEW_URL está configurado) */
export async function enviarEmailPedirResena({
  email, nombre, reviewUrl,
}: {
  email: string; nombre?: string; reviewUrl: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""}, llevas un tiempo trabajando con VitalSoft y tu opinión nos importa mucho.
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Si el servicio te ha funcionado bien, ¿podrías dejarnos una reseña honesta?
      <strong style="color:#f0f0f0">Tarda menos de 1 minuto</strong> y ayuda a otros creadores a tomar su decisión.
    </p>
    ${BTN("Dejar reseña →", reviewUrl)}
    <p style="font-size:12px;color:#444;margin-top:20px">
      Si prefieres no hacerlo, no pasa nada. Puedes ignorar este email sin problema.
    </p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `¿Nos dejas una reseña rápida? (menos de 1 minuto)`,
    html: WRAP(HEADER("¿Nos dejas una opinión?", "Tu experiencia ayuda a otros creadores.", "⭐"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS PAUSA DE SUSCRIPCIÓN
// ════════════════════════════════════════════════════════════════════════════

/** Cliente: suscripción pausada */
export async function enviarEmailClientePausada({
  email, nombre, pauseUntil, motivo,
}: {
  email: string; nombre?: string; pauseUntil: string; motivo?: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""}, tu suscripción ha sido pausada correctamente.
    </p>
    ${CARD(`
      ${ROW("Estado", "Pausada")}
      ${ROW("Pausada hasta", pauseUntil, true)}
      ${ROW("Facturación", "Suspendida durante la pausa")}
      ${motivo ? ROW("Motivo", motivo) : ""}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      No se generarán nuevas entregas ni se procesarán cobros mientras la suscripción esté pausada.
      El <strong style="color:#f0f0f0">${pauseUntil}</strong> tu suscripción se reactivará automáticamente.
    </p>
    <p style="font-size:12px;color:#555;margin-top:16px">Si quieres reactivarla antes, contacta con nosotros.</p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `⏸ Tu suscripción VitalSoft está pausada hasta el ${pauseUntil}`,
    html: WRAP(HEADER("Suscripción pausada", "Sin cobros ni entregas durante la pausa.", "⏸"), body),
  });
}

/** Cliente: suscripción reactivada tras pausa */
export async function enviarEmailClienteReactivada({
  email, nombre,
}: {
  email: string; nombre?: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""}, tu suscripción ya está activa de nuevo.
    </p>
    ${CARD(`
      ${ROW("Estado", "Activa", true)}
      ${ROW("Próxima facturación", "Ciclo normal reanudado")}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Ya puedes subir material a tu carpeta Drive cuando quieras. El equipo lo procesará en las próximas 24–48h.
    </p>
    ${BTN("Ir a mi Drive →", "https://drive.google.com")}`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `▶ Tu suscripción VitalSoft está activa de nuevo`,
    html: WRAP(HEADER("¡De vuelta!", "Tu suscripción se ha reactivado.", "▶"), body),
  });
}

/** Admin: cliente ha pausado */
export async function enviarEmailAdminClientePausado({
  clienteEmail, pauseUntil, motivo,
}: {
  clienteEmail: string; pauseUntil: string; motivo?: string;
}) {
  const body = `
    ${CARD(`
      ${ROW("Cliente", clienteEmail)}
      ${ROW("Pausada hasta", pauseUntil, true)}
      ${motivo ? ROW("Motivo", motivo) : ""}
    `)}
    ${BTN("Ver en admin →", `${SITE}/admin`)}`;

  return await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `⏸ Cliente pausado — ${clienteEmail}`,
    html: WRAP(HEADER("Cliente ha pausado su suscripción", `Pausa hasta ${pauseUntil}.`, "⏸"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS RECUPERACIÓN DE CLIENTES CANCELADOS
// ════════════════════════════════════════════════════════════════════════════

/** Intento 1 de recuperación */
export async function enviarEmailRecuperacion1({
  email, nombre,
}: {
  email: string; nombre?: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""},
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Hace un tiempo cancelaste tu suscripción a VitalSoft. 
      Queríamos preguntarte: <strong style="color:#f0f0f0">¿sigues creando contenido largo?</strong>
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Si volviste a grabar, tu sistema de clips sigue aquí, listo para arrancar cuando quieras.
      Puedes retomarlo en cualquier momento sin complicaciones.
    </p>
    ${BTN("Ver planes →", SITE)}`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `¿Sigues creando contenido? — VitalSoft`,
    html: WRAP(HEADER("¿Sigues creando?", "Tu sistema de clips te espera.", "👋"), body),
  });
}

/** Intento 2 de recuperación */
export async function enviarEmailRecuperacion2({
  email, nombre,
}: {
  email: string; nombre?: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""},
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Tenemos huecos disponibles este mes para nuevos proyectos.
      Si estás grabando de nuevo, ahora mismo podemos incorporarte sin lista de espera.
    </p>
    ${CARD(`
      ${ROW("Entrega", "24–48h desde que sube el material")}
      ${ROW("Revisiones incluidas", "Hasta 4 según plan")}
      ${ROW("Drive automático", "Carpeta lista desde el primer día")}
    `)}
    ${BTN("Volver a VitalSoft →", SITE)}`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `Volvemos a tener huecos disponibles — VitalSoft`,
    html: WRAP(HEADER("Huecos disponibles", "Sin lista de espera este mes.", "🟢"), body),
  });
}

/** Intento 3 de recuperación */
export async function enviarEmailRecuperacion3({
  email, nombre,
}: {
  email: string; nombre?: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""},
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Es la última vez que te escribimos para esto, lo prometemos.
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Tu sistema de clips en VitalSoft <strong style="color:#f0f0f0">sigue listo cuando quieras volver</strong>.
      Si en algún momento retomas la creación de contenido largo, aquí estaremos.
    </p>
    ${BTN("Volver cuando quieras →", SITE)}`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `Tu sistema de clips sigue listo — VitalSoft`,
    html: WRAP(HEADER("Seguimos aquí.", "Sin presión, sin lista de espera.", "✌"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS CRÉDITOS POR ANTIGÜEDAD
// ════════════════════════════════════════════════════════════════════════════

const MILESTONE_LABELS: Record<string, string> = {
  "3_meses": "3 meses activo",
  "6_meses": "6 meses activo",
  "12_meses": "1 año activo",
};

/** Cliente: ha desbloqueado crédito de antigüedad */
export async function enviarEmailLoyaltyCredit({
  email, nombre, milestone, amount,
}: {
  email: string; nombre?: string; milestone: string; amount: number;
}) {
  const label = MILESTONE_LABELS[milestone] || milestone;
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""},
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Llevas <strong style="color:#f0f0f0">${label}</strong> con VitalSoft y queremos agradecerlo.
    </p>
    <div style="background:#111827;color:#fff;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
      <div style="font-size:36px;font-weight:800;color:#d4f53c">+${amount.toFixed(0)}€</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px">Crédito por antigüedad · ${label}</div>
    </div>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Nuestro equipo aplicará este descuento en tu próxima factura. No tienes que hacer nada.
    </p>
    <p style="font-size:11px;color:#444;margin-top:16px">El crédito no es retirable ni convertible en efectivo. Solo válido como descuento en VitalSoft.</p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `🎖 Has desbloqueado ${amount.toFixed(0)}€ de crédito — ${label}`,
    html: WRAP(HEADER("¡Crédito por antigüedad!", `Gracias por ${label} con nosotros.`, "🎖"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS CRÉDITOS POR ERROR / SERVICIO
// ════════════════════════════════════════════════════════════════════════════

/** Cliente: se le ha otorgado un crédito por incidencia */
export async function enviarEmailServiceCredit({
  email, nombre, amount, reason,
}: {
  email: string; nombre?: string; amount: number; reason: string;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">
      Hola${nombre ? ` <strong>${nombre}</strong>` : ""},
    </p>
    <p style="font-size:13px;color:#888;line-height:1.7">
      Hemos añadido un crédito a tu cuenta como compensación.
    </p>
    <div style="background:#111827;color:#fff;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
      <div style="font-size:36px;font-weight:800;color:#d4f53c">+${amount.toFixed(0)}€</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px">Crédito aplicable a tu próxima factura</div>
    </div>
    ${CARD(ROW("Motivo", reason))}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Nuestro equipo lo descontará automáticamente en tu próximo ciclo. Si tienes dudas, responde a este email.
    </p>
    <p style="font-size:11px;color:#444;margin-top:16px">El crédito no es retirable ni convertible en efectivo.</p>`;

  return await resend.emails.send({
    from: FROM, to: email,
    subject: `💳 Hemos añadido ${amount.toFixed(0)}€ de crédito a tu cuenta`,
    html: WRAP(HEADER("Crédito añadido", "Como compensación por la incidencia.", "💳"), body),
  });
}
