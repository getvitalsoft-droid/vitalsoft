"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OnboardingForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "", nombre_proyecto: "", redes_sociales: "",
    tipo_contenido: "", plataformas: [] as string[],
    duracion_media: "", frecuencia_grabacion: "",
    idioma: "Español", drive_link: "",
    referencias: "", estilo_notas: "", notas_importantes: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const togglePlat = (p: string) => set("plataformas", form.plataformas.includes(p) ? form.plataformas.filter(x => x !== p) : [...form.plataformas, p]);

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20 resize-none";
  const label = "block text-xs text-white/35 font-medium mb-1.5";

  const handleSubmit = async () => {
    if (!form.email || !form.drive_link) { setError("Email y link de Drive son obligatorios."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, session_id: sessionId }),
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
        <div className="text-5xl mb-6">🎉</div>
        <h2 className="font-display font-black text-2xl mb-3 text-[#d4f53c]">¡Todo listo!</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-4">
          Hemos recibido tu información. Nuestro equipo revisará tu Drive en las próximas horas.
        </p>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-left text-xs text-white/35 space-y-2">
          <p>📁 Sube tu material al Drive que nos has indicado</p>
          <p>⏱️ El plazo empieza cuando validamos el material, no ahora</p>
          <p>📧 Recibirás un email cuando empecemos la edición</p>
          <p>✏️ Podrás pedir ajustes una vez recibas los clips</p>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-16">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="font-display font-black text-xl mb-2"><span className="text-[#d4f53c]">Vital</span>Soft</div>
          <h1 className="font-display font-bold text-2xl mb-2">Configura tu proyecto</h1>
          <p className="text-white/35 text-sm">Necesitamos esta información para empezar a producir tus clips.</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1,2,3].map(s => (
              <div key={s} className={`w-8 h-1 rounded-full transition-all ${step >= s ? "bg-[#d4f53c]" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7">

          {/* PASO 1 — Datos básicos */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">01 — Tu información</h2>
              <div><label className={label}>Tu email *</label><input type="email" placeholder="tu@email.com" value={form.email} onChange={e => set("email", e.target.value)} className={inp} /></div>
              <div><label className={label}>Nombre del proyecto o canal</label><input type="text" placeholder="Mi Podcast, Canal de Juan..." value={form.nombre_proyecto} onChange={e => set("nombre_proyecto", e.target.value)} className={inp} /></div>
              <div><label className={label}>Redes sociales (usuario o URL)</label><input type="text" placeholder="@tuusuario · youtube.com/canal..." value={form.redes_sociales} onChange={e => set("redes_sociales", e.target.value)} className={inp} /></div>
              <div>
                <label className={label}>Tipo de contenido *</label>
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
                <label className={label}>Plataformas objetivo *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlat(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.plataformas.includes(p) ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.email || !form.tipo_contenido || form.plataformas.length === 0}
                className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-40 mt-2">
                Siguiente →
              </button>
            </div>
          )}

          {/* PASO 2 — Contenido */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">02 — Tu contenido</h2>
              <div>
                <label className={label}>Duración media del episodio</label>
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
                <label className={label}>Frecuencia de grabación</label>
                <div className="grid grid-cols-2 gap-2">
                  {FRECUENCIAS.map(f => (
                    <button key={f} type="button" onClick={() => set("frecuencia_grabacion", f)}
                      className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${form.frecuencia_grabacion === f ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className={label}>Idioma del contenido</label>
                <select value={form.idioma} onChange={e => set("idioma", e.target.value)} className={inp + " appearance-none"}>
                  {["Español","Inglés","Portugués","Francés","Otro"].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div><label className={label}>Referencias de estilo (URLs de clips que te gustan)</label>
                <textarea rows={2} placeholder="https://www.tiktok.com/..." value={form.referencias} onChange={e => set("referencias", e.target.value)} className={inp} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all">Siguiente →</button>
              </div>
            </div>
          )}

          {/* PASO 3 — Drive + notas */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-sm mb-4 text-white/60 uppercase tracking-widest">03 — Material y entrega</h2>
              <div>
                <label className={label}>Link de tu Google Drive *</label>
                <input type="url" placeholder="https://drive.google.com/drive/folders/..." value={form.drive_link} onChange={e => set("drive_link", e.target.value)} className={inp} />
                <p className="text-white/20 text-xs mt-1.5">Asegúrate de que el link tenga permisos de edición para que podamos subir los clips entregados.</p>
              </div>
              <div><label className={label}>Notas de estilo de edición</label>
                <textarea rows={2} placeholder="Subtítulos en blanco, sin emojis, cortes rápidos..." value={form.estilo_notas} onChange={e => set("estilo_notas", e.target.value)} className={inp} />
              </div>
              <div><label className={label}>Notas importantes</label>
                <textarea rows={2} placeholder="Cualquier cosa que debamos saber antes de empezar..." value={form.notas_importantes} onChange={e => set("notas_importantes", e.target.value)} className={inp} />
              </div>

              <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-4 text-xs text-white/40 space-y-1.5">
                <p className="text-[#d4f53c] font-semibold mb-2">⏱️ Importante sobre los plazos</p>
                <p>El plazo de entrega (24–48h) empieza cuando recibimos y <strong className="text-white/60">validamos</strong> tu material.</p>
                <p>Si el material no cumple los requisitos mínimos de calidad, te avisamos antes de empezar.</p>
              </div>

              {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm">← Atrás</button>
                <button onClick={handleSubmit} disabled={loading || !form.drive_link}
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
