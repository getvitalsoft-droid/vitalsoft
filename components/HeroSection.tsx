"use client";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut", delay },
});

const platforms = ["🎙️ Podcasts", "📱 TikTok", "📸 Instagram Reels", "▶️ YouTube Shorts"];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(232,255,71,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative z-10 text-center max-w-4xl mx-auto">

        <motion.h1 {...fadeUp(0.1)} className="font-display font-extrabold text-[clamp(2.4rem,5.2vw,4.4rem)] leading-[1.0] tracking-[-0.03em] mb-6">
          <span className="text-gradient">Graba una vez.</span>
          <br />
          <span className="text-accent">Publica todo el mes.</span>
        </motion.h1>

        <motion.p {...fadeUp(0.2)} className="text-white/50 text-lg max-w-xl mx-auto mb-4 font-light leading-relaxed">
          Convertimos tu podcast o contenido largo en clips listos para TikTok, Reels y YouTube Shorts. Subtítulos, formato vertical y entrega en 24–48h.
        </motion.p>

        <motion.p {...fadeUp(0.25)} className="text-white/30 text-sm max-w-md mx-auto mb-10 font-light">
          Sin viralidad prometida. Sin humo. Solo distribución constante y consistente.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex gap-4 justify-center flex-wrap">
          <a href="#precios" onClick={(e) => { e.preventDefault(); document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" }); }}
            className="bg-accent hover:bg-accent-2 text-[#080808] font-display font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,255,71,0.3)]">
            Ver planes →
          </a>
          <a href="#calculadora" onClick={(e) => { e.preventDefault(); document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" }); }}
            className="bg-transparent border border-white/10 hover:border-white/25 text-white font-display font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm">
            Crear mi sistema de clips
          </a>
        </motion.div>

        <motion.div {...fadeUp(0.4)} className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          <span className="text-white/20 text-xs">Funciona para:</span>
          {platforms.map((p) => (
            <span key={p} className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1 text-xs text-white/50">{p}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
