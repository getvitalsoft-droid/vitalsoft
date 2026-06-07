"use client";
import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section className="relative py-32 px-6 text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse,rgba(232,255,71,0.07)_0%,transparent_70%)] pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative z-10 max-w-2xl mx-auto">
        <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-6">Empieza hoy</span>
        <h2 className="font-display font-extrabold text-[clamp(2.2rem,5vw,3.5rem)] tracking-tight mb-5 leading-[1.1]">
          Tu próximo mes de contenido<br /><span className="text-accent">ya está grabado.</span>
        </h2>
        <p className="text-white/55 text-base font-light mb-3 leading-relaxed max-w-lg mx-auto">
          El sistema ya está listo. Solo falta tu primer episodio.
        </p>
        <p className="text-white/35 text-sm mb-10 max-w-md mx-auto">
          Empieza esta semana y recibe tus primeros clips en 24–48h desde que subas tu material.
        </p>
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap text-xs text-white/35">
          <span>✓ Sin permanencia</span>
          <span className="text-white/15 hidden sm:block">·</span>
          <span>✓ Todos los derechos son tuyos</span>
          <span className="text-white/15 hidden sm:block">·</span>
          <span>✓ Cancela cuando quieras</span>
          <span className="text-white/15 hidden sm:block">·</span>
          <span>✓ Entrega en 24–48h</span>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#precios" onClick={(e) => { e.preventDefault(); document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" }); }}
            className="bg-accent hover:bg-accent-2 text-[#080808] font-display font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,255,71,0.3)] whitespace-nowrap">
            Elegir mi plan →
          </a>
          <a href="#calculadora" onClick={(e) => { e.preventDefault(); document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" }); }}
            className="border border-white/10 hover:border-white/25 text-white font-display font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm whitespace-nowrap">
            Calcular mi plan
          </a>
        </div>
      </motion.div>
    </section>
  );
}
