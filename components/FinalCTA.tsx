"use client";
import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section className="relative py-32 px-6 text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse,rgba(232,255,71,0.07)_0%,transparent_70%)] pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative z-10 max-w-2xl mx-auto">
        <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-6">Empieza hoy</span>
        <h2 className="font-display font-extrabold text-[clamp(2.2rem,5vw,3.5rem)] tracking-tight mb-5 leading-[1.1]">
          Deja de editar.<br /><span className="text-accent">Empieza a distribuir.</span>
        </h2>
        <p className="text-white/40 text-base font-light mb-6 leading-relaxed max-w-lg mx-auto">
          Tu tiempo vale más que editar clips. Nosotros convertimos tu contenido largo en distribución constante — tú te centras en crear y en tu negocio.
        </p>
        <p className="text-white/20 text-xs mb-10 max-w-md mx-auto">
          Sin viralidad prometida. Sin contratos. Sin humo. Solo producción consistente y entrega puntual.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#precios" onClick={(e) => { e.preventDefault(); document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" }); }}
            className="bg-accent hover:bg-accent-2 text-[#080808] font-display font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,255,71,0.3)]">
            Ver todos los planes →
          </a>
          <a href="#calculadora" onClick={(e) => { e.preventDefault(); document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" }); }}
            className="border border-white/10 hover:border-white/25 text-white font-display font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm">
            Calcular mi plan
          </a>
        </div>
      </motion.div>
    </section>
  );
}
