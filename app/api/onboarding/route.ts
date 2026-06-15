import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`onboarding:${ip}`, { windowMs: 60 * 60 * 1000, max: 10 });
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });

  try {
    const body = await req.json();
    const { session_id, nombre_proyecto, redes_sociales, tipo_contenido,
      plataformas, duracion_media, frecuencia_grabacion, idioma,
      referencias, instrucciones } = body;

    if (!session_id) return NextResponse.json({ error: "Datos requeridos." }, { status: 400 });


    // Buscar order por session_id
    const { data: order, error: orderErr } = await supabase
      .from("orders").select("id, estado, cliente_email").eq("stripe_session_id", session_id).single();

    if (orderErr || !order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

    // Usar el email del order directamente — no confiar en el email del cliente
    const email = order.cliente_email;

    // Guardar onboarding - upsert para evitar duplicados (UNIQUE en order_id)
    const { error: onbErr } = await supabase.from("onboarding").upsert({
      order_id: order.id, cliente_email: email,
      nombre_proyecto, redes_sociales, tipo_contenido,
      plataformas: plataformas || [],
      duracion_media, frecuencia_grabacion,
      idioma: idioma || "Español",

      referencias,
      notas_importantes: instrucciones,

    });
    if (onbErr) return NextResponse.json({ error: onbErr.message }, { status: 500 });

    // Actualizar estado SOLO si el order sigue en onboarding_pendiente
    // No sobreescribir estados más avanzados (en_edicion, completado, etc.)
    const ESTADOS_ONBOARDING = ["onboarding_pendiente", "esperando_material"];
    if (ESTADOS_ONBOARDING.includes(order.estado)) {
      await supabase.from("orders").update({
        estado: "esperando_material",

        fecha_onboarding: new Date().toISOString(),
      }).eq("id", order.id);
    } else {
      await supabase.from("orders").update({

      }).eq("id", order.id);
    }

    await supabase.from("activity_logs").insert({
      admin: "cliente", accion: "onboarding_completado",
      objetivo_tipo: "order", objetivo_id: order.id,
detalle: email,
    });

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Error interno." }, { status: 500 }); }
}
