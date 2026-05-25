"use client";
import { motion } from "framer-motion";

const pasos = [
  { num: "01", title: "Envías el material", desc: "Subes tu episodio o grabación al Drive compartido que te asignamos." },
  { num: "02", title: "Validamos el contenido", desc: "Revisamos que el material sea apto antes de comenzar producción. Te avisamos si hay algo a mejorar." },
  { num: "03", title: "Producimos los clips", desc: "Subtítulos, cortes, formato vertical y ritmo optimizado para cada plataforma." },
  { num: "04", title: "Revisas y publicas", desc: "Recibes los clips en tu Drive en 24–48h. Pides ajustes si necesitas. Tú publicas cuando quieras." },
];

export default function StatsBar() {
  return (
    <div className="bg-[#0f0f0f] border-y border-white/5 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-3">Cómo funciona</span>
          <h2 className="font-display font-extrabold text-2xl tracking-tight">Flujo de trabajo claro y predecible</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pasos.map((p, i) => (
            <motion.div key={p.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative">
              <div className="font-display font-black text-4xl text-accent/20 mb-3">{p.num}</div>
              <div className="font-display font-bold text-sm mb-2">{p.title}</div>
              <div className="text-white/35 text-xs leading-relaxed font-light">{p.desc}</div>
              {i < 3 && <div className="hidden lg:block absolute top-5 right-0 translate-x-1/2 text-white/10 text-lg">→</div>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
