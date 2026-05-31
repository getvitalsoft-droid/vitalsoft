"use client";
// Renderiza el portal de cliente con datos ficticios para preview

import { useState } from "react";
import {
  Copy, Check, Pause, Play, X, ExternalLink,
  ChevronDown, Gift, Loader2
} from "lucide-react";

const MOCK_DATA = {
  email: "airam@ejemplo.com",
  order: {
    id: "preview-123",
    plan: "Growth · 20 clips/mes",
    importe: 250,
    estado: "en_edicion",
    estadoLabel: "En edición",
    driveFolder: null,
    is_paused: false,
    pause_until: null,
    stripe_subscription_id: "sub_preview",
    notas_cliente: null,
    fecha_pago: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  creditos: {
    total: 60,
    loyalty: [{ id: "l1", milestone: "3_meses", amount: 10, status: "disponible", created_at: new Date().toISOString() }],
    service: [{ id: "s1", amount: 50, reason: "Retraso en entrega del lote de abril", status: "disponible", created_at: new Date().toISOString() }],
    referrals: [],
  },
  refLink: "https://vitalsoft.pro?client_ref=AIRAM4X2",
};

const ESTADO_COLOR: Record<string, string> = {
  en_edicion: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  esperando_material: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  completado: "bg-green-400/10 text-green-400 border-green-400/20",
  pausado: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
};

export default function ClientePreviewClient() {
  // Check access key client-side
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    // Allow if key matches OR if running on localhost
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocal && !key) {
      // No key provided — redirect to home
      window.location.href = "/";
      return null;
    }
  }

  const data = MOCK_DATA;
  const { order, creditos, refLink } = data;

  const [copied, setCopied] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showPausaModal, setShowPausaModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [actionDone, setActionDone] = useState("");

  const copyRef = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      {/* Banner de preview */}
      <div className="max-w-lg mx-auto mb-4">
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 text-xs text-accent text-center font-medium">
          👁 Modo preview — datos ficticios para revisión del diseño
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-display font-black text-xl">
              <span className="text-accent">Vital</span>Soft
            </div>
            <p className="text-white/30 text-xs mt-0.5">{data.email}</p>
          </div>
          <a href="/" className="text-white/20 text-xs hover:text-white/40 transition-colors">← Inicio</a>
        </div>

        {/* Mensaje de acción */}
        {actionDone && (
          <div className="mb-4 bg-green-400/10 border border-green-400/20 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <Check size={14} /> {actionDone}
          </div>
        )}

        {/* Card estado */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-white/40 text-xs mb-1">Tu plan</div>
              <div className="font-display font-black text-xl">{order.plan}</div>
              <div className="text-accent font-bold">€{order.importe}/mes</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ESTADO_COLOR[order.estado] || "bg-white/5 text-white/40 border-white/10"}`}>
              {order.estadoLabel}
            </span>
          </div>

          {isPaused && (
            <div className="bg-yellow-400/8 border border-yellow-400/20 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-300">
              ⏸ Pausada hasta el 30 jun 2026. Sin cobros hasta entonces.
            </div>
          )}

          <button className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all w-full mb-2">
            <ExternalLink size={14} />
            Abrir mi carpeta Drive
          </button>
        </div>

        {/* Créditos */}
        {creditos.total > 0 && (
          <div className="bg-accent/8 border border-accent/20 rounded-2xl p-4 mb-4">
            <button onClick={() => setShowCredits(!showCredits)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift size={16} className="text-accent" />
                <div>
                  <div className="font-bold text-accent text-sm">€{creditos.total} de crédito disponible</div>
                  <div className="text-white/30 text-xs">Se descuenta automáticamente de tu próxima factura</div>
                </div>
              </div>
              <ChevronDown size={16} className={`text-white/30 transition-transform ${showCredits ? "rotate-180" : ""}`} />
            </button>

            {showCredits && (
              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                {creditos.loyalty.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-white/50">
                    <span>🎖 Antigüedad {c.milestone.replace("_", " ")}</span>
                    <span className="text-accent font-bold">+€{c.amount}</span>
                  </div>
                ))}
                {creditos.service.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-white/50">
                    <span>💳 {c.reason}</span>
                    <span className="text-accent font-bold">+€{c.amount}</span>
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
          <button onClick={copyRef} className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-xl px-4 py-2.5 transition-all">
            <span className="text-white/40 text-xs font-mono truncate">{refLink}</span>
            {copied ? <Check size={14} className="text-green-400 flex-shrink-0" /> : <Copy size={14} className="text-white/30 flex-shrink-0" />}
          </button>
        </div>

        {/* Acciones */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
          <div className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">Gestionar suscripción</div>

          {!isPaused && (
            <button onClick={() => setShowPausaModal(true)} className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-yellow-400/30 hover:bg-yellow-400/5 rounded-xl px-4 py-3 text-left transition-all">
              <Pause size={15} className="text-yellow-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white/80">Pausar 30 días</div>
                <div className="text-xs text-white/30">Sin cobros mientras dura la pausa</div>
              </div>
            </button>
          )}

          {isPaused && (
            <button onClick={() => { setIsPaused(false); setActionDone("Suscripción reactivada."); }} className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-green-400/30 hover:bg-green-400/5 rounded-xl px-4 py-3 text-left transition-all">
              <Play size={15} className="text-green-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white/80">Reactivar ahora</div>
                <div className="text-xs text-white/30">Retomar antes de los 30 días</div>
              </div>
            </button>
          )}

          <button onClick={() => setShowCancelModal(true)} className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:border-red-400/30 hover:bg-red-400/5 rounded-xl px-4 py-3 text-left transition-all">
            <X size={15} className="text-red-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-white/70">Cancelar suscripción</div>
              <div className="text-xs text-white/30">Sigues activo hasta el final del período</div>
            </div>
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          ¿Problemas? Escríbenos a{" "}
          <a href="mailto:getvitalsoft@gmail.com" className="text-white/40 hover:text-accent transition-colors">getvitalsoft@gmail.com</a>
        </p>
      </div>

      {/* Modal pausa */}
      {showPausaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg mb-1">Pausar 30 días</h3>
            <p className="text-white/40 text-sm mb-4">No se generarán cobros ni entregas durante la pausa. Puedes reactivar antes si quieres.</p>
            <textarea rows={2} placeholder="Motivo (opcional)" className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowPausaModal(false)} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button>
              <button onClick={() => { setIsPaused(true); setShowPausaModal(false); setActionDone("Suscripción pausada hasta el 30 jun 2026."); }} className="flex-1 py-2 bg-yellow-400 text-[#080808] rounded-lg font-bold text-sm">Pausar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold text-lg mb-1 text-red-400">Cancelar suscripción</h3>
            <p className="text-white/40 text-sm mb-4">Seguirás activo hasta el final del período que ya has pagado. No se hará ningún cobro más.</p>
            <div className="mb-3">
              <label className="text-xs text-white/30 mb-1.5 block">Motivo (opcional)</label>
              <textarea rows={2} placeholder="¿Por qué cancelas?" className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-white/30 mb-1.5 block">Escribe <strong className="text-white/60">cancelar</strong> para confirmar</label>
              <input type="text" placeholder="cancelar" value={confirmCancel} onChange={e => setConfirmCancel(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowCancelModal(false); setConfirmCancel(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Volver</button>
              <button disabled={confirmCancel.toLowerCase() !== "cancelar"} onClick={() => { setShowCancelModal(false); setConfirmCancel(""); setActionDone("Cancelación confirmada. Tu acceso sigue activo hasta el 30 jun 2026."); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-sm disabled:opacity-40">Confirmar cancelación</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
