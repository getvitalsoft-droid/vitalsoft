"use client";
import { motion } from "framer-motion";

const servicios = [
  {
    icon: "✂️",
    title: "Conversión de contenido largo → clips",
    desc: "Tomamos tu episodio, entrevista o vídeo largo y lo convertimos en clips de 30–90 segundos listos para publicar. Identificamos los mejores momentos y los preparamos para cada plataforma.",
    tags: ["Podcast", "Entrevistas", "YouTube", "Webinars"],
    principal: true,
  },
  {
    icon: "📐",
    title: "Formato multiplataforma",
    desc: "Cada clip en formato 9:16 para TikTok y Reels, 1:1 para Instagram feed y 16:9 para YouTube. Un solo envío, distribución en todas las plataformas.",
    tags: ["9:16 vertical", "1:1 cuadrado", "16:9 horizontal"],
    principal: true,
  },
  {
    icon: "✍️",
    title: "Subtítulos animados",
    desc: "Subtítulos precisos, bien diseñados y alineados con la identidad visual que nos indiques. Aumentan retención y accesibilidad sin esfuerzo tuyo.",
    tags: ["Subtítulos animados", "Identidad visual", "Accesibilidad"],
    principal: true,
  },
  {
    icon: "🎙️",
    title: "Edición de episodio completo",
    desc: "Edición del podcast completo: limpieza de audio, eliminación de silencios, intro/outro y masterización. Solo en planes Scale y Pro.",
    tags: ["Audio limpio", "Masterización", "Intro/outro"],
    principal: false,
  },
];

const noHacemos = [
  "Gestión de redes sociales",
  "Estrategia de contenido",
  "Garantizamos viralidad ni crecimiento",
  "Publicación del contenido",
  "SEO ni optimización de algoritmo",
  "Consultoría de marca",
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Servicios</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Lo que hacemos. Nada más.</h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">Somos un sistema de producción de clips. No una agencia de crecimiento, no consultores de estrategia.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {servicios.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 ${s.principal ? "glass hover:border-white/15" : "bg-white/[0.02] border-white/[0.05] hover:border-white/10"}`}>
              <div className="w-12 h-12 bg-[rgba(232,255,71,0.08)] rounded-xl flex items-center justify-center text-2xl mb-5">{s.icon}</div>
              <h3 className="font-display font-bold text-base mb-2">{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed font-light mb-4">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map(tag => <span key={tag} className="bg-white/[0.04] border border-white/[0.07] text-white/35 text-[11px] px-2.5 py-1 rounded">{tag}</span>)}
              </div>
              {!s.principal && <p className="text-white/20 text-xs mt-3 italic">Solo disponible en planes Scale y Pro</p>}
            </motion.div>
          ))}
        </div>

        {/* Lo que NO hacemos */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <div className="font-display font-bold text-sm text-white/40 mb-4">Lo que NO incluye el servicio</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {noHacemos.map(item => (
              <div key={item} className="flex items-start gap-2 text-white/25 text-xs">
                <span className="text-white/20 flex-shrink-0 mt-0.5">✕</span>{item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
