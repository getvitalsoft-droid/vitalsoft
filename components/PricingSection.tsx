"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PRICING_PLANS, buildStripeUrl } from "@/lib/stripe";

export default function PricingSection() {
  const handlePlanClick = (planKey: string) => {
    const url = buildStripeUrl(planKey as any);
    window.open(url, "_blank");
  };

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">
            Pricing
          </span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">
            Simple, predictable pricing
          </h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">
            Choose your plan and start growing. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "bg-[rgba(232,255,71,0.05)] border-[rgba(232,255,71,0.35)]"
                  : "glass hover:border-white/15"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-accent text-[#080808] font-display font-black text-[10px] tracking-widest uppercase px-4 py-1 rounded-b-lg">
                  Most Popular
                </div>
              )}

              <div className="text-white/40 font-display font-black text-xs tracking-widest uppercase mb-2">
                {plan.name}
              </div>
              <div className="flex items-start gap-0.5 mb-0.5">
                <span className="text-white/50 text-lg font-display mt-1">€</span>
                <span className="font-display font-extrabold text-5xl tracking-tight leading-none">
                  {plan.price}
                </span>
              </div>
              <div className="text-white/30 text-xs mb-1">/month</div>
              <div className="text-accent font-semibold text-sm mb-5 pb-5 border-b border-white/5">
                {plan.videos} videos per month
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-white/45 text-xs"
                  >
                    <Check size={13} className="text-accent mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-white/45 text-xs">
                  <Check size={13} className="text-accent mt-0.5 flex-shrink-0" />
                  {plan.revisions}
                </li>
                <li className="flex items-start gap-2.5 text-white/45 text-xs">
                  <Check size={13} className="text-accent mt-0.5 flex-shrink-0" />
                  {plan.turnaround}
                </li>
              </ul>

              <button
                onClick={() => handlePlanClick(plan.key)}
                className={`w-full py-3 rounded-xl font-display font-bold text-sm transition-all duration-200 ${
                  plan.featured
                    ? "bg-accent hover:bg-accent-2 text-[#080808]"
                    : "border border-white/10 hover:border-white/25 hover:bg-white/[0.04] text-white"
                }`}
              >
                Start with {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
