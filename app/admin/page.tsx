"use client";
import { useState } from "react";

interface Agente {
  id: string; nombre: string; email: string; codigo: string; creado: string;
  ventas: { plan: string; importe: number; fecha: string; estado: string; clienteEmail: string }[];
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = async (t = token) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/agentes", { headers: { "x-admin-token": t } });
      const data = await res.json();
      if (res.ok) { setAgentes(data.agentes); setAuthed(true); }
      else { setError("Token incorrecto"); }
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(212,245,60,0.4)] transition-colors";
  const totalVentas = agentes.reduce((a, ag) => a + ag.ventas.length, 0);
  const totalIngresos = agentes.reduce((a, ag) => a + ag.ventas.reduce((b, v) => b + v.importe, 0), 0);

  if (!authed) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-black text-2xl mb-1"><span className="text-[#d4f53c]">Vital</span>Soft</div>
          <p className="text-white/40 text-sm">Panel de Administración</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div><label className="block text-xs text-white/40 mb-1.5">Token de acceso</label>
            <input type="password" placeholder="••••••••••••" value={token} onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && cargar()} className={inp} /></div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={() => cargar()} disabled={loading}
            className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
            {loading ? "Verificando..." : "Acceder →"}
          </button>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div><div className="font-display font-black text-xl"><span className="text-[#d4f53c]">Vital</span>Soft</div><p className="text-white/40 text-sm">Panel de Administración</p></div>
          <button onClick={() => setAuthed(false)} className="text-white/30 text-xs hover:text-white transition-colors">Cerrar sesión</button>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total agentes", value: agentes.length },
            { label: "Total ventas", value: totalVentas },
            { label: "Total ingresos", value: `€${totalIngresos}` },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 text-center">
              <div className="font-display font-black text-3xl text-[#d4f53c]">{s.value}</div>
              <div className="text-white/30 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Lista de agentes */}
        <div className="space-y-4">
          {agentes.length === 0 && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 text-center text-white/25 text-sm">
              No hay agentes registrados todavía.
            </div>
          )}
          {agentes.map(ag => (
            <div key={ag.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div className="font-display font-bold text-base">{ag.nombre}</div>
                  <div className="text-white/40 text-xs">{ag.email}</div>
                  <div className="text-white/20 text-xs mt-0.5">Registrado: {new Date(ag.creado).toLocaleDateString("es-ES")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#d4f53c] font-display font-black text-lg">{ag.codigo}</div>
                  <div className="text-white/30 text-xs">{ag.ventas.length} ventas · €{ag.ventas.reduce((a, v) => a + v.importe, 0)}</div>
                </div>
              </div>

              {/* Links del agente */}
              <div className="flex gap-2 flex-wrap mb-4">
                {["general","starter","growth","scale","pro"].map(plan => (
                  <a key={plan} href={plan === "general" ? `https://vitalsoft.pro?ref=${ag.codigo}` : `https://vitalsoft.pro/${plan}?ref=${ag.codigo}`}
                    target="_blank" className="bg-white/[0.04] border border-white/[0.07] text-white/40 text-[11px] px-2.5 py-1 rounded hover:text-accent transition-colors uppercase font-display font-bold">
                    {plan}
                  </a>
                ))}
              </div>

              {/* Ventas */}
              {ag.ventas.length === 0 ? (
                <p className="text-white/20 text-xs">Sin ventas todavía.</p>
              ) : (
                <div className="space-y-1.5">
                  {ag.ventas.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 text-xs">
                      <span className="text-white/50">{v.clienteEmail}</span>
                      <span className="text-white/40">{v.plan}</span>
                      <span className="text-[#d4f53c] font-bold">€{v.importe}</span>
                      <span className={`px-2 py-0.5 rounded-full ${v.estado === "pagado" ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"}`}>{v.estado}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
