"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Venta {
  id: string; plan: string; importe: number; creado_at: string;
  estado: string; cliente_email: string; notas_admin?: string;
  sospechoso?: boolean; sospechoso_motivo?: string; disponible_at?: string;
}
interface Agente {
  id: string; nombre: string; email: string; codigo: string;
  creado_at: string; aprobado: boolean; bloqueado: boolean;
  motivo_bloqueo?: string; ventas: Venta[];
}

const COMISION = 0.20;
const ESTADO_COLORS: Record<string, string> = {
  pendiente_validacion: "bg-yellow-400/10 text-yellow-400",
  disponible: "bg-blue-400/10 text-blue-400",
  pagada: "bg-green-400/10 text-green-400",
  invalida: "bg-red-400/10 text-red-400",
  cancelada: "bg-white/5 text-white/25",
};
const MOTIVOS = ["Spam", "Auto-referido", "Fraude", "Mala conducta", "Calidad baja de leads", "Otro"];

export default function AdminPage() {
  const [step, setStep] = useState<"login" | "sending" | "dashboard">("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  const [adminToken, setAdminToken] = useState("");
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [tab, setTab] = useState<"pendientes" | "activos" | "sospechas" | "todos">("pendientes");
  const [saving, setSaving] = useState("");
  const [modal, setModal] = useState<{ tipo: "bloquear" | "invalidar"; id: string } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (sess?.user) {
        setSession(sess);
        // Usamos el access_token como admin token para las llamadas a la API
        setAdminToken(sess.access_token);
        setStep("dashboard");
        await cargarAgentes(sess.access_token);
      } else if (event === "SIGNED_OUT") {
        setStep("login");
        setSession(null);
        setAgentes([]);
      }
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (sess?.user) {
        setSession(sess);
        setAdminToken(sess.access_token);
        setStep("dashboard");
        cargarAgentes(sess.access_token);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const cargarAgentes = async (token?: string) => {
    const t = token || adminToken;
    if (!t) return;
    try {
      // Usar ADMIN_TOKEN de env via API — la API verifica con ADMIN_TOKEN en el servidor
      const res = await fetch("/api/agentes", {
        headers: { "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || t },
      });
      const data = await res.json();
      if (data.agentes) setAgentes(data.agentes);
    } catch (e) { console.error("Error cargando agentes:", e); }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) setStep("sending");
    else setError(data.error || "Error al enviar el enlace.");
    setLoading(false);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setSession(null); setAgentes([]); setStep("login"); setAdminToken("");
  };

  const accion = async (body: Record<string, string>) => {
    setSaving(body.agente_id || body.venta_id || "x");
    await fetch("/api/agentes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || adminToken },
      body: JSON.stringify(body),
    });
    await cargarAgentes();
    setSaving(""); setModal(null); setMotivo("");
  };

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(212,245,60,0.4)] transition-colors placeholder:text-white/20";

  if (!mounted) return <main className="min-h-screen bg-[#080808]" />;

  if (step === "login") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-black text-2xl mb-1"><span className="text-[#d4f53c]">Vital</span>Soft</div>
          <p className="text-white/40 text-sm">Panel de Administración</p>
        </div>
        <form onSubmit={sendMagicLink} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Email de administrador</label>
            <input type="email" required placeholder="getvitalsoft@gmail.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
            {loading ? "Enviando..." : "Enviar enlace de acceso →"}
          </button>
          <p className="text-white/20 text-xs text-center">Recibirás un enlace seguro en tu email.</p>
        </form>
      </div>
    </main>
  );

  if (step === "sending") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-6">📧</div>
        <h2 className="font-display font-black text-xl mb-3">Revisa tu email</h2>
        <p className="text-white/40 text-sm mb-6">Hemos enviado un enlace a <strong className="text-white/60">{email}</strong>. Haz clic para entrar.</p>
        <button onClick={() => setStep("login")} className="text-white/25 text-xs hover:text-white/50 transition-colors">← Volver</button>
      </div>
    </main>
  );

  const todasVentas = agentes.flatMap(a => a.ventas);
  const totalIngresos = todasVentas.reduce((a, v) => a + Number(v.importe), 0);
  const comPend = todasVentas.filter(v => ["pendiente_validacion","disponible"].includes(v.estado)).reduce((a, v) => a + Number(v.importe) * COMISION, 0);
  const comPag = todasVentas.filter(v => v.estado === "pagada").reduce((a, v) => a + Number(v.importe) * COMISION, 0);
  const pendientesAprob = agentes.filter(a => !a.aprobado && !a.bloqueado).length;
  const sospechas = todasVentas.filter(v => v.sospechoso).length;

  const filtrados = agentes.filter(a => {
    if (tab === "pendientes") return !a.aprobado && !a.bloqueado;
    if (tab === "activos") return a.aprobado && !a.bloqueado;
    if (tab === "sospechas") return a.ventas.some(v => v.sospechoso);
    return true;
  });

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-display font-black text-xl"><span className="text-[#d4f53c]">Vital</span>Soft</div>
            <p className="text-white/30 text-xs">{session?.user?.email}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => cargarAgentes()} className="text-white/25 text-xs hover:text-white/50 transition-colors">↻ Actualizar</button>
            <button onClick={cerrarSesion} className="text-white/25 text-xs hover:text-white/50 transition-colors">Salir</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Agentes activos", value: agentes.filter(a => a.aprobado && !a.bloqueado).length, color: "text-[#d4f53c]" },
            { label: "Pendientes aprobación", value: pendientesAprob, color: pendientesAprob > 0 ? "text-yellow-400" : "text-[#d4f53c]", alert: pendientesAprob > 0 },
            { label: "Ingresos referidos", value: `€${totalIngresos.toFixed(0)}`, color: "text-[#d4f53c]" },
            { label: "Sospechas", value: sospechas, color: sospechas > 0 ? "text-red-400" : "text-white/20", alert: sospechas > 0 },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 text-center ${(s as any).alert ? "bg-yellow-400/[0.03] border-yellow-400/15" : "bg-white/[0.04] border-white/[0.08]"}`}>
              <div className={`font-display font-black text-2xl ${s.color}`}>{s.value}</div>
              <div className="text-white/25 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-yellow-400/[0.03] border border-yellow-400/10 rounded-xl p-4 text-center">
            <div className="font-display font-black text-2xl text-yellow-400">€{comPend.toFixed(2)}</div>
            <div className="text-white/25 text-xs mt-1">Comisiones pendientes</div>
          </div>
          <div className="bg-green-400/[0.03] border border-green-400/10 rounded-xl p-4 text-center">
            <div className="font-display font-black text-2xl text-green-400">€{comPag.toFixed(2)}</div>
            <div className="text-white/25 text-xs mt-1">Comisiones pagadas</div>
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            { key: "pendientes", label: `Pendientes (${pendientesAprob})` },
            { key: "activos", label: "Activos" },
            { key: "sospechas", label: `⚠️ Sospechas (${sospechas})` },
            { key: "todos", label: "Todos" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase transition-all ${tab === t.key ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtrados.length === 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">
              {tab === "pendientes" ? "No hay solicitudes pendientes." : "Sin agentes en esta categoría."}
            </div>
          )}
          {filtrados.map(ag => {
            const totalAg = ag.ventas.reduce((a, v) => a + Number(v.importe), 0);
            const comAgPend = ag.ventas.filter(v => ["pendiente_validacion","disponible"].includes(v.estado)).reduce((a, v) => a + Number(v.importe) * COMISION, 0);
            const comAgPag = ag.ventas.filter(v => v.estado === "pagada").reduce((a, v) => a + Number(v.importe) * COMISION, 0);
            return (
              <div key={ag.id} className={`border rounded-2xl p-6 ${ag.bloqueado ? "bg-red-500/[0.02] border-red-500/10" : ag.aprobado ? "bg-white/[0.03] border-white/[0.07]" : "bg-yellow-400/[0.02] border-yellow-400/10"}`}>
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display font-bold">{ag.nombre}</span>
                      {!ag.aprobado && !ag.bloqueado && <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">PENDIENTE</span>}
                      {ag.aprobado && !ag.bloqueado && <span className="bg-green-400/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVO</span>}
                      {ag.bloqueado && <span className="bg-red-400/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">BLOQUEADO{ag.motivo_bloqueo ? ` · ${ag.motivo_bloqueo}` : ""}</span>}
                    </div>
                    <div className="text-white/35 text-xs">{ag.email}</div>
                    <div className="text-white/20 text-xs">Registro: {new Date(ag.creado_at).toLocaleDateString("es-ES")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#d4f53c] font-display font-black text-lg">{ag.codigo}</div>
                    <div className="text-white/25 text-xs">{ag.ventas.length} ventas · €{totalAg} generados</div>
                    {comAgPend > 0 && <div className="text-yellow-400 text-xs">Pendiente: €{comAgPend.toFixed(2)}</div>}
                    {comAgPag > 0 && <div className="text-green-400 text-xs">Pagado: €{comAgPag.toFixed(2)}</div>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {!ag.aprobado && !ag.bloqueado && (
                    <button onClick={() => accion({ accion: "aprobar", agente_id: ag.id })} disabled={saving !== ""}
                      className="bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      ✓ Aprobar
                    </button>
                  )}
                  {ag.aprobado && !ag.bloqueado && (
                    <button onClick={() => setModal({ tipo: "bloquear", id: ag.id })}
                      className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      ✕ Bloquear
                    </button>
                  )}
                  {ag.bloqueado && (
                    <button onClick={() => accion({ accion: "reactivar", agente_id: ag.id })} disabled={saving !== ""}
                      className="bg-white/[0.05] text-white/40 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:bg-white/10">
                      Reactivar
                    </button>
                  )}
                </div>
                {ag.ventas.length > 0 && (
                  <div className="space-y-1.5">
                    {ag.ventas.map(v => {
                      const comV = (Number(v.importe) * COMISION).toFixed(2);
                      const diasR = v.disponible_at ? Math.max(0, Math.ceil((new Date(v.disponible_at).getTime() - Date.now()) / 86400000)) : null;
                      return (
                        <div key={v.id} className={`flex items-center justify-between rounded-lg px-3 py-2 gap-2 flex-wrap ${v.sospechoso ? "bg-red-500/[0.05] border border-red-500/15" : "bg-white/[0.02]"}`}>
                          <div className="min-w-0">
                            <div className="text-white/45 text-xs truncate">{v.cliente_email}</div>
                            <div className="text-white/20 text-[11px]">{v.plan} · {new Date(v.creado_at).toLocaleDateString("es-ES")}</div>
                            {v.sospechoso && <div className="text-red-400 text-[10px]">⚠️ {v.sospechoso_motivo}</div>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            <span className="text-white/35 text-xs">€{v.importe} → <span className="text-[#d4f53c] font-bold">€{comV}</span></span>
                            {diasR !== null && diasR > 0 && <span className="text-white/20 text-[10px]">{diasR}d</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ESTADO_COLORS[v.estado] || "bg-white/5 text-white/25"}`}>{v.estado.replace("_", " ")}</span>
                            {["disponible","pendiente_validacion"].includes(v.estado) && !v.sospechoso && (
                              <button onClick={() => accion({ accion: "marcar_pagado", venta_id: v.id })} disabled={saving !== ""}
                                className="bg-green-400/10 text-green-400 border border-green-400/20 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-green-400/20 transition-all">
                                Marcar pagada
                              </button>
                            )}
                            {v.sospechoso && v.estado !== "invalida" && (
                              <button onClick={() => setModal({ tipo: "invalidar", id: v.id })}
                                className="bg-red-400/10 text-red-400 border border-red-400/20 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-red-400/20 transition-all">
                                Invalidar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold mb-4">{modal.tipo === "bloquear" ? "Motivo de bloqueo" : "Motivo de invalidación"}</h3>
            <div className="space-y-2 mb-4">
              {MOTIVOS.map(m => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${motivo === m ? "border-[#d4f53c] bg-[rgba(212,245,60,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setMotivo(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button>
              <button disabled={!motivo || saving !== ""} onClick={() => { if (modal.tipo === "bloquear") accion({ accion: "bloquear", agente_id: modal.id, motivo_bloqueo: motivo }); else accion({ accion: "invalidar_venta", venta_id: modal.id, motivo_bloqueo: motivo }); }}
                className="flex-1 py-2 bg-red-500 hover:bg-red-400 rounded-lg text-white font-bold text-sm disabled:opacity-40 transition-all">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
