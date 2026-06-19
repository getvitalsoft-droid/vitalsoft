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
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { calcPrice } from "@/lib/stripe";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
    clips_mensuales: number | null;
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

// Componente interno de Stripe Elements para actualizar tarjeta
function FormularioPago({ token, clientSecret, onSuccess, onCancel }: {
  token: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setLoading(false); return; }

    const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
      clientSecret,
      { payment_method: { card: cardElement } }
    );

    if (stripeError) {
      setError(stripeError.message || "Error al procesar la tarjeta");
      setLoading(false);
      return;
    }

    // Notificar al backend para establecer el nuevo método como predeterminado
    const res = await fetch("/api/cliente/setup-pago", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-cliente-token": token },
      body: JSON.stringify({ setupIntentId: setupIntent?.id }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json();
      setError(d.error || "Error al actualizar el método de pago");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-white/40 text-xs mb-4 leading-relaxed">Introduce tu nueva tarjeta. La anterior dejará de usarse en los próximos cobros.</p>
      <div className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-3 mb-4">
        <CardElement options={{
          style: {
            base: { color: "#ffffff", fontSize: "14px", "::placeholder": { color: "rgba(255,255,255,0.25)" } },
            invalid: { color: "#f87171" },
          }
        }} />
      </div>
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 py-2.5 border border-white/10 rounded-xl text-white/40 text-sm disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading || !stripe}
          className="flex-1 py-2.5 bg-[#d4f53c] text-[#080808] font-bold text-sm rounded-xl disabled:opacity-40 transition-all">
          {loading ? "Guardando..." : "Actualizar tarjeta"}
        </button>
      </div>
    </form>
  );
}

