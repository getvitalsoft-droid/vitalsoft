"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PRICING_PLANS, buildStripeUrl } from "@/lib/stripe";

interface Props { ref?: string }

export default function PricingSection({ ref: refCode }: Props) {
  const handlePlan = (planKey: string) => {
    const base = buildStripeUrl(planKey as any);
    const url = refCode ? `${base}?client_reference_id=ref_${refCode}` : base;
    window.open(url, "_blank");
  };

  return (
    <section id="precios" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Precios</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Precios simples y predecibles</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">Elige tu plan y empieza a crecer. Cancela cuando quieras.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div key={plan.key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 ${plan.featured ? "bg-[rgba(232,255,71,0.05)] border-[rgba(232,255,71,0.35)]" : "glass hover:border-white/15"}`}>
              {plan.featured && <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-accent text-[#080808] font-display font-black text-[10px] tracking-widest uppercase px-4 py-1 rounded-b-lg">Más Popular</div>}
              <div className="text-white/40 font-display font-black text-xs tracking-widest uppercase mb-2">{plan.name}</div>
              <div className="flex items-start gap-0.5"><span className="text-white/50 text-lg font-display mt-1">€</span><span className="font-display font-extrabold text-5xl tracking-tight leading-none">{plan.price}</span></div>
              <div className="text-white/30 text-xs mb-1">/mes</div>
              <div className="text-accent font-semibold text-sm mb-5 pb-5 border-b border-white/5">{plan.videos} vídeos al mes</div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => <li key={f} className="flex items-start gap-2.5 text-white/45 text-xs"><Check size={13} className="text-accent mt-0.5 flex-shrink-0" />{f}</li>)}
                <li className="flex items-start gap-2.5 text-white/45 text-xs"><Check size={13} className="text-accent mt-0.5 flex-shrink-0" />{plan.revisions}</li>
                <li className="flex items-start gap-2.5 text-white/45 text-xs"><Check size={13} className="text-accent mt-0.5 flex-shrink-0" />{plan.turnaround}</li>
              </ul>
              <button onClick={() => handlePlan(plan.key)}
                className={`w-full py-3 rounded-xl font-display font-bold text-sm transition-all duration-200 ${plan.featured ? "bg-accent hover:bg-accent-2 text-[#080808]" : "border border-white/10 hover:border-white/25 hover:bg-white/[0.04] text-white"}`}>
                Empezar con {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
