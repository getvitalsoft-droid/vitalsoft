"use client";
// components/VersionChecker.tsx
// Banner de nueva versión disponible.
// Se monta en el layout raíz y comprueba /api/version cada 10 minutos.
// No recarga automáticamente, no interrumpe pagos, solo avisa.

import { useState, useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutos

export default function VersionChecker() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const initialVersion = useRef<string | null>(null);
  // Track if a checkout is in progress to delay showing the banner
  const checkoutActive = useRef(false);
  const pendingUpdate = useRef(false);

  useEffect(() => {
    // Listen for checkout state from StripeCheckout component
    const onCheckoutStart = () => { checkoutActive.current = true; };
    const onCheckoutEnd = () => {
      checkoutActive.current = false;
      if (pendingUpdate.current) {
        setShowBanner(true);
        pendingUpdate.current = false;
      }
    };
    window.addEventListener("vs:checkout:start", onCheckoutStart);
    window.addEventListener("vs:checkout:end", onCheckoutEnd);

    // Fetch initial version
    const fetchVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version } = await res.json();
        return version as string;
      } catch {
        return null;
      }
    };

    // Store initial version
    fetchVersion().then(v => { if (v) initialVersion.current = v; });

    // Check periodically
    const interval = setInterval(async () => {
      if (!initialVersion.current) return;
      const current = await fetchVersion();
      if (!current || current === initialVersion.current) return;

      // New version detected
      if (checkoutActive.current) {
        // Delay until checkout finishes
        pendingUpdate.current = true;
      } else {
        setShowBanner(true);
      }
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      window.removeEventListener("vs:checkout:start", onCheckoutStart);
      window.removeEventListener("vs:checkout:end", onCheckoutEnd);
    };
  }, []);

  if (!showBanner || dismissed) return null;

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
            onClick={() => setDismissed(true)}
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
