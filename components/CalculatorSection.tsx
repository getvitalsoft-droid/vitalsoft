"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { calcPrice, savings } from "@/lib/stripe";
import StripeCheckout from "@/components/StripeCheckout";

const PLAN_ANCHORS: Record<number, string> = { 10: "Starter", 20: "Growth", 30: "Scale", 40: "Pro" };
const PLAN_KEYS: Record<number, string> = { 10: "starter", 20: "growth", 30: "scale", 40: "pro" };

interface Props { refCode?: string }

export default function CalculatorSection({ refCode }: Props) {
  const [videos, setVideos] = useState(10);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [tipoContenido, setTipoContenido] = useState("");
  const [duracionMedia, setDuracionMedia] = useState("");
  const [plataformas, setPlataformas] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [urlRef, setUrlRef] = useState(refCode || "");
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [clientRef, setClientRef] = useState(""); // código de referido de cliente

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) setUrlRef(r);
    const cr = params.get("client_ref");
    if (cr) setClientRef(cr);
    const clips = params.get("clips");
    if (clips) setVideos(Number(clips));

    // Si hay ref + clips → solo preseleccionar, NO abrir checkout automáticamente
    // El cliente debe rellenar nombre y email primero (paso obligatorio)

    // Escuchar evento de PricingSection para preseleccionar plan
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.videos) setVideos(detail.videos);
    };
    window.addEventListener("vs:selectPlan", handler);
    return () => window.removeEventListener("vs:selectPlan", handler);
  }, []);

  const price = calcPrice(videos);
  const saved = savings(videos);
  const perVid = (price / videos).toFixed(2).replace(".", ",");
  const planMatch = PLAN_ANCHORS[videos];
  const planKey = PLAN_KEYS[videos];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);

    const notasCompletas = [
      tipoContenido && `Tipo: ${tipoContenido}`,
      duracionMedia && `Duración media: ${duracionMedia}`,
      plataformas && `Plataformas: ${plataformas}`,
      notas && `Notas: ${notas}`,
    ].filter(Boolean).join(" | ");

    // Guardar contacto
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, social, notes: notasCompletas, videos, price, ref: urlRef, client_ref: clientRef }),
      });
    } catch { /* no crítico */ }

    setLoading(false);
    setShowCheckout(true); // Mostrar formulario de tarjeta embebido
  };

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm font-body outline-none transition-all duration-200 placeholder:text-white/20 focus:border-[rgba(232,255,71,0.4)]";

  return (
    <>
      <section id="calculadora" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Plan Personalizado</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Calcula tu volumen mensual</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">Selecciona cuántos clips necesitas al mes. Los precios cuadran exactamente con los planes fijos.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 md:p-10 max-w-2xl mx-auto">
          {urlRef && (
            <div className="mb-5 bg-[rgba(232,255,71,0.06)] border border-[rgba(232,255,71,0.2)] rounded-lg px-4 py-2.5 text-xs text-accent flex items-center gap-2">
              🤝 Referido por agente: <strong>{urlRef}</strong>
            </div>
          )}

          {/* Anclas */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[{v:10,n:"Starter",p:150},{v:20,n:"Growth",p:250},{v:30,n:"Scale",p:350},{v:40,n:"Pro",p:450}].map((plan) => (
              <button key={plan.v} onClick={() => setVideos(plan.v)}
                className={`rounded-xl p-3 border text-center transition-all duration-200 ${videos === plan.v ? "bg-[rgba(232,255,71,0.07)] border-[rgba(232,255,71,0.32)]" : "bg-white/[0.03] border-white/[0.08] hover:border-white/20"}`}>
                <div className={`font-display font-black text-[10px] uppercase tracking-widest mb-1 ${videos === plan.v ? "text-accent" : "text-white/30"}`}>{plan.n}</div>
                <div className={`font-display font-extrabold text-sm ${videos === plan.v ? "text-accent" : "text-white/60"}`}>€{plan.p}</div>
              </button>
            ))}
          </div>

          {/* Slider + input de teclado */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-display font-bold text-base">Clips mensuales</span>
              <input
                type="number"
                min={1}
                max={100}
                value={videos}
                onChange={e => {
                  const v = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                  setVideos(v);
                }}
                onBlur={e => {
                  const v = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                  setVideos(v);
                }}
                className="font-display font-extrabold text-4xl text-accent bg-transparent border-b-2 border-accent/40 focus:border-accent outline-none w-20 text-right"
              />
            </div>
            <input type="range" min={1} max={100} step={1} value={videos} onChange={(e) => setVideos(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between mt-2 text-white/20 text-xs"><span>1 clip</span><span>100 clips</span></div>
          </div>

          {/* Precio */}
          <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-6 text-center mb-6">
            <div className="font-display font-extrabold text-5xl text-accent leading-none mb-2">€{price.toLocaleString("es-ES")}</div>
            <div className="text-white/35 text-sm">€{perVid} por clip · sin permanencia · cancela cuando quieras</div>
            <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
              {saved > 0 && <span className="bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">Ahorras €{saved} vs tarifa individual</span>}
              {planMatch && <span className="bg-[rgba(232,255,71,0.12)] border border-[rgba(232,255,71,0.25)] text-accent font-display text-xs font-bold px-3 py-1 rounded-full">= Plan {planMatch}</span>}
              {!planMatch && <span className="bg-white/[0.05] border border-white/10 text-white/40 text-xs px-3 py-1 rounded-full">Volumen personalizado</span>}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Nombre completo *</label><input type="text" required placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Correo electrónico *</label><input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Canal / perfil principal</label><input type="text" placeholder="@tuusuario o URL" value={social} onChange={e => setSocial(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Tipo de contenido</label><input type="text" placeholder="Podcast, entrevistas, YouTube..." value={tipoContenido} onChange={e => setTipoContenido(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Duración media del contenido</label><input type="text" placeholder="30 min, 1h, varía..." value={duracionMedia} onChange={e => setDuracionMedia(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Plataformas objetivo</label><input type="text" placeholder="TikTok, Reels, Shorts..." value={plataformas} onChange={e => setPlataformas(e.target.value)} className={inp} /></div>
            </div>
            <div className="mb-4"><label className="block text-xs text-white/35 font-medium mb-1.5">Notas adicionales</label><textarea rows={2} placeholder="Referencias visuales, estilo, plazos especiales..." value={notas} onChange={e => setNotas(e.target.value)} className={inp + " resize-none"} /></div>
            <button type="submit" disabled={loading || submitted}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-base py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(232,255,71,0.35)] disabled:opacity-60">
              {submitted ? "Redirigiendo al pago…" : loading ? "Preparando pago…" : <><span>Continuar al pago</span><ArrowRight size={18} /></>}
            </button>
            <div className="flex items-center justify-center gap-2 mt-4 text-white/25 text-xs"><Lock size={11} />Pago seguro con Stripe · Sin permanencia · Cancela cuando quieras</div>
          </form>
        </motion.div>
      </div>
    </section>

    {/* Overlay de pago embebido */}
    <AnimatePresence>
      {showCheckout && !checkoutSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/90 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="font-display font-black text-lg mb-1">
              <span className="text-accent">Vital</span>Soft
            </div>
            <p className="text-white/30 text-xs mb-6">Datos de pago seguros</p>
            <StripeCheckout
              data={{
                name, email, social,
                notes: [
                  tipoContenido && `Tipo: ${tipoContenido}`,
                  duracionMedia && `Duración media: ${duracionMedia}`,
                  plataformas && `Plataformas: ${plataformas}`,
                  notas,
                ].filter(Boolean).join(" | "),
                videos, price,
                ref: urlRef || undefined,
                client_ref: clientRef || undefined,
              }}
              onBack={() => setShowCheckout(false)}
              onSuccess={() => { setCheckoutSuccess(true); setShowCheckout(false); }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Confirmación de pago */}
    <AnimatePresence>
      {checkoutSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/90 px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="text-6xl mb-6">✅</div>
            <h2 className="font-display font-black text-2xl mb-3">¡Pago confirmado!</h2>
            <p className="text-white/40 text-sm mb-6">
              Recibirás un email con el acceso a tu proyecto.<br/>
              El equipo empieza en cuanto completes la configuración.
            </p>
            <button
              onClick={() => window.location.href = "/"}
              className="text-accent font-bold text-sm hover:underline"
            >
              Volver al inicio →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
