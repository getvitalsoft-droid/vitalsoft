"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut", delay },
});

// ── Secciones ──────────────────────────────────────────────────────────────

const TRAS_EL_PAGO = [
  { paso: "1", titulo: "Email de confirmación", desc: "En los minutos siguientes al pago recibes un email con acceso al onboarding y la confirmación de tu suscripción." },
  { paso: "2", titulo: "Formulario de onboarding", desc: "Un formulario breve donde nos cuentas tu canal, el tipo de contenido que produces, referencias de estilo y el link a tu Drive o nos indicas dónde subir el material." },
  { paso: "3", titulo: "Drive compartido asignado", desc: "Creamos y compartimos contigo una carpeta de Google Drive exclusiva. Tendrás acceso permanente desde el primer día." },
  { paso: "4", titulo: "Listo para empezar", desc: "Una vez completado el onboarding, solo tienes que subir tu material para que empiece el primer ciclo de producción." },
];

const CICLO_MENSUAL = [
  {
    titulo: "Subes tu contenido",
    desc: "Podcast, vídeo largo, entrevista o clase. Lo subes a tu carpeta Drive. Sin formatos especiales, sin requisitos extraños. Solo el archivo.",
    nota: "Fecha de subida recomendada: los primeros días del mes para recibir los clips antes del día 15.",
  },
  {
    titulo: "Validamos el material",
    desc: "Revisamos la calidad del audio y vídeo antes de empezar. Si hay algún problema te lo comunicamos antes de producir nada. Sin sorpresas al final.",
    nota: "La validación tarda menos de 24h en la mayoría de casos.",
  },
  {
    titulo: "Seleccionamos los mejores momentos",
    desc: "Identificamos los fragmentos con más potencial: momentos de valor, opiniones fuertes, remates, historias o frases con gancho. Tú no tienes que marcar nada.",
    nota: "Un episodio de 60 minutos suele generar entre 8 y 15 clips publicables.",
  },
  {
    titulo: "Producción de clips",
    desc: "Editamos cada clip: ritmo, cortes, subtítulos animados, música si aplica, formato vertical 9:16. Aplicamos el estilo que nos indicaste en el onboarding.",
    nota: "Tiempo de producción: 24–48h según tu plan desde la validación del material.",
  },
  {
    titulo: "Entrega en Drive",
    desc: "Los clips aparecen en tu carpeta Drive organizados y listos. Puedes descargarlos, revisarlos y publicarlos cuando quieras en cualquier plataforma.",
    nota: "Los archivos se entregan en todos los formatos incluidos en tu plan.",
  },
  {
    titulo: "Revisiones si las necesitas",
    desc: "Si algún clip necesita ajuste, nos lo indicas directamente. Tienes un número de ajustes por clip según tu plan. Cada ajuste = un cambio concreto.",
    nota: "Los ajustes se procesan en menos de 24h en la mayoría de casos.",
  },
];

const QUE_RECIBE = [
  { formato: "9:16 vertical", plataformas: "TikTok · Instagram Reels · YouTube Shorts", incluye: "Todos los planes" },
  { formato: "1:1 cuadrado", plataformas: "Instagram feed · Facebook", incluye: "Growth, Scale, Pro" },
  { formato: "16:9 horizontal", plataformas: "YouTube · LinkedIn", incluye: "Growth, Scale, Pro" },
];

const REVISIONES_SI = [
  "Cambiar un subtítulo",
  "Modificar un corte o timing",
  "Ajustar la música de fondo",
  "Cambiar la posición de un elemento",
  "Añadir o quitar un zoom",
  "Corrección de ortografía en subtítulos",
];

const REVISIONES_NO = [
  "Rehacer el estilo visual completo",
  "Solicitar clips adicionales no contemplados en el plan",
  "Cambiar branding o identidad desde cero",
  "Cambios masivos en múltiples clips a la vez",
  "Producir contenido nuevo no incluido en el material original",
];

const MES_A_MES = [
  { titulo: "El flujo se repite cada ciclo", desc: "Cada mes subes contenido nuevo y recibes un lote nuevo de clips. El proceso es siempre igual, predecible y sin gestión de tu parte." },
  { titulo: "Tu Drive crece como archivo", desc: "Todos los clips producidos quedan en tu Drive de forma permanente. Tienes acceso a todo el historial de entregas en cualquier momento." },
  { titulo: "Puedes pausar cuando necesites", desc: "Si un mes no tienes material o quieres tomarte un descanso, puedes pausar tu suscripción hasta 30 días desde tu portal de cliente. Sin cobros durante la pausa." },
  { titulo: "Cancelas cuando quieras", desc: "Sin permanencia. Si decides cancelar, sigues activo hasta el final del período ya pagado. No hay penalizaciones ni cargos extra." },
];

// ── Componente ─────────────────────────────────────────────────────────────

