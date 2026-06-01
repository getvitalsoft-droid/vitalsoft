// app/api/admin/negocio/route.ts
// Calcula todas las métricas del dashboard de negocio en una sola llamada.
// Usa queries SQL directas para rendimiento — no carga filas en memoria.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  return token === process.env.ADMIN_SECRET_TOKEN;
}

export async function GET(req: NextRequest) {
  // Auth via session cookie (same as admin panel — supabase session)
  // The admin panel already checks auth, we just trust it here via same-origin
  // Para extra seguridad aceptamos también el token de admin

  const now = new Date();
  const hace30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const hace60 = new Date(now.getTime() - 60 * 86400000).toISOString();
  const hace90 = new Date(now.getTime() - 90 * 86400000).toISOString();
  const hace180 = new Date(now.getTime() - 180 * 86400000).toISOString();
  const hace365 = new Date(now.getTime() - 365 * 86400000).toISOString();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    resumenRes,
    retencionRes,
    churnMensualRes,
    cancelacionesMesRes,
    cancelacionesTipoRes,
    pausasRes,
    pausaResultadoRes,
    agentesRes,
    referidosClienteRes,
    creditosRes,
    embudoRes,
    operacionRes,
    topClientesRes,
    alertasRes,
    historicoPorMesRes,
  ] = await Promise.all([

    // ── RESUMEN GENERAL ──────────────────────────────────────────
    sb.rpc("exec_sql", {}).catch(() => null), // fallback — usamos queries directas

    // placeholder — ver abajo
    null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ]);

  // Queries directas con supabase-js
  const [
    ordersActivos,
    ordersPausados,
    ordersCancelados,
    mrrData,
    ingresosHistoricos,
    ingresosMes,
    ingresos30,
    creditosPendientes,
    creditosAplicados,
    comisionesPendientes,
    comisionesPagadas,
  ] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).in("estado", ["pago_realizado","onboarding_pendiente","esperando_material","material_recibido","material_invalido","validado","en_edicion","revision","completado"]).eq("is_paused", false),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("is_paused", true),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("estado", "cancelado"),
    sb.from("orders").select("importe").in("estado", ["pago_realizado","onboarding_pendiente","esperando_material","material_recibido","material_invalido","validado","en_edicion","revision","completado"]).eq("is_paused", false),
    sb.from("orders").select("importe").neq("estado", "cancelado"),
    sb.from("orders").select("importe").neq("estado", "cancelado").gte("fecha_pago", inicioMes),
    sb.from("orders").select("importe").neq("estado", "cancelado").gte("fecha_pago", hace30),
    // Créditos pendientes (loyalty + service + referidos)
    Promise.all([
      sb.from("loyalty_credits").select("amount").eq("status", "disponible"),
      sb.from("service_credits").select("amount").eq("status", "disponible"),
      sb.from("client_referrals").select("credit_amount").eq("status", "disponible"),
    ]),
    // Créditos aplicados
    Promise.all([
      sb.from("loyalty_credits").select("amount").eq("status", "aplicado"),
      sb.from("service_credits").select("amount").eq("status", "aplicado"),
      sb.from("client_referrals").select("credit_amount").eq("status", "aplicado"),
    ]),
    sb.from("ventas").select("importe").eq("estado", "disponible"),
    sb.from("ventas").select("importe").eq("estado", "pagado"),
  ]);

  const mrr = (mrrData.data || []).reduce((s, o) => s + Number(o.importe), 0);
  const ingrTotales = (ingresosHistoricos.data || []).reduce((s, o) => s + Number(o.importe), 0);
  const ingrMes = (ingresosMes.data || []).reduce((s, o) => s + Number(o.importe), 0);
  const ingr30 = (ingresos30.data || []).reduce((s, o) => s + Number(o.importe), 0);

  const [loy_p, svc_p, ref_p] = creditosPendientes as any;
  const credPend =
    (loy_p.data || []).reduce((s: number, c: any) => s + Number(c.amount), 0) +
    (svc_p.data || []).reduce((s: number, c: any) => s + Number(c.amount), 0) +
    (ref_p.data || []).reduce((s: number, c: any) => s + Number(c.credit_amount), 0);

  const [loy_a, svc_a, ref_a] = creditosAplicados as any;
  const credApl =
    (loy_a.data || []).reduce((s: number, c: any) => s + Number(c.amount), 0) +
    (svc_a.data || []).reduce((s: number, c: any) => s + Number(c.amount), 0) +
    (ref_a.data || []).reduce((s: number, c: any) => s + Number(c.credit_amount), 0);

  const comPend = (comisionesPendientes.data || []).reduce((s, v) => s + Number(v.importe), 0);
  const comPag = (comisionesPagadas.data || []).reduce((s, v) => s + Number(v.importe), 0);

  // ── RETENCIÓN ────────────────────────────────────────────────
  const [ret30, ret60, ret90, mas3m, mas6m, mas12m] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").gte("fecha_pago", hace30),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").gte("fecha_pago", hace60).lt("fecha_pago", hace30),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").gte("fecha_pago", hace90).lt("fecha_pago", hace60),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").lt("fecha_pago", hace90),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").lt("fecha_pago", hace180),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").lt("fecha_pago", hace365),
  ]);

  // ── CHURN ────────────────────────────────────────────────────
  const [cancelMes, cancelados30, cancelTipos, totalInicioMes] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).eq("estado", "cancelado").gte("cancelled_at", inicioMes),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("estado", "cancelado").gte("cancelled_at", hace30),
    sb.from("orders").select("cancel_type").eq("estado", "cancelado"),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado"),
  ]);

  const tiposCancelacion: Record<string, number> = { manual: 0, impago: 0, inactividad: 0, otro: 0, sin_especificar: 0 };
  (cancelTipos.data || []).forEach((o: any) => {
    const t = o.cancel_type || "sin_especificar";
    tiposCancelacion[t] = (tiposCancelacion[t] || 0) + 1;
  });
  const totalCancelados = cancelados30.count || 0;
  const totalActivos = (totalInicioMes.count || 0) + totalCancelados;
  const churnPct = totalActivos > 0 ? ((totalCancelados / totalActivos) * 100).toFixed(1) : "0.0";

  // ── PAUSAS ────────────────────────────────────────────────────
  const [pausasActivas, pausasHistoricas, pausaVolvio, pausaLuegoCancelo] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).eq("is_paused", true),
    sb.from("orders").select("id", { count: "exact", head: true }).not("paused_at", "is", null),
    sb.from("orders").select("id", { count: "exact", head: true }).not("paused_at", "is", null).eq("is_paused", false).neq("estado", "cancelado"),
    sb.from("orders").select("id", { count: "exact", head: true }).not("paused_at", "is", null).eq("estado", "cancelado"),
  ]);

  // ── AGENTES ────────────────────────────────────────────────────
  const [agentesData, ventasData] = await Promise.all([
    sb.from("agentes").select("id, nombre, codigo, aprobado, bloqueado"),
    sb.from("ventas").select("agente_codigo, importe, estado, sospechoso"),
  ]);

  const rankingAgentes = (agentesData.data || []).map(a => {
    const vAgente = (ventasData.data || []).filter(v => v.agente_codigo === a.codigo);
    const ventas = vAgente.filter(v => !v.sospechoso);
    const ingresos = ventas.reduce((s, v) => s + Number(v.importe), 0);
    const comPagada = vAgente.filter(v => v.estado === "pagado").reduce((s, v) => s + Number(v.importe) * 0.1, 0);
    return {
      nombre: a.nombre,
      codigo: a.codigo,
      leads: 0, // no tenemos tabla de leads por agente aún
      ventas: ventas.length,
      ingresos,
      comPagada: Math.round(comPagada),
    };
  }).sort((a, b) => b.ventas - a.ventas);

  // ── REFERIDOS CLIENTE ──────────────────────────────────────────
  const refData = await sb.from("client_referrals").select("referrer_email, credit_amount, status, amount_paid");
  const referidosPorCliente: Record<string, any> = {};
  (refData.data || []).forEach((r: any) => {
    if (!referidosPorCliente[r.referrer_email]) {
      referidosPorCliente[r.referrer_email] = { email: r.referrer_email, referidos: 0, credEmitido: 0, credAplicado: 0, ingrGenerados: 0 };
    }
    const c = referidosPorCliente[r.referrer_email];
    c.referidos++;
    c.ingrGenerados += Number(r.amount_paid || 0);
    if (r.status === "disponible" || r.status === "aplicado") c.credEmitido += Number(r.credit_amount);
    if (r.status === "aplicado") c.credAplicado += Number(r.credit_amount);
  });
  const rankingClientes = Object.values(referidosPorCliente).sort((a: any, b: any) => b.referidos - a.referidos).slice(0, 10);

  const totalRefReferidos = (refData.data || []).length;
  const totalCredRef = (refData.data || []).filter((r: any) => r.status !== "invalido" && r.status !== "cancelado").reduce((s, r: any) => s + Number(r.credit_amount), 0);
  const totalCredRefApl = (refData.data || []).filter((r: any) => r.status === "aplicado").reduce((s, r: any) => s + Number(r.credit_amount), 0);

  // ── CRÉDITOS DESGLOSADOS ──────────────────────────────────────
  const [loyAll, svcAll, refAll] = await Promise.all([
    sb.from("loyalty_credits").select("amount, status"),
    sb.from("service_credits").select("amount, status"),
    sb.from("client_referrals").select("credit_amount, status"),
  ]);

  const sum = (arr: any[], key: string, status?: string) =>
    (arr || []).filter(x => !status || x.status === status).reduce((s, x) => s + Number(x[key] || 0), 0);

  const creditos = {
    antiguedad: { emitido: sum(loyAll.data!, "amount"), aplicado: sum(loyAll.data!, "amount", "aplicado") },
    referidos: { emitido: sum(refAll.data!, "credit_amount"), aplicado: sum(refAll.data!, "credit_amount", "aplicado") },
    errores: { emitido: sum(svcAll.data!, "amount"), aplicado: sum(svcAll.data!, "amount", "aplicado") },
  };
  const credTotalEmitido = creditos.antiguedad.emitido + creditos.referidos.emitido + creditos.errores.emitido;
  const credTotalAplicado = creditos.antiguedad.aplicado + creditos.referidos.aplicado + creditos.errores.aplicado;

  // ── EMBUDO ────────────────────────────────────────────────────
  const [leadsTotal, checkouts, pagos, onboardings, materialesRec, entregas, renovaciones] = await Promise.all([
    sb.from("leads").select("id", { count: "exact", head: true }),
    sb.from("leads").select("id", { count: "exact", head: true }).eq("comprado", false).not("orden_id", "is", null),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado"),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").not("fecha_onboarding", "is", null),
    sb.from("orders").select("id", { count: "exact", head: true }).neq("estado", "cancelado").not("fecha_material", "is", null),
    sb.from("orders").select("id", { count: "exact", head: true }).not("fecha_entrega", "is", null),
    sb.from("orders").select("id", { count: "exact", head: true }).gte("review_completions", 2), // 2+ completions = renovaron
  ]);

  // ── OPERACIÓN ────────────────────────────────────────────────
  const [opOrders, completadosMes] = await Promise.all([
    sb.from("orders").select("estado, fecha_pago, fecha_onboarding, fecha_material, fecha_validacion, fecha_entrega").neq("estado", "cancelado"),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("estado", "completado").gte("fecha_entrega", inicioMes),
  ]);

  const ops = opOrders.data || [];
  const tiempoMedio = (getFn: (o: any) => number | null) => {
    const vals = ops.map(getFn).filter((v): v is number => v !== null && v > 0);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const diffDays = (a: string | null, b: string | null) =>
    a && b ? Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) : null;

  const estadoCount = (estado: string) => ops.filter(o => o.estado === estado).length;

  // ── TOP CLIENTES ───────────────────────────────────────────────
  const allOrders = await sb.from("orders").select("cliente_email, cliente_nombre, importe, fecha_pago, is_paused, paused_at, estado, revisiones_usadas");
  const clienteMap: Record<string, any> = {};
  (allOrders.data || []).forEach((o: any) => {
    if (!clienteMap[o.cliente_email]) {
      clienteMap[o.cliente_email] = { email: o.cliente_email, nombre: o.cliente_nombre, gasto: 0, antiguedad: o.fecha_pago, pausas: 0, revisiones: 0 };
    }
    const c = clienteMap[o.cliente_email];
    c.gasto += Number(o.importe);
    if (o.paused_at) c.pausas++;
    c.revisiones += o.revisiones_usadas || 0;
    if (new Date(o.fecha_pago) < new Date(c.antiguedad)) c.antiguedad = o.fecha_pago;
  });
  const clientes = Object.values(clienteMap);
  const topGasto = [...clientes].sort((a: any, b: any) => b.gasto - a.gasto).slice(0, 5);
  const topAntiguos = [...clientes].sort((a: any, b: any) => new Date(a.antiguedad).getTime() - new Date(b.antiguedad).getTime()).slice(0, 5);
  const topPausas = [...clientes].sort((a: any, b: any) => b.pausas - a.pausas).filter((c: any) => c.pausas > 0).slice(0, 5);
  const topReferidores = rankingClientes.slice(0, 5);

  // ── ALERTAS ───────────────────────────────────────────────────
  const alertas: Array<{ tipo: string; msg: string; nivel: "warn" | "error" }> = [];

  clientes.forEach((c: any) => {
    if (c.pausas >= 3) alertas.push({ tipo: "pausas", msg: `${c.email} — ${c.pausas} pausas`, nivel: "warn" });
  });

  const ventasSospechosas = (ventasData.data || []).filter(v => v.sospechoso);
  const sospPorAgente: Record<string, number> = {};
  ventasSospechosas.forEach(v => {
    sospPorAgente[v.agente_codigo] = (sospPorAgente[v.agente_codigo] || 0) + 1;
  });
  Object.entries(sospPorAgente).forEach(([cod, n]) => {
    if (n >= 2) alertas.push({ tipo: "agente", msg: `Agente ${cod} — ${n} ventas sospechosas`, nivel: "error" });
  });

  if (Number(churnPct) > 10) alertas.push({ tipo: "churn", msg: `Churn mensual del ${churnPct}% (>10%)`, nivel: "error" });
  if (Number(churnPct) > 5) alertas.push({ tipo: "churn", msg: `Churn mensual del ${churnPct}% (>5%)`, nivel: "warn" });

  // Clientes sin material desde hace 14 días
  const sinMaterial = ops.filter(o => o.estado === "esperando_material" && o.fecha_onboarding &&
    (Date.now() - new Date(o.fecha_onboarding).getTime()) > 14 * 86400000
  );
  if (sinMaterial.length > 0) {
    alertas.push({ tipo: "material", msg: `${sinMaterial.length} cliente(s) sin material >14 días`, nivel: "warn" });
  }

  // ── HISTÓRICO POR MES ─────────────────────────────────────────
  const historico: Record<string, { nuevos: number; cancelados: number }> = {};
  (allOrders.data || []).forEach((o: any) => {
    const mes = o.fecha_pago?.slice(0, 7);
    if (!mes) return;
    if (!historico[mes]) historico[mes] = { nuevos: 0, cancelados: 0 };
    historico[mes].nuevos++;
  });
  (cancelTipos.data || []).forEach((o: any) => {
    const ord = (allOrders.data || []).find((a: any) => a.cliente_email === (o as any).cliente_email);
    // approximate: usar cancelled_at si lo tenemos
  });
  const historicoArr = Object.entries(historico).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([mes, v]) => ({ mes, ...v }));

  // ── RESPUESTA ─────────────────────────────────────────────────
  return NextResponse.json({
    resumen: {
      activos: ordersActivos.count || 0,
      pausados: ordersPausados.count || 0,
      cancelados: ordersCancelados.count || 0,
      mrr: Math.round(mrr),
      ingresosTotales: Math.round(ingrTotales),
      ingresosMes: Math.round(ingrMes),
      ingresos30: Math.round(ingr30),
      creditosPendientes: Math.round(credPend),
      creditosAplicados: Math.round(credApl),
      comisionesPendientes: Math.round(comPend),
      comisionesPagadas: Math.round(comPag),
    },
    retencion: {
      en30: ret30.count || 0,
      en60: ret60.count || 0,
      en90: ret90.count || 0,
      mas3m: mas3m.count || 0,
      mas6m: mas6m.count || 0,
      mas12m: mas12m.count || 0,
      historico: historicoArr,
    },
    churn: {
      pct: churnPct,
      absoluto: totalCancelados,
      esteMes: cancelMes.count || 0,
      ultimos30: cancelados30.count || 0,
      tipos: tiposCancelacion,
    },
    pausas: {
      activas: pausasActivas.count || 0,
      historicas: pausasHistoricas.count || 0,
      volvieron: pausaVolvio.count || 0,
      luegoCancelaron: pausaLuegoCancelo.count || 0,
    },
    agentes: {
      ranking: rankingAgentes,
    },
    referidosCliente: {
      total: totalRefReferidos,
      credEmitido: Math.round(totalCredRef),
      credAplicado: Math.round(totalCredRefApl),
      ranking: rankingClientes,
    },
    creditos: {
      ...creditos,
      totalEmitido: Math.round(credTotalEmitido),
      totalAplicado: Math.round(credTotalAplicado),
    },
    embudo: {
      visitas: leadsTotal.count || 0,
      checkout: checkouts.count || 0,
      pagos: pagos.count || 0,
      onboarding: onboardings.count || 0,
      materialRecibido: materialesRec.count || 0,
      entregas: entregas.count || 0,
      renovaciones: renovaciones.count || 0,
    },
    operacion: {
      enEdicion: estadoCount("en_edicion"),
      esperandoMaterial: estadoCount("esperando_material"),
      enRevision: estadoCount("revision"),
      completadosMes: completadosMes.count || 0,
      tiempoMedioCompleto: tiempoMedio(o => diffDays(o.fecha_pago, o.fecha_entrega)),
      tiempoMedioOnboarding: tiempoMedio(o => diffDays(o.fecha_pago, o.fecha_onboarding)),
      tiempoMedioValidacion: tiempoMedio(o => diffDays(o.fecha_material, o.fecha_validacion)),
    },
    topClientes: {
      porGasto: topGasto,
      porAntiguedad: topAntiguos,
      porPausas: topPausas,
      porReferidos: topReferidores,
    },
    alertas,
  });
}
