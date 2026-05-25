"use client";
import { useState } from "react";

interface Venta { plan: string; importe: number; creado_at: string; estado: string; cliente_email: string; notas_admin?: string; }
interface Agente { id: string; nombre: string; email: string; codigo: string; creado_at: string; aprobado: boolean; bloqueado: boolean; notas_admin?: string; ventas: Venta[]; }

const COMISION = 0.20;
const ESTADOS_VENTA = ["registrada","pendiente_validacion","disponible","pagada","cancelada","reembolsada","invalida"];

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"pendientes"|"activos"|"todos">("pendientes");
  const [saving, setSaving] = useState("");

  const cargar = async (t = token) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/agentes", { headers: { "x-admin-token": t } });
      const data = await res.json();
      if (res.ok) { setAgentes(data.agentes || []); setAuthed(true); }
      else setError("Token incorrecto");
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  const aprobar = async (id: string, aprobado: boolean, bloqueado = false) => {
    setSaving(id);
    await fetch("/api/agentes", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ agente_id: id, aprobado, bloqueado }) });
    await cargar(token);
    setSaving("");
  };

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(212,245,60,0.4)] transition-colors";

  const filtrados = agentes.filter(a => {
    if (tab === "pendientes") return !a.aprobado && !a.bloqueado;
    if (tab === "activos") return a.aprobado && !a.bloqueado;
    return true;
  });

  const totalVentas = agentes.reduce((a, ag) => a + ag.ventas.length, 0);
  const totalIngresos = agentes.reduce((a, ag) => a + ag.ventas.reduce((b, v) => b + Number(v.importe), 0), 0);
  const pendientesAprobacion = agentes.filter(a => !a.aprobado && !a.bloqueado).length;

  if (!authed) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-black text-2xl mb-1"><span className="text-[#d4f53c]">Vital</span>Soft</div>
          <p className="text-white/40 text-sm">Panel de Administración</p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div><label className="block text-xs text-white/40 mb-1.5">Token de acceso</label>
            <input type="password" placeholder="••••••••" value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === "Enter" && cargar()} className={inp} /></div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={() => cargar()} disabled={loading} className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
            {loading ? "Verificando..." : "Acceder →"}
          </button>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><div className="font-display font-black text-xl"><span className="text-[#d4f53c]">Vital</span>Soft</div><p className="text-white/40 text-sm">Panel de Administración</p></div>
          <button onClick={() => { setAuthed(false); setAgentes([]); }} className="text-white/20 hover:text-white/50 text-xs">Cerrar sesión</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Agentes activos", value: agentes.filter(a => a.aprobado).length },
            { label: "Pendientes aprobación", value: pendientesAprobacion, alert: pendientesAprobacion > 0 },
            { label: "Ventas totales", value: totalVentas },
            { label: "Ingresos referidos", value: `€${totalIngresos.toFixed(0)}` },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 text-center ${(s as any).alert ? "bg-yellow-400/[0.05] border-yellow-400/20" : "bg-white/[0.04] border-white/[0.08]"}`}>
              <div className={`font-display font-black text-2xl ${(s as any).alert ? "text-yellow-400" : "text-[#d4f53c]"}`}>{s.value}</div>
              <div className="text-white/30 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["pendientes","activos","todos"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase transition-all ${tab === t ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
              {t === "pendientes" ? `Pendientes (${pendientesAprobacion})` : t === "activos" ? "Activos" : "Todos"}
            </button>
          ))}
        </div>

        {/* Lista agentes */}
        <div className="space-y-4">
          {filtrados.length === 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 text-center text-white/20 text-sm">
              {tab === "pendientes" ? "No hay solicitudes pendientes." : "No hay agentes en esta categoría."}
            </div>
          )}
          {filtrados.map(ag => {
            const totalAg = ag.ventas.reduce((a, v) => a + Number(v.importe), 0);
            const comisionAg = Math.round(totalAg * COMISION * 100) / 100;
            return (
              <div key={ag.id} className={`border rounded-2xl p-6 ${ag.bloqueado ? "bg-red-500/[0.03] border-red-500/15" : ag.aprobado ? "bg-white/[0.04] border-white/[0.08]" : "bg-yellow-400/[0.03] border-yellow-400/15"}`}>
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-base">{ag.nombre}</span>
                      {!ag.aprobado && !ag.bloqueado && <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pendiente</span>}
                      {ag.aprobado && <span className="bg-green-400/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Activo</span>}
                      {ag.bloqueado && <span className="bg-red-400/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Bloqueado</span>}
                    </div>
                    <div className="text-white/40 text-xs">{ag.email}</div>
                    <div className="text-white/20 text-xs mt-0.5">Desde {new Date(ag.creado_at).toLocaleDateString("es-ES")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#d4f53c] font-display font-black text-lg">{ag.codigo}</div>
                    <div className="text-white/30 text-xs">{ag.ventas.length} ventas · €{totalAg} generados</div>
                    {comisionAg > 0 && <div className="text-yellow-400 text-xs">Comisión pendiente: €{comisionAg}</div>}
                  </div>
                </div>

                {/* Acciones admin */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {!ag.aprobado && !ag.bloqueado && (
                    <button onClick={() => aprobar(ag.id, true)} disabled={saving === ag.id}
                      className="bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      {saving === ag.id ? "..." : "✓ Aprobar"}
                    </button>
                  )}
                  {ag.aprobado && !ag.bloqueado && (
                    <button onClick={() => aprobar(ag.id, false, true)} disabled={saving === ag.id}
                      className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      {saving === ag.id ? "..." : "✕ Bloquear"}
                    </button>
                  )}
                  {ag.bloqueado && (
                    <button onClick={() => aprobar(ag.id, true, false)} disabled={saving === ag.id}
                      className="bg-white/[0.05] hover:bg-white/10 text-white/50 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      Reactivar
                    </button>
                  )}
                  {/* Links del agente */}
                  {ag.aprobado && ["starter","growth","scale","pro"].map(plan => (
                    <a key={plan} href={`https://vitalsoft.pro/${plan}?ref=${ag.codigo}`} target="_blank"
                      className="bg-white/[0.03] border border-white/[0.07] text-white/30 text-[11px] px-2.5 py-1.5 rounded-lg hover:text-accent transition-colors uppercase font-display font-bold">
                      {plan}
                    </a>
                  ))}
                </div>

                {/* Ventas del agente */}
                {ag.ventas.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {ag.ventas.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 text-xs gap-2">
                        <span className="text-white/40 truncate">{v.cliente_email}</span>
                        <span className="text-white/30">{v.plan}</span>
                        <span className="text-[#d4f53c] font-bold flex-shrink-0">€{v.importe} → <span className="text-yellow-400">€{(Number(v.importe)*COMISION).toFixed(2)}</span></span>
                        <span className={`px-2 py-0.5 rounded-full flex-shrink-0 text-[10px] font-bold ${v.estado === "pagada" ? "bg-green-400/10 text-green-400" : v.estado === "invalida" ? "bg-red-400/10 text-red-400" : "bg-yellow-400/10 text-yellow-400"}`}>
                          {v.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
