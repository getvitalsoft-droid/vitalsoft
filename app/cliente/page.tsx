"use client";
// app/cliente/page.tsx
// Portal de cliente — magic link, sin contraseña.
// Mismo diseño que el resto de la web.

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Copy, Check, Pause, Play, X, ExternalLink,
  ChevronDown, Gift, AlertCircle, Loader2
} from "lucide-react";

// ─── Tipos ──────────────────────────────────────────────────

interface CreditItem {
  id: string;
  amount?: number;
  credit_amount?: number;
  milestone?: string;
  reason?: string;
  referred_email?: string;
  status: string;
  created_at: string;
}

interface PortalData {
  email: string;
  order: {
    id: string;
    plan: string;
    importe: number;
    estado: string;
    estadoLabel: string;
    driveFolder: string | null;
    is_paused: boolean;
    pause_until: string | null;
    stripe_subscription_id: string | null;
    notas_cliente: string | null;
    fecha_pago: string;
    review_completions: number;
  };
  showReviewBanner: boolean;
  reviewUrl: string;
  creditos: {
    total: number;
    loyalty: CreditItem[];
    service: CreditItem[];
    referrals: CreditItem[];
  };
  refLink: string;
}

const ESTADO_COLOR: Record<string, string> = {
  onboarding_pendiente: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  esperando_material: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  material_recibido: "bg-blue-400/10 text-blue-500 border-blue-400/20",
  material_invalido: "bg-red-400/10 text-red-400 border-red-400/20",
  validado: "bg-teal-400/10 text-teal-400 border-teal-400/20",
  en_edicion: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  revision: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  completado: "bg-green-400/10 text-green-400 border-green-400/20",
  pausado: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  cancelado: "bg-white/5 text-white/20 border-white/10",
};

// ─── Portal principal ────────────────────────────────────────

