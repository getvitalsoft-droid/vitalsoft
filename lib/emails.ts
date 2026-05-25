// ═══════════════════════════════════════════════════════════════════════════
// VitalSoft — Sistema centralizado de emails (Resend)
//
// ARQUITECTURA:
//   Stripe → webhook → /api/webhook → aquí → Resend → email final
//
// MAPA COMPLETO DE EMAILS:
// ─────────────────────────────────────────────────────────────────────────
// STRIPE (desactivado para clientes — solo genera PDFs/facturas internas):
//   ✓ Genera PDF de factura (compliance fiscal) → NO envía email
//   ✓ Genera recibo interno → NO envía email
//   ✓ Registra eventos via webhook → nuestro backend procesa
//
// RESEND (todos los emails visibles):
//
//   CLIENTE:
//     enviarEmailClientePagoRealizado   ← checkout.session.completed
//     enviarEmailClienteRenovacion      ← invoice.paid (no primer pago)
//     enviarEmailClientePagoFallido     ← invoice.payment_failed
//     enviarEmailClienteCancelacion     ← customer.subscription.deleted
//     enviarEmailClienteReembolso       ← charge.refunded
//
//   AGENTES:
//     enviarEmailBienvenidaAgente       ← PATCH /api/agentes (aprobar)
//     enviarEmailAgente                 ← checkout.session.completed
//     enviarEmailAgenteComisionDisp     ← cron/manual cuando pasan 7 días
//     enviarEmailAgenteComisionPagada   ← PATCH /api/agentes (marcar_pagado)
//     enviarEmailAgenteBloqueo          ← PATCH /api/agentes (bloquear)
//
//   ADMIN:
//     enviarEmailAdmin                  ← checkout.session.completed
//     enviarEmailAdminPagoFallido       ← invoice.payment_failed
//     enviarEmailAdminCancelacion       ← customer.subscription.deleted
//     enviarEmailAdminReembolso         ← charge.refunded
//     enviarEmailAdminNuevoPendiente    ← POST /api/agentes (nuevo registro)
//
// RIESGO DOBLE ENVÍO:
//   ✗ Stripe emails desactivados → sin duplicados
//   ✓ Webhook idempotente → stripe_session_id como clave única en DB
//   ✓ Si Resend falla → error logueado en activity_logs, Stripe no envía nada
//   ✓ Retry: Stripe reintenta webhooks hasta 3 días si recibe error != 2xx
//
// LO QUE STRIPE SIGUE HACIENDO INTERNAMENTE (no emails):
//   ✓ PDF de factura descargable desde portal del cliente de Stripe
//   ✓ Registro fiscal/contable de cada transacción
//   ✓ Generación de IVA si está configurado
//   ✓ Gestión de disputas/chargebacks
// ═══════════════════════════════════════════════════════════════════════════

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "getvitalsoft@gmail.com";
const SITE = "https://vitalsoft.pro";

// ─── Estilos base compartidos ──────────────────────────────────────────────
const BASE_STYLE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#f0f0f0;border-radius:14px;overflow:hidden`;
const HEADER = (titulo: string, subtitulo: string, emoji = "") => `
  <div style="background:#111;padding:28px 32px;border-bottom:1px solid #222">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#d4f53c;margin-bottom:6px">VitalSoft</div>
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
      Puedes cancelar en cualquier momento desde Stripe sin penalización.
    </p>`;

  await resend.emails.send({
    from: FROM, to: email,
    subject: `✅ Suscripción activada — Configura tu proyecto`,
    html: WRAP(HEADER("¡Suscripción activada!", nombre ? `Hola ${nombre}, ya estás dentro.` : "Ya estás dentro.", "✅"), body),
  });
}

/** Disparado por: invoice.paid (renovaciones mensuales, NO primer pago) */
export async function enviarEmailClienteRenovacion({
  email, plan, importe, periodo,
}: {
  email: string; plan: string; importe: number; periodo: string;
}) {
  const body = `
    ${CARD(`
      ${ROW("Plan", plan)}
      ${ROW("Importe renovado", `€${importe}`, true)}
      ${ROW("Período", periodo)}
    `)}
    <p style="font-size:13px;color:#888">Tu suscripción se ha renovado correctamente. Puedes subir nuevo contenido a tu Drive cuando quieras.</p>`;

  await resend.emails.send({
    from: FROM, to: email,
    subject: `🔄 Renovación mensual — €${importe}`,
    html: WRAP(HEADER("Renovación mensual", "Tu plan se ha renovado correctamente.", "🔄"), body),
  });
}

