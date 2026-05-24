"use client";
import { useState, useEffect } from "react";

interface AgenteData {
  nombre: string;
  email: string;
  codigo: string;
  creado: string;
  ventas: { plan: string; importe: number; fecha: string; estado: string }[];
  links: { general: string; starter: string; growth: string; scale: string; pro: string };
}

export default function AgentesPage() {
  const [step, setStep] = useState<"login" | "dashboard">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [agente, setAgente] = useState<AgenteData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email }),
      });
      const data = await res.json();
      if (data.agente) {
        setAgente({ ...data.agente, links: data.links });
        setStep("dashboard");
        localStorage.setItem("agente_email", email);
      } else {
        setError(data.error || "Error al registrarse");
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  };

  const copyLink = (link: string, key: string) => {
    navigator.clipboard.writeText(link);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(212,245,60,0.4)] transition-colors placeholder:text-white/20";

  if (step === "login") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-display font-black text-2xl mb-2"><span className="text-[#d4f53c]">Vital</span>Soft</div>
          <h1 className="text-2xl font-display font-bold mb-2">Portal de Agentes</h1>
          <p className="text-white/40 text-sm">Regístrate para obtener tu código de referido y empezar a ganar comisiones.</p>
        </div>
        <form onSubmit={handleRegistro} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div><label className="block text-xs text-white/40 mb-1.5">Nombre completo *</label><input type="text" required placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-white/40 mb-1.5">Email *</label><input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
            {loading ? "Procesando..." : "Obtener mi código →"}
          </button>
          <p className="text-white/20 text-xs text-center">Si ya tienes cuenta, introduce el mismo email para acceder.</p>
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
          <div className="text-right"><div className="text-sm font-semibold">{agente?.nombre}</div><div className="text-white/40 text-xs">{agente?.email}</div></div>
        </div>

        {/* Código */}
        <div className="bg-[rgba(212,245,60,0.05)] border border-[rgba(212,245,60,0.2)] rounded-2xl p-6 mb-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Tu código de referido</p>
          <div className="font-display font-black text-4xl text-[#d4f53c] mb-2">{agente?.codigo}</div>
          <p className="text-white/30 text-xs">Comparte este código o usa los links directos de abajo</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Ventas totales", value: agente?.ventas.length ?? 0 },
            { label: "Ingresos generados", value: `€${agente?.ventas.reduce((a, v) => a + v.importe, 0) ?? 0}` },
            { label: "Pendientes de pago", value: agente?.ventas.filter(v => v.estado === "pendiente").length ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="font-display font-black text-2xl text-[#d4f53c]">{s.value}</div>
              <div className="text-white/30 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-sm mb-4">Tus links de referido</h2>
          <div className="space-y-2">
            {agente?.links && Object.entries(agente.links).map(([key, url]) => (
              <div key={key} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                <div>
                  <span className="text-[#d4f53c] text-xs font-display font-bold uppercase mr-2">{key}</span>
                  <span className="text-white/30 text-xs truncate">{url}</span>
                </div>
                <button onClick={() => copyLink(url, key)} className="text-xs bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1 transition-all flex-shrink-0 ml-2">
                  {copied === key ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ventas */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="font-display font-bold text-sm mb-4">Historial de ventas</h2>
          {(!agente?.ventas || agente.ventas.length === 0) ? (
            <p className="text-white/25 text-sm text-center py-6">Aún no tienes ventas. ¡Comparte tus links!</p>
          ) : (
            <div className="space-y-2">
              {agente.ventas.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                  <span className="text-white/60">{v.plan}</span>
                  <span className="text-[#d4f53c] font-bold">€{v.importe}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.estado === "pagado" ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"}`}>{v.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
