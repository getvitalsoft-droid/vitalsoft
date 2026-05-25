"use client";
import { useState, useEffect } from "react";

interface CookiePreferences {
  necesarias: boolean;   // siempre true, no se puede desactivar
  analiticas: boolean;   // Google Analytics
  marketing: boolean;    // futuro uso
}

const COOKIE_KEY = "vs_cookie_consent";

export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(COOKIE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necesarias: true,
    analiticas: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    const consent = getCookieConsent();
    if (!consent) setVisible(true);
    else applyConsent(consent);
  }, []);

  const applyConsent = (p: CookiePreferences) => {
    if (typeof window === "undefined") return;
    // Activar/desactivar Google Analytics según preferencia
    if (p.analiticas) {
      (window as any).gtag?.("consent", "update", {
        analytics_storage: "granted",
      });
    } else {
      (window as any).gtag?.("consent", "update", {
        analytics_storage: "denied",
      });
    }
  };

  const guardar = (p: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(p));
    applyConsent(p);
    setVisible(false);
  };

  const aceptarTodo = () => {
    const all = { necesarias: true, analiticas: true, marketing: true };
    guardar(all);
  };

  const rechazarOpcionales = () => {
    const min = { necesarias: true, analiticas: false, marketing: false };
    guardar(min);
  };

  const guardarPersonalizado = () => guardar(prefs);

  if (!mounted || !visible) return null;

  return (
    <>
      {/* Overlay suave */}
      <div className="fixed inset-0 bg-black/40 z-[998] pointer-events-none" />

      <div className="fixed bottom-0 left-0 right-0 z-[999] px-4 pb-4 md:px-6 md:pb-6">
        <div className="max-w-2xl mx-auto bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-sm mb-1">🍪 Gestión de cookies</h3>
                <p className="text-white/40 text-xs leading-relaxed">
                  Usamos cookies propias y de terceros para analizar el uso de la web. Puedes aceptar todas, rechazar las opcionales o personalizar tu elección.{" "}
                  <a href="/privacidad" className="text-accent underline underline-offset-2">Política de privacidad</a>
                </p>
              </div>
            </div>
          </div>

          {/* Categorías expandibles */}
          {expanded && (
            <div className="px-6 py-4 border-b border-white/[0.06] space-y-3">

              {/* Necesarias */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display font-semibold text-xs mb-0.5">Cookies necesarias</div>
                  <p className="text-white/30 text-xs">Imprescindibles para que la web funcione. No se pueden desactivar.</p>
                </div>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-9 h-5 rounded-full bg-accent/80 flex items-center justify-end px-1 cursor-not-allowed opacity-60">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#080808]" />
                  </div>
                </div>
              </div>

              {/* Analíticas */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display font-semibold text-xs mb-0.5">Cookies analíticas</div>
                  <p className="text-white/30 text-xs">Google Analytics — nos ayuda a entender cómo se usa la web (visitas, páginas vistas). Datos anónimos.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, analiticas: !p.analiticas }))}
                  className={`flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-1 ${prefs.analiticas ? "bg-accent justify-end" : "bg-white/10 justify-start"}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#080808]" />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display font-semibold text-xs mb-0.5">Cookies de marketing</div>
                  <p className="text-white/30 text-xs">Para mostrar anuncios relevantes. Actualmente no utilizamos cookies de marketing.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                  className={`flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-1 ${prefs.marketing ? "bg-accent justify-end" : "bg-white/10 justify-start"}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#080808]" />
                </button>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="px-6 py-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={aceptarTodo}
              className="bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-xs px-4 py-2.5 rounded-lg transition-all">
              Aceptar todas
            </button>
            <button
              onClick={rechazarOpcionales}
              className="bg-white/[0.06] hover:bg-white/10 text-white/60 font-display font-semibold text-xs px-4 py-2.5 rounded-lg transition-all border border-white/10">
              Solo necesarias
            </button>
            {expanded ? (
              <button
                onClick={guardarPersonalizado}
                className="bg-white/[0.06] hover:bg-white/10 text-white/60 font-display font-semibold text-xs px-4 py-2.5 rounded-lg transition-all border border-white/10">
                Guardar preferencias
              </button>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="text-white/30 hover:text-white/50 font-display text-xs px-2 py-2.5 transition-colors underline underline-offset-2">
                Personalizar
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
