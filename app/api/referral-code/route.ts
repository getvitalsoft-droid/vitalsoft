// GET /api/referral-code?email=xxx
// Uso interno: llamar desde server-side para incluir el link de referido en emails
// Requiere el mismo auth de admin O un x-internal-secret para uso interno

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateRefCode } from "@/lib/referrals";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  // Acepta también x-internal-secret para uso interno
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret && internalSecret === process.env.CRON_SECRET) return true;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
}

export async function GET(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stripeCustomerId = searchParams.get("stripe_customer_id");
  const email = searchParams.get("email");

  if (!stripeCustomerId || !email) {
    return NextResponse.json({ error: "stripe_customer_id y email requeridos" }, { status: 400 });
  }

  const refCode = await getOrCreateRefCode(stripeCustomerId, email);
  const refLink = `https://vitalsoft.pro?client_ref=${refCode}`;

  return NextResponse.json({ refCode, refLink });
}
