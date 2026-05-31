// lib/reviews.ts — Sistema de reseñas externas VitalSoft
// Solo envía email si NEXT_PUBLIC_REVIEW_URL está configurado.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ReviewStatus = "no_solicitada" | "solicitada" | "completada" | "ignorada";

export async function maybeRequestReview(
  stripeCustomerId: string,
  customerEmail: string,
  orderId?: string
): Promise<boolean> {
  const reviewUrl = process.env.NEXT_PUBLIC_REVIEW_URL;
  if (!reviewUrl) return false;

  const { data: existing } = await supabase.from("review_requests")
    .select("id").eq("stripe_customer_id", stripeCustomerId)
    .not("status", "eq", "no_solicitada").limit(1);
  if (existing && existing.length > 0) return false;

  let platform = "Externo";
  if (reviewUrl.includes("trustpilot.com")) platform = "Trustpilot";
  else if (reviewUrl.includes("google.com")) platform = "Google Reviews";
  else if (reviewUrl.includes("senja.io")) platform = "Senja";

  const { error } = await supabase.from("review_requests").insert({
    stripe_customer_id: stripeCustomerId,
    customer_email: customerEmail,
    order_id: orderId ?? null,
    review_platform: platform,
    review_url: reviewUrl,
    status: "solicitada",
    review_requested_at: new Date().toISOString(),
  });

  if (error) { console.error("[reviews] Error:", error.message); return false; }
  return true;
}

export async function markReviewCompleted(reviewId: string): Promise<void> {
  const { error } = await supabase.from("review_requests")
    .update({ status: "completada" }).eq("id", reviewId);
  if (error) throw new Error(error.message);
}
