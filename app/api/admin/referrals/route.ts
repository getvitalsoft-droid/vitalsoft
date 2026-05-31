// app/api/admin/referrals/route.ts
// Protegido con el mismo sistema de auth del panel admin (Bearer JWT Supabase)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  listReferrals, getReferralStats, markCreditApplied,
  invalidateCredit, releaseCredit, ReferralStatus,
} from "@/lib/referrals";
import {
  enviarEmailCreditoDisponible, enviarEmailCreditoAplicado, enviarEmailAdminCreditoListo,
} from "@/lib/emails";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
}

export async function GET(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status") as ReferralStatus | undefined;
  const [referrals, stats] = await Promise.all([
    listReferrals(status || undefined),
    getReferralStats(),
  ]);
  return NextResponse.json({ referrals, stats });
}

export async function PATCH(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { accion, referral_id, notas } = await req.json();
  if (!referral_id) return NextResponse.json({ error: "referral_id requerido" }, { status: 400 });

  const { data: referral } = await supabaseAdmin
    .from("client_referrals").select("*").eq("id", referral_id).single();
  if (!referral) return NextResponse.json({ error: "Referral no encontrado" }, { status: 404 });

  if (accion === "liberar_credito") {
    await releaseCredit(referral_id);
    await Promise.allSettled([
      enviarEmailCreditoDisponible({ referrerEmail: referral.referrer_email, creditAmount: referral.credit_amount }),
      enviarEmailAdminCreditoListo({ referrerEmail: referral.referrer_email, creditAmount: referral.credit_amount }),
    ]);
    return NextResponse.json({ success: true, mensaje: "Crédito liberado y emails enviados" });
  }

  if (accion === "marcar_aplicado") {
    if (!notas?.trim()) return NextResponse.json({ error: "Nota obligatoria" }, { status: 400 });
    await markCreditApplied(referral_id, notas);
    await enviarEmailCreditoAplicado({ referrerEmail: referral.referrer_email, creditAmount: referral.credit_amount }).catch(console.error);
    return NextResponse.json({ success: true, mensaje: "Crédito marcado como aplicado" });
  }

  if (accion === "invalidar") {
    if (!notas?.trim()) return NextResponse.json({ error: "Motivo obligatorio" }, { status: 400 });
    await invalidateCredit(referral_id, notas);
    return NextResponse.json({ success: true, mensaje: "Crédito invalidado" });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
