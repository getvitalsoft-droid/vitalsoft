// app/api/cliente/cancelar/route.ts
// Cancelación al final del período pagado (at_period_end: true).
// El cliente sigue activo hasta que vence el mes que ya pagó.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyClientToken } from "@/app/api/cliente-auth/route";
import { enviarEmailClienteCancelacion, enviarEmailAdminCancelacion } from "@/lib/emails";

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

  const { motivo } = await req.json();

  const { data: order } = await sb
    .from("orders")
    .select("id, stripe_subscription_id, cliente_nombre, plan, estado")
    .eq("cliente_email", email)
    .not("estado", "eq", "cancelado")
    .order("fecha_pago", { ascending: false })
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ error: "No se encontró tu suscripción" }, { status: 404 });
  if (!order.stripe_subscription_id) {
    return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
  }

  // Cancelar al final del período — el cliente sigue activo hasta que vence
  const sub = await stripe.subscriptions.update(order.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  const fechaFin = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toLocaleDateString("es-ES")
    : "fin del período";

  // Marcar en BD (no "cancelado" aún — lo marca el webhook cuando realmente se cancela)
  await sb.from("orders").update({
    notas_admin: `Cancelación solicitada por cliente el ${new Date().toLocaleDateString("es-ES")}. Motivo: ${motivo || "sin indicar"}. Activo hasta: ${fechaFin}`,
    cancelled_at: new Date().toISOString(),
  }).eq("id", order.id);

  await sb.from("activity_logs").insert({
    admin: email,
    accion: "cancelacion_solicitada_por_cliente",
    objetivo_tipo: "order",
    objetivo_id: order.id,
    detalle: `Activo hasta ${fechaFin}. Motivo: ${motivo || "sin indicar"}`,
  });

  await Promise.allSettled([
    enviarEmailClienteCancelacion({ email, plan: order.plan, fechaFin }),
    enviarEmailAdminCancelacion({ clienteEmail: email, plan: order.plan }),
  ]);

  return NextResponse.json({ success: true, activo_hasta: fechaFin });
}
