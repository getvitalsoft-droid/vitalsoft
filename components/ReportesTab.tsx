"use client";
import { useState, useEffect } from "react";

interface Reporte {
  id: string;
  admin: string;
  detalle: string;
  created_at: string;
  objetivo_id: string;
}

interface ReportesPorAgente {
  email: string;
  reportes: Reporte[];
}

export default function ReportesTab({ token }: { token: string }) {
  const [datos, setDatos] = useState<ReportesPorAgente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [vista, setVista] = useState<"agentes" | "recientes">("agentes");

  useEffect(() => {
    fetch("/api/admin/reportes-agentes", { headers: { "x-admin-token": token } })
      .then(r => r.json())
      .then(d => {
        // Agrupar por agente
        const mapa: Record<string, Reporte[]> = {};
        for (const r of (d.reportes || [])) {
          if (!mapa[r.admin]) mapa[r.admin] = [];
          mapa[r.admin].push(r);
        }
        const agrupados = Object.entries(mapa)
          .map(([email, reportes]) => ({ email, reportes }))
          .sort((a, b) => {
            const ultimaA = new Date(a.reportes[0]?.created_at || 0).getTime();
            const ultimaB = new Date(b.reportes[0]?.created_at || 0).getTime();
            return ultimaB - ultimaA;
          });
        setDatos(agrupados);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const totalReportes = datos.reduce((sum, a) => sum + a.reportes.length, 0);

  if (loading) return <div className="text-white/30 text-sm py-8 text-center">Cargando reportes...</div>;

  if (!totalReportes) return (
    <div className="text-center py-12 text-white/25 text-sm">
      No hay reportes aún. Los agentes envían sus reportes cada lunes desde el portal.
    </div>
  );

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-sm">{totalReportes} reportes de {datos.length} agente{datos.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
          {(["agentes", "recientes"] as const).map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`text-xs px-3 py-1.5 rounded font-semibold transition-all ${vista === v ? "bg-[#d4f53c] text-[#080808]" : "text-white/30 hover:text-white/60"}`}>
              {v === "agentes" ? "Por agente" : "Más recientes"}
            </button>
          ))}
        </div>
      </div>

      {/* Vista por agente */}
      {vista === "agentes" && (
        <div className="space-y-2">
          {datos.map(({ email, reportes }) => (
            <div key={email} className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandido(expandido === email ? null : email)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
                <div>
                  <span className="text-white/70 text-sm font-semibold">{email}</span>
                  <span className="text-white/25 text-xs ml-3">{reportes.length} reporte{reportes.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/25 text-xs">
                    Último: {new Date(reportes[0].created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span className={`text-white/30 text-xs transition-transform ${expandido === email ? "rotate-180" : ""}`}>▼</span>
                </div>
              </button>
              {expandido === email && (
                <div className="border-t border-white/[0.05] divide-y divide-white/[0.04]">
                  {reportes.map(r => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="text-white/25 text-xs mb-1.5">
                        {new Date(r.created_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {new Date(r.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed whitespace-pre-wrap">{r.detalle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vista más recientes — lista plana */}
      {vista === "recientes" && (
        <div className="space-y-3">
          {datos
            .flatMap(a => a.reportes.map(r => ({ ...r, email: a.email })))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 50)
            .map(r => (
              <div key={r.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-white/60 text-sm font-semibold">{r.email}</span>
                  <span className="text-white/25 text-xs flex-shrink-0">
                    {new Date(r.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed whitespace-pre-wrap">{r.detalle}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
