import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`onboarding:${ip}`, { windowMs: 60 * 60 * 1000, max: 10 });
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });

  try {
    const body = await req.json();
    const { session_id, email, nombre_proyecto, redes_sociales, tipo_contenido,
      plataformas, duracion_media, frecuencia_grabacion, idioma,
      drive_link, referencias, estilo_notas, notas_importantes } = body;

    if (!email || !session_id) return NextResponse.json({ error: "Datos requeridos." }, { status: 400 });
    if (!drive_link) return NextResponse.json({ error: "El link de Drive es obligatorio." }, { status: 400 });

    // Buscar order por session_id
    const { data: order, error: orderErr } = await supabase
      .from("orders").select("id, estado").eq("stripe_session_id", session_id).single();

    if (orderErr || !order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

    // Guardar onboarding - upsert para evitar duplicados (UNIQUE en order_id)
    const { error: onbErr } = await supabase.from("onboarding").upsert({
      order_id: order.id, cliente_email: email,
      nombre_proyecto, redes_sociales, tipo_contenido,
      plataformas: plataformas || [],
      duracion_media, frecuencia_grabacion,
      idioma: idioma || "Español",
      drive_link, referencias, estilo_notas, notas_importantes,
    });
    if (onbErr) return NextResponse.json({ error: onbErr.message }, { status: 500 });

    // Actualizar estado del order
    await supabase.from("orders").update({
      estado: "esperando_material",
      material_link: drive_link,
      fecha_onboarding: new Date().toISOString(),
    }).eq("id", order.id);

    await supabase.from("activity_logs").insert({
      admin: "cliente", accion: "onboarding_completado",
      objetivo_tipo: "order", objetivo_id: order.id,
      detalle: `${email} · Drive: ${drive_link}`,
    });

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Error interno." }, { status: 500 }); }
}
