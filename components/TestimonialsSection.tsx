"use client";
import { motion } from "framer-motion";

const aptoPara = [
  { icon: "🎙️", title: "Podcasters", benefit: "Más frecuencia de publicación", desc: "Cada episodio se convierte en semanas de contenido para redes sin que toques el editor." },
  { icon: "▶️", title: "YouTubers", benefit: "Más rendimiento por vídeo", desc: "Cada vídeo largo genera clips para TikTok, Reels y Shorts. Más alcance con el mismo esfuerzo." },
  { icon: "🎮", title: "Streamers", benefit: "Aprovecha cada directo", desc: "Tus directos están llenos de momentos publicables. Los extraemos y editan sin que pares de crear." },
  { icon: "🎓", title: "Creadores educativos", benefit: "Reutiliza tu conocimiento", desc: "Formaciones, clases y webinars cobran nueva vida en formato corto. El mismo contenido, más canales." },
  { icon: "🏢", title: "Marcas y agencias", benefit: "Convierte eventos y entrevistas en semanas de contenido", desc: "Ruedas de prensa, entrevistas o contenido corporativo convertido en clips listos para publicar cada mes." },
  { icon: "🎤", title: "Speakers y formadores", benefit: "Multiplica el alcance de cada charla", desc: "Una ponencia produce semanas de contenido de valor. Cada intervención trabaja por ti mucho más allá del evento." },
];

const cuandoFunciona = [
  "Ya grabas contenido de forma regular",
  "Quieres publicar más sin dedicar tiempo a editar",
  "Buscas reutilizar contenido que ya tienes",
  "Necesitas consistencia en redes sin contratar un equipo",
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Para quién es</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Si ya grabas contenido largo, estás en el lugar correcto</h2>
          <p className="text-white/50 text-base font-light mb-10 max-w-lg">Si ya grabas podcasts, vídeos, directos o formaciones, VitalSoft convierte cada grabación en semanas de contenido listo para publicar.</p>
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
          className="bg-[rgba(232,255,71,0.03)] border border-white/[0.08] rounded-2xl p-6">
          <div className="font-display font-bold text-sm text-white/50 mb-4">✓ Sacarás más partido a VitalSoft cuando...</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cuandoFunciona.map((item) => (
              <div key={item} className="flex items-start gap-2 text-white/45 text-xs">
                <span className="text-accent flex-shrink-0 mt-0.5">✓</span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
