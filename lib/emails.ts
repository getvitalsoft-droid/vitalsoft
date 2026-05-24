// ─────────────────────────────────────────────────────────────────────────────
// VitalSoft — Emails automáticos con Resend
// ─────────────────────────────────────────────────────────────────────────────
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "getvitalsoft@gmail.com";

interface Agente { nombre: string; email: string; codigo: string; }

// Email al admin cuando llega una venta
export async function enviarEmailAdmin({
  clienteEmail, plan, importe, agente, comision,
}: {
  clienteEmail: string; plan: string; importe: number;
  agente: Agente | null; comision: number;
}) {
  const agenteInfo = agente
    ? `<p><strong>Agente:</strong> ${agente.nombre} (${agente.codigo})<br>
       <strong>Comisión a pagar:</strong> €${comision} (20% del primer pago)</p>`
    : `<p><strong>Venta directa</strong> — sin agente referido</p>`;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `💰 Nueva venta VitalSoft — €${importe}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:32px;border-radius:12px">
        <h1 style="color:#d4f53c;font-size:24px;margin-bottom:8px">💰 Nueva venta</h1>
        <p style="color:#999;margin-bottom:24px">VitalSoft ha recibido un nuevo pago</p>
        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px">
          <p><strong>Cliente:</strong> ${clienteEmail}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Importe:</strong> <span style="color:#d4f53c;font-size:20px;font-weight:bold">€${importe}</span></p>
        </div>
        ${agenteInfo}
        <p style="color:#555;font-size:12px;margin-top:24px">VitalSoft · vitalsoft.pro</p>
      </div>
    `,
  });
}

// Email al agente cuando genera una venta
export async function enviarEmailAgente({
  agente, clienteEmail, plan, importe, comision,
}: {
  agente: Agente; clienteEmail: string; plan: string;
  importe: number; comision: number;
}) {
  await resend.emails.send({
    from: FROM,
    to: agente.email,
    subject: `🎉 ¡Tienes una nueva comisión! — €${comision}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:32px;border-radius:12px">
        <h1 style="color:#d4f53c;font-size:24px;margin-bottom:8px">🎉 ¡Nueva comisión!</h1>
        <p style="color:#999;margin-bottom:24px">Hola ${agente.nombre}, has generado una venta con tu código <strong style="color:#d4f53c">${agente.codigo}</strong></p>
        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px">
          <p><strong>Plan vendido:</strong> ${plan}</p>
          <p><strong>Importe total:</strong> €${importe}</p>
          <p><strong>Tu comisión (20%):</strong> <span style="color:#d4f53c;font-size:24px;font-weight:bold">€${comision}</span></p>
        </div>
        <p style="color:#999;font-size:13px">El equipo de VitalSoft procesará tu comisión próximamente. Puedes ver tu historial completo en <a href="https://vitalsoft.pro/agentes" style="color:#d4f53c">vitalsoft.pro/agentes</a></p>
        <p style="color:#555;font-size:12px;margin-top:24px">VitalSoft · vitalsoft.pro</p>
      </div>
    `,
  });
}

// Email de bienvenida al nuevo agente
export async function enviarEmailBienvenidaAgente({
  agente, links,
}: {
  agente: Agente;
  links: Record<string, string>;
}) {
  await resend.emails.send({
    from: FROM,
    to: agente.email,
    subject: `¡Bienvenido al programa de agentes VitalSoft! 🚀`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:32px;border-radius:12px">
        <h1 style="color:#d4f53c;font-size:24px;margin-bottom:8px">🚀 ¡Bienvenido, ${agente.nombre}!</h1>
        <p style="color:#999;margin-bottom:24px">Ya eres parte del programa de agentes de VitalSoft. Por cada cliente que traigas ganarás el <strong style="color:#d4f53c">20% del primer pago</strong>.</p>
        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:16px">
          <p style="margin-bottom:8px"><strong>Tu código:</strong> <span style="color:#d4f53c;font-size:20px;font-weight:bold">${agente.codigo}</span></p>
          <p style="margin-bottom:16px;color:#999;font-size:13px">Comparte cualquiera de estos links:</p>
          ${Object.entries(links).map(([k, v]) => `
            <p style="margin:4px 0;font-size:12px">
              <strong style="color:#d4f53c;text-transform:uppercase">${k}:</strong>
              <a href="${v}" style="color:#999">${v}</a>
            </p>
          `).join("")}
        </div>
        <a href="https://vitalsoft.pro/agentes" style="display:inline-block;background:#d4f53c;color:#080808;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">Ver mi panel →</a>
        <p style="color:#555;font-size:12px;margin-top:24px">VitalSoft · vitalsoft.pro</p>
      </div>
    `,
  });
}
