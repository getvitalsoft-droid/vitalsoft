"use client";
import { useState } from "react";

// PREVIEW INTERNO — Solo accesible desde /onboarding-preview
// No aparece en navegación ni footer. Solo para revisión interna del flujo.

const PREVIEW_KEY = "vitalsoft_preview_2024";

const PLANES = [
  { key: "starter", nombre: "Starter", clips: 10, precio: 150 },
  { key: "growth",  nombre: "Growth",  clips: 20, precio: 250 },
  { key: "scale",   nombre: "Scale",   clips: 30, precio: 350 },
  { key: "pro",     nombre: "Pro",     clips: 40, precio: 450 },
];

const PLATAFORMAS = ["TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn", "Twitter/X", "Facebook"];
const TIPOS = ["Podcast", "Entrevistas", "YouTube largo", "Webinar / Formación", "Eventos", "Otro"];
const DURACIONES = ["15–30 min", "30–60 min", "1–2h", "Más de 2h", "Varía"];
const FRECUENCIAS = ["1–2 por semana", "3–4 por semana", "1 por semana", "Quincenal", "Mensual"];

const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20 resize-none";
const labelCls = "block text-xs text-white/35 font-medium mb-1.5";

export default function OnboardingPreviewPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [planIdx, setPlanIdx] = useState(1);

  const [form, setForm] = useState({
    email: "cliente@ejemplo.com",
    nombre_proyecto: "Mi Podcast Semanal",
    redes_sociales: "@mipodcast · youtube.com/mipodcast",
    tipo_contenido: "Podcast",
    plataformas: ["TikTok", "Instagram Reels"] as string[],
    duracion_media: "30–60 min",
    frecuencia_grabacion: "1 por semana",
    idioma: "Español",
    drive_link: "https://drive.google.com/drive/folders/ejemplo",
    referencias: "https://www.tiktok.com/@ejemplo",
    estilo_notas: "Subtítulos en blanco, sin emojis, cortes dinámicos",
    notas_importantes: "Tenemos intro de 30s que preferimos no cortar",
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const togglePlat = (p: string) => set("plataformas", form.plataformas.includes(p) ? form.plataformas.filter((x: string) => x !== p) : [...form.plataformas, p]);

  const plan = PLANES[planIdx];

  if (!unlocked) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="font-display font-black text-xl mb-2"><span className="text-[#d4f53c]">Vital</span><span className="text-white/70">Soft</span></div>
        <p className="text-white/30 text-xs mb-8">Vista previa interna del onboarding</p>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-white/50 text-sm mb-4">Introduce la contraseña de acceso</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pw === PREVIEW_KEY) setUnlocked(true); else setPwError(true); }}}
            className={inp + " mb-3"}
          />
          {pwError && <p className="text-red-400 text-xs mb-3">Contraseña incorrecta</p>}
          <button
            onClick={() => { if (pw === PREVIEW_KEY) setUnlocked(true); else setPwError(true); }}
            className="w-full py-3 bg-[#d4f53c] text-[#080808] font-display font-black rounded-xl text-sm"
          >
            Ver preview →
          </button>
        </div>
        <p className="text-white/15 text-[10px] mt-4">Esta página no está enlazada públicamente</p>
      </div>
    </main>
  );

  if (done) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🎉</div>
        <h2 className="font-display font-black text-2xl mb-3 text-[#d4f53c]">¡Todo listo!</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-4">
          Hemos recibido tu información. Nuestro equipo revisará tu Drive en las próximas horas.
        </p>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-left text-xs text-white/35 space-y-2 mb-6">
          <p>📁 Sube tu material al Drive que nos has indicado</p>
          <p>⏱️ El plazo empieza cuando validamos el material, no ahora</p>
          <p>📧 Recibirás un email cuando empecemos la edición</p>
          <p>✏️ Podrás pedir ajustes una vez recibas los clips</p>
        </div>
        <button onClick={() => { setStep(1); setDone(false); }} className="text-white/30 text-xs underline">
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
            <span className="text-white/25 text-xs">· Datos de ejemplo precargados · No se envía nada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">Simular plan:</span>
            <div className="flex gap-1">
              {PLANES.map((p, i) => (
                <button key={p.key} onClick={() => setPlanIdx(i)}
                  className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${planIdx === i ? "bg-[#d4f53c] text-[#080808]" : "text-white/30 border border-white/10 hover:border-white/20"}`}>
                  {p.nombre}
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
            <span className="text-white/50 text-xs">Plan <span className="text-white/80 font-semibold">{plan.nombre}</span> activo · {plan.clips} clips/mes · {plan.precio}€/mes</span>
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">Configura tu proyecto</h1>
          <p className="text-white/35 text-sm">Solo necesitamos esto una vez. Lo guardamos para todos tus ciclos.</p>
          <div className="flex justify-center items-center gap-2 mt-4">
            {[1,2,3].map(s => (
              <div key={s} className={`w-8 h-1 rounded-full transition-all duration-300 ${step >= s ? "bg-[#d4f53c]" : "bg-white/10"}`} />
            ))}
            <span className="text-white/20 text-xs ml-2">
              Paso {step} de 3 · ~{step === 1 ? "3" : "2"} min
            </span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7">

          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">01 — Tu información</h2>
              <div>
                <label className={labelCls}>Tu email *</label>
                <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => set("email", e.target.value)} className={inp} />
              </div>
              <div>
                <label className={labelCls}>Nombre del proyecto o canal</label>
                <input type="text" placeholder="Mi Podcast, Canal de Juan..." value={form.nombre_proyecto} onChange={e => set("nombre_proyecto", e.target.value)} className={inp} />
              </div>
              <div>
                <label className={labelCls}>Redes sociales (usuario o URL)</label>
                <input type="text" placeholder="@tuusuario · youtube.com/canal..." value={form.redes_sociales} onChange={e => set("redes_sociales", e.target.value)} className={inp} />
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
                  {["Español","Inglés","Portugués","Francés","Otro"].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Referencias de estilo (URLs de clips que te gustan)</label>
                <textarea rows={2} placeholder="https://www.tiktok.com/..." value={form.referencias} onChange={e => set("referencias", e.target.value)} className={inp} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all">Siguiente →</button>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">03 — Material y entrega</h2>
              <div>
                <label className={labelCls}>Link de tu Google Drive *</label>
                <input type="url" placeholder="https://drive.google.com/drive/folders/..." value={form.drive_link} onChange={e => set("drive_link", e.target.value)} className={inp} />
                <p className="text-white/20 text-xs mt-1.5">Asegúrate de que el link tenga permisos de edición para que podamos subir los clips entregados.</p>
              </div>
              <div>
                <label className={labelCls}>Notas de estilo de edición</label>
                <textarea rows={2} placeholder="Subtítulos en blanco, sin emojis, cortes rápidos..." value={form.estilo_notas} onChange={e => set("estilo_notas", e.target.value)} className={inp} />
              </div>
              <div>
                <label className={labelCls}>Notas importantes</label>
                <textarea rows={2} placeholder="Cualquier cosa que debamos saber antes de empezar..." value={form.notas_importantes} onChange={e => set("notas_importantes", e.target.value)} className={inp} />
              </div>
              <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-4 text-xs text-white/40 space-y-1.5">
                <p className="text-[#d4f53c] font-semibold mb-2">⏱️ Importante sobre los plazos</p>
                <p>El plazo de entrega empieza cuando recibimos y <strong className="text-white/60">validamos</strong> tu material.</p>
                <p>Si el material no cumple los requisitos mínimos de calidad, te avisamos antes de empezar.</p>
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
