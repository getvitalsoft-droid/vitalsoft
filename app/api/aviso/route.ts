import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usamos service_role para leer avisos — la tabla tiene RLS estricto
// y el cliente anon no puede leer aunque haya política pública
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
