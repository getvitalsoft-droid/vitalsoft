"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Venta { id: string; plan: string; importe: number; creado_at: string; estado: string; cliente_email: string; notas_admin?: string; sospechoso?: boolean; sospechoso_motivo?: string; disponible_at?: string; }
interface Agente { id: string; nombre: string; email: string; codigo: string; creado_at: string; aprobado: boolean; bloqueado: boolean; motivo_bloqueo?: string; ventas: Venta[]; }
interface Order { id: string; cliente_email: string; cliente_nombre?: string; plan: string; importe: number; estado: string; creado_at: string; fecha_pago: string; drive_folder_id?: string; material_link?: string; agente_codigo?: string; notas_admin?: string; stripe_session_id?: string; }

const COMISION = 0.20;
const ESTADO_VENTA_COLORS: Record<string, string> = { pendiente_validacion: "bg-yellow-400/10 text-yellow-400", disponible: "bg-blue-400/10 text-blue-400", pagada: "bg-green-400/10 text-green-400", invalida: "bg-red-400/10 text-red-400", cancelada: "bg-white/5 text-white/25", reembolsada: "bg-orange-400/10 text-orange-400" };
const ESTADO_ORDER_COLORS: Record<string, string> = { pago_realizado: "bg-white/10 text-white/50", onboarding_pendiente: "bg-yellow-400/10 text-yellow-400", esperando_material: "bg-blue-400/10 text-blue-400", material_recibido: "bg-blue-400/10 text-blue-500", material_invalido: "bg-red-400/10 text-red-400", validado: "bg-teal-400/10 text-teal-400", en_edicion: "bg-purple-400/10 text-purple-400", revision: "bg-orange-400/10 text-orange-400", completado: "bg-green-400/10 text-green-400", pausado: "bg-red-400/10 text-red-300", cancelado: "bg-white/5 text-white/20" };
const MOTIVOS_BLOQUEO = ["Spam", "Auto-referido", "Fraude", "Mala conducta", "Calidad baja de leads", "Otro"];
const ESTADOS_ORDER = ["onboarding_pendiente","esperando_material","material_recibido","material_invalido","validado","en_edicion","revision","completado","pausado","cancelado"];

