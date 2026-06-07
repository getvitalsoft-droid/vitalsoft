import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Devuelve información básica del order para personalizar el onboarding
// No expone datos sensibles — solo nombre, plan y clips
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session");
  if (!sessionId) return NextResponse.json({ error: "session requerido" }, { status: 400 });

  const { data: order } = await supabase
    .from("orders")
    .select("cliente_nombre, clips, precio")
    .eq("stripe_session_id", sessionId)
    .single();

  if (!order) return NextResponse.json({ found: false });

  // Determinar nombre del plan o dejarlo como personalizado
  const PLANES: Record<number, string> = { 10: "Starter", 20: "Growth", 30: "Scale", 40: "Pro" };
  const planNombre = PLANES[order.clips] || null; // null = plan personalizado

  return NextResponse.json({
    found: true,
    nombre: order.cliente_nombre || null,
    clips: order.clips || null,
    precio: order.precio || null,
    planNombre, // null si no coincide con ningún plan fijo
  });
}