/** Disparado por: invoice.payment_failed */
export async function enviarEmailClientePagoFallido({
  email, plan, importe, intentoUrl,
}: {
  email: string; plan: string; importe: number; intentoUrl?: string;
}) {
  const body = `
    ${ALERTA("⚠️ No hemos podido cobrar tu suscripción este mes.", "warn")}
    ${CARD(`
      ${ROW("Plan", plan)}
      ${ROW("Importe pendiente", `€${importe}`, true)}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Stripe lo reintentará automáticamente en los próximos días. Si el problema persiste, actualiza tu método de pago para mantener el servicio activo.
    </p>
    ${intentoUrl ? BTN("Actualizar método de pago", intentoUrl) : ""}`;

  await resend.emails.send({
    from: FROM, to: email,
    subject: `⚠️ Pago fallido — Acción requerida`,
    html: WRAP(HEADER("Pago fallido", "Necesitamos que actualices tu método de pago.", "⚠️"), body),
  });
}

/** Disparado por: customer.subscription.deleted */
export async function enviarEmailClienteCancelacion({
  email, plan, fechaFin,
}: {
  email: string; plan: string; fechaFin: string;
}) {
  const body = `
    ${CARD(`
      ${ROW("Plan cancelado", plan)}
      ${ROW("Acceso hasta", fechaFin)}
    `)}
    <p style="font-size:13px;color:#888;line-height:1.7">
      Tu suscripción ha sido cancelada. Seguirás teniendo acceso hasta el final del período ya pagado.
      Si quieres volver en el futuro, puedes reactivarla desde la web.
    </p>
    ${BTN("Volver a VitalSoft", SITE)}`;

  await resend.emails.send({
    from: FROM, to: email,
    subject: `Suscripción cancelada — ${plan}`,
    html: WRAP(HEADER("Suscripción cancelada", "Sentimos verte marchar.", "👋"), body),
  });
}

/** Disparado por: charge.refunded */
export async function enviarEmailClienteReembolso({
  email, importe, motivo,
}: {
  email: string; importe: number; motivo?: string;
}) {
  const body = `
    ${CARD(`
      ${ROW("Importe reembolsado", `€${importe}`, true)}
      ${motivo ? ROW("Motivo", motivo) : ""}
      ${ROW("Plazo", "3–5 días hábiles en tu cuenta")}
    `)}
    <p style="font-size:13px;color:#888">El reembolso ha sido procesado. Puede tardar unos días en aparecer en tu cuenta según tu banco.</p>`;

  await resend.emails.send({
    from: FROM, to: email,
    subject: `💳 Reembolso procesado — €${importe}`,
    html: WRAP(HEADER("Reembolso procesado", "Hemos procesado tu devolución.", "💳"), body),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// EMAILS AGENTES
// ════════════════════════════════════════════════════════════════════════════

/** Disparado por: PATCH /api/agentes accion=aprobar */
export async function enviarEmailBienvenidaAgente({
  agente, links,
}: {
  agente: Agente; links: Record<string, string>;
}) {
  const body = `
    <p style="font-size:14px;color:#aaa;margin-bottom:16px">Hola <strong>${agente.nombre}</strong>, tu cuenta ha sido aprobada. Ya puedes compartir tu link y ganar comisiones.</p>
    ${CARD(`
      <p style="margin:0 0 10px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:2px;font-weight:700">Tu código</p>
      <p style="color:#d4f53c;font-size:30px;font-weight:800;margin:0 0 14px;letter-spacing:3px">${agente.codigo}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#666">Tu link principal:</p>
      <a href="${links.general}" style="color:#d4f53c;font-size:13px">${links.general}</a>
    `)}
    ${CARD(`
      <p style="margin:0 0 10px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:2px;font-weight:700">Cómo funciona</p>
      <p style="margin:4px 0;font-size:13px;color:#888">1. Comparte tu link con creadores, podcasters o marcas.</p>
      <p style="margin:4px 0;font-size:13px;color:#888">2. Cuando alguien contrata, la venta queda registrada con tu código.</p>
      <p style="margin:4px 0;font-size:13px;color:#888">3. Ganas el <strong style="color:#d4f53c">20% del primer pago</strong> de cada cliente.</p>
      <p style="margin:4px 0;font-size:13px;color:#888">4. Tras 7 días de validación, la comisión queda disponible para cobrar.</p>
    `)}
    ${CARD(`
      <p style="margin:0 0 10px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:2px;font-weight:700">Qué tipo de cliente buscar</p>
      <p style="font-size:13px;color:#888;margin:4px 0">✓ Podcasters con episodios regulares</p>
      <p style="font-size:13px;color:#888;margin:4px 0">✓ Creadores de YouTube que quieran distribuir en TikTok/Reels</p>
      <p style="font-size:13px;color:#888;margin:4px 0">✓ Negocios o marcas que graben contenido largo</p>
      <p style="font-size:13px;color:#888;margin:4px 0">✗ No prometer viralidad ni crecimiento garantizado</p>
    `)}
    ${BTN("Ver mi panel", `${SITE}/agentes`)}`;

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
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

  await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `👤 Nuevo agente pendiente — ${nombre}`,
    html: WRAP(HEADER("Nuevo agente pendiente", `${nombre} quiere unirse al programa.`, "👤"), body),
  });
}
