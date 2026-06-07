"use client";
import { useState } from "react";
import Image from "next/image";

// PREVIEW INTERNO — /onboarding-preview
// Sin contraseña. Datos de ejemplo precargados. No envía nada.

const PLANES = [
  { key: "starter", nombre: "Starter", clips: 10, precio: 150 },
  { key: "growth",  nombre: "Growth",  clips: 20, precio: 250 },
  { key: "scale",   nombre: "Scale",   clips: 30, precio: 350 },
  { key: "pro",     nombre: "Pro",     clips: 40, precio: 450 },
  { key: "custom",  nombre: "Plan personalizado", clips: 25, precio: 325 },
];

const PLATAFORMAS = ["TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn", "Twitter/X", "Facebook"];
const TIPOS = ["Podcast", "Entrevistas", "YouTube largo", "Webinar / Formación", "Eventos", "Otro"];
const DURACIONES = ["15–30 min", "30–60 min", "1–2h", "Más de 2h", "Varía"];
const FRECUENCIAS = ["1–2 por semana", "3–4 por semana", "1 por semana", "Quincenal", "Mensual"];

const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20 resize-none";
const labelCls = "block text-xs text-white/35 font-medium mb-1.5";

const pasosDrive = [
  { num: "1", texto: "Haz clic derecho sobre la carpeta → Compartir → Compartir", img: "/onboarding/drive-paso1.png", alt: "Clic derecho en carpeta Drive" },
  { num: "2", texto: "Se abre el panel de uso compartido. Por defecto está en Restringido.", img: "/onboarding/drive-paso2.png", alt: "Panel compartir Drive restringido" },
  { num: "3", texto: "Pulsa el desplegable y selecciona \"Cualquier persona con el enlace\"", img: "/onboarding/drive-paso3.png", alt: "Seleccionar cualquier persona con el enlace" },
  { num: "4", texto: "Cambia el rol a Editor (necesitamos poder subir los clips). Luego copia el enlace.", img: "/onboarding/drive-paso4.png", alt: "Cambiar rol a Editor" },
];

