// app/api/cliente/pausar/route.ts
// El cliente pausa o reactiva su propia suscripción.
// Pausa en Stripe: pause_collection marca la suscripción pero NO para el cobro
// inmediatamente — la suscripción sigue activa, simplemente no factura.
// Nosotros usamos subscription.billing_cycle_anchor para controlar 30 días.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyClientToken } from "@/lib/cliente-token";
import {
  enviarEmailClientePausada,
  enviarEmailClienteReactivada,
  enviarEmailAdminClientePausado,
} from "@/lib/emails";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-cliente-token");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const email = verifyClientToken(token);
  if (!email) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { accion, motivo } = await req.json();
  if (!["pausar", "reactivar"].includes(accion)) {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  // Obtener order activo
  const { data: order } = await sb
    .from("orders")
    .select("id, stripe_subscription_id, cliente_nombre, is_paused, estado")
    .eq("cliente_email", email)
    .not("estado", "eq", "cancelado")
    .order("fecha_pago", { ascending: false })
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "No se encontró tu suscripción" }, { status: 404 });
  if (!order.stripe_subscription_id) {
    return NextResponse.json({ error: "Suscripción no encontrada en Stripe" }, { status: 404 });
  }

  if (accion === "pausar") {
    if (order.is_paused) {
      return NextResponse.json({ error: "La suscripción ya está pausada" }, { status: 400 });
    }

    const pauseUntil = new Date(Date.now() + 30 * 86400000);

    // Stripe: pause_collection — Stripe NO cobra pero la suscripción sigue activa
    // behavior: "void" = las facturas se marcan como void (no se generan cargos)
    await stripe.subscriptions.update(order.stripe_subscription_id, {
      pause_collection: { behavior: "void" },
    });

    // BD
    await sb.from("orders").update({
      is_paused: true,
      paused_at: new Date().toISOString(),
      pause_until: pauseUntil.toISOString(),
      pause_reason: motivo || null,
      estado: "pausado",
    }).eq("id", order.id);

    // Log
    await sb.from("activity_logs").insert({
      admin: email,
      accion: "pausa_solicitada_por_cliente",
      objetivo_tipo: "order",
      objetivo_id: order.id,
      detalle: `Cliente pausó 30 días. Motivo: ${motivo || "sin motivo"}`,
    });

    const pauseUntilStr = pauseUntil.toLocaleDateString("es-ES");

    // Emails
    await Promise.allSettled([
      enviarEmailClientePausada({ email, nombre: order.cliente_nombre, pauseUntil: pauseUntilStr, motivo }),
      enviarEmailAdminClientePausado({ clienteEmail: email, pauseUntil: pauseUntilStr, motivo }),
    ]);

    return NextResponse.json({ success: true, pause_until: pauseUntil.toISOString() });
  }

  // Reactivar
  if (!order.is_paused) {
    return NextResponse.json({ error: "La suscripción no está pausada" }, { status: 400 });
  }

  // Stripe: quitar pause_collection
  await stripe.subscriptions.update(order.stripe_subscription_id, {
    pause_collection: "",
  } as any);

  await sb.from("orders").update({
    is_paused: false,
    paused_at: null,
    pause_until: null,
    pause_reason: null,
    estado: "esperando_material",
  }).eq("id", order.id);

  await sb.from("activity_logs").insert({
    admin: email,
    accion: "reactivacion_solicitada_por_cliente",
    objetivo_tipo: "order",
    objetivo_id: order.id,
    detalle: "Cliente reactivó su suscripción manualmente",
  });

  await enviarEmailClienteReactivada({ email, nombre: order.cliente_nombre }).catch(console.error);

  return NextResponse.json({ success: true });
}
