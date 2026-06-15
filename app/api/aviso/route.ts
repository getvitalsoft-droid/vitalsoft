import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data } = await sb
    .from("avisos_sistema")
    .select("activo, tipo, mensaje")
    .eq("activo", true)
    .order("creado_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(data || null, {
    headers: { "Cache-Control": "no-store" },
  });
}
