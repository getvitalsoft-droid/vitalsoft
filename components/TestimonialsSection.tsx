"use client";
import { motion } from "framer-motion";

const aptoPara = [
  { icon: "🎙️", title: "Podcasters", desc: "Tienes episodios largos pero no tiempo de reeditar para redes. Nosotros lo hacemos por ti." },
  { icon: "🎥", title: "Creadores de contenido largo", desc: "Grabas vídeos de YouTube, entrevistas o webinars y quieres reutilizar ese contenido en clips cortos." },
  { icon: "🏢", title: "Marcas y negocios", desc: "Tienes contenido corporativo, formaciones o eventos y quieres distribuirlo en redes de forma consistente." },
  { icon: "🎤", title: "Speakers y formadores", desc: "Tienes charlas, ponencias o clases y quieres convertirlas en contenido de valor para tus redes." },
];

const noApto = [
  "Contenido con audio de mala calidad o muy fragmentado",
  "Material que requiere estrategia completa de redes sociales",
  "Expectativa de viralidad garantizada",
  "Streams caóticos sin estructura clara",
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Para quién es</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">¿Encaja contigo?</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">VitalSoft es un sistema de producción, no una agencia de growth. Esto es lo que hacemos y lo que no hacemos.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {aptoPara.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 hover:border-[rgba(232,255,71,0.15)] transition-all">
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="font-display font-bold text-sm mb-2">{item.title}</div>
              <p className="text-white/45 text-sm font-light leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-red-500/[0.04] border border-red-500/15 rounded-2xl p-6">
          <div className="font-display font-bold text-sm text-red-400/80 mb-4">⚠️ No somos la opción correcta si...</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {noApto.map((item) => (
              <div key={item} className="flex items-start gap-2 text-white/30 text-xs">
                <span className="text-red-400/50 flex-shrink-0 mt-0.5">✕</span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
