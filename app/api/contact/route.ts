import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

const OWNERSHIP_DIAS = 30;

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`contact:${ip}`, LIMITS.contacto);
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });

  try {
    const body = await req.json();
    const { name, email, social, source, notes, videos, price, ref } = body;

    if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const ownershipHasta = ref
      ? new Date(Date.now() + OWNERSHIP_DIAS * 86400000).toISOString()
      : null;

    // Verificar si ya existe un lead con ownership activo de otro agente
    const { data: leadExistente } = await supabase
      .from("leads")
      .select("id, agente_codigo, ownership_hasta")
      .eq("email", email.toLowerCase())
      .gte("ownership_hasta", new Date().toISOString())
      .single();

    // Si ya hay ownership activo de otro agente, no sobreescribir
    const agenteReal = leadExistente && leadExistente.agente_codigo !== ref
      ? leadExistente.agente_codigo  // mantener el primero
      : ref || null;

    await supabase.from("leads").insert({
      nombre: name?.trim() || null,
      email: email.trim().toLowerCase(),
      social: social?.trim() || null,
      source: source?.trim() || null,
      notas: notes?.trim() || null,
      videos: Number(videos),
      precio: Number(price),
      agente_codigo: agenteReal,
      ownership_hasta: ownershipHasta,
      ip,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
