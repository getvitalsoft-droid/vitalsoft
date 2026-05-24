"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  { q: "¿Cuál es el tiempo de entrega?", a: "La entrega estándar es de 24–48 horas por lote dependiendo de tu plan. Los clientes de Scale y Pro reciben prioridad con entrega en 24h. La entrega urgente (12h) está disponible como complemento para proyectos urgentes." },
  { q: "¿Cuántas revisiones incluye?", a: "Starter incluye 1 revisión por clip. Growth incluye 2. Los planes Scale y Pro incluyen revisiones ilimitadas hasta que estés 100% satisfecho. Queremos que ames cada vídeo." },
  { q: "¿Qué formatos y tipos de archivo aceptáis?", a: "Aceptamos MP4, MOV, AVI, MKV y la mayoría de formatos de vídeo. Entregamos en 9:16 vertical (TikTok/Reels/Shorts), 1:1 cuadrado y 16:9 horizontal. Todos los exports son en 1080p mínimo, con 4K disponible en Pro." },
  { q: "¿Cómo funciona la entrega del contenido?", a: "Tras suscribirte accederás a una carpeta compartida de Google Drive. Sube tu material en bruto ahí y nosotros subiremos los clips terminados a la misma carpeta dentro del plazo acordado. Simple y sin complicaciones." },
  { q: "¿Puedo cambiar o cancelar mi plan?", a: "Por supuesto. Puedes mejorar, reducir, pausar o cancelar tu plan cuando quieras desde tu panel de facturación. Los cambios se aplican al inicio del siguiente ciclo de facturación." },
  { q: "¿Trabajáis también con empresas y marcas?", a: "Sí. Trabajamos con creadores individuales, podcasters, agencias, marcas de e-commerce y clientes corporativos. Para necesidades grandes (50+ vídeos/mes) contáctanos para un presupuesto personalizado." },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">FAQ</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Preguntas frecuentes</h2>
          <p className="text-white/40 text-base font-light max-w-md mx-auto">Todo lo que necesitas saber antes de empezar.</p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={faq.q} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className={`glass rounded-xl overflow-hidden border transition-colors duration-200 ${open === i ? "border-[rgba(232,255,71,0.2)]" : ""}`}>
              <button className="w-full text-left px-6 py-5 flex items-center justify-between font-display font-semibold text-sm hover:text-accent transition-colors" onClick={() => setOpen(open === i ? null : i)}>
                {faq.q}
                <Plus size={18} className={`text-white/40 flex-shrink-0 ml-4 transition-transform duration-200 ${open === i ? "rotate-45 text-accent" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-6 pb-5"><p className="text-white/45 text-sm leading-relaxed font-light">{faq.a}</p></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
