// /api/cron/daily — Cron unificado diario
// Reemplaza los 5 crons individuales para cumplir el límite de 2 del plan Hobby.
// Se ejecuta cada día a las 9:00 UTC. Internamente decide qué jobs correr según
// el día de la semana y el día del mes.
//
// Jobs incluidos:
// - Diario:     comisiones, onboarding-reminder
// - Lunes:      reportes-agentes, recuperacion
// - Día 1:      loyalty

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vitalsoft.pro";

async function llamar(path: string, secret: string): Promise<{ ok: boolean; resultado: unknown }> {
  try {
    const res = await fetch(`${SITE}${path}`, {
      headers: {
        "x-cron-secret": secret,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ status: res.status }));
    return { ok: res.ok, resultado: data };
  } catch (e: any) {
    return { ok: false, resultado: e.message };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  // UTC — Vercel corre en UTC
  const diaSemana = ahora.getUTCDay(); // 0=dom, 1=lun
  const diaMes = ahora.getUTCDate();
  const esLunes = diaSemana === 1;
  const esDia1 = diaMes === 1;

  const resultados: Record<string, unknown> = {};

  // ── Diarios (siempre) ──────────────────────────────────────────────────
  resultados.comisiones = await llamar("/api/cron/comisiones", secret);
  resultados.onboarding_reminder = await llamar("/api/cron/onboarding-reminder", secret);

  // ── Solo lunes ────────────────────────────────────────────────────────
  if (esLunes) {
    resultados.reportes_agentes = await llamar("/api/cron/reportes-agentes", secret);
    resultados.recuperacion = await llamar("/api/cron/recuperacion", secret);
  }

  // ── Solo día 1 de mes ─────────────────────────────────────────────────
  if (esDia1) {
    resultados.loyalty = await llamar("/api/cron/loyalty", secret);
  }

  console.log(`[daily] ${ahora.toISOString()} | lunes:${esLunes} dia1:${esDia1}`, resultados);

  return NextResponse.json({
    fecha: ahora.toISOString(),
    esLunes,
    esDia1,
    resultados,
  });
}
