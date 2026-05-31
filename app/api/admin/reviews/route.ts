import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markReviewCompleted } from "@/lib/reviews";

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
  const status = new URL(req.url).searchParams.get("status");
  let query = supabaseAdmin.from("review_requests").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

export async function PATCH(req: NextRequest) {
  if (!await verificarAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { accion, review_id } = await req.json();
  if (accion === "marcar_completada") {
    await markReviewCompleted(review_id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
