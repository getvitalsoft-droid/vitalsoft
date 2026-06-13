import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { signToken } from "@/lib/agente-token";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`agente-magic:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 });
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

  const { data: agente } = await supabase
    .from("agentes").select("id, nombre, email, aprobado").eq("email", email.trim().toLowerCase()).single();

  // Responder siempre igual para no revelar si el email existe
  // Nota: agentes bloqueados o inactivos SÍ pueden recibir el enlace — necesitan
  // entrar al portal para ver su pantalla de estado (bloqueo/inactividad).
  // Solo los que nunca fueron aprobados (pendientes de aprobación) no reciben enlace.
  if (!agente || !agente.aprobado) {
    return NextResponse.json({ ok: true });
  }

  const token = signToken(agente.id, agente.email);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/agentes?token=${token}`;

  await resend.emails.send({
    from: "VitalSoft <notificaciones@vitalsoft.pro>",
    to: agente.email,
    subject: "Tu acceso a VitalSoft Agentes",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#f0f0f0;padding:32px;border-radius:12px">
        <div style="font-size:20px;font-weight:900;margin-bottom:24px"><span style="color:#d4f53c">Vital</span>Soft</div>
        <h2 style="font-size:18px;margin-bottom:8px">Hola ${agente.nombre} 👋</h2>
        <p style="color:#aaa;font-size:14px;margin-bottom:24px">Aquí tienes tu enlace de acceso al portal de agentes. Caduca en 1 hora — si cierras la pestaña y vuelves dentro de ese tiempo, no necesitarás otro enlace.</p>
        <a href="${url}" style="display:inline-block;background:#d4f53c;color:#080808;font-weight:900;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px">
          Acceder al portal →
        </a>
        <p style="color:#555;font-size:11px;margin-top:24px">Si no solicitaste este acceso, ignora este email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
