import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vitalsoft.pro";
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hola@vitalsoft.pro";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Log de inicio — visible en Supabase activity_logs
  await supabase.from("activity_logs").insert({
    admin: "system", accion: "cron_onboarding_reminder_inicio",
    objetivo_tipo: "system", detalle: `Cron ejecutado: ${new Date().toISOString()}`,
  });

  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: pendientes } = await supabase
    .from("orders")
    .select("id, cliente_email, cliente_nombre, stripe_session_id, fecha_pago")
    .eq("estado", "onboarding_pendiente")
    .lt("fecha_pago", hace24h)
    .gt("fecha_pago", hace72h);

  if (!pendientes?.length) {
    await supabase.from("activity_logs").insert({
      admin: "system", accion: "cron_onboarding_reminder_fin",
      objetivo_tipo: "system", detalle: "Sin orders pendientes en ventana 24-72h",
    });
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  let enviados = 0;

  for (const order of pendientes) {
    if (!order.cliente_email) continue;

    const { data: yaEnviado } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("accion", "recordatorio_onboarding")
      .eq("objetivo_id", order.id)
      .single();

    if (yaEnviado) continue;

    const onboardingUrl = `${SITE}/onboarding?session=${order.stripe_session_id}`;
    const nombre = order.cliente_nombre;

    await resend.emails.send({
      from: FROM,
      to: order.cliente_email,
      subject: "Falta un paso para empezar — VitalSoft",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#f0f0f0;border-radius:14px;overflow:hidden">
          <div style="background:#111;padding:20px 32px;border-bottom:1px solid #222">
            <div style="font-size:16px;font-weight:800;margin-bottom:12px"><span style="color:#d4f53c">Vital</span>Soft</div>
            <div style="font-size:20px;font-weight:800;margin-bottom:4px">⏳ Falta un paso</div>
            <div style="font-size:13px;color:#666">Tu suscripción está activa, pero la configuración no está completa.</div>
          </div>
          <div style="padding:28px 32px">
            <p style="font-size:14px;color:#aaa;margin-bottom:16px">
              Hola${nombre ? ` <strong>${nombre}</strong>` : ""}, tu pago se confirmó correctamente.
            </p>
            <p style="font-size:13px;color:#888;line-height:1.7;margin-bottom:20px">
              Solo falta completar la configuración de tu proyecto para que podamos empezar a producir tus clips. Tarda menos de 5 minutos.
            </p>
            <a href="${onboardingUrl}" style="display:inline-block;background:#d4f53c;color:#080808;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:800;font-size:13px">
              Completar configuración →
            </a>
            <p style="font-size:12px;color:#444;margin-top:20px">
              ¿Tienes dudas? Escríbenos a <a href="mailto:${ADMIN_EMAIL}" style="color:#d4f53c">${ADMIN_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
    }).catch(console.error);

    await supabase.from("activity_logs").insert({
      admin: "system",
      accion: "recordatorio_onboarding",
      objetivo_tipo: "order",
      objetivo_id: order.id,
      detalle: `Recordatorio enviado a ${order.cliente_email}`,
    });

    enviados++;
  }

  await supabase.from("activity_logs").insert({
    admin: "system", accion: "cron_onboarding_reminder_fin",
    objetivo_tipo: "system", detalle: `Completado: ${enviados} recordatorios enviados`,
  });

  return NextResponse.json({ ok: true, enviados });
}
