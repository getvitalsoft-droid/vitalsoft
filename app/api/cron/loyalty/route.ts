// app/api/cron/loyalty/route.ts
// Cron mensual: detecta clientes que alcanzan 3, 6 o 12 meses activos
// y otorga créditos de antigüedad (una sola vez por milestone).
// Añadir en vercel.json: { "path": "/api/cron/loyalty", "schedule": "0 11 1 * *" }

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { enviarEmailLoyaltyCredit } from "@/lib/emails";

export const dynamic = "force-dynamic";

const MILESTONES: Array<{ key: string; meses: number; importe: number }> = [
  { key: "3_meses",  meses: 3,  importe: 10 },
  { key: "6_meses",  meses: 6,  importe: 25 },
  { key: "12_meses", meses: 12, importe: 50 },
];

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultados = { verificados: 0, creditos_otorgados: 0, errores: 0 };
  const ahora = new Date();

  // Traer orders activos (no pausados, no cancelados) con fecha de pago
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, stripe_customer_id, cliente_email, cliente_nombre, fecha_pago, estado")
    .not("estado", "in", '("cancelado","pausado")')
    .not("stripe_customer_id", "is", null)
    .not("fecha_pago", "is", null);

  if (error) {
    console.error("[Cron Loyalty] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const order of (orders ?? [])) {
    resultados.verificados++;
    try {
      const fechaPago = new Date(order.fecha_pago);
      const mesesActivo = (ahora.getTime() - fechaPago.getTime()) / (30.44 * 86400000);

      for (const milestone of MILESTONES) {
        if (mesesActivo < milestone.meses) continue;

        // Comprobar si ya se otorgó este milestone a este cliente
        const { data: existing } = await supabase
          .from("loyalty_credits")
          .select("id")
          .eq("stripe_customer_id", order.stripe_customer_id)
          .eq("milestone", milestone.key)
          .single();

        if (existing) continue; // Ya tiene este milestone

        // Otorgar crédito
        const { error: insertErr } = await supabase.from("loyalty_credits").insert({
          order_id: order.id,
          stripe_customer_id: order.stripe_customer_id,
          customer_email: order.cliente_email,
          milestone: milestone.key,
          amount: milestone.importe,
          status: "disponible",
        });

        if (insertErr) {
          // Puede ser violación de unique (race condition) — ignorar silenciosamente
          if (!insertErr.message.includes("unique")) {
            console.error(`[Cron Loyalty] Insert error ${order.cliente_email}:`, insertErr.message);
          }
          continue;
        }

        // Email al cliente
        await enviarEmailLoyaltyCredit({
          email: order.cliente_email,
          nombre: order.cliente_nombre,
          milestone: milestone.key,
          amount: milestone.importe,
        }).catch(err => console.error("[Cron Loyalty] Email error:", err));

        // Log
        await supabase.from("activity_logs").insert({
          admin: "cron",
          accion: "loyalty_credit_otorgado",
          objetivo_tipo: "order",
          objetivo_id: order.id,
          detalle: `Milestone ${milestone.key} · €${milestone.importe} · ${order.cliente_email}`,
        });

        await supabase.from("email_logs").insert({
          destinatario: order.cliente_email,
          tipo_email: `loyalty_${milestone.key}`,
          evento: "cron_loyalty",
          estado: "enviado",
        });

        resultados.creditos_otorgados++;
      }
    } catch (err) {
      console.error(`[Cron Loyalty] Error order ${order.id}:`, err);
      resultados.errores++;
    }
  }

  return NextResponse.json(resultados);
}
