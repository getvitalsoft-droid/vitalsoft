"use client";
import { motion } from "framer-motion";

const pasos = [
  { num: "01", title: "Subes tu contenido", desc: "Podcast, entrevista, vídeo largo o stream. Lo subes a tu carpeta compartida de Google Drive — sin apps nuevas, sin aprender nada." },
  { num: "02", title: "Encontramos los mejores momentos", desc: "Seleccionamos los clips con más potencial para formato corto. Tú no tienes que marcar nada." },
  { num: "03", title: "Editamos y adaptamos", desc: "Subtítulos animados, ritmo, formato vertical 9:16 y optimización para cada plataforma." },
  { num: "04", title: "Recibes los clips en 24–48h", desc: "De vuelta en tu Drive. Revisas, pides ajustes si necesitas, y publicas cuando quieras en cualquier plataforma." },
];

const requisitos = [
  { icon: "🎙️", label: "Audio claro y entendible" },
  { icon: "📹", label: "Grabación estable, sin cortes bruscos" },
  { icon: "⏱️", label: "Material suficiente por episodio (+15 min)" },
  { icon: "🎯", label: "Contenido con estructura o conversación" },
  { icon: "📋", label: "Referencias si tienes preferencias de estilo" },
];

export default function StatsBar() {
  return (
    <>
      {/* Flujo */}
      <div className="bg-[#0f0f0f] border-y border-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-3">Cómo funciona</span>
            <h2 className="font-display font-extrabold text-2xl tracking-tight">De tu grabación a clips listos en 4 pasos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pasos.map((p, i) => (
              <motion.div key={p.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
                <div className="font-display font-black text-4xl text-accent/20 mb-3">{p.num}</div>
                <div className="font-display font-bold text-sm mb-2">{p.title}</div>
                <div className="text-white/35 text-xs leading-relaxed font-light">{p.desc}</div>
                {i < 3 && <div className="hidden lg:block absolute top-5 right-0 translate-x-1/2 text-white/10 text-lg">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Requisitos mínimos */}
      <div className="bg-[#080808] border-b border-white/5 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="md:w-1/3">
              <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-3">Requisitos mínimos</span>
              <h3 className="font-display font-bold text-lg mb-2">Para trabajar bien contigo necesitamos</h3>
              <p className="text-white/45 text-xs leading-relaxed font-light italic">La edición mejora el contenido. No reemplaza una mala grabación.</p>
            </div>
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {requisitos.map((r) => (
                <div key={r.label} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <span className="text-lg flex-shrink-0">{r.icon}</span>
                  <span className="text-white/55 text-sm font-light">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
