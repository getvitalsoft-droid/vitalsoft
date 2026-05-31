import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyClientToken } from "@/lib/cliente-token";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-cliente-token");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const email = verifyClientToken(token);
  if (!email) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  await sb.from("orders")
    .update({ review_shown_at: new Date().toISOString() })
    .eq("cliente_email", email)
    .not("estado", "eq", "cancelado");

  return NextResponse.json({ ok: true });
}
