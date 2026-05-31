// app/api/cron/recuperacion/route.ts
// Cron semanal: intenta recuperar clientes cancelados hace 30–180 días
// Máximo 3 intentos por cliente, espaciados al menos 21 días entre sí.
// Añadir en vercel.json: { "path": "/api/cron/recuperacion", "schedule": "0 10 * * 1" }

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  enviarEmailRecuperacion1,
  enviarEmailRecuperacion2,
  enviarEmailRecuperacion3,
} from "@/lib/emails";

export const dynamic = "force-dynamic";
const MAX_INTENTOS = 3;
const MIN_DIAS_ENTRE_INTENTOS = 21;
const MIN_DIAS_CANCELADO = 30;
const MAX_DIAS_CANCELADO = 180;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const hace30 = new Date(ahora.getTime() - MIN_DIAS_CANCELADO * 86400000).toISOString();
  const hace180 = new Date(ahora.getTime() - MAX_DIAS_CANCELADO * 86400000).toISOString();

  const resultados = { procesados: 0, emails_enviados: 0, omitidos: 0, errores: 0 };

  // Buscar orders cancelados en la ventana 30–180 días
  // cancelled_at puede ser null en orders cancelados antes de esta migración → fallback a actualizado_at
  const { data: cancelados, error } = await supabase
    .from("orders")
    .select("id, cliente_email, cliente_nombre, recovery_attempts, recovery_email_sent_at, cancelled_at, actualizado_at")
    .eq("estado", "cancelado")
    .lt("recovery_attempts", MAX_INTENTOS)
    .or(`cancelled_at.gte.${hace180},actualizado_at.gte.${hace180}`)
    .or(`cancelled_at.lte.${hace30},actualizado_at.lte.${hace30}`);

  if (error) {
    console.error("[Cron Recuperacion] Error query:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const order of (cancelados ?? [])) {
    resultados.procesados++;
    try {
      const intentos = order.recovery_attempts ?? 0;

      // Respetar espacio mínimo entre intentos
      if (order.recovery_email_sent_at) {
        const diasDesdeUltimo = (ahora.getTime() - new Date(order.recovery_email_sent_at).getTime()) / 86400000;
        if (diasDesdeUltimo < MIN_DIAS_ENTRE_INTENTOS) {
          resultados.omitidos++;
          continue;
        }
      }

      // Seleccionar template según intento
      const emailFn = intentos === 0
        ? enviarEmailRecuperacion1
        : intentos === 1
        ? enviarEmailRecuperacion2
        : enviarEmailRecuperacion3;

      await emailFn({ email: order.cliente_email, nombre: order.cliente_nombre });

      // Actualizar contadores
      await supabase.from("orders").update({
        recovery_attempts: intentos + 1,
        recovery_email_sent_at: ahora.toISOString(),
      }).eq("id", order.id);

      // Log
      await supabase.from("activity_logs").insert({
        admin: "cron",
        accion: "recovery_email_enviado",
        objetivo_tipo: "order",
        objetivo_id: order.id,
        detalle: `Intento ${intentos + 1}/${MAX_INTENTOS} · ${order.cliente_email}`,
      });

      await supabase.from("email_logs").insert({
        destinatario: order.cliente_email,
        tipo_email: `recuperacion_intento_${intentos + 1}`,
        evento: "cron_recuperacion",
        estado: "enviado",
      });

      resultados.emails_enviados++;
    } catch (err) {
      console.error(`[Cron Recuperacion] Error ${order.cliente_email}:`, err);
      resultados.errores++;
    }
  }

  return NextResponse.json(resultados);
}
