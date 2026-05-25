"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "¿Cuál es el tiempo de entrega?",
    a: "El plazo comienza cuando recibimos el material correctamente en tu Drive, no desde el pago. Una vez validado el contenido, la entrega es en 24–48h según tu plan. Si el material llega incompleto o con problemas de calidad, te lo comunicamos antes de empezar.",
  },
  {
    q: "¿Qué cuenta como ajuste o revisión?",
    a: "Un ajuste es: cambiar un subtítulo, modificar un corte pequeño, ajustar timing, cambiar música o añadir zoom. No es ajuste: rehacer el estilo completo, pedir clips nuevos, cambiar branding, cambiar formato total o rehacer el episodio. Los cambios estructurales o solicitudes fuera del alcance se presupuestan aparte.",
  },
  {
    q: "¿Qué tipo de contenido funciona bien?",
    a: "Audio claro y entendible, conversaciones con opinión o valor, contenido con estructura definida, duración mínima de 15 minutos. No funcionan bien: streams caóticos sin estructura, audios con mucho ruido o baja calidad, contenido sin momentos destacables.",
  },
  {
    q: "¿Qué pasa si mi contenido no genera buenos clips?",
    a: "Lo más probable es que lo veamos antes de empezar. Si el material no cumple los mínimos de calidad, te lo comunicamos en la fase de validación. Si ya empezamos y el resultado no es el esperado por limitaciones del material original, lo hablamos contigo directamente para encontrar la mejor solución.",
  },
  {
    q: "¿Qué NO incluyen las revisiones?",
    a: "Las revisiones no incluyen: rehacer el estilo visual completo, solicitar clips adicionales no contemplados en el plan, cambiar branding o identidad desde cero, cambios masivos en múltiples clips a la vez. Todo esto se presupuesta como trabajo adicional.",
  },
  {
    q: "¿Cómo funciona la entrega del contenido?",
    a: "Tras suscribirte recibes acceso a un Drive compartido. Subes tu material allí con las instrucciones que te damos. Validamos el contenido, producimos los clips y los subimos al mismo Drive. Tú publicas cuando quieras.",
  },
  {
    q: "¿Qué formatos de archivo aceptáis?",
    a: "MP4, MOV, AVI, MKV y la mayoría de formatos de vídeo y audio estándar. Entregamos en 9:16 vertical (TikTok/Reels/Shorts), 1:1 cuadrado y 16:9 horizontal en 1080p mínimo.",
  },
  {
    q: "¿Puedo cambiar o cancelar mi plan?",
    a: "Sí. Puedes modificar o cancelar desde tu panel de facturación en cualquier momento. Los cambios se aplican al inicio del siguiente ciclo. No hay permanencia.",
  },
  {
    q: "¿Trabajáis con empresas y marcas?",
    a: "Sí. Trabajamos con creadores, podcasters, negocios y marcas que generan contenido largo y quieren distribución constante en redes. Para volúmenes grandes (más de 50 clips/mes) contáctanos para un presupuesto personalizado.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">FAQ</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Preguntas frecuentes</h2>
          <p className="text-white/40 text-base font-light max-w-md mx-auto">Todo lo que necesitas saber. Sin letra pequeña.</p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={faq.q} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className={`glass rounded-xl overflow-hidden border transition-colors duration-200 ${open === i ? "border-[rgba(232,255,71,0.2)]" : ""}`}>
              <button className="w-full text-left px-6 py-5 flex items-center justify-between font-display font-semibold text-sm hover:text-accent transition-colors"
                onClick={() => setOpen(open === i ? null : i)}>
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
