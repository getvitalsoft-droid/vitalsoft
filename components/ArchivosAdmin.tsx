"use client";
// components/ArchivosAdmin.tsx
// Panel de archivos para el admin: ver bruto del cliente, subir clips.

import { useState, useEffect } from "react";
import ArchivoUploader from "./ArchivoUploader";

interface Archivo {
  id: string;
  tipo: "bruto" | "clip";
  nombre: string;
  tamanio_bytes: number | null;
  subido_por: string;
  creado_at: string;
  storage_path: string;
}

interface Props {
  orderId: string;
  adminToken: string; // JWT Supabase del admin
  clipsContratados: number;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function ArchivosAdmin({ orderId, adminToken, clipsContratados }: Props) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const authHeader = { "Authorization": `Bearer ${adminToken}` };

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

  const brutos = archivos.filter(a => a.tipo === "bruto");
  const clips = archivos.filter(a => a.tipo === "clip");

  const descargarBruto = (archivoId: string, nombre: string) => {
    const a = document.createElement("a");
    a.href = `/api/archivos/download?id=${archivoId}`;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3">
      {/* Material bruto del cliente */}
      <div>
        <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Material bruto</p>
        {loading && <p className="text-white/20 text-xs">Cargando...</p>}
        {!loading && brutos.length === 0 && (
          <p className="text-white/20 text-xs">El cliente aún no ha subido material.</p>
        )}
        {!loading && brutos.map(bruto => (
          <div key={bruto.id}
            className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" className="text-green-400 flex-shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-white/70 text-xs truncate">{bruto.nombre}</p>
              {bruto.tamanio_bytes && (
                <p className="text-white/25 text-[10px]">{formatBytes(bruto.tamanio_bytes)}</p>
              )}
            </div>
            <button onClick={() => descargarBruto(bruto.id, bruto.nombre)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 border border-white/10 rounded-lg text-white/40 text-[10px] hover:border-white/20 hover:text-white/60 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar
            </button>
          </div>
        ))}
      </div>

      {/* Clips entregados */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/25 text-[10px] uppercase tracking-widest">Clips entregados</p>
          <p className="text-white/25 text-[10px]">{clips.length} / {clipsContratados}</p>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-[#d4f53c] rounded-full transition-all"
            style={{ width: `${Math.min((clips.length / clipsContratados) * 100, 100)}%` }} />
        </div>

        {/* Grid de clips */}
        {clips.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mb-3">
            {clips.map(clip => (
              <div key={clip.id} title={clip.nombre}
                className="aspect-[9/16] bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center justify-center relative group cursor-pointer"
                onClick={() => descargarBruto(clip.id, clip.nombre)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                  className="text-white/20 group-hover:text-white/40 transition-colors">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" className="text-[#d4f53c]">
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subir nuevos clips */}
        <ArchivoUploader
          orderId={orderId}
          tipo="clip"
          authHeader={authHeader}
          onSuccess={() => cargar()}
          label={`Subir clip ${clips.length + 1} de ${clipsContratados}`}
          maxGb={5}
        />
      </div>
    </div>
  );
}