export default function OnboardingPreviewPage() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [drivePendiente, setDrivePendiente] = useState(false);
  const [planIdx, setPlanIdx] = useState(1);

  const [form, setForm] = useState({
    nombre_proyecto: "Mi Podcast Semanal",
    redes_sociales: "@mipodcast · youtube.com/mipodcast",
    tipo_contenido: "Podcast",
    plataformas: ["TikTok", "Instagram Reels"] as string[],
    duracion_media: "30–60 min",
    frecuencia_grabacion: "1 por semana",
    idioma: "Español",
    drive_link: "https://drive.google.com/drive/folders/ejemplo",
    referencias: "https://www.tiktok.com/@ejemplo",
    instrucciones: "Subtítulos en blanco, sin emojis, cortes dinámicos",
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const togglePlat = (p: string) => set("plataformas", form.plataformas.includes(p)
    ? form.plataformas.filter((x: string) => x !== p)
    : [...form.plataformas, p]);

  const plan = PLANES[planIdx];

  const planBadge = () => {
    if (plan.key === "custom") return `Plan personalizado · ${plan.clips} clips/mes`;
    return `Plan ${plan.nombre} · ${plan.clips} clips/mes`;
  };

  if (done) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">✅</div>
        <h2 className="font-display font-black text-2xl mb-3 text-[#d4f53c]">¡Todo listo!</h2>
        <p className="text-white/55 text-sm leading-relaxed mb-6">
          Hemos recibido tu configuración. En cuanto subas tu primer material al Drive empezamos a producir.
        </p>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-left space-y-3 mb-6">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Próximos pasos</p>
          {drivePendiente ? (
            <p className="text-white/45 text-xs flex gap-2"><span>📁</span><span>Cuando tengas el material listo, súbelo al Drive y envíanos el enlace a hola@vitalsoft.pro</span></p>
          ) : (
            <p className="text-white/45 text-xs flex gap-2"><span>📁</span><span>Sube tu primera grabación a la carpeta de Drive que nos has indicado</span></p>
          )}
          <p className="text-white/45 text-xs flex gap-2"><span>⏱️</span><span>El plazo empieza cuando recibimos y validamos tu material, no ahora</span></p>
          <p className="text-white/45 text-xs flex gap-2"><span>📧</span><span>Recibirás un email cuando empecemos la edición</span></p>
          <p className="text-white/45 text-xs flex gap-2"><span>✏️</span><span>Podrás solicitar ajustes una vez recibas los clips</span></p>
        </div>
        <button onClick={() => { setStep(1); setDone(false); setDrivePendiente(false); }} className="text-white/30 text-xs underline">
          ← Volver al inicio del preview
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12">
      <div className="max-w-xl mx-auto">

        {/* Banner preview */}
        <div className="bg-[rgba(232,255,71,0.06)] border border-[rgba(232,255,71,0.15)] rounded-xl px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#d4f53c] text-xs font-bold uppercase tracking-widest">Preview interno</span>
            <span className="text-white/25 text-xs">· Datos de ejemplo · No se envía nada</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/30 text-xs">Simular plan:</span>
            <div className="flex gap-1 flex-wrap">
              {PLANES.map((p, i) => (
                <button key={p.key} onClick={() => setPlanIdx(i)}
                  className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${planIdx === i ? "bg-[#d4f53c] text-[#080808]" : "text-white/30 border border-white/10 hover:border-white/20"}`}>
                  {p.key === "custom" ? "Personalizado" : p.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="font-display font-black text-xl mb-3">
            <span className="text-[#d4f53c]">Vital</span><span className="text-white/70">Soft</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#d4f53c]" />
            <span className="text-white/50 text-xs">{planBadge()}</span>
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">Bienvenido a VitalSoft.</h1>
          <p className="text-white/35 text-sm max-w-sm mx-auto">Completa esta configuración una sola vez para que podamos empezar a producir tus clips.</p>
          <div className="flex justify-center items-center gap-2 mt-5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-8 h-1 rounded-full transition-all duration-300 ${step >= s ? "bg-[#d4f53c]" : "bg-white/10"}`} />
            ))}
            <span className="text-white/20 text-xs ml-2">Paso {step} de 3 · ~{step === 1 ? "3" : "2"} min</span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7">

          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">01 — Tu proyecto</h2>
              <div>
                <label className={labelCls}>Nombre del proyecto o canal</label>
                <input type="text" placeholder="Mi Podcast, Canal de Juan..." value={form.nombre_proyecto}
                  onChange={e => set("nombre_proyecto", e.target.value)} className={inp} />
              </div>
              <div>
                <label className={labelCls}>Redes sociales <span className="text-white/20 font-normal">(usuario o URL)</span></label>
                <input type="text" placeholder="@tuusuario · youtube.com/canal..." value={form.redes_sociales}
                  onChange={e => set("redes_sociales", e.target.value)} className={inp} />
              </div>
              <div>
                <label className={labelCls}>Tipo de contenido *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS.map(t => (
                    <button key={t} type="button" onClick={() => set("tipo_contenido", t)}
                      className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${form.tipo_contenido === t ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Plataformas objetivo *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlat(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.plataformas.includes(p) ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(2)}
                className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all mt-2">
                Siguiente →
              </button>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">02 — Tu contenido</h2>
              <div>
                <label className={labelCls}>Duración media del episodio</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURACIONES.map(d => (
                    <button key={d} type="button" onClick={() => set("duracion_media", d)}
                      className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${form.duracion_media === d ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Frecuencia de grabación</label>
                <div className="grid grid-cols-2 gap-2">
                  {FRECUENCIAS.map(f => (
                    <button key={f} type="button" onClick={() => set("frecuencia_grabacion", f)}
                      className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${form.frecuencia_grabacion === f ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Idioma del contenido</label>
                <select value={form.idioma} onChange={e => set("idioma", e.target.value)} className={inp + " appearance-none"}>
                  {["Español", "Inglés", "Portugués", "Francés", "Otro"].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Referencias de estilo <span className="text-white/20 font-normal">(opcional)</span></label>
                <textarea rows={2} placeholder="URLs de clips que te gustan como referencia visual..."
                  value={form.referencias} onChange={e => set("referencias", e.target.value)} className={inp} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all">Siguiente →</button>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">03 — Material y entrega</h2>

              {/* Instrucciones Drive en desplegable */}
              <details className="bg-white/[0.02] border border-white/[0.07] rounded-xl overflow-hidden group">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between list-none">
                  <div>
                    <p className="text-white/55 text-xs font-semibold">¿Necesitas ayuda para obtener el enlace?</p>
                    <p className="text-white/25 text-xs mt-0.5">Ver cómo compartir tu carpeta de Google Drive</p>
                  </div>
                  <span className="text-white/30 text-xs ml-3 flex-shrink-0 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                  {pasosDrive.map((paso) => (
                    <div key={paso.num} className="p-4">
                      <div className="flex gap-3 items-start mb-3">
                        <span className="text-[#d4f53c] font-display font-black text-sm flex-shrink-0 w-5">{paso.num}.</span>
                        <p className="text-white/50 text-xs leading-relaxed">{paso.texto}</p>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-white/[0.06] ml-8">
                        <Image src={paso.img} alt={paso.alt} width={600} height={340} className="w-full h-auto object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {!drivePendiente ? (
                <div>
                  <label className={labelCls}>Enlace de tu carpeta de Google Drive *</label>
                  <input type="url" placeholder="https://drive.google.com/drive/folders/..."
                    value={form.drive_link} onChange={e => set("drive_link", e.target.value)} className={inp} />
                  <p className="text-white/20 text-xs mt-1.5">Ejemplo: <span className="text-white/35">drive.google.com/drive/folders/xxxxx</span></p>
                  <button type="button" onClick={() => { setDrivePendiente(true); set("drive_link", ""); }}
                    className="text-white/25 text-xs mt-2 hover:text-white/45 transition-colors underline">
                    Aún no tengo el material preparado →
                  </button>
                </div>
              ) : (
                <div className="bg-[rgba(232,255,71,0.03)] border border-[rgba(232,255,71,0.1)] rounded-xl p-4">
                  <p className="text-[#d4f53c] text-xs font-semibold mb-1">Sin material por ahora</p>
                  <p className="text-white/40 text-xs mb-3">Completaremos el onboarding y te enviaremos instrucciones por email cuando estés listo.</p>
                  <button type="button" onClick={() => setDrivePendiente(false)} className="text-white/30 text-xs hover:text-white/50 transition-colors underline">← Tengo el enlace ahora</button>
                </div>
              )}

              <div>
                <label className={labelCls}>Instrucciones para la edición <span className="text-white/20 font-normal">(opcional)</span></label>
                <textarea rows={3} placeholder="Estilo de subtítulos, música, ritmo de cortes, cosas a evitar..."
                  value={form.instrucciones} onChange={e => set("instrucciones", e.target.value)} className={inp} />
              </div>

              <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-4 text-xs text-white/40 space-y-1.5">
                <p className="text-[#d4f53c] font-semibold mb-2">⏱️ Sobre los plazos</p>
                <p>El plazo empieza cuando recibimos y <strong className="text-white/60">validamos</strong> tu material, no desde el pago.</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={() => setDone(true)}
                  className="flex-1 py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all">
                  Confirmar →
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/15 text-[10px] mt-6">Vista previa interna · Los datos no se envían</p>
      </div>
    </main>
  );
}
