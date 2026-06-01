"use client";
// components/VersionChecker.tsx
// Avisa al usuario si hay una nueva versión disponible.
// No recarga automáticamente. No interrumpe pagos.

import { useState, useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export default function VersionChecker() {
  const [showBanner, setShowBanner] = useState(false);
  const initialVersion = useRef<string | null>(null);
  const checkoutActive = useRef(false);
  const pendingShow = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchVersion(): Promise<string | null> {
    try {
      const res = await fetch("/api/version?t=" + Date.now(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      const { version } = await res.json();
      return version as string;
    } catch {
      return null;
    }
  }

  function maybeShow() {
    if (checkoutActive.current) {
      pendingShow.current = true;
    } else {
      setShowBanner(true);
    }
  }

  useEffect(() => {
    // Checkout lifecycle listeners
    const onStart = () => { checkoutActive.current = true; };
    const onEnd = () => {
      checkoutActive.current = false;
      if (pendingShow.current) {
        pendingShow.current = false;
        setShowBanner(true);
      }
    };
    window.addEventListener("vs:checkout:start", onStart);
    window.addEventListener("vs:checkout:end", onEnd);

    // Get initial version first, THEN start polling
    fetchVersion().then(v => {
      if (!v) return;
      initialVersion.current = v;

      // Start polling only after initial version is set
      intervalRef.current = setInterval(async () => {
        const current = await fetchVersion();
        if (!current || !initialVersion.current) return;
        if (current !== initialVersion.current) {
          clearInterval(intervalRef.current!);
          maybeShow();
        }
      }, CHECK_INTERVAL);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("vs:checkout:start", onStart);
      window.removeEventListener("vs:checkout:end", onEnd);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4">
      <div className="bg-[#1a1a1a] border border-[rgba(232,255,71,0.3)] rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
        <RefreshCw size={15} className="text-accent flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium leading-tight">
            Hay una nueva versión disponible
          </p>
          <p className="text-white/35 text-xs mt-0.5">
            Actualiza para evitar errores
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="bg-accent hover:bg-accent-2 text-[#080808] text-xs font-display font-black px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
          >
            Actualizar
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/25 hover:text-white/50 transition-colors p-1"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
