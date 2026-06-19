import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

    // Respuesta genérica siempre para no revelar si el email es admin
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({ success: true });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vitalsoft.pro";

    // Generar magic link con Supabase
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
      options: { redirectTo: `${siteUrl}/admin` },
    });

    if (error || !data?.properties?.action_link) {
      console.error("[AdminAuth] Error generando link:", error?.message);
      return NextResponse.json({ error: "Error al generar el enlace." }, { status: 500 });
    }

    // Usar el action_link tal cual — Supabase verifica en su dominio y redirige
    // automáticamente a redirectTo (vitalsoft.pro/admin) con la sesión establecida.
    const magicLink = data.properties.action_link;

    // Enviar email con Resend directamente (no SMTP de Supabase)
    const { error: resendError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Tu enlace de acceso a VitalSoft Admin",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0d0d;color:#f0f0f0;padding:32px;border-radius:14px">
          <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#d4f53c;margin-bottom:20px">VitalSoft Admin</div>
          <h1 style="font-size:20px;font-weight:800;margin-bottom:8px">Enlace de acceso</h1>
          <p style="color:#666;font-size:13px;margin-bottom:24px">Haz clic en el botón para entrar al panel de administración. Este enlace caduca en 1 hora.</p>
          <a href="${magicLink}" style="display:inline-block;background:#d4f53c;color:#080808;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px">
            Acceder al panel →
          </a>
          <p style="color:#333;font-size:11px;margin-top:24px">Si no solicitaste este enlace, ignora este email.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error("[AdminAuth] Error enviando email:", resendError);
      return NextResponse.json({ error: "Error al enviar el email." }, { status: 500 });
    }

    console.log("[AdminAuth] Magic link enviado a:", email);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[AdminAuth] Error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ valid: false }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ valid: false }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
  return NextResponse.json({ valid: isAdmin, email: user.email });
}