export default function AdminPage() {
  const [step, setStep] = useState<"login"|"sending"|"dashboard">("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  const [adminToken, setAdminToken] = useState("");
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mainTab, setMainTab] = useState<"agentes"|"orders">("agentes");
  const [agentesTab, setAgentesTab] = useState<"pendientes"|"activos"|"sospechas"|"todos">("pendientes");
  const [ordersTab, setOrdersTab] = useState<"todos"|"onboarding_pendiente"|"esperando_material"|"material_invalido"|"en_edicion">("todos");
  const [saving, setSaving] = useState("");
  const [modal, setModal] = useState<{tipo: string; id: string; id2?: string} | null>(null);
  const [motivo, setMotivo] = useState("");
  const [inputText, setInputText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (sess?.user) { setSession(sess); setAdminToken(sess.access_token); setStep("dashboard"); cargarTodo(sess.access_token); }
      else if (event === "SIGNED_OUT") { setStep("login"); setSession(null); }
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (sess?.user) { setSession(sess); setAdminToken(sess.access_token); setStep("dashboard"); cargarTodo(sess.access_token); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const cargarTodo = async (token?: string) => {
    const t = token || adminToken;
    if (!t) return;
    const headers = { "Authorization": `Bearer ${t}` };
    const [a, o] = await Promise.all([
      fetch("/api/agentes/admin", { headers }).then(r => r.json()),
      fetch("/api/orders", { headers }).then(r => r.json()),
    ]);
    if (a.agentes) setAgentes(a.agentes);
    if (o.orders) setOrders(o.orders);
  };

  const accionAgente = async (body: Record<string, string>) => {
    setSaving(body.agente_id || body.venta_id || "x");
    await fetch("/api/agentes/admin", { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(body) });
    await cargarTodo(); setSaving(""); setModal(null); setMotivo(""); setInputText("");
  };

  const accionOrder = async (body: Record<string, any>) => {
    setSaving(body.order_id || "x");
    await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(body) });
    await cargarTodo(); setSaving(""); setModal(null); setMotivo(""); setInputText("");
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/admin-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (data.success) setStep("sending"); else setError(data.error || "Error al enviar el enlace.");
    setLoading(false);
  };

  const inp = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(212,245,60,0.4)] transition-colors placeholder:text-white/20";

  if (!mounted) return <main className="min-h-screen bg-[#080808]" />;

  if (step === "login") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><div className="font-display font-black text-2xl mb-1"><span className="text-[#d4f53c]">Vital</span>Soft</div><p className="text-white/40 text-sm">Panel de Administración</p></div>
        <form onSubmit={sendMagicLink} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4">
          <div><label className="block text-xs text-white/40 mb-1.5">Email</label><input type="email" required placeholder="getvitalsoft@gmail.com" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">{loading ? "Enviando..." : "Enviar enlace →"}</button>
        </form>
      </div>
    </main>
  );

  if (step === "sending") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm"><div className="text-5xl mb-6">📧</div><h2 className="font-display font-black text-xl mb-3">Revisa tu email</h2><p className="text-white/40 text-sm mb-6">Enlace enviado a <strong className="text-white/60">{email}</strong></p><button onClick={() => setStep("login")} className="text-white/25 text-xs">← Volver</button></div>
    </main>
  );

  // Stats
  const todasVentas = agentes.flatMap(a => a.ventas);
  const totalIngresos = todasVentas.reduce((a, v) => a + Number(v.importe), 0);
  const comPend = todasVentas.filter(v => ["pendiente_validacion","disponible"].includes(v.estado)).reduce((a, v) => a + Number(v.importe) * COMISION, 0);
  const pendientesAprob = agentes.filter(a => !a.aprobado && !a.bloqueado).length;
  const sospechas = todasVentas.filter(v => v.sospechoso).length;
  const onboardingAtascados = orders.filter(o => o.estado === "onboarding_pendiente").length;

  const filtradosAgentes = agentes.filter(a => {
    if (agentesTab === "pendientes") return !a.aprobado && !a.bloqueado;
    if (agentesTab === "activos") return a.aprobado && !a.bloqueado;
    if (agentesTab === "sospechas") return a.ventas.some(v => v.sospechoso);
    return true;
  });

  const filtradosOrders = ordersTab === "todos" ? orders : orders.filter(o => o.estado === ordersTab);

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><div className="font-display font-black text-xl"><span className="text-[#d4f53c]">Vital</span>Soft</div><p className="text-white/30 text-xs">{session?.user?.email}</p></div>
          <div className="flex gap-3"><button onClick={() => cargarTodo()} className="text-white/25 text-xs hover:text-white/50">↻</button><button onClick={() => supabase.auth.signOut()} className="text-white/25 text-xs hover:text-white/50">Salir</button></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Agentes activos", value: agentes.filter(a => a.aprobado && !a.bloqueado).length, color: "text-[#d4f53c]" },
            { label: "Pendientes aprobación", value: pendientesAprob, color: pendientesAprob > 0 ? "text-yellow-400" : "text-[#d4f53c]", alert: pendientesAprob > 0 },
            { label: "Orders activos", value: orders.filter(o => !["cancelado","completado"].includes(o.estado)).length, color: "text-[#d4f53c]" },
            { label: "Sin onboarding", value: onboardingAtascados, color: onboardingAtascados > 0 ? "text-yellow-400" : "text-white/20", alert: onboardingAtascados > 0 },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 text-center ${(s as any).alert ? "bg-yellow-400/[0.03] border-yellow-400/15" : "bg-white/[0.04] border-white/[0.08]"}`}>
              <div className={`font-display font-black text-2xl ${s.color}`}>{s.value}</div>
              <div className="text-white/25 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-yellow-400/[0.03] border border-yellow-400/10 rounded-xl p-4 text-center"><div className="font-display font-black text-2xl text-yellow-400">€{comPend.toFixed(2)}</div><div className="text-white/25 text-xs mt-1">Comisiones pendientes</div></div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center"><div className="font-display font-black text-2xl text-[#d4f53c]">€{totalIngresos.toFixed(0)}</div><div className="text-white/25 text-xs mt-1">Ingresos referidos</div></div>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 mb-5">
          {(["agentes","orders"] as const).map(t => (
            <button key={t} onClick={() => setMainTab(t)} className={`px-5 py-2 rounded-lg text-sm font-display font-bold uppercase transition-all ${mainTab === t ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>{t === "agentes" ? `Agentes` : `Orders (${orders.filter(o => !["cancelado","completado"].includes(o.estado)).length})`}</button>
          ))}
        </div>

        {/* AGENTES */}
        {mainTab === "agentes" && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {([["pendientes",`Pendientes (${pendientesAprob})`],["activos","Activos"],["sospechas",`⚠️ Sospechas (${sospechas})`],["todos","Todos"]] as const).map(([k,l]) => (
                <button key={k} onClick={() => setAgentesTab(k)} className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase transition-all ${agentesTab === k ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>{l}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filtradosAgentes.length === 0 && <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin agentes en esta categoría.</div>}
              {filtradosAgentes.map(ag => {
                const totalAg = ag.ventas.reduce((a, v) => a + Number(v.importe), 0);
                const comAgPend = ag.ventas.filter(v => ["pendiente_validacion","disponible"].includes(v.estado)).reduce((a, v) => a + Number(v.importe) * COMISION, 0);
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
                      </div>
                      <div className="text-right">
                        <div className="text-[#d4f53c] font-display font-black text-lg">{ag.codigo}</div>
                        <div className="text-white/25 text-xs">{ag.ventas.length} ventas · €{totalAg}</div>
                        {comAgPend > 0 && <div className="text-yellow-400 text-xs">Pendiente: €{comAgPend.toFixed(2)}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {!ag.aprobado && !ag.bloqueado && <button onClick={() => accionAgente({ accion: "aprobar", agente_id: ag.id })} disabled={saving !== ""} className="bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">✓ Aprobar</button>}
                      {ag.aprobado && !ag.bloqueado && <button onClick={() => setModal({ tipo: "bloquear", id: ag.id })} className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">✕ Bloquear</button>}
                      {ag.bloqueado && <button onClick={() => accionAgente({ accion: "reactivar", agente_id: ag.id })} disabled={saving !== ""} className="bg-white/[0.05] text-white/40 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/10">Reactivar</button>}
                    </div>
                    {ag.ventas.length > 0 && (
                      <div className="space-y-1.5">
                        {ag.ventas.map(v => {
                          const comV = (Number(v.importe) * COMISION).toFixed(2);
                          const diasR = v.disponible_at ? Math.max(0, Math.ceil((new Date(v.disponible_at).getTime() - Date.now()) / 86400000)) : null;
                          return (
                            <div key={v.id} className={`flex items-center justify-between rounded-lg px-3 py-2 gap-2 flex-wrap ${v.sospechoso ? "bg-red-500/[0.05] border border-red-500/15" : "bg-white/[0.02]"}`}>
                              <div className="min-w-0"><div className="text-white/45 text-xs truncate">{v.cliente_email}</div><div className="text-white/20 text-[11px]">{v.plan}</div>{v.sospechoso && <div className="text-red-400 text-[10px]">⚠️ {v.sospechoso_motivo}</div>}</div>
                              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                <span className="text-white/35 text-xs">€{v.importe} → <span className="text-[#d4f53c] font-bold">€{comV}</span></span>
                                {diasR !== null && diasR > 0 && <span className="text-white/20 text-[10px]">{diasR}d</span>}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ESTADO_VENTA_COLORS[v.estado] || "bg-white/5 text-white/25"}`}>{v.estado.replace("_", " ")}</span>
                                {["disponible","pendiente_validacion"].includes(v.estado) && !v.sospechoso && <button onClick={() => accionAgente({ accion: "marcar_pagado", venta_id: v.id })} disabled={saving !== ""} className="bg-green-400/10 text-green-400 border border-green-400/20 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-green-400/20">Marcar pagada</button>}
                                {v.sospechoso && v.estado !== "invalida" && <button onClick={() => setModal({ tipo: "invalidar", id: v.id })} className="bg-red-400/10 text-red-400 border border-red-400/20 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-red-400/20">Invalidar</button>}
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
          </>
        )}

        {/* ORDERS */}
        {mainTab === "orders" && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {([["todos","Todos"],["onboarding_pendiente","Sin onboarding"],["esperando_material","Esperando material"],["material_invalido","Material inválido"],["en_edicion","En edición"]] as const).map(([k,l]) => (
                <button key={k} onClick={() => setOrdersTab(k)} className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase transition-all ${ordersTab === k ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>{l}</button>
              ))}
            </div>
            <div className="space-y-3">
              {filtradosOrders.length === 0 && <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin orders en esta categoría.</div>}
              {filtradosOrders.map(order => (
                <div key={order.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="font-display font-bold text-sm mb-0.5">{order.cliente_email}</div>
                      <div className="text-white/35 text-xs">{order.plan} · €{order.importe}/mes</div>
                      {order.agente_codigo && <div className="text-[#d4f53c] text-xs mt-0.5">Agente: {order.agente_codigo}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${ESTADO_ORDER_COLORS[order.estado] || "bg-white/5 text-white/25"}`}>{order.estado.replace(/_/g, " ")}</span>
                      {order.drive_folder_id && <a href={`https://drive.google.com/drive/folders/${order.drive_folder_id}`} target="_blank" className="text-[#d4f53c] text-[11px] border border-[rgba(212,245,60,0.2)] px-2 py-0.5 rounded hover:bg-[rgba(212,245,60,0.06)]">Drive →</a>}
                    </div>
                  </div>

                  {/* Acciones del order */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Cambiar estado */}
                    <select
                      defaultValue=""
                      onChange={e => { if (e.target.value) { setModal({ tipo: "cambiar_estado", id: order.id, id2: e.target.value }); e.target.value = ""; } }}
                      className="bg-white/[0.04] border border-white/10 text-white/50 text-xs rounded-lg px-2 py-1.5 outline-none">
                      <option value="" disabled>Cambiar estado...</option>
                      {ESTADOS_ORDER.map(e => <option key={e} value={e}>{e.replace(/_/g, " ")}</option>)}
                    </select>

                    {/* Asignar agente */}
                    {!order.agente_codigo && (
                      <button onClick={() => setModal({ tipo: "asignar_agente", id: order.id })} className="bg-white/[0.04] border border-white/10 text-white/40 text-xs px-3 py-1.5 rounded-lg hover:bg-white/[0.07]">
                        + Asignar agente
                      </button>
                    )}

                    {/* Nota interna */}
                    <button onClick={() => setModal({ tipo: "nota", id: order.id })} className="bg-white/[0.04] border border-white/10 text-white/40 text-xs px-3 py-1.5 rounded-lg hover:bg-white/[0.07]">
                      Añadir nota
                    </button>
                  </div>

                  {order.notas_admin && <div className="mt-2 text-white/30 text-xs bg-white/[0.02] rounded px-3 py-2 italic">{order.notas_admin}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">

            {/* Bloquear agente */}
            {modal.tipo === "bloquear" && (
              <>
                <h3 className="font-display font-bold mb-4">Motivo de bloqueo</h3>
                <div className="space-y-2 mb-4">{MOTIVOS_BLOQUEO.map(m => <button key={m} onClick={() => setMotivo(m)} className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${motivo === m ? "border-[#d4f53c] bg-[rgba(212,245,60,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>{m}</button>)}</div>
                <div className="flex gap-2"><button onClick={() => { setModal(null); setMotivo(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button disabled={!motivo} onClick={() => accionAgente({ accion: "bloquear", agente_id: modal.id, motivo_bloqueo: motivo })} className="flex-1 py-2 bg-red-500 hover:bg-red-400 rounded-lg text-white font-bold text-sm disabled:opacity-40">Confirmar</button></div>
              </>
            )}

            {/* Invalidar venta */}
            {modal.tipo === "invalidar" && (
              <>
                <h3 className="font-display font-bold mb-4">Motivo de invalidación</h3>
                <div className="space-y-2 mb-4">{MOTIVOS_BLOQUEO.map(m => <button key={m} onClick={() => setMotivo(m)} className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${motivo === m ? "border-[#d4f53c] bg-[rgba(212,245,60,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>{m}</button>)}</div>
                <div className="flex gap-2"><button onClick={() => { setModal(null); setMotivo(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button disabled={!motivo} onClick={() => accionAgente({ accion: "invalidar_venta", venta_id: modal.id, motivo_bloqueo: motivo })} className="flex-1 py-2 bg-red-500 rounded-lg text-white font-bold text-sm disabled:opacity-40">Confirmar</button></div>
              </>
            )}

            {/* Cambiar estado order */}
            {modal.tipo === "cambiar_estado" && (
              <>
                <h3 className="font-display font-bold mb-2">Cambiar a: <span className="text-[#d4f53c]">{modal.id2?.replace(/_/g, " ")}</span></h3>
                {modal.id2 === "material_invalido" && <p className="text-white/40 text-xs mb-3">Se enviará un email al cliente con el motivo.</p>}
                <textarea rows={3} placeholder={modal.id2 === "material_invalido" ? "Describe el problema con el material..." : "Nota opcional..."} value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />
                <div className="flex gap-2"><button onClick={() => { setModal(null); setMotivo(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button disabled={modal.id2 === "material_invalido" && !motivo} onClick={() => accionOrder({ accion: "cambiar_estado", order_id: modal.id, estado: modal.id2, motivo })} className="flex-1 py-2 bg-[#d4f53c] text-[#080808] rounded-lg font-bold text-sm disabled:opacity-40">Confirmar</button></div>
              </>
            )}

            {/* Asignar agente */}
            {modal.tipo === "asignar_agente" && (
              <>
                <h3 className="font-display font-bold mb-4">Asignar agente manualmente</h3>
                <input type="text" placeholder="Código agente (ej: VSAIROZN)" value={inputText} onChange={e => setInputText(e.target.value.toUpperCase())} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-2" />
                <textarea rows={2} placeholder="Motivo / nota interna..." value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />
                <div className="flex gap-2"><button onClick={() => { setModal(null); setInputText(""); setMotivo(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button disabled={!inputText || !motivo} onClick={() => { const ventaRelacionada = todasVentas.find(v => v.cliente_email === orders.find(o => o.id === modal.id)?.cliente_email); accionOrder({ accion: "asignar_agente", order_id: modal.id, venta_id: ventaRelacionada?.id, agente_codigo: inputText, nota: motivo }); }} className="flex-1 py-2 bg-[#d4f53c] text-[#080808] rounded-lg font-bold text-sm disabled:opacity-40">Asignar</button></div>
              </>
            )}

            {/* Nota interna */}
            {modal.tipo === "nota" && (
              <>
                <h3 className="font-display font-bold mb-4">Añadir nota interna</h3>
                <textarea rows={3} placeholder="Nota visible solo para el admin..." value={inputText} onChange={e => setInputText(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />
                <div className="flex gap-2"><button onClick={() => { setModal(null); setInputText(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button disabled={!inputText} onClick={() => accionOrder({ accion: "añadir_nota", order_id: modal.id, nota: inputText })} className="flex-1 py-2 bg-[#d4f53c] text-[#080808] rounded-lg font-bold text-sm disabled:opacity-40">Guardar</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
