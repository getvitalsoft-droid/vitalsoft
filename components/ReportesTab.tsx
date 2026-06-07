"use client";
import { useState, useEffect } from "react";

interface Reporte {
  id: string;
  admin: string;
  accion: string;
  detalle: string;
  created_at: string;
  objetivo_id: string;
}

export default function ReportesTab({ token }: { token: string }) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reportes-agentes", {
      headers: { "x-admin-token": token },
    })
      .then(r => r.json())
      .then(d => { setReportes(d.reportes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-white/30 text-sm py-8 text-center">Cargando reportes...</div>;

  if (!reportes.length) return (
    <div className="text-center py-12 text-white/25 text-sm">
      No hay reportes aún. Los agentes envían sus reportes desde el portal cada lunes.
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-sm">{reportes.length} reportes recibidos</p>
      </div>
      {reportes.map(r => (
        <div key={r.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-white/70 text-sm font-semibold">{r.admin}</span>
            <span className="text-white/25 text-xs flex-shrink-0">
              {new Date(r.created_at).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-white/50 text-sm leading-relaxed whitespace-pre-wrap">{r.detalle}</p>
        </div>
      ))}
    </div>
  );
}
