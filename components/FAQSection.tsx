"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "¿Qué necesito enviaros para empezar?",
    a: "Solo el archivo de tu grabación. No necesitas cámara profesional, micrófono especial ni formatos concretos. Grabas como siempre, lo subes a tu carpeta Drive compartida y nosotros nos encargamos del resto. Aceptamos MP4, MOV, AVI, MKV y la mayoría de formatos estándar de audio y vídeo.",
  },
  {
    q: "¿Quién selecciona los momentos para los clips?",
    a: "Nosotros. El equipo de VitalSoft revisa tu material e identifica los momentos más relevantes, claros y con potencial de retención. Tú indicas el estilo o referencias en el onboarding, y contamos con ajustes para que el resultado se alinee con lo que necesitas.",
  },
  {
    q: "¿Cuál es el tiempo de entrega?",
    a: "El plazo empieza cuando recibimos tu material en Drive y lo validamos, no desde el pago. Una vez validado: Starter 48h, Growth 36h, Scale 24h, Pro prioridad máxima. Si el material llega con problemas de calidad, te lo comunicamos antes de empezar.",
  },
  {
    q: "¿Y si no me gusta algún clip?",
    a: "Si algún clip no encaja con tu estilo o referencias, puedes solicitar los ajustes incluidos en tu plan. Corregimos subtítulos, cortes, timing, música o elementos visuales dentro del alcance definido. El objetivo es que el resultado final sea exactamente lo que necesitas.",
  },
  {
    q: "¿Los clips son míos? ¿Quién tiene los derechos?",
    a: "Todo el contenido producido es tuyo al 100%. VitalSoft no retiene derechos sobre los clips ni sobre el material original. Puedes publicar, redistribuir o modificar los clips como quieras sin ninguna restricción.",
  },
  {
    q: "¿Los clips los genera una IA?",
    a: "Utilizamos herramientas de IA dentro del proceso de producción, pero cada entrega pasa por revisión y edición humana. Nos aseguramos de que el resultado tenga coherencia, ritmo y calidad antes de entregarlo.",
  },
  {
    q: "¿Puedo pausar o cancelar?",
    a: "Sí. Puedes pausar hasta 30 días o cancelar en cualquier momento desde tu portal de cliente. Sin permanencia. Si cancelas, sigues activo hasta el final del período ya pagado.",
  },
  {
    q: "¿Por qué no contratar un editor freelance?",
    a: "Un freelance puede ser una buena opción. VitalSoft es para quienes prefieren un sistema predecible: capacidad fija, tiempos definidos, entrega consistente y sin necesidad de gestionar personas. La diferencia no es calidad — es previsibilidad.",
  },
  {
    q: "¿Qué tipo de contenido funciona mejor?",
    a: "Funciona bien: podcasts, entrevistas, formación, webinars y contenido educativo con estructura clara y audio entendible.\n\nFunciona peor: streams caóticos sin estructura, audio con mucho ruido o contenido sin momentos destacables.\n\nSi tienes dudas sobre tu caso concreto, consúltanos antes de suscribirte.",
  },
  {
    q: "¿Qué cuenta como ajuste?",
    a: "Un ajuste es: cambiar un subtítulo, modificar un corte, ajustar timing, cambiar música o añadir zoom. No es ajuste: rehacer el estilo completo, pedir clips nuevos fuera del plan, cambiar branding desde cero o rehacer el episodio. Los cambios fuera del alcance se presupuestan aparte.",
  },
  {
    q: "¿Cómo funciona la entrega?",
    a: "Tras suscribirte compartes una carpeta de Google Drive con nosotros. Subes tu material con las instrucciones del onboarding. Validamos el contenido, producimos los clips y los subimos al mismo Drive. Tú publicas cuando y donde quieras.",
  },
  {
    q: "¿Qué formatos entregáis?",
    a: "9:16 vertical para TikTok, Reels y Shorts. 1:1 cuadrado para Instagram. 16:9 horizontal para YouTube. Formatos disponibles según plan. Resolución mínima 1080p. Formatos de entrada aceptados: MP4, MOV, AVI, MKV y la mayoría de formatos estándar.",
  },
  {
    q: "¿VitalSoft es solo para creadores?",
    a: "No. También trabajamos con marcas, podcasts, coaches, formadores y equipos de marketing que generan contenido largo de forma recurrente. Si grabas con regularidad y quieres más distribución, encajas. Para volúmenes superiores a 50 clips/mes usa la calculadora o escríbenos.",
  },
  {
    q: "¿Qué pasa si no uso todos mis clips ese mes?",
    a: "Los clips no utilizados no se acumulan ni se trasladan al mes siguiente. Cada ciclo mensual empieza desde cero con la capacidad de tu plan. Si un mes tienes menos material del habitual, puedes pausar la suscripción hasta 30 días sin coste.",
  },
  {
    q: "¿Cuántos clips salen de un episodio?",
    a: "Depende del contenido. Un episodio puede generar muy pocos clips si tiene poco valor reutilizable, o decenas si está lleno de momentos útiles, frases con gancho o historias. Por eso hablamos de capacidad mensual y no de una cantidad fija por vídeo. Lo que importa es el volumen de material que produces al mes.",
  },
  {
    q: "¿Puedo cambiar de plan o reducir volumen?",
    a: "Sí. Puedes cambiar de plan al final de tu ciclo mensual. Si un mes necesitas menos clips, puedes pausar hasta 30 días o cancelar sin penalización. Sin permanencia en ningún plan.",
  },

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">FAQ</span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">Preguntas frecuentes</h2>
          <p className="text-white/45 text-base font-light max-w-md mx-auto">Todo lo que necesitas saber antes de empezar.</p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={faq.q} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className={`glass rounded-xl overflow-hidden border transition-colors duration-200 ${open === i ? "border-[rgba(232,255,71,0.2)]" : ""}`}>
              <button className="w-full text-left px-6 py-5 flex items-center justify-between font-display font-semibold text-sm text-white/80 hover:text-accent transition-colors"
                onClick={() => setOpen(open === i ? null : i)}>
                {faq.q}
                <Plus size={18} className={`text-white/40 flex-shrink-0 ml-4 transition-transform duration-200 ${open === i ? "rotate-45 text-accent" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-6 pb-5"><p className="text-white/55 text-sm leading-relaxed font-light">{faq.a}</p></div>
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
