"use client";
// components/ArchivoUploader.tsx
import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "vitalsoft-archivos";

// Cliente Supabase solo para storage (anon key — el bucket es privado pero las
// signed upload URLs no requieren auth adicional, son autocontenidas)
const sbStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  orderId: string;
  tipo: "bruto" | "clip";
  authHeader: Record<string, string>;
  onSuccess: (archivo: { id: string; nombre: string; storage_path: string }) => void;
  accept?: string;
  maxGb?: number;
  label?: string;
}

export default function ArchivoUploader({
  orderId, tipo, authHeader, onSuccess,
  accept = "video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm",
  maxGb = 10,
  label,
}: Props) {
  const [estado, setEstado] = useState<"idle" | "subiendo" | "confirmando" | "ok" | "error">("idle");
  const [progreso, setProgreso] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subirArchivo = async (file: File) => {
    setEstado("subiendo");
    setProgreso(0);
    setErrorMsg("");

    const maxBytes = maxGb * 1024 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`Archivo demasiado grande. Máximo ${maxGb} GB.`);
      setEstado("error");
      return;
    }

    try {
      // 1. Obtener URL firmada + token de subida
      const urlRes = await fetch("/api/archivos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          order_id: orderId,
          nombre: file.name,
          tipo,
          tamanio_bytes: file.size,
        }),
      });

      if (!urlRes.ok) {
        const err = await urlRes.json();
        throw new Error(err.error || "Error al preparar la subida");
      }

      const { storage_path, token } = await urlRes.json();

      // 2. Subir usando el SDK de Supabase con uploadToSignedUrl
      // (el XHR directo da 400 — la signed upload URL requiere el token del SDK)
      setProgreso(10);

      const { error: uploadError } = await sbStorage.storage
        .from(BUCKET)
        .uploadToSignedUrl(storage_path, token, file, {
          contentType: file.type || "video/mp4",
        });

      if (uploadError) throw new Error(uploadError.message);

      setProgreso(90);
      setEstado("confirmando");

      // 3. Confirmar en la BD
      const confirmRes = await fetch("/api/archivos/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          order_id: orderId,
          storage_path,
          nombre: file.name,
          tipo,
          tamanio_bytes: file.size,
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || "Error al confirmar la subida");
      }

      const { archivo } = await confirmRes.json();
      setProgreso(100);
      setEstado("ok");
      onSuccess(archivo);

    } catch (err: any) {
      setErrorMsg(err.message || "Error inesperado");
      setEstado("error");
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    subirArchivo(file);
  };

  if (estado === "ok") {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-[rgba(100,200,80,0.07)] border border-[rgba(100,200,80,0.2)] rounded-xl">
        <span className="text-green-400 text-sm">✓</span>
        <span className="text-white/50 text-xs">Archivo subido correctamente.</span>
        <button onClick={() => { setEstado("idle"); setProgreso(0); }}
          className="ml-auto text-white/25 text-xs underline hover:text-white/40">Subir otro</button>
      </div>
    );
  }

  return (
    <div>
      {(estado === "idle" || estado === "error") && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all ${
            dragging
              ? "border-[#d4f53c]/40 bg-[rgba(212,245,60,0.04)]"
              : "border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]"
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" className="text-white/30">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div className="text-center">
            <p className="text-white/60 text-sm font-semibold mb-0.5">
              {label || (tipo === "bruto" ? "Sube tu material" : "Subir clip")}
            </p>
            <p className="text-white/25 text-xs">
              Arrastra o haz clic · MP4, MOV, AVI · máx {maxGb} GB
            </p>
          </div>
          {estado === "error" && (
            <p className="text-red-400 text-xs mt-1">{errorMsg}</p>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => handleFile(e.target.files?.[0] || null)} />

      {(estado === "subiendo" || estado === "confirmando") && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white/50 text-xs">
              {estado === "confirmando" ? "Verificando..." : "Subiendo..."}
            </p>
            <p className="text-white/40 text-xs font-mono">{progreso}%</p>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#d4f53c] rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  orderId: string;
  tipo: "bruto" | "clip";
  authHeader: Record<string, string>; // { "x-cliente-token": "..." } o { "Authorization": "Bearer ..." }
  onSuccess: (archivo: { id: string; nombre: string; storage_path: string }) => void;
  accept?: string;
  maxGb?: number;
  label?: string;
}

