"use client";
import { motion } from "framer-motion";

const testimonials = [
  {
    stars: 5,
    text: "VitalSoft completely changed my workflow. My podcast clips went from 800 views to 60k+ on TikTok. The retention editing is genuinely next-level.",
    name: "Jake Martinez",
    handle: "@jakecasts · 84k followers",
    initials: "JM",
    gradient: "from-accent to-green-400",
  },
  {
    stars: 5,
    text: "Outsourcing to VitalSoft gave me 20+ hours back per week. Quality is insane and turnaround is always under 24 hours. Best investment for any creator.",
    name: "Sofia Laurent",
    handle: "@sofialifts · 210k followers",
    initials: "SL",
    gradient: "from-violet-400 to-blue-400",
  },
  {
    stars: 5,
    text: "As a business owner with no time to edit, this is a godsend. Professional quality, on-brand captions, and the whole process is effortless.",
    name: "Tom Rivera",
    handle: "@riveraproperty · Brand account",
    initials: "TR",
    gradient: "from-orange-400 to-pink-400",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">
            Social Proof
          </span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">
            Creators love the results
          </h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">
            Real feedback from real creators scaling their content.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-7 relative overflow-hidden hover:border-[rgba(232,255,71,0.2)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(232,255,71,0.3)] to-transparent" />
              <div className="text-accent text-sm mb-3">{"★".repeat(t.stars)}</div>
              <p className="text-white/75 text-sm leading-relaxed mb-5 italic font-light">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center font-display font-black text-sm text-[#080808] flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-white/35 text-xs">{t.handle}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
