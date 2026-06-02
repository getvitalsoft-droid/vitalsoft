"use client";
// Punto 10: Flujo visual de transformación
// Muestra el antes/después del servicio sin ejemplos reales ni clientes

import { motion } from "framer-motion";

const INPUT = {
  label: "Lo que tú tienes",
  items: [
    { icon: "🎙️", text: "Un episodio de podcast de 60 minutos" },
    { icon: "🎥", text: "Una entrevista de YouTube de 45 minutos" },
    { icon: "📹", text: "Un vídeo largo grabado en cámara" },
    { icon: "🎤", text: "Una charla, clase o webinar" },
  ],
};

const OUTPUT = {
  label: "Lo que recibes",
  items: [
    { icon: "🗓️", text: "Semanas de publicaciones listas para TikTok, Reels y Shorts", accent: true },
    { icon: "📁", text: "Entrega en tu Drive en 24–48h" },
    { icon: "📱", text: "Entre 10 y 40 clips por plan · hasta 100 con plan personalizado", accent: false },
    { icon: "↕️", text: "Formato 9:16 listo para TikTok y Reels" },
    { icon: "◻️", text: "Formato 1:1 para Instagram feed" },
    { icon: "▶️", text: "Formato 16:9 para YouTube horizontal" },
    { icon: "✍️", text: "Subtítulos animados en todos los clips" },
  ],
};

const PASOS = [
  {
    n: "01",
    titulo: "Compartes tu carpeta de trabajo",
    desc: "Durante el onboarding nos compartes una carpeta de Google Drive donde subirás tus grabaciones. Trabajaremos siempre desde ahí y ahí recibirás todos los clips.",
    color: "text-accent",
  },
  {
    n: "02",
    titulo: "Onboarding breve",
    desc: "Un formulario donde nos indicas tu canal, estilo, referencias visuales y preferencias. Solo la primera vez. Lo guardamos para todos los ciclos.",
    color: "text-accent",
  },
  {
    n: "03",
    titulo: "Subes tu primera grabación",
    desc: "Podcast, vídeo, entrevista o clase. Lo subes a la carpeta compartida. Sin formatos especiales, sin instrucciones complicadas.",
    color: "text-white/60",
  },
  {
    n: "04",
    titulo: "Convertimos tu grabación en clips listos para publicar",
    desc: "Seleccionamos momentos, editamos, añadimos subtítulos y formateamos. Los clips aparecen en tu Drive en 24–48h desde la validación.",
    color: "text-white/60",
  },
  {
    n: "05",
    titulo: "Recibes semanas de contenido listo para publicar",
    desc: "Los clips son tuyos. Puedes publicarlos, programarlos o guardarlos. Si necesitas ajustes, los tienes incluidos en tu plan.",
    color: "text-white/60",
  },
];

export default function TransformationFlow() {
  return (
    <section className="py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">La transformación</span>
          <h2 className="font-display font-extrabold text-[clamp(1.8rem,3.5vw,2.8rem)] tracking-tight mb-3">
            Una grabación.<br />
            <span className="text-accent">Semanas de contenido.</span>
          </h2>
          <p className="text-white/45 text-base font-light max-w-md mx-auto">
            Así convertimos una sola grabación en semanas de publicaciones.
          </p>
        </motion.div>

        {/* Antes → Después */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start mb-16">

          {/* Input */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">{INPUT.label}</div>
            <div className="space-y-3">
              {INPUT.items.map(item => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span className="text-white/55 text-sm font-light leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="flex items-center justify-center py-4 md:py-0">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-[#080808] font-black text-lg">→</div>
              <div className="text-accent text-[10px] font-bold uppercase tracking-widest">VitalSoft</div>
            </div>
          </motion.div>

          {/* Output */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.15)] rounded-2xl p-6">
            <div className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">{OUTPUT.label}</div>
            <div className="space-y-3">
              {OUTPUT.items.map(item => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span className={`text-sm font-light leading-snug ${item.accent ? "text-white font-medium" : "text-white/65"}`}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Flujo paso a paso */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Después de contratar</div>
            <div className="font-display font-bold text-base text-white/85">Qué ocurre desde que contratas hasta que publicas</div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {PASOS.map((paso, i) => (
              <motion.div key={paso.n}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex items-start gap-5 px-6 py-5 hover:bg-white/[0.02] transition-colors">
                <div className={`font-display font-black text-2xl w-10 flex-shrink-0 ${paso.color}`}>{paso.n}</div>
                <div className="flex-1">
                  <div className="font-display font-bold text-sm text-white/85 mb-1">{paso.titulo}</div>
                  <div className="text-white/45 text-xs leading-relaxed font-light">{paso.desc}</div>
                </div>
                {(i === 0 || i === 1) && (
                  <div className="flex-shrink-0 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    VitalSoft
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stat bottom */}
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center text-white/25 text-xs mt-8">
          El número de clips depende del plan contratado y del material. De 10 a 100 clips al mes según el plan elegido.
        </motion.p>

      </div>
    </section>
  );
}
