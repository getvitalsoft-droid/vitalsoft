"use client";
import { motion } from "framer-motion";

const servicios = [
  {
    icon: "⏸️",
    title: "No vuelves a tocar el editor",
    desc: "Grabas, subes el material y recibes los clips listos. Seleccionamos los mejores momentos, editamos y entregamos. Tú no abres el editor nunca.",
    tags: ["Podcast", "Entrevistas", "YouTube", "Webinars"],
  },
  {
    icon: "✂️",
    title: "Convierte una grabación en semanas de contenido",
    desc: "Tomamos tu episodio, entrevista o vídeo e identificamos los momentos con más potencial. Los convertimos en clips de 30–90 segundos listos para publicar.",
    tags: ["Selección humana", "30–90 segundos", "Sin marcar nada"],
  },
  {
    icon: "✅",
    title: "Ajustes hasta que quede como quieres",
    desc: "Cada clip entregado incluye ajustes. Si algo no encaja con tu estilo o referencias, lo corregimos. Sin coste extra dentro del alcance de tu plan.",
    tags: ["Ajustes por clip", "Respuesta en 24h", "Sin coste extra"],
  },
  {
    icon: "📐",
    title: "Listo para todas las plataformas en un solo envío",
    desc: "Cada clip en 9:16 para TikTok y Reels, 1:1 para Instagram y 16:9 para YouTube horizontal. Subes el material una vez y lo tienes todo.",
    tags: ["9:16 vertical", "1:1 cuadrado", "16:9 horizontal"],
  },
  {
    icon: "✍️",
    title: "Subtítulos que aumentan la retención",
    desc: "Subtítulos precisos y bien diseñados en todos los clips. Hacen el contenido accesible y mejoran el tiempo de visualización, sin trabajo extra de tu parte.",
    tags: ["Subtítulos animados", "Alta retención", "Accesibilidad"],
  },
];

const noHacemos = [
  "Gestión de redes sociales",
  "Estrategia de contenido",
  "Publicación del contenido",
  "No prometemos viralidad ni crecimiento",
  "SEO ni optimización de algoritmo",
  "Consultoría de marca",
];

const vsEditor = [
  {
    label: "Gestión manual",
    items: [
      "Buscar y filtrar candidatos",
      "Coordinar revisiones y correos",
      "Gestionar plazos cada entrega",
      "Dependencia de disponibilidad",
      "Resultado inconsistente entre meses",
    ],
    bad: true,
  },
  {
    label: "VitalSoft",
    items: [
      "Sistema ya montado",
      "Flujo definido desde el primer mes",
      "Entrega predecible cada ciclo",
      "Sin gestión de personas",
      "Resultado consistente",
    ],
    bad: false,
  },
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">

        {/* Servicios */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">Servicios</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Lo convertimos en contenido listo para publicar</h2>
          <p className="text-white/50 text-base font-light mb-10 max-w-md">Recibes clips listos para publicar, adaptados a cada plataforma y entregados de forma constante cada mes.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {servicios.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`glass rounded-2xl p-7 border hover:border-white/15 transition-all duration-300 hover:-translate-y-1 ${i === 4 ? "md:col-span-2" : ""}`}>
              <div className="w-12 h-12 bg-[rgba(232,255,71,0.08)] rounded-xl flex items-center justify-center text-2xl mb-5">{s.icon}</div>
              <h3 className="font-display font-bold text-base mb-2">{s.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed font-light mb-4">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map(tag => <span key={tag} className="bg-white/[0.05] border border-white/[0.08] text-white/40 text-[11px] px-2.5 py-1 rounded">{tag}</span>)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lo que NO hacemos */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 mb-12">
          <div className="font-display font-bold text-sm text-white/50 mb-4">Lo que NO incluye el servicio</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {noHacemos.map(item => (
              <div key={item} className="flex items-start gap-2 text-white/35 text-xs">
                <span className="text-white/25 flex-shrink-0 mt-0.5">✕</span>{item}
              </div>
            ))}
          </div>
        </motion.div>

        {/* VitalSoft vs editor freelance */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display font-extrabold text-[clamp(1.6rem,3vw,2.2rem)] tracking-tight mb-2">La diferencia entre contratar una persona y contratar un sistema</h2>
          <p className="text-white/45 text-sm font-light mb-8 max-w-lg">
            La gestión manual tiene sus ventajas. VitalSoft es para quien prefiere un sistema. La diferencia no es calidad — es previsibilidad.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vsEditor.map((col) => (
              <div key={col.label} className={`rounded-2xl p-6 border ${col.bad ? "bg-white/[0.02] border-white/[0.06]" : "bg-[rgba(232,255,71,0.04)] border-[rgba(232,255,71,0.2)]"}`}>
                <div className={`font-display font-black text-sm mb-4 ${col.bad ? "text-white/40" : "text-accent"}`}>{col.label}</div>
                <ul className="space-y-2.5">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className={`flex-shrink-0 mt-0.5 ${col.bad ? "text-white/25" : "text-accent"}`}>{col.bad ? "—" : "✓"}</span>
                      <span className={col.bad ? "text-white/40" : "text-white/70"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
