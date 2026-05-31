// lib/referrals.ts — Sistema de referidos de clientes VitalSoft
// Crédito interno: 20% del primer pago del referido. No es efectivo, no se retira.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CREDIT_PCT = 0.20;

export type ReferralStatus =
  | "registrado" | "pendiente_validacion" | "disponible"
  | "aplicado" | "cancelado" | "reembolsado" | "invalido";

export interface ClientReferral {
  id: string;
  referrer_stripe_customer_id: string;
  referrer_email: string;
  referred_stripe_customer_id: string | null;
  referred_email: string;
  stripe_session_id: string | null;
  order_id: string | null;
  amount_paid: number | null;
  credit_amount: number | null;
  status: ReferralStatus;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  notes: string | null;
  created_at: string;
  available_at: string | null;
  applied_at: string | null;
}

// ─── Códigos de referido ───────────────────────────────────────────────────

export async function getOrCreateRefCode(stripeCustomerId: string, email: string): Promise<string> {
  const { data: existing } = await supabase
    .from("client_ref_codes").select("ref_code")
    .eq("stripe_customer_id", stripeCustomerId).single();
  if (existing) return existing.ref_code;

  const base = email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ref_code = `${base}${rand}`;

  const { data, error } = await supabase
    .from("client_ref_codes")
    .insert({ stripe_customer_id: stripeCustomerId, email, ref_code })
    .select("ref_code").single();
  if (error) throw new Error(`Error creando ref_code: ${error.message}`);
  return data.ref_code;
}

export async function lookupRefCode(code: string): Promise<{ stripe_customer_id: string; email: string } | null> {
  const { data } = await supabase
    .from("client_ref_codes").select("stripe_customer_id, email")
    .eq("ref_code", code.toUpperCase()).single();
  return data ?? null;
}

// ─── Registrar referido ────────────────────────────────────────────────────

export async function registerReferral(input: {
  referrerStripeCustomerId: string;
  referrerEmail: string;
  referredEmail: string;
  referredStripeCustomerId?: string;
  stripeSessionId?: string;
  orderId?: string;
  amountPaid: number;
}): Promise<{ referral: ClientReferral; suspicious: boolean }> {
  const creditAmount = parseFloat((input.amountPaid * CREDIT_PCT).toFixed(2));

  let isSuspicious = false;
  let suspiciousReason: string | null = null;

  if (input.referrerEmail.toLowerCase() === input.referredEmail.toLowerCase()) {
    isSuspicious = true; suspiciousReason = "auto-referido: mismo email";
  }
  if (!isSuspicious && input.referredStripeCustomerId && input.referredStripeCustomerId === input.referrerStripeCustomerId) {
    isSuspicious = true; suspiciousReason = "auto-referido: mismo stripe_customer_id";
  }
  if (!isSuspicious) {
    const { data: dup } = await supabase.from("client_referrals").select("id")
      .eq("referrer_stripe_customer_id", input.referrerStripeCustomerId)
      .eq("referred_email", input.referredEmail.toLowerCase())
      .not("status", "eq", "invalido").limit(1);
    if (dup && dup.length > 0) { isSuspicious = true; suspiciousReason = "referido duplicado"; }
  }

  const { data, error } = await supabase.from("client_referrals").insert({
    referrer_stripe_customer_id: input.referrerStripeCustomerId,
    referrer_email: input.referrerEmail.toLowerCase(),
    referred_stripe_customer_id: input.referredStripeCustomerId ?? null,
    referred_email: input.referredEmail.toLowerCase(),
    stripe_session_id: input.stripeSessionId ?? null,
    order_id: input.orderId ?? null,
    amount_paid: input.amountPaid,
    credit_amount: creditAmount,
    status: "pendiente_validacion",
    is_suspicious: isSuspicious,
    suspicious_reason: suspiciousReason,
  }).select().single();

  if (error) throw new Error(`Error registrando referral: ${error.message}`);
  return { referral: data as ClientReferral, suspicious: isSuspicious };
}

// ─── Acciones de estado ────────────────────────────────────────────────────

export async function releaseCredit(referralId: string): Promise<void> {
  const { error } = await supabase.from("client_referrals")
    .update({ status: "disponible", available_at: new Date().toISOString() })
    .eq("id", referralId).eq("status", "pendiente_validacion");
  if (error) throw new Error(error.message);
}

export async function markCreditApplied(referralId: string, notes: string): Promise<void> {
  if (!notes?.trim()) throw new Error("Nota obligatoria");
  const { error } = await supabase.from("client_referrals")
    .update({ status: "aplicado", applied_at: new Date().toISOString(), notes })
    .eq("id", referralId).eq("status", "disponible");
  if (error) throw new Error(error.message);
}

export async function invalidateCredit(referralId: string, reason: string): Promise<void> {
  if (!reason?.trim()) throw new Error("Motivo obligatorio al invalidar");
  const { error } = await supabase.from("client_referrals")
    .update({ status: "invalido", notes: reason }).eq("id", referralId);
  if (error) throw new Error(error.message);
}

export async function handleReferralRefund(stripeSessionId: string): Promise<void> {
  const { data: referral } = await supabase.from("client_referrals")
    .select("id, status").eq("stripe_session_id", stripeSessionId).single();
  if (!referral) return;
  if (["aplicado", "invalido", "cancelado", "reembolsado"].includes(referral.status)) return;
  await supabase.from("client_referrals").update({
    status: "reembolsado",
    notes: "Crédito cancelado automáticamente por refund del referido en Stripe",
  }).eq("id", referral.id);
}

// ─── Queries para admin ────────────────────────────────────────────────────

export async function listReferrals(status?: ReferralStatus): Promise<ClientReferral[]> {
  let query = supabase.from("client_referrals").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientReferral[];
}

export async function getReferralStats() {
  const { data, error } = await supabase.from("client_referrals").select("status, credit_amount, is_suspicious");
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((acc, row) => {
    const credit = Number(row.credit_amount ?? 0);
    if (row.status === "pendiente_validacion") { acc.pendiente_validacion.count++; acc.pendiente_validacion.total += credit; }
    else if (row.status === "disponible") { acc.disponible.count++; acc.disponible.total += credit; }
    else if (row.status === "aplicado") { acc.aplicado.count++; acc.aplicado.total += credit; }
    else if (row.status === "invalido") acc.invalido.count++;
    if (row.is_suspicious) acc.suspicious.count++;
    return acc;
  }, {
    pendiente_validacion: { count: 0, total: 0 },
    disponible: { count: 0, total: 0 },
    aplicado: { count: 0, total: 0 },
    invalido: { count: 0 },
    suspicious: { count: 0 },
  });
}
