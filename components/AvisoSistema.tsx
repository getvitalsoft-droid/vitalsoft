"use client";
import { useState, useEffect } from "react";

interface Aviso {
  activo: boolean;
  tipo: "info" | "warning" | "error";
  mensaje: string;
}

const COLORES = {
  info:    { bg: "bg-blue-500/10",   border: "border-blue-500/25",   text: "text-blue-300",   icon: "ℹ️" },
  warning: { bg: "bg-yellow-400/10", border: "border-yellow-400/25", text: "text-yellow-300", icon: "⚠️" },
  error:   { bg: "bg-red-500/10",    border: "border-red-500/25",    text: "text-red-300",    icon: "🔴" },
};

export default function AvisoSistema() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    fetch("/api/aviso")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.activo) setAviso(data); })
      .catch(() => {});
  }, []);

  if (!aviso || cerrado) return null;

  const c = COLORES[aviso.tipo];

  return (
    <div className={`w-full ${c.bg} border-b ${c.border} px-4 py-2.5 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm flex-shrink-0">{c.icon}</span>
        <p className={`text-xs leading-relaxed ${c.text}`}>{aviso.mensaje}</p>
      </div>
      <button
        onClick={() => setCerrado(true)}
        className={`flex-shrink-0 ${c.text} opacity-50 hover:opacity-100 text-lg leading-none`}
        aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
