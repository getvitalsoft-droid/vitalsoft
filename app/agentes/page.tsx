"use client";
import { useState, useEffect } from "react";
import { calcPrice } from "@/lib/stripe";

interface Venta {
  plan: string; importe: number; creado_at: string; estado: string; cliente_email?: string;
}
interface AgenteData {
  nombre: string; email: string; codigo: string; creado_at: string; ventas: Venta[];
}
interface Links { general: string; starter: string; growth: string; scale: string; pro: string; }

const COMISION_PCT = 0.20;

export default function AgentesPage() {
  const [step, setStep] = useState<"login" | "dashboard">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [agente, setAgente] = useState<AgenteData | null>(null);
  const [links, setLinks] = useState<Links | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [customClips, setCustomClips] = useState(10);
  const [customLinkCopied, setCustomLinkCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("vs_agente");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.agente && parsed.links) {
          setAgente(parsed.agente);
          setLinks(parsed.links);
          setStep("dashboard");
        }
      }
    } catch { /* ignorar */ }
  }, []);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/agentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email }),
      });
      const data = await res.json();
      if (data.agente) {
        setAgente(data.agente);
        setLinks(data.links);
        setStep("dashboard");
        try { localStorage.setItem("vs_agente", JSON.stringify({ agente: data.agente, links: data.links })); } catch { /* ignorar */ }
      } else { setError(data.error || "Error al registrarse"); }
    } catch { setError("Error de conexión."); }
    setLoading(false);
  };

  const copyLink = (link: string, key: string) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  const cerrarSesion = () => {
    try { localStorage.removeItem("vs_agente"); } catch { /* ignorar */ }
    setAgente(null); setLinks(null); setStep("login");
    setNombre(""); setEmail("");
  };

  // Calcular stats de comisiones
  const ventas = agente?.ventas || [];
  const totalVentas = ventas.length;
  const totalIngresos = ventas.reduce((a, v) => a + Number(v.importe), 0);
  const totalComisiones = Math.round(totalIngresos * COMISION_PCT * 100) / 100;
  const comisionesPendientes = ventas
    .filter(v => v.estado === "pendiente")
    .reduce((a, v) => a + Number(v.importe) * COMISION_PCT, 0);
  const comisionesPagadas = ventas
    .filter(v => v.estado === "pagado")
    .reduce((a, v) => a + Number(v.importe) * COMISION_PCT, 0);

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(212,245,60,0.4)] transition-colors placeholder:text-white/20";

  if (!mounted) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-white/20 text-sm">Cargando...</div>
    </main>
  );

  if (step === "login") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-display font-black text-2xl mb-2"><span className="text-[#d4f53c]">Vital</span>Soft</div>
          <h1 className="text-2xl font-display font-bold mb-2">Portal de Agentes</h1>
          <p className="text-white/40 text-sm">Regístrate para obtener tu código y ganar comisiones del 20%.</p>
        </div>
        <form onSubmit={handleRegistro} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div><label className="block text-xs text-white/40 mb-1.5">Nombre completo *</label><input type="text" required placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-white/40 mb-1.5">Email *</label><input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
            {loading ? "Procesando..." : "Obtener mi código →"}
          </button>
          <p className="text-white/20 text-xs text-center">Si ya tienes cuenta, introduce el mismo email para recuperarla.</p>
        </form>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div><div className="font-display font-black text-xl"><span className="text-[#d4f53c]">Vital</span>Soft</div><p className="text-white/40 text-sm">Portal de Agentes</p></div>
          <div className="flex items-center gap-4">
            <div className="text-right"><div className="text-sm font-semibold">{agente?.nombre}</div><div className="text-white/40 text-xs">{agente?.email}</div></div>
            <button onClick={cerrarSesion} className="text-white/20 hover:text-white/50 text-xs transition-colors">Salir</button>
          </div>
        </div>

        {/* Código */}
        <div className="bg-[rgba(212,245,60,0.05)] border border-[rgba(212,245,60,0.2)] rounded-2xl p-6 mb-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Tu código de referido</p>
          <div className="font-display font-black text-4xl text-[#d4f53c] mb-2">{agente?.codigo}</div>
          <p className="text-white/30 text-xs">Ganas el <strong className="text-[#d4f53c]">20%</strong> del primer pago de cada cliente que traigas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
            <div className="font-display font-black text-2xl text-[#d4f53c]">{totalVentas}</div>
            <div className="text-white/30 text-xs mt-1">Ventas generadas</div>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
            <div className="font-display font-black text-2xl text-[#d4f53c]">€{totalIngresos.toFixed(0)}</div>
            <div className="text-white/30 text-xs mt-1">Ingresos generados para VitalSoft</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[rgba(212,245,60,0.05)] border border-[rgba(212,245,60,0.15)] rounded-xl p-4 text-center">
            <div className="font-display font-black text-2xl text-[#d4f53c]">€{comisionesPendientes.toFixed(2)}</div>
            <div className="text-yellow-400/70 text-xs mt-1">Comisiones pendientes de cobro</div>
          </div>
          <div className="bg-green-400/[0.04] border border-green-400/20 rounded-xl p-4 text-center">
            <div className="font-display font-black text-2xl text-green-400">€{comisionesPagadas.toFixed(2)}</div>
            <div className="text-green-400/60 text-xs mt-1">Comisiones ya pagadas</div>
          </div>
        </div>

        {/* Links de referido */}
        {agente && links && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
            <h2 className="font-display font-bold text-sm mb-1">Tus links de referido</h2>
            <p className="text-white/30 text-xs mb-4">El cliente llega directamente con el plan preseleccionado y solo tiene que poner su nombre, email y tarjeta.</p>

            {/* 4 planes fijos */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { key: "starter", label: "Starter", clips: 10, precio: 150 },
                { key: "growth",  label: "Growth",  clips: 20, precio: 250 },
                { key: "scale",   label: "Scale",   clips: 30, precio: 350 },
                { key: "pro",     label: "Pro",     clips: 40, precio: 450 },
              ].map(plan => {
                const url = links[plan.key as keyof Links];
                return (
                  <div key={plan.key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[#d4f53c] text-xs font-display font-black uppercase">{plan.label}</span>
                      <span className="text-white font-bold text-sm">€{plan.precio}</span>
                    </div>
                    <div className="text-white/30 text-xs mb-3">{plan.clips} clips/mes</div>
                    <button
                      onClick={() => copyLink(url, plan.key)}
                      className="w-full py-1.5 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-all"
                    >
                      {copied === plan.key ? "✓ Copiado" : "Copiar link"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Separador */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/20 text-xs">o personalizado</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Generador personalizado */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1.5">Clips mensuales</label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={customClips}
                  onChange={e => setCustomClips(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-white/20 text-xs mt-1"><span>1</span><span>100</span></div>
              </div>
              <div className="text-right flex-shrink-0 w-20">
                <div className="font-display font-black text-xl text-[#d4f53c]">{customClips}</div>
                <div className="text-white/30 text-xs">clips</div>
                <div className="font-bold text-white/70 text-sm">€{calcPrice(customClips)}</div>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 mb-3 text-white/30 text-xs font-mono truncate">
              https://vitalsoft.pro?ref={agente.codigo}&clips={customClips}#calculadora
            </div>
            <button
              onClick={() => {
                const url = `https://vitalsoft.pro?ref=${agente.codigo}&clips=${customClips}#calculadora`;
                navigator.clipboard.writeText(url).catch(() => {});
                setCustomLinkCopied(true);
                setTimeout(() => setCustomLinkCopied(false), 2000);
              }}
              className="w-full py-2.5 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black text-sm rounded-xl transition-all"
            >
              {customLinkCopied ? "✓ Link copiado" : `Copiar link — ${customClips} clips · €${calcPrice(customClips)}/mes`}
            </button>
          </div>
        )}

        {/* Ventas */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="font-display font-bold text-sm mb-4">Historial de ventas y comisiones</h2>
          {ventas.length === 0 ? (
            <p className="text-white/25 text-sm text-center py-6">¡Comparte tus links para empezar a ganar comisiones!</p>
          ) : (
            <div className="space-y-2">
              {ventas.map((v, i) => {
                const comision = Math.round(Number(v.importe) * COMISION_PCT * 100) / 100;
                return (
                  <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2.5 gap-2">
                    <div className="min-w-0">
                      <div className="text-white/60 text-xs truncate">{v.plan}</div>
                      <div className="text-white/25 text-[11px]">{new Date(v.creado_at).toLocaleDateString("es-ES")}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white/40 text-xs">€{v.importe} → <span className="text-[#d4f53c] font-bold">€{comision} tu parte</span></div>
                      <div className={`text-[11px] mt-0.5 ${v.estado === "pagado" ? "text-green-400" : "text-yellow-400"}`}>{v.estado}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
