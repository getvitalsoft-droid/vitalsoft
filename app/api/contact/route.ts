import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, social, source, notes, videos, price, ref } = body;

    if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const { error } = await supabase.from("leads").insert({
      nombre: name?.trim() || null,
      email: email.trim().toLowerCase(),
      social: social?.trim() || null,
      source: source?.trim() || null,
      notas: notes?.trim() || null,
      videos: Number(videos),
      precio: Number(price),
      agente_codigo: ref || null,
    });

    if (error) console.error("[VitalSoft] Error guardando lead:", error.message);
    else console.log("[VitalSoft] Lead guardado:", { email, videos, price, ref });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
