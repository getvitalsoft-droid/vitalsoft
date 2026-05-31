// app/api/cliente-auth/route.ts
// Magic link para portal de cliente — sin contraseña.
// El cliente escribe su email → si tiene un order activo → recibe link.
// Respuesta siempre genérica para no revelar si el email existe.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VitalSoft <notificaciones@vitalsoft.pro>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vitalsoft.pro";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`cliente-auth:${ip}`, LIMITS.checkout);
  if (!allowed) return NextResponse.json({ success: true }); // genérico

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: true });

    const emailNorm = email.toLowerCase().trim();

    // Verificar que tiene al menos un order (no importa el estado para el acceso)
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("cliente_email", emailNorm)
      .limit(1)
      .single();

    // Si no hay order → respuesta genérica sin revelar nada
    if (!order) {
      return NextResponse.json({ success: true });
    }

    // Generar token seguro (JWT firmado, 1h de vida)
    // Usamos un token simple en base64 firmado con CRON_SECRET
    // No usamos Supabase Auth para clientes (no tienen cuenta)
    const payload = {
      email: emailNorm,
      exp: Date.now() + 60 * 60 * 1000, // 1 hora
    };
    const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
    // Firma básica: hash del payload + secret
    const crypto = await import("crypto");
    const sig = crypto
      .createHmac("sha256", process.env.CRON_SECRET || "vitalsoft-secret")
      .update(token)
      .digest("base64url");
    const signedToken = `${token}.${sig}`;

    const link = `${SITE}/cliente?token=${signedToken}`;

    await resend.emails.send({
      from: FROM,
      to: emailNorm,
      subject: "Tu acceso a VitalSoft",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0d0d;color:#f0f0f0;padding:32px;border-radius:14px">
          <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#e8ff47;margin-bottom:20px">VitalSoft</div>
          <h1 style="font-size:20px;font-weight:800;margin-bottom:8px">Accede a tu cuenta</h1>
          <p style="color:#666;font-size:13px;margin-bottom:24px">
            Haz clic para ver el estado de tu proyecto, pausar tu suscripción o gestionar tus créditos.<br>
            Este enlace caduca en 1 hora.
          </p>
          <a href="${link}" style="display:inline-block;background:#e8ff47;color:#080808;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px">
            Ver mi cuenta →
          </a>
          <p style="color:#333;font-size:11px;margin-top:24px">Si no solicitaste este enlace, ignóralo.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ClienteAuth]", err);
    return NextResponse.json({ success: true }); // siempre genérico
  }
}

// GET — verificar token y devolver datos del cliente
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-cliente-token");
  if (!token) return NextResponse.json({ valid: false }, { status: 401 });

  const email = verifyClientToken(token);
  if (!email) return NextResponse.json({ valid: false }, { status: 401 });

  return NextResponse.json({ valid: true, email });
}

// Helper exportado para reusar en otras rutas
export function verifyClientToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;

    const crypto = require("crypto");
    const expectedSig = crypto
      .createHmac("sha256", process.env.CRON_SECRET || "vitalsoft-secret")
      .update(payload)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.email || !data.exp) return null;
    if (Date.now() > data.exp) return null;

    return data.email as string;
  } catch {
    return null;
  }
}
