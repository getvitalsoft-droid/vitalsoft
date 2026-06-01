"use client";
import { motion } from "framer-motion";

const aptoPara = [
  { icon: "🎙️", title: "Podcasters", benefit: "Más frecuencia de publicación", desc: "Cada episodio se convierte en semanas de contenido para redes sin que toques el editor." },
  { icon: "▶️", title: "YouTubers", benefit: "Más rendimiento por vídeo", desc: "Cada vídeo largo genera clips para TikTok, Reels y Shorts. Más alcance con el mismo esfuerzo." },
  { icon: "🎮", title: "Streamers", benefit: "Aprovecha cada directo", desc: "Tus directos están llenos de momentos publicables. Los extraemos y editan sin que pares de crear." },
  { icon: "🎓", title: "Creadores educativos", benefit: "Reutiliza tu conocimiento", desc: "Formaciones, clases y webinars cobran nueva vida en formato corto. El mismo contenido, más canales." },
  { icon: "🏢", title: "Marcas y agencias", benefit: "Presencia constante en redes", desc: "Eventos, entrevistas o contenido corporativo convertido en clips listos para publicar cada mes." },
  { icon: "🎤", title: "Speakers y formadores", benefit: "Multiplica el alcance de cada charla", desc: "Una ponencia produce semanas de contenido de valor. Cada intervención trabaja por ti mucho más allá del evento." },
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
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Si grabas contenido largo, probablemente encajes aquí</h2>
          <p className="text-white/50 text-base font-light mb-10 max-w-lg">Funciona mejor cuando ya grabas de forma regular y quieres convertir ese contenido en semanas de publicaciones sin contratar un editor.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {aptoPara.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 hover:border-[rgba(232,255,71,0.15)] transition-all">
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="font-display font-bold text-sm mb-0.5">{item.title}</div>
              <div className="text-accent text-xs font-semibold mb-2">{item.benefit}</div>
              <p className="text-white/50 text-sm font-light leading-relaxed">{item.desc}</p>
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
