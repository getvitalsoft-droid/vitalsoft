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

    const emailLower = email.trim().toLowerCase();
    const ahora = new Date().toISOString();

    // ── Buscar ownership activo para este email ──────────────────────────────
    // Un ownership activo = hay un lead con este email cuyo ownership_hasta > ahora
    const { data: ownershipActivo } = await supabase
      .from("leads")
      .select("id, agente_codigo, ownership_hasta, creado_at")
      .eq("email", emailLower)
      .not("ownership_hasta", "is", null)
      .gte("ownership_hasta", ahora)
      .order("creado_at", { ascending: true }) // el más antiguo = el primero
      .limit(1)
      .single();

    // ── Reglas de ownership ──────────────────────────────────────────────────
    // CASO 1: Ya existe ownership activo
    // → No sobreescribir. El primer agente mantiene el lead.
    // → Registrar el intento de todos modos para analytics.
    if (ownershipActivo) {
      await supabase.from("activity_logs").insert({
        admin: "sistema",
        accion: "ownership_mantenido",
        objetivo_tipo: "lead",
        objetivo_id: ownershipActivo.id,
        detalle: `Email ${emailLower} ya tiene ownership de ${ownershipActivo.agente_codigo} hasta ${ownershipActivo.ownership_hasta}. Ref rechazado: ${ref || "directo"}`,
      });

      // Devolvemos success igual — el visitante no necesita saber esto
      return NextResponse.json({ success: true });
    }

    // CASO 2: No hay ownership activo → guardar con el agente actual (si hay ref)
    const ownershipHasta = ref
      ? new Date(Date.now() + OWNERSHIP_DIAS * 86400000).toISOString()
      : null;

    await supabase.from("leads").insert({
      nombre: name?.trim() || null,
      email: emailLower,
      social: social?.trim() || null,
      source: source?.trim() || null,
      notas: notes?.trim() || null,
      videos: Number(videos) || null,
      precio: Number(price) || null,
      agente_codigo: ref || null,
      ownership_hasta: ownershipHasta,
      ip,
    });

    if (ref) {
      await supabase.from("activity_logs").insert({
        admin: "sistema",
        accion: "ownership_asignado",
        objetivo_tipo: "lead",
        detalle: `Email ${emailLower} asignado a agente ${ref} hasta ${ownershipHasta}`,
      });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[Contact] Error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
