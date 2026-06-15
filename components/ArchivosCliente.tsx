"use client";
// components/ArchivosCliente.tsx
// Zona de subida de material + galería de clips para el portal /cliente

import { useState, useEffect } from "react";
import ArchivoUploader from "./ArchivoUploader";

interface Archivo {
  id: string;
  tipo: "bruto" | "clip";
  nombre: string;
  tamanio_bytes: number | null;
  creado_at: string;
}

interface Props {
  orderId: string;
  clienteToken: string;
  clipsContratados: number;
  estado: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function ArchivosCliente({ orderId, clienteToken, clipsContratados, estado }: Props) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [descargando, setDescargando] = useState<string | null>(null);
  const authHeader = { "x-cliente-token": clienteToken };

  const cargar = async () => {
    setLoading(true);
    const res = await fetch(`/api/archivos/${orderId}`, { headers: authHeader });
    if (res.ok) {
      const data = await res.json();
      setArchivos(data.archivos || []);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [orderId]);

  const clips = archivos.filter(a => a.tipo === "clip");
  const brutos = archivos.filter(a => a.tipo === "bruto");
  const tieneBruto = brutos.length > 0;
  const puedeSubir = ["onboarding_completado", "esperando_material"].includes(estado);

  const descargar = async (archivoId: string, nombre: string) => {
    setDescargando(archivoId);
    const a = document.createElement("a");
    a.href = `/api/archivos/download?id=${archivoId}`;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDescargando(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Zona de subida de material bruto */}
      {puedeSubir && !tieneBruto && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
          <p className="text-white/60 text-xs font-semibold mb-1">Sube tu material</p>
          <p className="text-white/25 text-xs mb-4 leading-relaxed">
            Sube el vídeo o episodio que quieres convertir en clips. Formatos aceptados: MP4, MOV, AVI, WebM. Máximo 10 GB.
          </p>
          <ArchivoUploader
            orderId={orderId}
            tipo="bruto"
            authHeader={authHeader}
            onSuccess={() => cargar()}
            label="Sube tu vídeo o episodio"
          />
        </div>
      )}

      {/* Material recibido */}
      {tieneBruto && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">✓</span>
            <p className="text-white/50 text-xs">
              Material recibido — estamos produciendo tus clips.
              {brutos[0].tamanio_bytes && (
                <span className="text-white/25"> ({formatBytes(brutos[0].tamanio_bytes)})</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Galería de clips */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/60 text-xs font-semibold">Tus clips</p>
          {clips.length > 0 && (
            <span className="text-white/30 text-xs">{clips.length} / {clipsContratados} este mes</span>
          )}
        </div>

        {/* Barra de progreso */}
        {clipsContratados > 0 && (
          <div className="mb-4">
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4f53c] rounded-full transition-all"
                style={{ width: `${Math.min((clips.length / clipsContratados) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {loading && (
          <p className="text-white/25 text-xs text-center py-6">Cargando...</p>
        )}

        {!loading && clips.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/25 text-xs">
              {tieneBruto
                ? "Estamos editando tus clips. Te avisaremos cuando estén listos."
                : "Aquí aparecerán tus clips cuando estén listos."}
            </p>
          </div>
        )}

        {!loading && clips.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {clips.map(clip => (
              <div key={clip.id}>
                <div className="w-full aspect-[9/16] bg-white/[0.04] border border-white/[0.07] rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group cursor-pointer"
                  onClick={() => descargar(clip.id, clip.nombre)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"
                    className="text-white/20 group-hover:text-white/40 transition-colors">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <p className="text-white/20 text-[9px] px-2 text-center leading-tight group-hover:text-white/35 transition-colors line-clamp-2">
                    {clip.nombre.replace(/\.[^.]+$/, "")}
                  </p>
                  <div className="absolute inset-0 bg-[#d4f53c]/0 group-hover:bg-[#d4f53c]/[0.04] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" className="text-[#d4f53c]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => descargar(clip.id, clip.nombre)}
                  disabled={descargando === clip.id}
                  className="w-full mt-1.5 py-1.5 text-[10px] text-white/30 hover:text-white/50 border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                  {descargando === clip.id ? "Descargando..." : "Descargar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
