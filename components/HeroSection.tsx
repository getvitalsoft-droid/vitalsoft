"use client";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut", delay },
});

const platforms = [
  "🎙️ Podcasts",
  "📱 TikTok",
  "📸 Instagram Reels",
  "▶️ YouTube Shorts",
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(232,255,71,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.2)] rounded-full px-4 py-1.5 text-accent text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          Más de 1.000 creadores confían en nosotros
        </motion.div>
        <motion.h1
          {...fadeUp(0.2)}
          className="font-display font-extrabold text-[clamp(2.8rem,6vw,5rem)] leading-[1.05] tracking-[-0.03em] mb-6"
        >
          <span className="text-gradient">Convierte Contenido Largo en</span>
          <br />
          <span className="text-accent">Shorts Virales</span>
        </motion.h1>
        <motion.p {...fadeUp(0.3)} className="text-white/50 text-lg max-w-xl mx-auto mb-10 font-light leading-relaxed">
          Edición de vídeo profesional para creadores, podcasters y marcas. Subtítulos animados, formato vertical, edición de retención — optimizado para TikTok, Reels y YouTube Shorts.
        </motion.p>
        <motion.div {...fadeUp(0.4)} className="flex gap-4 justify-center flex-wrap">
          <a href="#calculadora" onClick={(e) => { e.preventDefault(); document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" }); }} className="bg-accent hover:bg-accent-2 text-[#080808] font-display font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,255,71,0.3)]">
            Empezar ahora →
          </a>
          <a href="#precios" onClick={(e) => { e.preventDefault(); document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" }); }} className="bg-transparent border border-white/10 hover:border-white/25 text-white font-display font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm">
            Ver precios
          </a>
        </motion.div>
        <motion.div {...fadeUp(0.5)} className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          <span className="text-white/20 text-xs">Para:</span>
          {platforms.map((p) => (
            <span key={p} className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1 text-xs text-white/50">{p}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