function ClientePortal({ token }: { token: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [copied, setCopied] = useState(false);
  const [showPausaModal, setShowPausaModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoPausa, setMotivoPausa] = useState("");
  const [motivoCancel, setMotivoCancel] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState("");
  const [showCredits, setShowCredits] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState("");

  const headers = { "Content-Type": "application/json", "x-cliente-token": token };

  const loadData = useCallback(async () => {
    // Detectar cookies deshabilitadas antes de hacer la llamada
    if (typeof navigator !== "undefined" && !navigator.cookieEnabled) {
      setError("cookies_disabled");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/cliente/portal", { headers: { "x-cliente-token": token } });
      if (!res.ok) { setError("Sesión expirada. Solicita un nuevo enlace."); return; }
      setData(await res.json());
    } catch { setError("Error de conexión"); }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const copyRef = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const dismissReview = async () => {
    setReviewDismissed(true);
    // Mark as shown so it doesn't appear again until next completion
    await fetch("/api/cliente/review-shown", {
      method: "POST",
      headers,
    }).catch(() => {});
  };

  const handlePausa = async (accion: "pausar" | "reactivar") => {
    setActionLoading(true);
    const res = await fetch("/api/cliente/pausar", {
      method: "POST",
      headers,
      body: JSON.stringify({ accion, motivo: motivoPausa }),
    });
    const json = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setShowPausaModal(false);
      setMotivoPausa("");
      setActionDone(accion === "pausar" ? "Suscripción pausada correctamente." : "Suscripción reactivada.");
      await loadData();
    } else {
      setActionDone(`Error: ${json.error}`);
    }
  };

  const handleCancelar = async () => {
    if (confirmCancel.toLowerCase() !== "cancelar") return;
    setActionLoading(true);
    const res = await fetch("/api/cliente/cancelar", {
      method: "POST",
      headers,
      body: JSON.stringify({ motivo: motivoCancel }),
    });
    const json = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setShowCancelModal(false);
      setActionDone(`Cancelación confirmada. Tu acceso sigue activo hasta ${json.activo_hasta}.`);
      await loadData();
    } else {
      setActionDone(`Error: ${json.error}`);
    }
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  if (error === "cookies_disabled") return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-5">🍪</div>
        <h2 className="font-display font-bold text-xl mb-3 text-white">Activa las cookies para continuar</h2>
        <p className="text-white/45 text-sm leading-relaxed mb-6">
          Tu navegador tiene las cookies bloqueadas. El portal de cliente necesita cookies para verificar tu sesión de forma segura.
        </p>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-left text-xs text-white/35 space-y-2 mb-6">
          <p className="text-white/55 font-semibold mb-2">Cómo activarlas:</p>
          <p>· <strong className="text-white/50">Chrome / Edge:</strong> Configuración → Privacidad → Cookies → Permitir todas</p>
          <p>· <strong className="text-white/50">Firefox:</strong> Ajustes → Privacidad → Protección estándar</p>
          <p>· <strong className="text-white/50">Safari:</strong> Preferencias → Privacidad → desactiva "Bloquear todas las cookies"</p>
        </div>
        <button onClick={() => window.location.reload()}
          className="bg-accent text-[#080808] font-display font-black px-6 py-3 rounded-xl text-sm hover:bg-accent-2 transition-all">
          Reintentar →
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="mx-auto mb-4 text-red-400" size={40} />
        <p className="text-white/60 mb-6">{error}</p>
        <a href="/cliente" className="text-accent font-bold text-sm hover:underline">
          Solicitar nuevo enlace →
        </a>
      </div>
    </div>
  );

  if (!data) return null;

  const { order, creditos, refLink } = data;
  const canPause = !["cancelado"].includes(order.estado);
  const canCancel = order.estado !== "cancelado";
  const pauseUntilStr = order.pause_until
    ? new Date(order.pause_until).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : null;

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-display font-black text-xl">
              <span className="text-accent">Vital</span>Soft
            </div>
            <p className="text-white/30 text-xs mt-0.5">{data.email}</p>
          </div>
          <a href="/" className="text-white/20 text-xs hover:text-white/40 transition-colors">
            ← Inicio
          </a>
        </div>

        {/* Banner de reseña */}
        {data.showReviewBanner && !reviewDismissed && (
          <div className="mb-4 bg-[#111] border border-accent/25 rounded-2xl p-5 relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
            <button
              onClick={dismissReview}
              className="absolute top-3 right-3 text-white/20 hover:text-white/50 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
            <div className="relative">
              <div className="text-xl mb-2">⭐</div>
              <p className="font-display font-bold text-sm text-white/90 mb-1">
                {order.review_completions === 1
                  ? "¿Qué tal tu primer mes?"
                  : `¿Qué tal llevas ${order.review_completions} meses?`}
              </p>
              <p className="text-white/40 text-xs mb-4 leading-relaxed">
                Si el servicio te está funcionando bien, ¿nos dejas una reseña rápida?<br />
                Ayuda a otros creadores a tomar su decisión. Tarda menos de 1 minuto.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={data.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismissReview}
                  className="flex-1 text-center py-2.5 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-xs rounded-xl transition-all"
                >
                  Dejar reseña →
                </a>
                <button
                  onClick={dismissReview}
                  className="text-white/25 text-xs hover:text-white/50 transition-colors whitespace-nowrap"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de acción */}
        {actionDone && (
          <div className="mb-4 bg-green-400/10 border border-green-400/20 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <Check size={14} /> {actionDone}
          </div>
        )}

        {/* Card estado del plan */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-white/40 text-xs mb-1">Tu plan</div>
              <div className="font-display font-black text-xl">{order.plan}</div>
              <div className="text-accent font-bold">€{Number(order.importe).toFixed(0)}/mes</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ESTADO_COLOR[order.estado] || "bg-white/5 text-white/40 border-white/10"}`}>
              {order.estadoLabel}
            </span>
          </div>

          {/* Pausa activa */}
          {order.is_paused && pauseUntilStr && (
            <div className="bg-yellow-400/8 border border-yellow-400/20 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-300">
              ⏸ Pausada hasta el <strong>{pauseUntilStr}</strong>. Sin cobros hasta entonces.
            </div>
          )}

          {/* Drive */}
          {order.driveFolder && (
            <a
              href={order.driveFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all mb-4"
            >
              <ExternalLink size={14} />
              Abrir mi carpeta Drive
            </a>
          )}

          {/* Nota del admin (si la hay) */}
          {order.notas_cliente && (
            <div className="bg-blue-400/8 border border-blue-400/20 rounded-xl px-4 py-3 text-sm text-blue-300">
              💬 {order.notas_cliente}
            </div>
          )}
        </div>

        {/* Créditos disponibles */}
        {creditos.total > 0 && (
          <div className="bg-accent/8 border border-accent/20 rounded-2xl p-4 mb-4">
            <button
              onClick={() => setShowCredits(!showCredits)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Gift size={16} className="text-accent" />
                <div>
                  <div className="font-bold text-accent text-sm">
                    €{creditos.total.toFixed(0)} de crédito disponible
                  </div>
                  <div className="text-white/30 text-xs">
                    Se descuenta automáticamente de tu próxima factura
                  </div>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-white/30 transition-transform ${showCredits ? "rotate-180" : ""}`}
              />
            </button>

            {showCredits && (
              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                {creditos.loyalty.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-white/50">
                    <span>🎖 Antigüedad {c.milestone?.replace("_", " ")}</span>
                    <span className="text-accent font-bold">+€{Number(c.amount).toFixed(0)}</span>
                  </div>
                ))}
                {creditos.service.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-white/50">
                    <span>💳 {c.reason}</span>
                    <span className="text-accent font-bold">+€{Number(c.amount).toFixed(0)}</span>
                  </div>
                ))}
                {creditos.referrals.filter(r => r.status === "disponible").map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs text-white/50">
                    <span>🤝 Referido: {r.referred_email}</span>
                    <span className="text-accent font-bold">+€{Number(r.credit_amount).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Link de referido */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-white/70">🤝 Tu link de referido</span>
          </div>
          <p className="text-white/30 text-xs mb-3">
            Compártelo. Si alguien contrata, recibes crédito para tu siguiente mensualidad.
          </p>
          <button
            onClick={copyRef}
            className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-xl px-4 py-2.5 transition-all"
          >
            <span className="text-white/40 text-xs font-mono truncate">{refLink}</span>
            {copied
              ? <Check size={14} className="text-green-400 flex-shrink-0" />
              : <Copy size={14} className="text-white/30 flex-shrink-0" />
            }
          </button>
        </div>

        {/* Acciones */}
        {canPause || canCancel ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
            <div className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">
              Gestionar suscripción
            </div>

            {canPause && !order.is_paused && (
              <button
                onClick={() => setShowPausaModal(true)}
                className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-yellow-400/30 hover:bg-yellow-400/5 rounded-xl px-4 py-3 text-left transition-all"
              >
                <Pause size={15} className="text-yellow-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white/80">Pausar 30 días</div>
                  <div className="text-xs text-white/30">Sin cobros mientras dura la pausa</div>
                </div>
              </button>
            )}

            {order.is_paused && (
              <button
                onClick={() => handlePausa("reactivar")}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-green-400/30 hover:bg-green-400/5 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50"
              >
                <Play size={15} className="text-green-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white/80">Reactivar ahora</div>
                  <div className="text-xs text-white/30">Retomar antes de los 30 días</div>
                </div>
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-red-400/30 hover:bg-red-400/5 rounded-xl px-4 py-3 text-left transition-all"
              >
                <X size={15} className="text-red-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white/70">Cancelar suscripción</div>
                  <div className="text-xs text-white/30">Sigues activo hasta el final del período</div>
                </div>
              </button>
            )}
          </div>
        ) : null}

        <p className="text-center text-white/20 text-xs mt-6">
          ¿Problemas? Escríbenos a{" "}
          <a href={`mailto:hola@vitalsoft.pro?subject=Ayuda con mi pedido&body=Hola, soy ${data?.email || "cliente"} y necesito ayuda con mi pedido (Plan: ${order?.plan || ""}).%0A%0AMi consulta es:%0A`} className="text-white/40 hover:text-accent transition-colors">
            hola@vitalsoft.pro
          </a>
        </p>
      </div>

      {/* Modal pausa */}
      {showPausaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg mb-1">Pausar 30 días</h3>
            <p className="text-white/40 text-sm mb-4">
              No se generarán cobros ni entregas durante la pausa. Puedes reactivar antes si quieres.
            </p>
            <textarea
              rows={2}
              placeholder="Motivo (opcional) — nos ayuda a mejorar"
              value={motivoPausa}
              onChange={e => setMotivoPausa(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowPausaModal(false)} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">
                Cancelar
              </button>
              <button
                onClick={() => handlePausa("pausar")}
                disabled={actionLoading}
                className="flex-1 py-2 bg-yellow-400 text-[#080808] rounded-lg font-bold text-sm disabled:opacity-50"
              >
                {actionLoading ? "..." : "Pausar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg mb-1 text-red-400">Cancelar suscripción</h3>
            <p className="text-white/40 text-sm mb-4">
              Seguirás activo hasta el final del período que ya has pagado. No se hará ningún cobro más.
            </p>
            <div className="mb-3">
              <label className="text-xs text-white/30 mb-1.5 block">Motivo (opcional)</label>
              <textarea
                rows={2}
                placeholder="¿Por qué cancelas? Nos ayuda a mejorar."
                value={motivoCancel}
                onChange={e => setMotivoCancel(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-white/30 mb-1.5 block">
                Escribe <strong className="text-white/60">cancelar</strong> para confirmar
              </label>
              <input
                type="text"
                placeholder="cancelar"
                value={confirmCancel}
                onChange={e => setConfirmCancel(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowCancelModal(false); setConfirmCancel(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">
                Volver
              </button>
              <button
                onClick={handleCancelar}
                disabled={actionLoading || confirmCancel.toLowerCase() !== "cancelar"}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-sm disabled:opacity-40"
              >
                {actionLoading ? "..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Login ───────────────────────────────────────────────────

function ClienteLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      await fetch("/api/cliente-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  if (sent) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-6">📧</div>
        <h2 className="font-display font-black text-xl mb-3">Revisa tu email</h2>
        <p className="text-white/40 text-sm">
          Si tienes una cuenta activa, recibirás un enlace de acceso en{" "}
          <strong className="text-white/60">{email}</strong>.<br/>
          Caduca en 1 hora.
        </p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-black text-2xl mb-1">
            <span className="text-accent">Vital</span>Soft
          </div>
          <p className="text-white/40 text-sm">Accede a tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Tu email</label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {loading ? "Enviando..." : "Enviar enlace de acceso →"}
          </button>
          <p className="text-white/20 text-xs text-center">
            Sin contraseña. Te enviamos un enlace directo.
          </p>
        </form>
      </div>
    </main>
  );
}

// ─── Wrapper con token de URL ─────────────────────────────────

function ClientePageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) return <ClientePortal token={token} />;
  return <ClienteLogin />;
}

export default function ClientePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    }>
      <ClientePageInner />
    </Suspense>
  );
}