function ClientePortal({ token, onSessionExpired }: { token: string; onSessionExpired?: () => void }) {
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
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [planClips, setPlanClips] = useState(20);
  const [planLoading, setPlanLoading] = useState(false);
  const [pagoLoading, setPagoLoading] = useState(false);
  const [pagoClientSecret, setPagoClientSecret] = useState("");
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [showClipsModal, setShowClipsModal] = useState(false);
  const [clipsExtra, setClipsExtra] = useState(5);
  const [clipsExtraClientSecret, setClipsExtraClientSecret] = useState("");
  const [clipsExtraModo, setClipsExtraModo] = useState<"unico"|"mensual"|null>(null);
  const [clipsExtraPrecio, setClipsExtraPrecio] = useState(0);
  const [clipsExtraLoading, setClipsExtraLoading] = useState(false);
  const [clipsExtraOk, setClipsExtraOk] = useState(false);
  const [cambioOk, setCambioOk] = useState("");

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
      if (!res.ok) {
        if (onSessionExpired) onSessionExpired();
        setError("Sesión expirada. Solicita un nuevo enlace.");
        return;
      }
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

  const iniciarClipsExtra = async (modo: "unico" | "mensual") => {
    setClipsExtraLoading(true);
    const res = await fetch("/api/cliente/clips-extra", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cliente-token": token },
      body: JSON.stringify({ clips_extra: clipsExtra, modo }),
    });
    const d = await res.json();
    if (res.ok) {
      setClipsExtraClientSecret(d.clientSecret);
      setClipsExtraModo(modo);
      setClipsExtraPrecio(d.precioExtra);
    } else {
      setError(d.error || "Error al procesar");
    }
    setClipsExtraLoading(false);
  };

  const handleCambiarPlan = async () => {
    setPlanLoading(true);
    const res = await fetch("/api/cliente/cambiar-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cliente-token": token },
      body: JSON.stringify({ clips: planClips }),
    });
    const d = await res.json();
    if (res.ok) {
      setCambioOk(`Plan actualizado a ${d.plan} (€${d.precio}/mes). Efectivo desde el próximo ciclo.`);
      setShowPlanModal(false);
      await loadData();
    } else {
      setError(d.error || "Error al cambiar el plan");
    }
    setPlanLoading(false);
  };

  const iniciarCambioPago = async () => {
    setPagoLoading(true);
    const res = await fetch("/api/cliente/setup-pago", {
      method: "POST",
      headers: { "x-cliente-token": token },
    });
    const d = await res.json();
    if (res.ok) {
      setPagoClientSecret(d.clientSecret);
      setShowPagoModal(true);
    } else {
      setError(d.error || "Error al iniciar el proceso");
    }
    setPagoLoading(false);
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

          {/* Material — Drive */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
            <p className="text-white/60 text-xs font-semibold mb-1">Tu carpeta de entrega</p>
            <p className="text-white/25 text-xs mb-4 leading-relaxed">
              Todo tu material y tus clips se gestionan a través de Google Drive. Aquí tienes las instrucciones para empezar.
            </p>

            {/* Instrucciones en accordion */}
            <details className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden group mb-4">
              <summary className="px-4 py-3 cursor-pointer flex items-center justify-between list-none">
                <p className="text-white/50 text-xs font-semibold">¿Cómo funciona el Drive compartido?</p>
                <span className="text-white/30 text-xs ml-3 flex-shrink-0 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                {[
                  { num: "1", texto: "Accede a tu carpeta compartida de Google Drive con el botón de abajo.", img: "/onboarding/drive-paso1.png", alt: "Acceder a Drive" },
                  { num: "2", texto: "Cuando tengas material listo, súbelo a la carpeta. Puedes subir archivos de vídeo de cualquier formato y tamaño.", img: "/onboarding/drive-paso2.png", alt: "Subir material" },
                  { num: "3", texto: "Nosotros procesamos tu material y subimos los clips terminados a la misma carpeta, en una subcarpeta llamada 'Clips'.", img: "/onboarding/drive-paso3.png", alt: "Recibir clips" },
                  { num: "4", texto: "Te avisamos por email cuando tus clips estén listos. Puedes descargarlos directamente desde Drive.", img: "/onboarding/drive-paso4.png", alt: "Descargar clips" },
                ].map((paso) => (
                  <div key={paso.num} className="p-4">
                    <div className="flex gap-3 items-start mb-3">
                      <span className="text-[#d4f53c] font-display font-black text-sm flex-shrink-0 w-5">{paso.num}.</span>
                      <p className="text-white/50 text-xs leading-relaxed">{paso.texto}</p>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-white/[0.06] ml-8">
                      <img src={paso.img} alt={paso.alt} className="w-full h-auto object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {order.driveFolder ? (
              <a href={order.driveFolder} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-bold text-sm rounded-xl px-4 py-3 transition-all">
                <ExternalLink size={14} />
                Abrir mi carpeta de Drive
              </a>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
                <p className="text-white/30 text-xs">Tu carpeta se asignará en breve. Te avisaremos por email.</p>
              </div>
            )}
          </div>



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
            Compártelo. Si alguien contrata usando tu link, recibes <span className="text-white/70 font-semibold">crédito del 20%</span> de su primer pago en tu próxima factura.
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

            {/* Clips extra */}
            <button onClick={() => setShowClipsModal(true)}
              className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-[rgba(212,245,60,0.3)] hover:bg-[rgba(212,245,60,0.04)] rounded-xl px-4 py-3 text-left transition-all">
              <Gift size={15} className="text-[#d4f53c] flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white/80">Comprar clips extra</div>
                <div className="text-xs text-white/30">Añade clips este mes, pago único o ampliando tu plan</div>
              </div>
            </button>

            {/* Cambiar plan */}
            <button onClick={() => { setPlanClips(order.clips_mensuales || 20); setShowPlanModal(true); }}
              className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-[rgba(212,245,60,0.3)] hover:bg-[rgba(212,245,60,0.04)] rounded-xl px-4 py-3 text-left transition-all">
              <ChevronDown size={15} className="text-[#d4f53c] flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white/80">Cambiar plan</div>
                <div className="text-xs text-white/30">Ajusta el número de clips mensuales</div>
              </div>
            </button>

            {/* Método de pago */}
            <button onClick={iniciarCambioPago} disabled={pagoLoading}
              className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-blue-400/30 hover:bg-blue-400/5 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50">
              <Gift size={15} className="text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white/80">Actualizar método de pago</div>
                <div className="text-xs text-white/30">Cambia tu tarjeta de crédito</div>
              </div>
            </button>

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

        {cambioOk && (
          <div className="bg-[rgba(212,245,60,0.06)] border border-[rgba(212,245,60,0.2)] rounded-xl px-4 py-3 text-xs text-[#d4f53c] text-center">
            ✓ {cambioOk}
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-6">
          ¿Problemas? Escríbenos a{" "}
          <a href={`mailto:hola@vitalsoft.pro?subject=Ayuda con mi pedido&body=Hola, soy ${data?.email || "cliente"} y necesito ayuda con mi pedido (Plan: ${order?.plan || ""}).%0A%0AMi consulta es:%0A`} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-accent transition-colors">
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

      {/* Modal clips extra */}
      {showClipsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!clipsExtraLoading) { setShowClipsModal(false); setClipsExtraClientSecret(""); setClipsExtraModo(null); setClipsExtraOk(false); } }} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm z-10">

            {clipsExtraOk ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✅</div>
                <p className="text-white/60 text-sm mb-1">
                  {clipsExtraModo === "mensual" ? "Clips añadidos y plan actualizado." : "Clips extra adquiridos."}
                </p>
                <p className="text-white/30 text-xs">Los clips estarán disponibles en breve.</p>
                <button onClick={() => { setShowClipsModal(false); setClipsExtraOk(false); setClipsExtraClientSecret(""); setClipsExtraModo(null); loadData(); }}
                  className="mt-4 w-full py-2.5 bg-[#d4f53c] text-[#080808] font-bold text-sm rounded-xl">Cerrar</button>
              </div>
            ) : clipsExtraClientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret: clipsExtraClientSecret, appearance: { theme: "night", variables: { colorPrimary: "#d4f53c", colorBackground: "#111111", colorText: "#ffffff", borderRadius: "8px" } } }}>
                <FormularioPago
                  token={token}
                  clientSecret={clipsExtraClientSecret}
                  onSuccess={() => setClipsExtraOk(true)}
                  onCancel={() => { setClipsExtraClientSecret(""); setClipsExtraModo(null); }}
                />
              </Elements>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg mb-1">Clips extra</h3>
                <p className="text-white/40 text-xs mb-5 leading-relaxed">Añade clips adicionales este mes. Elige cuántos necesitas y si quieres que sea un pago único o que tu plan cambie a partir del próximo mes.</p>

                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/50 text-xs">Clips adicionales</span>
                    <span className="text-[#d4f53c] font-display font-bold text-lg">{clipsExtra}</span>
                  </div>
                  <input type="range" min={1} max={50} value={clipsExtra}
                    onChange={e => setClipsExtra(Number(e.target.value))}
                    className="w-full accent-[#d4f53c]" />
                  <div className="flex justify-between text-white/20 text-[10px] mt-1">
                    <span>1</span><span>25</span><span>50</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button onClick={() => iniciarClipsExtra("unico")} disabled={clipsExtraLoading}
                    className="w-full flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-40">
                    <div>
                      <p className="text-white/70 text-sm font-semibold">Pago único</p>
                      <p className="text-white/30 text-xs">Solo este mes, sin cambios en tu suscripción</p>
                    </div>
                    <span className="text-[#d4f53c] font-bold text-sm flex-shrink-0 ml-3">
                      €{Math.round((calcPrice(order?.clips_mensuales || 20) / (order?.clips_mensuales || 20)) * clipsExtra)}
                    </span>
                  </button>

                  <button onClick={() => iniciarClipsExtra("mensual")} disabled={clipsExtraLoading}
                    className="w-full flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-40">
                    <div>
                      <p className="text-white/70 text-sm font-semibold">Ampliar plan mensual</p>
                      <p className="text-white/30 text-xs">Este mes + a partir del próximo, {(order?.clips_mensuales || 20) + clipsExtra} clips/mes</p>
                    </div>
                    <span className="text-[#d4f53c] font-bold text-sm flex-shrink-0 ml-3">
                      €{Math.round((calcPrice(order?.clips_mensuales || 20) / (order?.clips_mensuales || 20)) * clipsExtra)}
                    </span>
                  </button>
                </div>

                {clipsExtraLoading && <p className="text-white/30 text-xs text-center mt-3">Preparando pago...</p>}
                <button onClick={() => setShowClipsModal(false)} className="w-full mt-3 py-2 text-white/20 text-xs">Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal cambiar plan */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm z-10">
            <h3 className="font-display font-bold text-lg mb-1">Cambiar plan</h3>
            <p className="text-white/40 text-xs mb-5 leading-relaxed">El cambio se aplica desde el próximo ciclo de facturación. Sin cancelaciones ni reembolsos.</p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/50 text-xs">Clips mensuales</span>
                <span className="text-[#d4f53c] font-display font-bold text-lg">{planClips}</span>
              </div>
              <input type="range" min={1} max={100} value={planClips}
                onChange={e => setPlanClips(Number(e.target.value))}
                className="w-full accent-[#d4f53c]" />
              <div className="flex justify-between text-white/20 text-[10px] mt-1">
                <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
              <span className="text-white/50 text-sm">{planClips} clips/mes</span>
              <span className="text-white font-bold text-lg">€{Math.round(calcPrice(planClips))}/mes</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowPlanModal(false)} className="flex-1 py-2.5 border border-white/10 rounded-xl text-white/40 text-sm">Cancelar</button>
              <button onClick={handleCambiarPlan} disabled={planLoading || planClips === (order?.clips_mensuales || 20)}
                className="flex-1 py-2.5 bg-[#d4f53c] text-[#080808] font-bold text-sm rounded-xl disabled:opacity-40 transition-all">
                {planLoading ? "Guardando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal método de pago con Stripe Elements */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!pagoLoading) { setShowPagoModal(false); setPagoConfirmado(false); setPagoClientSecret(""); } }} />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm z-10">
            <h3 className="font-display font-bold text-lg mb-1">Actualizar tarjeta</h3>
            {pagoConfirmado ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✅</div>
                <p className="text-white/60 text-sm">Tarjeta actualizada correctamente.</p>
                <button onClick={() => { setShowPagoModal(false); setPagoConfirmado(false); setPagoClientSecret(""); }}
                  className="mt-4 w-full py-2.5 bg-[#d4f53c] text-[#080808] font-bold text-sm rounded-xl">Cerrar</button>
              </div>
            ) : pagoClientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret: pagoClientSecret, appearance: { theme: "night", variables: { colorPrimary: "#d4f53c", colorBackground: "#111111", colorText: "#ffffff", borderRadius: "8px" } } }}>
                <FormularioPago
                  token={token}
                  clientSecret={pagoClientSecret}
                  onSuccess={() => { setPagoConfirmado(true); setCambioOk("Método de pago actualizado correctamente."); }}
                  onCancel={() => { setShowPagoModal(false); setPagoClientSecret(""); }}
                />
              </Elements>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="animate-spin text-white/30 mx-auto" size={24} />
                <p className="text-white/30 text-xs mt-2">Preparando formulario...</p>
              </div>
            )}
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
  const [sesionEnOtraPestana, setSesionEnOtraPestana] = useState(false);

  // Detectar si el enlace se abrió en otra pestaña
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vs_cliente_token" && e.newValue) {
        setSesionEnOtraPestana(true);
        setTimeout(() => { try { window.close(); } catch {} }, 1500);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
        {sesionEnOtraPestana ? (
          <>
            <div className="text-5xl mb-6">✅</div>
            <h2 className="font-display font-black text-xl mb-3">Ya iniciaste sesión</h2>
            <p className="text-white/40 text-sm">Abriste el enlace en otra pestaña. Puedes cerrar esta.</p>
            <button onClick={() => window.close()} className="mt-4 text-white/25 text-xs underline hover:text-white/40">Cerrar esta pestaña</button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">📧</div>
            <h2 className="font-display font-black text-xl mb-3">Revisa tu email</h2>
            <p className="text-white/40 text-sm">
              Si tienes una cuenta activa, recibirás un enlace de acceso en{" "}
              <strong className="text-white/60">{email}</strong>.<br/>
              Caduca en 1 hora.
            </p>
          </>
        )}
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
            className="w-full py-3 px-4 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace →"}
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
  const [token, setToken] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Leer token de la URL — en el cliente, searchParams ya está disponible
    const urlToken = searchParams.get("token");
    if (urlToken) {
      window.localStorage.setItem("vs_cliente_token", urlToken);
      setTimeout(() => window.history.replaceState({}, "", "/cliente"), 100);
      setToken(urlToken);
    } else {
      // Sin token en URL — recuperar sesión guardada (1h)
      const saved = window.localStorage.getItem("vs_cliente_token");
      if (saved) setToken(saved);
    }
    setListo(true);
  }, [searchParams]);

  // Esperar a que el efecto haya corrido antes de decidir qué mostrar
  if (!listo) return null;
  if (!token) return <ClienteLogin />;
  return <ClientePortal token={token} onSessionExpired={() => {
    window.localStorage.removeItem("vs_cliente_token");
    setToken(null);
  }} />;
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
