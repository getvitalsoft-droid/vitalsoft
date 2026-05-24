"use client";
import { motion } from "framer-motion";

const services = [
  { icon: "🎙️", title: "Clips de Podcast", desc: "Transformamos tus episodios largos en clips cortos y virales que captan la atención desde el primer segundo.", tags: ["Mejores momentos", "Subtítulos auto", "Audiograma"] },
  { icon: "📱", title: "Edición TikTok / Reels", desc: "Edición vertical creada para el máximo engagement. Formatos tendencia, hooks y diseño de sonido incluidos.", tags: ["Formato 9:16", "Hooks virales", "B-roll"] },
  { icon: "▶️", title: "YouTube Shorts", desc: "Aumenta suscriptores y tiempo de visualización con Shorts editados para el algoritmo de YouTube.", tags: ["Optimizado algoritmo", "Pantallas finales", "Capítulos"] },
  { icon: "🎬", title: "Edición Podcast Completo", desc: "Edición del episodio completo: intro/outro, mezcla de música, reducción de ruido y masterización de audio profesional.", tags: ["Episodio completo", "Masterización", "Show notes"] },
  { icon: "✍️", title: "Subtítulos y Retención", desc: "Subtítulos animados, jump cuts estratégicos y técnicas de ritmo probadas para aumentar el tiempo de visualización.", tags: ["Subtítulos animados", "Jump cuts", "Ritmo"] },
  { icon: "🚀", title: "Estrategia de Contenido", desc: "Planificamos y ejecutamos tu estrategia de contenido corto: calendarios, pruebas de formato y análisis mensual.", tags: ["Calendario mensual", "Analíticas", "A/B testing"], highlight: true },
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Servicios</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Todo lo que necesitas para triunfar</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">Del material en bruto al contenido listo para publicar — nosotros lo gestionamos todo.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 ${s.highlight ? "bg-[rgba(232,255,71,0.04)] border-[rgba(232,255,71,0.2)] hover:border-[rgba(232,255,71,0.35)]" : "glass hover:border-white/15"}`}>
              <div className="w-12 h-12 bg-[rgba(232,255,71,0.08)] rounded-xl flex items-center justify-center text-2xl mb-5">{s.icon}</div>
              <h3 className="font-display font-bold text-base mb-2">{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed font-light mb-4">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map((tag) => (<span key={tag} className="bg-white/[0.04] border border-white/[0.07] text-white/40 text-[11px] px-2.5 py-1 rounded">{tag}</span>))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
