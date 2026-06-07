"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OnboardingForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [drivePendiente, setDrivePendiente] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre_proyecto: "", redes_sociales: "",
    tipo_contenido: "", plataformas: [] as string[],
    duracion_media: "", frecuencia_grabacion: "",
    idioma: "Español", drive_link: "",
    referencias: "", instrucciones: "",
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const togglePlat = (p: string) => set("plataformas", form.plataformas.includes(p)
    ? form.plataformas.filter((x: string) => x !== p)
    : [...form.plataformas, p]);

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20 resize-none";
  const labelCls = "block text-xs text-white/35 font-medium mb-1.5";

  const handleSubmit = async () => {
    if (!drivePendiente && !form.drive_link) {
      setError("Indica el link de tu Drive o selecciona que lo enviarás más tarde.");
      return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, session_id: sessionId, drive_pendiente: drivePendiente }),
    });
    const data = await res.json();
    if (data.success) setDone(true);
    else setError(data.error || "Error al enviar.");
    setLoading(false);
  };

  const PLATAFORMAS = ["TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn", "Twitter/X", "Facebook"];
  const TIPOS = ["Podcast", "Entrevistas", "YouTube largo", "Webinar / Formación", "Eventos", "Otro"];
  const DURACIONES = ["15–30 min", "30–60 min", "1–2h", "Más de 2h", "Varía"];
  const FRECUENCIAS = ["1–2 por semana", "3–4 por semana", "1 por semana", "Quincenal", "Mensual"];

  if (done) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">✅</div>
        <h2 className="font-display font-black text-2xl mb-3 text-[#d4f53c]">¡Todo listo!</h2>
        <p className="text-white/55 text-sm leading-relaxed mb-6">
          Hemos recibido tu configuración. En cuanto subas tu primer material al Drive empezamos a producir.
        </p>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-left space-y-3 mb-4">
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
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-16">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="font-display font-black text-xl mb-3">
            <span className="text-[#d4f53c]">Vital</span><span className="text-white/70">Soft</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#d4f53c]" />
            <span className="text-white/50 text-xs">Tu plan ya está activo</span>
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

          {/* PASO 1 — Tu proyecto */}
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
                disabled={!form.tipo_contenido || form.plataformas.length === 0}
                className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-40 mt-2">
                Siguiente →
              </button>
            </div>
          )}

          {/* PASO 2 — Tu contenido */}
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
                <label className={labelCls}>
                  Referencias de estilo <span className="text-white/20 font-normal">(opcional)</span>
                </label>
                <textarea rows={2} placeholder="URLs de clips que te gustan como referencia visual..."
                  value={form.referencias} onChange={e => set("referencias", e.target.value)} className={inp} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all">Siguiente →</button>
              </div>
            </div>
          )}

          {/* PASO 3 — Drive y notas */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">03 — Material y entrega</h2>

              {/* Instrucciones Drive */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <p className="text-white/50 text-xs font-semibold mb-3">Cómo compartir tu carpeta de Drive</p>
                <ol className="space-y-2">
                  {[
                    "Crea una carpeta nueva en Google Drive",
                    "Haz clic derecho → Compartir → Cambiar a cualquier persona con el enlace",
                    "Cambia el permiso a Editor (necesitamos subir los clips)",
                    "Copia el enlace y pégalo aquí",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-white/40 text-xs">
                      <span className="text-[#d4f53c] font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Campo Drive o toggle pendiente */}
              {!drivePendiente ? (
                <div>
                  <label className={labelCls}>Enlace de tu carpeta de Google Drive *</label>
                  <input type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={form.drive_link}
                    onChange={e => { set("drive_link", e.target.value); setError(""); }}
                    className={inp}
                  />
                  <p className="text-white/20 text-xs mt-1.5">
                    Ejemplo: <span className="text-white/35">drive.google.com/drive/folders/xxxxx</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setDrivePendiente(true); set("drive_link", ""); setError(""); }}
                    className="text-white/25 text-xs mt-2 hover:text-white/45 transition-colors underline"
                  >
                    Aún no tengo el material preparado →
                  </button>
                </div>
              ) : (
                <div className="bg-[rgba(232,255,71,0.03)] border border-[rgba(232,255,71,0.1)] rounded-xl p-4">
                  <p className="text-[#d4f53c] text-xs font-semibold mb-1">Sin material por ahora</p>
                  <p className="text-white/40 text-xs mb-3">Completaremos el onboarding y te enviaremos instrucciones por email cuando estés listo para subir tu primera grabación.</p>
                  <button
                    type="button"
                    onClick={() => setDrivePendiente(false)}
                    className="text-white/30 text-xs hover:text-white/50 transition-colors underline"
                  >
                    ← Tengo el enlace ahora
                  </button>
                </div>
              )}

              {/* Campo único de instrucciones */}
              <div>
                <label className={labelCls}>
                  Instrucciones para la edición <span className="text-white/20 font-normal">(opcional)</span>
                </label>
                <textarea rows={3}
                  placeholder="Estilo de subtítulos, música, ritmo de cortes, cosas a evitar, cualquier detalle que debamos saber..."
                  value={form.instrucciones}
                  onChange={e => set("instrucciones", e.target.value)}
                  className={inp}
                />
              </div>

              {/* Bloque plazos */}
              <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-4 text-xs text-white/40 space-y-1.5">
                <p className="text-[#d4f53c] font-semibold mb-2">⏱️ Sobre los plazos</p>
                <p>El plazo de entrega empieza cuando recibimos y <strong className="text-white/60">validamos</strong> tu material, no desde el pago.</p>
                <p>Si el material no cumple los requisitos mínimos de calidad, te avisamos antes de empezar.</p>
              </div>

              {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={handleSubmit} disabled={loading || (!drivePendiente && !form.drive_link)}
                  className="flex-1 py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-40">
                  {loading ? "Enviando..." : "Confirmar →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#080808]" />}><OnboardingForm /></Suspense>;
}
