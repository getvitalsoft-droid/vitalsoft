import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// POST — enviar magic link
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

    // Respuesta genérica siempre para no revelar si el email es admin
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin?auth=1` },
      });
      if (error) console.error("[AdminAuth] Error:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Error interno." }, { status: 500 }); }
}

// GET — verificar token de sesión
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ valid: false }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ valid: false }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
  return NextResponse.json({ valid: isAdmin, email: user.email });
}
