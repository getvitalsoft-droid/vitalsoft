"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { calcPrice, savings, buildStripeUrl } from "@/lib/stripe";

const PLAN_ANCHORS: Record<number, string> = { 10: "Starter", 20: "Growth", 30: "Scale", 40: "Pro" };
const PLAN_KEYS: Record<number, string> = { 10: "starter", 20: "growth", 30: "scale", 40: "pro" };

interface Props { ref?: string }

export default function CalculatorSection({ ref: refCode }: Props) {
  const [videos, setVideos] = useState(10);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [urlRef, setUrlRef] = useState(refCode || "");

  // Capturar ?ref= de la URL en el cliente también
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) setUrlRef(r);
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

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, social, source, notes, videos, price, ref: urlRef }),
      });

      if (planKey) {
        // Plan fijo — usar Payment Link directo con ref en client_reference_id
        const base = buildStripeUrl(planKey as any, { email, videos });
        const url = urlRef ? `${base}&client_reference_id=ref_${urlRef}` : base;
        setSubmitted(true);
        setTimeout(() => window.open(url, "_blank"), 600);
        return;
      }

      // Plan custom — sesión dinámica
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, social, notes, videos, price, ref: urlRef }),
      });
      const data = await res.json();
      if (data.url) {
        setSubmitted(true);
        setTimeout(() => { window.location.href = data.url; }, 600);
      } else {
        alert("Error al crear el pago. Inténtalo de nuevo.");
        setLoading(false);
      }
    } catch {
      alert("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm font-body outline-none transition-all duration-200 placeholder:text-white/20 focus:border-[rgba(232,255,71,0.4)] focus:bg-white/[0.06]";

  return (
    <section id="calculadora" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Plan Personalizado</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Crea tu plan perfecto</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">Mueve el slider para seleccionar los vídeos que necesitas. Los precios cuadran exactamente con los planes fijos.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 md:p-10 max-w-2xl mx-auto">

          {/* Ref badge */}
          {urlRef && (
            <div className="mb-4 bg-[rgba(232,255,71,0.06)] border border-[rgba(232,255,71,0.15)] rounded-lg px-4 py-2 text-xs text-accent flex items-center gap-2">
              <span>🤝</span> Referido por agente: <strong>{urlRef}</strong>
            </div>
          )}

          {/* Anclas de planes */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[{v:10,n:"Starter",p:150},{v:20,n:"Growth",p:250},{v:30,n:"Scale",p:350},{v:40,n:"Pro",p:450}].map((plan) => (
              <button key={plan.v} onClick={() => setVideos(plan.v)}
                className={`rounded-xl p-3 border text-center transition-all duration-200 ${videos === plan.v ? "bg-[rgba(232,255,71,0.07)] border-[rgba(232,255,71,0.32)]" : "bg-white/[0.03] border-white/[0.08] hover:border-white/20"}`}>
                <div className={`font-display font-black text-[10px] uppercase tracking-widest mb-1 ${videos === plan.v ? "text-accent" : "text-white/30"}`}>{plan.n}</div>
                <div className={`font-display font-extrabold text-sm ${videos === plan.v ? "text-accent" : "text-white/60"}`}>€{plan.p}</div>
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-display font-bold text-base">Vídeos al mes</span>
              <span className="font-display font-extrabold text-4xl text-accent">{videos}</span>
            </div>
            <input type="range" min={1} max={100} step={1} value={videos} onChange={(e) => setVideos(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between mt-2 text-white/20 text-xs"><span>1 vídeo</span><span>100 vídeos</span></div>
          </div>

          {/* Precio */}
          <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-6 text-center mb-6">
            <div className="font-display font-extrabold text-5xl text-accent leading-none mb-2">€{price.toLocaleString("es-ES")}</div>
            <div className="text-white/35 text-sm">€{perVid} por vídeo · facturación mensual</div>
            <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
              {saved > 0 && <span className="inline-block bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">Ahorras €{saved} vs tarifa individual</span>}
              {planMatch && <span className="inline-block bg-[rgba(232,255,71,0.12)] border border-[rgba(232,255,71,0.25)] text-accent font-display text-xs font-bold px-3 py-1 rounded-full">= Plan {planMatch}</span>}
              {!planMatch && <span className="inline-block bg-white/[0.05] border border-white/10 text-white/40 text-xs px-3 py-1 rounded-full">Plan personalizado</span>}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Nombre completo *</label><input type="text" required placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Correo electrónico *</label><input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">Instagram / TikTok / YouTube</label><input type="text" placeholder="@tuusuario" value={social} onChange={e => setSocial(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs text-white/35 font-medium mb-1.5">¿Cómo nos encontraste?</label><input type="text" placeholder="TikTok, Google..." value={source} onChange={e => setSource(e.target.value)} className={inp} /></div>
            </div>
            <div className="mb-4"><label className="block text-xs text-white/35 font-medium mb-1.5">Notas adicionales</label><textarea rows={3} placeholder="Cuéntanos sobre tu contenido, estilo, plazos..." value={notes} onChange={e => setNotes(e.target.value)} className={inp + " resize-none"} /></div>
            <button type="submit" disabled={loading || submitted}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-base py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(232,255,71,0.35)] disabled:opacity-60">
              {submitted ? "Redirigiendo al pago…" : loading ? "Preparando pago…" : <><span>Continuar al pago</span><ArrowRight size={18} /></>}
            </button>
            <div className="flex items-center justify-center gap-2 mt-4 text-white/25 text-xs"><Lock size={11} />Pago seguro con Stripe · Cancela cuando quieras</div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
