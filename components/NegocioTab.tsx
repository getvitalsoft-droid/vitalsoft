"use client";
// components/NegocioTab.tsx
// Dashboard de negocio para el panel admin.
// Datos reales, sin adornos innecesarios.

import { useEffect } from "react";
import { RefreshCw, AlertTriangle, AlertCircle, TrendingDown } from "lucide-react";

interface Props {
  data: any;
  loading: boolean;
  onLoad: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────

function eur(n: number) {
  return `€${n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return ((a / b) * 100).toFixed(1) + "%";
}

// ── Sub-componentes ───────────────────────────────────────────────

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
      <div className="text-white/35 text-xs mb-1">{label}</div>
      <div className={`font-display font-black text-2xl ${accent ? "text-[#d4f53c]" : "text-white"}`}>{value}</div>
      {sub && <div className="text-white/25 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">{title}</div>
      {children}
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; n: number }[] }) {
  const max = steps[0]?.n || 1;
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => {
        const pctVal = max > 0 ? (s.n / max) * 100 : 0;
        const conv = i > 0 && steps[i - 1].n > 0
          ? ((s.n / steps[i - 1].n) * 100).toFixed(0) + "%"
          : null;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/50">{s.label}</span>
              <span className="font-bold text-white">{s.n.toLocaleString()}
                {conv && <span className="text-white/30 font-normal ml-2">↓ {conv}</span>}
              </span>
            </div>
            <div className="h-5 bg-white/[0.04] rounded overflow-hidden">
              <div
                className="h-full bg-[#d4f53c]/70 rounded transition-all"
                style={{ width: `${pctVal}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ cols, rows }: { cols: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return <p className="text-white/25 text-xs py-2">Sin datos</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {cols.map(c => <th key={c} className="text-left text-white/30 py-1.5 pr-4 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 pr-4 text-white/70">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────

export default function NegocioTab({ data, loading, onLoad }: Props) {
  useEffect(() => {
    if (!data && !loading) onLoad();
  }, []);

  if (loading || !data) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <RefreshCw size={24} className="animate-spin text-white/30 mx-auto mb-3" />
        <p className="text-white/30 text-sm">Calculando métricas...</p>
      </div>
    </div>
  );

  const { resumen, retencion, churn, pausas, agentes, referidosCliente, creditos, embudo, operacion, topClientes, alertas } = data;

  return (
    <div className="space-y-0">

      {/* Cabecera + refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-black text-lg">Dashboard de Negocio</h2>
          <p className="text-white/30 text-xs">Métricas reales para tomar decisiones</p>
        </div>
        <button onClick={onLoad} disabled={loading}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* ── ALERTAS ── */}
      {alertas?.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertas.map((a: any, i: number) => (
            <div key={i} className={`flex items-start gap-2.5 px-4 py-2.5 rounded-xl border text-sm ${a.nivel === "error"
              ? "bg-red-500/8 border-red-500/20 text-red-400"
              : "bg-yellow-400/8 border-yellow-400/20 text-yellow-300"}`}>
              {a.nivel === "error" ? <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />}
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── RESUMEN GENERAL ── */}
      <Section title="Resumen General">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <Card label="MRR" value={eur(resumen.mrr)} accent />
          <Card label="Ingresos 30 días" value={eur(resumen.ingresos30)} />
          <Card label="Ingresos este mes" value={eur(resumen.ingresosMes)} />
          <Card label="Ingresos históricos" value={eur(resumen.ingresosTotales)} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <Card label="Clientes activos" value={resumen.activos} accent />
          <Card label="Pausados" value={resumen.pausados} />
          <Card label="Cancelados" value={resumen.cancelados} />
          <Card label="Créditos pendientes" value={eur(resumen.creditosPendientes)} sub="por aplicar" />
          <Card label="Comisiones pend." value={eur(resumen.comisionesPendientes)} />
          <Card label="Comisiones pagadas" value={eur(resumen.comisionesPagadas)} />
        </div>
      </Section>

      {/* ── EMBUDO DE CONVERSIÓN ── */}
      <Section title="Embudo de Conversión">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <Funnel steps={[
            { label: "Visitas (leads)", n: embudo.visitas },
            { label: "Iniciaron checkout", n: embudo.checkout },
            { label: "Pagaron", n: embudo.pagos },
            { label: "Completaron onboarding", n: embudo.onboarding },
            { label: "Material recibido", n: embudo.materialRecibido },
            { label: "Entregas realizadas", n: embudo.entregas },
            { label: "Renovaron (≥2 ciclos)", n: embudo.renovaciones },
          ]} />
        </div>
      </Section>

      {/* ── RETENCIÓN + CHURN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <Section title="Retención">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Card label="Clientes <30 días" value={retencion.en30} />
            <Card label="Entre 30-60 días" value={retencion.en60} />
            <Card label="Entre 60-90 días" value={retencion.en90} />
            <Card label="+3 meses" value={retencion.mas3m} />
            <Card label="+6 meses" value={retencion.mas6m} />
            <Card label="+12 meses" value={retencion.mas12m} accent />
          </div>
        </Section>

        <Section title="Churn">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Card label="Churn mensual" value={`${churn.pct}%`} accent={Number(churn.pct) > 5} />
            <Card label="Cancelaciones (abs)" value={churn.absoluto} />
            <Card label="Este mes" value={churn.esteMes} />
            <Card label="Últimos 30 días" value={churn.ultimos30} />
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="text-white/30 text-xs mb-2">Motivos de cancelación</div>
            <div className="space-y-1">
              {Object.entries(churn.tipos as Record<string, number>).map(([tipo, n]) => (
                <div key={tipo} className="flex items-center justify-between text-xs">
                  <span className="text-white/50 capitalize">{tipo.replace("_", " ")}</span>
                  <span className="font-bold text-white/70">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ── PAUSAS ── */}
      <Section title="Análisis de Pausas">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card label="Pausas activas" value={pausas.activas} />
          <Card label="Pausas históricas" value={pausas.historicas} />
          <Card label="Pausaron y volvieron" value={pausas.volvieron} accent />
          <Card label="Pausaron y cancelaron" value={pausas.luegoCancelaron} />
        </div>
        {pausas.historicas > 0 && (
          <p className="text-white/30 text-xs mt-3">
            La pausa retuvo al <strong className="text-white/60">
              {pct(pausas.volvieron, pausas.historicas)}
            </strong> de los clientes que la usaron.
          </p>
        )}
      </Section>

      {/* ── OPERACIÓN ── */}
      <Section title="Operación">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <Card label="En edición" value={operacion.enEdicion} />
          <Card label="Esperando material" value={operacion.esperandoMaterial} />
          <Card label="En revisión" value={operacion.enRevision} />
          <Card label="Completados este mes" value={operacion.completadosMes} accent />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card label="Tiempo medio entrega" value={operacion.tiempoMedioCompleto ? `${operacion.tiempoMedioCompleto}d` : "—"} sub="desde pago hasta entrega" />
          <Card label="Tiempo medio onboarding" value={operacion.tiempoMedioOnboarding ? `${operacion.tiempoMedioOnboarding}d` : "—"} sub="desde pago hasta onboarding" />
          <Card label="Tiempo medio validación" value={operacion.tiempoMedioValidacion ? `${operacion.tiempoMedioValidacion}d` : "—"} sub="desde material hasta validación" />
        </div>
      </Section>

      {/* ── AGENTES ── */}
      <Section title="Agentes — Ranking">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <Table
            cols={["Agente", "Código", "Ventas", "Ingresos generados", "Comisión pagada"]}
            rows={(agentes.ranking || []).map((a: any) => [
              a.nombre,
              a.codigo,
              a.ventas,
              eur(a.ingresos),
              eur(a.comPagada),
            ])}
          />
        </div>
      </Section>

      {/* ── REFERIDOS CLIENTE ── */}
      <Section title="Referidos — Clientes">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Card label="Referidos generados" value={referidosCliente.total} />
          <Card label="Créditos emitidos" value={eur(referidosCliente.credEmitido)} />
          <Card label="Créditos aplicados" value={eur(referidosCliente.credAplicado)} accent />
        </div>
        {referidosCliente.ranking?.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <Table
              cols={["Cliente", "Referidos", "Crédito emitido", "Crédito aplicado", "Ingresos generados"]}
              rows={(referidosCliente.ranking || []).map((c: any) => [
                c.email,
                c.referidos,
                eur(c.credEmitido),
                eur(c.credAplicado),
                eur(c.ingrGenerados),
              ])}
            />
          </div>
        )}
      </Section>

      {/* ── CRÉDITOS ── */}
      <Section title="Créditos — Cuánto dinero sale">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="text-white/30 text-xs mb-2">Por antigüedad</div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Emitido</span>
              <span className="font-bold">{eur(creditos.antiguedad.emitido)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Aplicado</span>
              <span className="font-bold text-[#d4f53c]">{eur(creditos.antiguedad.aplicado)}</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="text-white/30 text-xs mb-2">Por referidos</div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Emitido</span>
              <span className="font-bold">{eur(creditos.referidos.emitido)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Aplicado</span>
              <span className="font-bold text-[#d4f53c]">{eur(creditos.referidos.aplicado)}</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="text-white/30 text-xs mb-2">Por errores de servicio</div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Emitido</span>
              <span className="font-bold">{eur(creditos.errores.emitido)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Aplicado</span>
              <span className="font-bold text-[#d4f53c]">{eur(creditos.errores.aplicado)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-white/40 text-sm">Total créditos emitidos</span>
          <span className="font-display font-black text-xl text-white">{eur(creditos.totalEmitido)}</span>
        </div>
        <div className="bg-[rgba(212,245,60,0.06)] border border-[rgba(212,245,60,0.15)] rounded-xl px-4 py-3 flex items-center justify-between mt-2">
          <span className="text-white/40 text-sm">Total aplicado a facturas</span>
          <span className="font-display font-black text-xl text-[#d4f53c]">{eur(creditos.totalAplicado)}</span>
        </div>
      </Section>

      {/* ── TOP CLIENTES ── */}
      <Section title="Top Clientes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-white/30 text-xs mb-2">Por gasto total</div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <Table
                cols={["Cliente", "Gasto total"]}
                rows={(topClientes.porGasto || []).map((c: any) => [c.email, eur(c.gasto)])}
              />
            </div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-2">Más antiguos</div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <Table
                cols={["Cliente", "Desde"]}
                rows={(topClientes.porAntiguedad || []).map((c: any) => [c.email, new Date(c.antiguedad).toLocaleDateString("es-ES")])}
              />
            </div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-2">Con más pausas</div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              {(topClientes.porPausas || []).length === 0
                ? <p className="text-white/25 text-xs py-1">Ningún cliente ha pausado aún</p>
                : <Table cols={["Cliente", "Pausas"]} rows={(topClientes.porPausas || []).map((c: any) => [c.email, c.pausas])} />
              }
            </div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-2">Más referidos</div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              {(topClientes.porReferidos || []).length === 0
                ? <p className="text-white/25 text-xs py-1">Sin referidos aún</p>
                : <Table cols={["Cliente", "Referidos"]} rows={(topClientes.porReferidos || []).map((c: any) => [c.email, c.referidos])} />
              }
            </div>
          </div>
        </div>
      </Section>

    </div>
  );
}
