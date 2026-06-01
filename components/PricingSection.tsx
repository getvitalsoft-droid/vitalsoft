"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { PRICING_PLANS, calcPrice } from "@/lib/stripe";
import StripeCheckout from "@/components/StripeCheckout";

interface Props { refCode?: string }

interface CheckoutState {
  name: string;
  email: string;
  social: string;
  notes: string;
  videos: number;
  price: number;
  ref?: string;
}

export default function PricingSection({ refCode }: Props) {
  const [selected, setSelected] = useState<typeof PRICING_PLANS[0] | null>(null);
  // Form fields for the plan popup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [step, setStep] = useState<"form" | "payment">("form");
  const [checkoutData, setCheckoutData] = useState<CheckoutState | null>(null);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Auto-abrir popup si viene ref+clips en la URL (link de agente a la landing)
  // Equivalente a pulsar el plan correspondiente manualmente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get("ref");
    const urlClips = Number(params.get("clips"));
    if (!urlRef || !urlClips) return;

    // Buscar el plan que coincide con los clips, o crear uno personalizado
    const planFijo = PRICING_PLANS.find(p => p.videos === urlClips);
    if (planFijo) {
      // Es un plan fijo: abrir popup directamente
      setTimeout(() => {
        setSelected(planFijo);
        setStep("form");
        setSuccess(false);
      }, 300); // pequeño delay para que la página cargue primero
    } else {
      // Es un volumen personalizado: abrir popup con datos custom
      setTimeout(() => {
        setSelected({
          key: "custom" as any,
          name: `${urlClips} clips`,
          price: calcPrice(urlClips),
          videos: urlClips,
          featured: false,
          features: [],
          turnaround: "",
          revisions: "",
        });
        setStep("form");
        setSuccess(false);
      }, 300);
    }
  }, []);

  const openPlan = (plan: typeof PRICING_PLANS[0]) => {
    setSelected(plan);
    setStep("form");
    setFormError("");
    setSuccess(false);
  };

  const closeModal = () => {
    setSelected(null);
    setName("");
    setEmail("");
    setSocial("");
    setStep("form");
    setCheckoutData(null);
    setSuccess(false);
  };

  const handleContinuar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Nombre y email son obligatorios.");
      return;
    }
    if (!selected) return;
    setFormError("");
    setCheckoutData({
      name, email, social,
      notes: "",
      videos: selected.videos,
      price: selected.price,
      ref: refCode,
    });
    setStep("payment");
  };

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20";

  return (
    <section id="precios" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Precios</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Precios simples y predecibles</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">Elige tu volumen mensual. Sin permanencia. Cancela cuando quieras.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div key={plan.key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 ${plan.featured ? "bg-[rgba(232,255,71,0.05)] border-[rgba(232,255,71,0.35)]" : "glass hover:border-white/15"}`}>
              {plan.featured && <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-accent text-[#080808] font-display font-black text-[10px] tracking-widest uppercase px-4 py-1 rounded-b-lg">Más Popular</div>}
              <div className="text-white/40 font-display font-black text-xs tracking-widest uppercase mb-2">{plan.name}</div>
              <div className="flex items-start gap-0.5 mb-0.5">
                <span className="text-white/50 text-lg font-display mt-1">€</span>
                <span className="font-display font-extrabold text-5xl tracking-tight leading-none">{plan.price}</span>
              </div>
              <div className="text-white/30 text-xs mb-1">/mes</div>
              <div className="text-accent font-semibold text-sm mb-5 pb-5 border-b border-white/5">{plan.videos} clips al mes</div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => <li key={f} className="flex items-start gap-2.5 text-white/45 text-xs"><Check size={13} className="text-accent mt-0.5 flex-shrink-0" />{f}</li>)}
                <li className="flex items-start gap-2.5 text-white/45 text-xs"><Check size={13} className="text-accent mt-0.5 flex-shrink-0" />{plan.revisions}</li>
                <li className="flex items-start gap-2.5 text-white/45 text-xs"><Check size={13} className="text-accent mt-0.5 flex-shrink-0" />{plan.turnaround}</li>
              </ul>
              <button onClick={() => openPlan(plan)}
                className={`w-full py-3 rounded-xl font-display font-bold text-sm transition-all duration-200 ${plan.featured ? "bg-accent hover:bg-accent-2 text-[#080808]" : "border border-white/10 hover:border-white/25 hover:bg-white/[0.04] text-white"}`}>
                Empezar con {plan.name}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-2">
          <p className="text-white/25 text-xs text-center">La mayoría de clips se entregan entre 20 y 90 segundos dependiendo del contenido y la plataforma.</p>
          <p className="text-white/25 text-xs text-center">Los ajustes cubren cambios razonables sobre el contenido entregado. Re-ediciones completas o cambios de estilo se presupuestan aparte.</p>
          <p className="text-white/20 text-xs text-center italic">Los plazos de entrega empiezan cuando recibimos tu contenido, no desde el pago.</p>
        </motion.div>
      </div>

      {/* Modal de plan */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/90 px-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div>
                  <div className="font-display font-black text-lg">
                    <span className="text-accent">Vital</span>Soft <span className="text-white/40 font-normal text-base">· {selected.name}</span>
                  </div>
                  <div className="text-accent font-bold text-sm mt-0.5">
                    €{selected.price}/mes · {selected.videos} clips
                  </div>
                  {refCode && (
                    <div className="text-white/30 text-xs mt-1 flex items-center gap-1">
                      🤝 Referido por <strong className="text-accent/70 ml-0.5">{refCode}</strong>
                    </div>
                  )}
                </div>
                <button onClick={closeModal} className="text-white/30 hover:text-white/60 transition-colors p-1">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {success ? (
                  <div className="text-center py-6">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="font-display font-black text-xl mb-2">¡Pago confirmado!</h3>
                    <p className="text-white/40 text-sm mb-4">Recibirás un email con el acceso a tu proyecto.</p>
                    <button onClick={closeModal} className="text-accent font-bold text-sm hover:underline">Cerrar →</button>
                  </div>
                ) : step === "form" ? (
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
                    <button type="submit"
                      className="w-full py-3.5 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-sm rounded-xl transition-all">
                      Continuar al pago →
                    </button>
                    <p className="text-white/20 text-xs text-center">Siguiente paso: datos de tu tarjeta</p>
                  </form>
                ) : checkoutData ? (
                  <StripeCheckout
                    data={checkoutData}
                    onBack={() => setStep("form")}
                    onSuccess={() => setSuccess(true)}
                  />
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
