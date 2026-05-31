"use client";
// Abre el popup de pago directamente sin mostrar la landing.
// Pensado para links de agentes donde el cliente ya decidió.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, ChevronLeft, Lock } from "lucide-react";
import { calcPrice } from "@/lib/stripe";
import StripeCheckout from "@/components/StripeCheckout";

interface Props { agentRef: string; clips: number }

export default function PagarClient({ agentRef, clips }: Props) {
  const price = calcPrice(clips);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [step, setStep] = useState<"form" | "payment">("form");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const planLabel = {
    10: "Starter", 20: "Growth", 30: "Scale", 40: "Pro"
  }[clips] || `${clips} clips`;

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20";

  const handleContinuar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Nombre y email son obligatorios.");
      return;
    }
    setFormError("");
    setStep("payment");
  };

  if (success) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="font-display font-black text-2xl mb-3">¡Pago confirmado!</h2>
        <p className="text-white/40 text-sm mb-6">
          Recibirás un email con los siguientes pasos.<br />
          El equipo empieza en cuanto completes la configuración.
        </p>
        <a href="/" className="text-accent font-bold text-sm hover:underline">
          Ir a vitalsoft.pro →
        </a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="font-display font-black text-2xl">
            <span className="text-accent">Vital</span>Soft
          </a>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Resumen del plan */}
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/40 text-xs mb-0.5">Plan seleccionado</div>
                <div className="font-display font-black text-xl">
                  {planLabel} <span className="text-white/30 font-normal text-base">· {clips} clips/mes</span>
                </div>
                <div className="text-accent font-bold text-lg mt-0.5">€{price}/mes</div>
              </div>
              <div className="text-right">
                <div className="text-white/20 text-xs">Sin permanencia</div>
                <div className="text-white/20 text-xs">Cancela cuando quieras</div>
              </div>
            </div>
            {agentRef && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-xs text-white/35">
                🤝 Referido por <strong className="text-accent/80 ml-0.5">{agentRef}</strong>
              </div>
            )}
          </div>

          {/* Form / Payment */}
          <div className="p-6">
            {step === "form" ? (
              <form onSubmit={handleContinuar} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Nombre completo *</label>
                  <input type="text" required placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} className={inp} autoFocus />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Correo electrónico *</label>
                  <input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Canal / perfil principal</label>
                  <input type="text" placeholder="@tuusuario o URL" value={social} onChange={e => setSocial(e.target.value)} className={inp} />
                </div>
                {formError && <p className="text-red-400 text-xs">{formError}</p>}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-sm rounded-xl transition-all"
                >
                  <span>Continuar al pago</span>
                  <ArrowRight size={16} />
                </button>
                <p className="text-white/20 text-xs text-center">Siguiente paso: datos de tu tarjeta</p>
              </form>
            ) : (
              <StripeCheckout
                data={{ name, email, social, notes: "", videos: clips, price, ref: agentRef || undefined }}
                onBack={() => setStep("form")}
                onSuccess={() => setSuccess(true)}
              />
            )}
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          ¿Dudas antes de pagar? <a href="/" className="text-white/40 hover:text-accent transition-colors">Ver vitalsoft.pro →</a>
        </p>
      </div>
    </main>
  );
}
