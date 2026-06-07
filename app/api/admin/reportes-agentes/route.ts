import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!bearer) return false;
  try {
    const sbAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await sbAuth.auth.getUser(bearer);
    if (error || !user) return false;
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
      .split(",").map(e => e.trim().toLowerCase());
    return adminEmails.includes(user.email?.toLowerCase() || "");
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!await verificarAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("accion", "reporte_agente")
    .order("creado_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reportes: data || [] });
}