export default function ComoFuncionaContent() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">

      {/* Header */}
      <motion.div {...fade(0)} className="mb-16">
        <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-5">Cómo funciona</span>
        <h1 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-[1.05] mb-4">
          Todo lo que ocurre desde el pago hasta que publicas.
        </h1>
        <p className="text-white/50 text-base font-light leading-relaxed max-w-xl">
          Esta página existe para que sepas exactamente qué esperar. Sin letra pequeña, sin sorpresas.
          Si después de leerla tienes dudas, escríbenos.
        </p>
      </motion.div>

      {/* ── 1. TRAS EL PAGO ── */}
      <Section num="01" titulo="Qué ocurre después del pago">
        <div className="space-y-4">
          {TRAS_EL_PAGO.map((p, i) => (
            <motion.div key={p.paso} {...fade(i * 0.06)}
              className="flex gap-4 bg-white/[0.02] border border-white/[0.07] rounded-xl p-5">
              <div className="font-display font-black text-accent text-lg w-6 flex-shrink-0">{p.paso}</div>
              <div>
                <div className="font-display font-bold text-sm text-white/85 mb-1">{p.titulo}</div>
                <div className="text-white/50 text-sm font-light leading-relaxed">{p.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 2. CICLO MENSUAL ── */}
      <Section num="02" titulo="El ciclo mensual de producción">
        <div className="space-y-5">
          {CICLO_MENSUAL.map((paso, i) => (
            <motion.div key={paso.titulo} {...fade(i * 0.05)} className="border-l-2 border-white/[0.08] pl-6 py-1">
              <div className="font-display font-bold text-sm text-white/85 mb-1">{paso.titulo}</div>
              <p className="text-white/50 text-sm font-light leading-relaxed mb-2">{paso.desc}</p>
              <p className="text-white/30 text-xs italic">{paso.nota}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 3. QUÉ RECIBE ── */}
      <Section num="03" titulo="Qué recibes exactamente">
        <div className="space-y-3 mb-6">
          {QUE_RECIBE.map((f) => (
            <div key={f.formato} className="flex items-start justify-between gap-4 bg-white/[0.02] border border-white/[0.07] rounded-xl px-5 py-4">
              <div>
                <div className="font-display font-bold text-sm text-white/85 mb-0.5">{f.formato}</div>
                <div className="text-white/40 text-xs">{f.plataformas}</div>
              </div>
              <div className="text-accent text-xs font-semibold bg-accent/10 border border-accent/20 px-2.5 py-1 rounded whitespace-nowrap flex-shrink-0">
                {f.incluye}
              </div>
            </div>
          ))}
        </div>
        <div className="text-white/40 text-sm font-light leading-relaxed">
          Resolución mínima de entrega: <span className="text-white/60">1080p</span>.<br />
          Todos los clips incluyen subtítulos animados.<br />
          Acceso permanente a todos los archivos en tu Drive.
        </div>
      </Section>

      {/* ── 4. REVISIONES ── */}
      <Section num="04" titulo="Cómo funcionan las revisiones">
        <p className="text-white/50 text-sm font-light leading-relaxed mb-6">
          Cada plan incluye un número de ajustes por clip. Un ajuste es un cambio concreto sobre un clip ya entregado.
          Las revisiones no son rehacer el clip desde cero.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.15)] rounded-xl p-5">
            <div className="text-accent text-xs font-bold uppercase tracking-wide mb-3">Sí es un ajuste</div>
            <ul className="space-y-2">
              {REVISIONES_SI.map(r => (
                <li key={r} className="flex items-start gap-2 text-white/60 text-xs">
                  <Check size={12} className="text-accent flex-shrink-0 mt-0.5" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-5">
            <div className="text-white/35 text-xs font-bold uppercase tracking-wide mb-3">No es un ajuste</div>
            <ul className="space-y-2">
              {REVISIONES_NO.map(r => (
                <li key={r} className="flex items-start gap-2 text-white/45 text-xs">
                  <span className="text-white/25 flex-shrink-0 mt-0.5">✕</span>{r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-white/30 text-xs italic">
          Los cambios fuera del alcance se presupuestan como trabajo adicional antes de realizarlos.
        </p>
      </Section>

      {/* ── 5. MES A MES ── */}
      <Section num="05" titulo="Qué ocurre mes a mes">
        <div className="space-y-4">
          {MES_A_MES.map((m, i) => (
            <motion.div key={m.titulo} {...fade(i * 0.06)}
              className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-2 flex-shrink-0" />
              <div>
                <div className="font-display font-bold text-sm text-white/85 mb-1">{m.titulo}</div>
                <p className="text-white/50 text-sm font-light leading-relaxed">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── CTA final ── */}
      <motion.div {...fade(0.1)}
        className="mt-16 bg-[rgba(232,255,71,0.05)] border border-[rgba(232,255,71,0.2)] rounded-2xl p-8 text-center">
        <h2 className="font-display font-black text-xl mb-2">¿Listo para empezar?</h2>
        <p className="text-white/45 text-sm font-light mb-6 max-w-sm mx-auto">
          Elige tu plan, completa el onboarding y sube tu primer contenido. El primer lote de clips llega en 24–48h.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/#precios"
            className="bg-accent hover:bg-accent-2 text-[#080808] font-display font-bold px-7 py-3 rounded-xl text-sm transition-all hover:-translate-y-0.5">
            Ver planes →
          </a>
          <a href="mailto:getvitalsoft@gmail.com"
            className="border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-display font-semibold px-7 py-3 rounded-xl text-sm transition-all">
            Tengo preguntas
          </a>
        </div>
      </motion.div>

    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────

function Section({ num, titulo, children }: { num: string; titulo: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="mb-14">
      <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-white/[0.07]">
        <span className="font-display font-black text-accent/40 text-2xl">{num}</span>
        <h2 className="font-display font-extrabold text-lg text-white/90">{titulo}</h2>
      </div>
      {children}
    </motion.div>
  );
}
