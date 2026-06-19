"use client";
import { useState, useEffect } from "react";
import NegocioTab from "@/components/NegocioTab";
import ReportesTab from "@/components/ReportesTab";
import { createClient } from "@supabase/supabase-js";
import ArchivosAdmin from "@/components/ArchivosAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Venta { id: string; plan: string; importe: number; creado_at: string; estado: string; cliente_email: string; notas_admin?: string; sospechoso?: boolean; sospechoso_motivo?: string; disponible_at?: string; }
interface Agente { id: string; nombre: string; email: string; codigo: string; creado_at: string; aprobado: boolean; bloqueado: boolean; motivo_bloqueo?: string; nota_agente?: string; estado_agente?: string; reactivacion_solicitada?: boolean; ventas: Venta[]; }
interface Order { id: string; cliente_email: string; cliente_nombre?: string; plan: string; importe: number; estado: string; creado_at: string; fecha_pago: string; drive_folder_id?: string; material_link?: string; agente_codigo?: string; notas_admin?: string; stripe_session_id?: string; is_paused?: boolean; paused_at?: string | null; pause_until?: string | null; pause_reason?: string | null; recovery_attempts?: number; recovery_email_sent_at?: string | null; clips_mensuales?: number | null; }
interface Referral { id: string; referrer_email: string; referred_email: string; amount_paid: number; credit_amount: number; status: string; is_suspicious: boolean; suspicious_reason: string | null; notes: string | null; created_at: string; available_at: string | null; applied_at: string | null; }
interface ReferralStats { pendiente_validacion: { count: number; total: number }; disponible: { count: number; total: number }; aplicado: { count: number; total: number }; invalido: { count: number }; suspicious: { count: number }; }
interface LoyaltyCredit { id: string; customer_email: string; milestone: string; amount: number; status: string; created_at: string; applied_at: string | null; notes: string | null; }
interface ServiceCredit { id: string; customer_email: string; amount: number; reason: string; status: string; created_at: string; applied_at: string | null; notes: string | null; order_id: string; }
interface CreditStats { pendiente: { count: number; total: number }; aplicado: { count: number; total: number }; }

const COMISION = 0.20;
const ESTADO_VENTA_COLORS: Record<string, string> = { pendiente_validacion: "bg-yellow-400/10 text-yellow-400", disponible: "bg-blue-400/10 text-blue-400", pagada: "bg-green-400/10 text-green-400", invalida: "bg-red-400/10 text-red-400", cancelada: "bg-white/5 text-white/25", reembolsada: "bg-orange-400/10 text-orange-400" };
const ESTADO_ORDER_COLORS: Record<string, string> = { pago_realizado: "bg-white/10 text-white/50", onboarding_pendiente: "bg-yellow-400/10 text-yellow-400", esperando_material: "bg-blue-400/10 text-blue-400", material_recibido: "bg-blue-400/10 text-blue-500", material_invalido: "bg-red-400/10 text-red-400", validado: "bg-teal-400/10 text-teal-400", en_edicion: "bg-purple-400/10 text-purple-400", revision: "bg-orange-400/10 text-orange-400", completado: "bg-green-400/10 text-green-400", pausado: "bg-red-400/10 text-red-300", cancelado: "bg-white/5 text-white/20" };
const MOTIVOS_BLOQUEO = ["Spam", "Auto-referido", "Fraude", "Mala conducta", "Calidad baja de leads", "Otro"];
const ESTADOS_ORDER = ["onboarding_pendiente","esperando_material","material_recibido","material_invalido","validado","en_edicion","revision","completado","pausado","cancelado"];

export default function AdminPage() {
  const [step, setStep] = useState<"login"|"sending"|"dashboard">("login");
  const [sesionEnOtraPestana, setSesionEnOtraPestana] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  const [adminToken, setAdminToken] = useState("");
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mainTab, setMainTab] = useState<"agentes"|"orders"|"referidos"|"retencion"|"negocio"|"reportes">("agentes");
  const [negocio, setNegocio] = useState<any>(null);
  const [negocioLoading, setNegocioLoading] = useState(false);
  const [agentesTab, setAgentesTab] = useState<"pendientes"|"activos"|"sospechas"|"todos">("pendientes");
  const [ordersTab, setOrdersTab] = useState<"todos"|"onboarding_pendiente"|"esperando_material"|"material_invalido"|"en_edicion">("todos");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralsTab, setReferralsTab] = useState<"todos"|"pendiente_validacion"|"disponible"|"aplicado"|"invalido">("todos");
  const [referralModal, setReferralModal] = useState<{referral: Referral; accion: string} | null>(null);
  const [referralNota, setReferralNota] = useState("");
  const [loyaltyCredits, setLoyaltyCredits] = useState<LoyaltyCredit[]>([]);
  const [serviceCredits, setServiceCredits] = useState<ServiceCredit[]>([]);
  const [creditStats, setCreditStats] = useState<{loyalty: CreditStats; service: CreditStats} | null>(null);
  const [retencionTab, setRetencionTab] = useState<"pausas"|"cancelados"|"loyalty"|"service">("pausas");
  const [pausaModal, setPausaModal] = useState<{order: Order; accion: "pausar"|"reactivar"} | null>(null);
  const [pausaMotivo, setPausaMotivo] = useState("");
  const [creditModal, setCreditModal] = useState<{type: "new_service"|"apply"|"cancel"; orderId?: string; creditId?: string; creditType?: string} | null>(null);
  const [creditForm, setCreditForm] = useState({ amount: "", reason: "", notes: "" });
  const [saving, setSaving] = useState("");
  const [modal, setModal] = useState<{tipo: string; id: string; id2?: string} | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [notaAgente, setNotaAgente] = useState("");
  const [inputText, setInputText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vs_admin_session" && e.newValue) {
        setSesionEnOtraPestana(true);
        setTimeout(() => { try { window.close(); } catch {} }, 1500);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setMounted(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (sess?.user) { setSession(sess); setAdminToken(sess.access_token); setStep("dashboard"); cargarTodo(sess.access_token); window.localStorage.setItem("vs_admin_session", sess.access_token.slice(-8)); }
      else if (event === "SIGNED_OUT") { setStep("login"); setSession(null); }
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (sess?.user) { setSession(sess); setAdminToken(sess.access_token); setStep("dashboard"); cargarTodo(sess.access_token); window.localStorage.setItem("vs_admin_session", sess.access_token.slice(-8)); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadNegocio = async () => {
    setNegocioLoading(true);
    try {
      const res = await fetch("/api/admin/negocio", {
        headers: adminToken ? { "Authorization": `Bearer ${adminToken}` } : {},
      });
      if (!res.ok) { console.error("[Negocio] HTTP", res.status); setNegocioLoading(false); return; }
      const data = await res.json();
      setNegocio(data);
    } catch (e) { console.error(e); }
    setNegocioLoading(false);
  };

  const cargarTodo = async (token?: string) => {
    const t = token || adminToken;
    if (!t) return;
    const headers = { "Authorization": `Bearer ${t}` };
    const [a, o, r] = await Promise.all([
      fetch("/api/agentes/admin", { headers }).then(r => r.json()),
      fetch("/api/orders", { headers }).then(r => r.json()),
      fetch("/api/admin/referrals", { headers }).then(r => r.json()).catch(() => ({})),
    ]);
    if (a.agentes) setAgentes(a.agentes);
    if (o.orders) setOrders(o.orders);
    if (r.referrals) setReferrals(r.referrals);
    if (r.stats) setReferralStats(r.stats);
    const cr = await fetch("/api/admin/credits", { headers }).then(r => r.json()).catch(() => ({}));
    if (cr.loyalty) setLoyaltyCredits(cr.loyalty);
    if (cr.service) setServiceCredits(cr.service);
    if (cr.stats) setCreditStats(cr.stats);
  };

  const accionAgente = async (body: Record<string, string | undefined>) => {
    setSaving(body.agente_id || body.venta_id || "x");
    await fetch("/api/agentes/admin", { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(body) });
    await cargarTodo(); setSaving(""); setModal(null); setMotivo(""); setInputText("");
  };

  const accionReferral = async (accion: string, referral_id: string, notas?: string) => {
    setSaving(referral_id);
    const res = await fetch("/api/admin/referrals", { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify({ accion, referral_id, notas }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Error"); setSaving(""); return; }
    await cargarTodo(); setSaving(""); setReferralModal(null); setReferralNota("");
  };

  const accionPausa = async (orderId: string, accion: "pausar"|"reactivar", motivo?: string) => {
    setSaving(orderId);
    const res = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify({ accion, order_id: orderId, motivo }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Error"); setSaving(""); return; }
    await cargarTodo(); setSaving(""); setPausaModal(null); setPausaMotivo("");
  };

  const accionCredit = async (url: string, method: string, body: object) => {
    setSaving("credit");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Error"); setSaving(""); return; }
    await cargarTodo(); setSaving(""); setCreditModal(null); setCreditForm({ amount: "", reason: "", notes: "" });
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
          <div><label className="block text-xs text-white/40 mb-1.5">Email</label><input type="email" required placeholder="hola@vitalsoft.pro" value={email} onChange={e => setEmail(e.target.value)} className={inp} /></div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">{loading ? "Enviando..." : "Enviar enlace →"}</button>
        </form>
      </div>
    </main>
  );

  if (step === "sending") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {sesionEnOtraPestana ? (
          <>
            <div className="text-5xl mb-6">✅</div>
            <h2 className="font-display font-black text-xl mb-3">Ya iniciaste sesión</h2>
            <p className="text-white/40 text-sm mb-4">El panel se abrió en otra pestaña. Puedes cerrar esta.</p>
            <button onClick={() => window.close()} className="text-white/25 text-xs underline hover:text-white/40">Cerrar esta pestaña</button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">📧</div>
            <h2 className="font-display font-black text-xl mb-3">Revisa tu email</h2>
            <p className="text-white/40 text-sm mb-6">Enlace enviado a <strong className="text-white/60">{email}</strong></p>
            <button onClick={() => setStep("login")} className="text-white/25 text-xs">← Volver</button>
          </>
        )}
      </div>
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
        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            ["agentes", "Agentes"],
            ["orders", `Orders (${orders.filter(o => !["cancelado","completado"].includes(o.estado)).length})`],
            ["referidos", `Referidos${referralStats?.disponible.count ? ` (${referralStats.disponible.count} 🟢)` : ""}`],
            ["retencion", `Retención${orders.filter(o => o.is_paused).length ? ` (${orders.filter(o => o.is_paused).length} ⏸)` : ""}`],
            ["negocio", "📊 Negocio"],
            ["reportes", "📋 Reportes"],
          ] as Array<[typeof mainTab, string]>).map(([t, l]) => (
            <button key={t} onClick={() => setMainTab(t)} className={`px-5 py-2 rounded-lg text-sm font-display font-bold uppercase transition-all ${mainTab === t ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>{l}</button>
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
                          {ag.aprobado && !ag.bloqueado && ag.estado_agente !== "inactivo" && <span className="bg-green-400/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVO</span>}
                          {ag.aprobado && !ag.bloqueado && ag.estado_agente === "inactivo" && <span className="bg-white/10 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full">INACTIVO</span>}
                          {ag.reactivacion_solicitada && <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">🔔 Pidió reactivación</span>}
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
                      {ag.aprobado && !ag.bloqueado && ag.estado_agente !== "inactivo" && <button onClick={() => setModal({ tipo: "bloquear", id: ag.id })} className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">✕ Bloquear</button>}
                      {(ag.bloqueado || ag.estado_agente === "inactivo") && <button onClick={() => accionAgente({ accion: "reactivar", agente_id: ag.id })} disabled={saving !== ""} className="bg-white/[0.05] text-white/40 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/10">Reactivar</button>}
                      {(ag.bloqueado || ag.estado_agente === "inactivo") && <button onClick={() => { setNotaAgente(ag.nota_agente || ""); setModal({ tipo: "nota", id: ag.id }); }} className="bg-white/[0.05] text-white/40 border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/10">{ag.nota_agente ? "✎ Editar nota" : "+ Nota para el agente"}</button>}
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
                      className="bg-[#111] border border-white/10 text-white/50 text-xs rounded-lg px-2 py-1.5 outline-none">
                      <option value="" disabled style={{background:"#111",color:"rgba(255,255,255,0.3)"}}>Cambiar estado...</option>
                      {ESTADOS_ORDER.map(e => <option key={e} value={e} style={{background:"#111",color:"rgba(255,255,255,0.8)"}}>{e.replace(/_/g, " ")}</option>)}
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

                  {/* Panel de archivos — expandible */}
                  <div className="mt-3 border-t border-white/[0.05] pt-3">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="flex items-center gap-2 text-white/30 text-xs hover:text-white/50 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                      </svg>
                      {expandedOrder === order.id ? "Ocultar archivos" : "Archivos y clips"}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {expandedOrder === order.id && adminToken && (
                      <div className="mt-3">
                        <ArchivosAdmin
                          orderId={order.id}
                          adminToken={adminToken}
                          clipsContratados={order.clips_mensuales || 20}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REFERIDOS */}
        {mainTab === "referidos" && (
          <>
            {/* Stats */}
            {referralStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {([["pendiente_validacion","Pendientes","yellow"],["disponible","Disponibles","green"],["aplicado","Aplicados","blue"],["invalido","Inválidos","red"]] as const).map(([k,l,c]) => (
                  <div key={k} className={`border rounded-xl p-3 text-center ${c==="yellow"?"border-yellow-400/20 bg-yellow-400/5":c==="green"?"border-green-400/20 bg-green-400/5":c==="blue"?"border-blue-400/20 bg-blue-400/5":"border-red-400/20 bg-red-400/5"}`}>
                    <div className={`font-display font-black text-xl ${c==="yellow"?"text-yellow-400":c==="green"?"text-green-400":c==="blue"?"text-blue-400":"text-red-400"}`}>{(referralStats as any)[k].count}</div>
                    <div className="text-white/25 text-xs mt-0.5">{l}</div>
                    {(referralStats as any)[k].total != null && <div className={`text-xs font-bold mt-0.5 ${c==="yellow"?"text-yellow-400/70":c==="green"?"text-green-400/70":"text-blue-400/70"}`}>€{((referralStats as any)[k].total ?? 0).toFixed(2)}</div>}
                  </div>
                ))}
              </div>
            )}
            {/* Filtros */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {([["todos","Todos"],["pendiente_validacion","Pendientes"],["disponible","Disponibles 🟢"],["aplicado","Aplicados"],["invalido","Inválidos"]] as const).map(([k,l]) => (
                <button key={k} onClick={() => setReferralsTab(k)} className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase transition-all ${referralsTab === k ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>{l}</button>
              ))}
            </div>
            {/* Tabla */}
            <div className="space-y-3">
              {(referralsTab === "todos" ? referrals : referrals.filter(r => r.status === referralsTab)).length === 0 && (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin referidos en esta categoría.</div>
              )}
              {(referralsTab === "todos" ? referrals : referrals.filter(r => r.status === referralsTab)).map(r => (
                <div key={r.id} className={`bg-white/[0.02] border rounded-2xl p-4 ${r.is_suspicious ? "border-red-400/30" : "border-white/[0.06]"}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-white/80">{r.referrer_email}</span>
                        <span className="text-white/25 text-xs">→</span>
                        <span className="text-sm text-white/60">{r.referred_email}</span>
                        {r.is_suspicious && <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">⚠️ {r.suspicious_reason}</span>}
                      </div>
                      <div className="flex gap-3 text-xs text-white/30 flex-wrap">
                        <span>Pagado: <strong className="text-white/50">€{r.amount_paid?.toFixed(2)}</strong></span>
                        <span>Crédito: <strong className="text-[#d4f53c]">€{r.credit_amount?.toFixed(2)}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${r.status==="disponible"?"bg-green-400/10 text-green-400":r.status==="aplicado"?"bg-blue-400/10 text-blue-400":r.status==="invalido"||r.status==="reembolsado"?"bg-red-400/10 text-red-400":"bg-yellow-400/10 text-yellow-400"}`}>{r.status.replace(/_/g," ")}</span>
                        <span>{new Date(r.created_at).toLocaleDateString("es-ES")}</span>
                      </div>
                      {r.notes && <div className="text-white/25 text-xs mt-1 italic">{r.notes}</div>}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {r.status === "pendiente_validacion" && !r.is_suspicious && (
                        <button onClick={() => setReferralModal({referral: r, accion: "liberar_credito"})} disabled={saving===r.id} className="px-3 py-1.5 bg-green-400/10 text-green-400 border border-green-400/20 rounded-lg text-xs font-bold hover:bg-green-400/20 disabled:opacity-40">Liberar</button>
                      )}
                      {r.status === "disponible" && (
                        <button onClick={() => setReferralModal({referral: r, accion: "marcar_aplicado"})} disabled={saving===r.id} className="px-3 py-1.5 bg-blue-400/10 text-blue-400 border border-blue-400/20 rounded-lg text-xs font-bold hover:bg-blue-400/20 disabled:opacity-40">Marcar aplicado</button>
                      )}
                      {!["invalido","aplicado","cancelado","reembolsado"].includes(r.status) && (
                        <button onClick={() => setReferralModal({referral: r, accion: "invalidar"})} disabled={saving===r.id} className="px-3 py-1.5 bg-red-400/10 text-red-400 border border-red-400/20 rounded-lg text-xs font-bold hover:bg-red-400/20 disabled:opacity-40">Invalidar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}


        {/* RETENCIÓN */}
        {mainTab === "retencion" && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {([["pausas","Pausas"], ["cancelados","Recuperación"], ["service","Créditos error"], ["loyalty","Créditos antigüedad"]] as const).map(([k,l]) => (
                <button key={k} onClick={() => setRetencionTab(k)} className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase transition-all ${retencionTab===k ? "bg-[#d4f53c] text-[#080808]" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>{l}</button>
              ))}
            </div>

            {/* ── Pausas ── */}
            {retencionTab === "pausas" && (
              <div className="space-y-3">
                <p className="text-white/30 text-xs mb-3">Suscripciones activas — puedes pausar 30 días sin facturación.</p>
                {orders.filter(o => !["cancelado"].includes(o.estado)).length === 0 && (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin orders activos.</div>
                )}
                {orders.filter(o => !["cancelado"].includes(o.estado)).map(o => (
                  <div key={o.id} className={`bg-white/[0.02] border rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap ${(o as any).is_paused ? "border-yellow-400/30" : "border-white/[0.06]"}`}>
                    <div>
                      <div className="text-sm font-medium text-white/80">{o.cliente_email}</div>
                      <div className="flex gap-3 text-xs text-white/30 mt-0.5 flex-wrap">
                        <span>{o.plan}</span>
                        <span>€{Number(o.importe).toFixed(0)}/mes</span>
                        {(o as any).is_paused && (
                          <span className="text-yellow-400 font-bold">⏸ Pausada hasta {(o as any).pause_until ? new Date((o as any).pause_until).toLocaleDateString("es-ES") : "—"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!(o as any).is_paused && o.estado !== "cancelado" && (
                        <button onClick={() => setPausaModal({order: o, accion: "pausar"})} disabled={saving===o.id} className="px-3 py-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-lg text-xs font-bold hover:bg-yellow-400/20 disabled:opacity-40">Pausar 30d</button>
                      )}
                      {(o as any).is_paused && (
                        <button onClick={() => accionPausa(o.id, "reactivar")} disabled={saving===o.id} className="px-3 py-1.5 bg-green-400/10 text-green-400 border border-green-400/20 rounded-lg text-xs font-bold hover:bg-green-400/20 disabled:opacity-40">Reactivar</button>
                      )}
                      <button onClick={() => setCreditModal({type: "new_service", orderId: o.id})} disabled={saving==="credit"} className="px-3 py-1.5 bg-blue-400/10 text-blue-400 border border-blue-400/20 rounded-lg text-xs font-bold hover:bg-blue-400/20 disabled:opacity-40">+ Crédito error</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Recuperación cancelados ── */}
            {retencionTab === "cancelados" && (
              <div className="space-y-3">
                <p className="text-white/30 text-xs mb-3">El cron semanal (lunes 10h) envía hasta 3 emails a cancelados de 30–180 días.</p>
                {orders.filter(o => o.estado === "cancelado").length === 0 && (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin clientes cancelados.</div>
                )}
                {orders.filter(o => o.estado === "cancelado").map(o => (
                  <div key={o.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-sm font-medium text-white/80">{o.cliente_email}</div>
                        <div className="flex gap-3 text-xs text-white/30 mt-0.5 flex-wrap">
                          <span>{o.plan}</span>
                          <span className="text-orange-400">Intentos enviados: {(o as any).recovery_attempts ?? 0}/3</span>
                          {(o as any).recovery_email_sent_at && <span>Último: {new Date((o as any).recovery_email_sent_at).toLocaleDateString("es-ES")}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(o as any).recovery_attempts >= 3 ? "bg-white/5 text-white/20" : "bg-orange-400/10 text-orange-400"}`}>
                        {(o as any).recovery_attempts >= 3 ? "Completado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Service credits ── */}
            {retencionTab === "service" && (
              <div>
                {creditStats && (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="border border-blue-400/20 bg-blue-400/5 rounded-xl p-3 text-center">
                      <div className="font-display font-black text-xl text-blue-400">{creditStats.service.pendiente.count}</div>
                      <div className="text-white/25 text-xs">Disponibles</div>
                      <div className="text-xs text-blue-400/70">€{creditStats.service.pendiente.total.toFixed(2)}</div>
                    </div>
                    <div className="border border-green-400/20 bg-green-400/5 rounded-xl p-3 text-center">
                      <div className="font-display font-black text-xl text-green-400">{creditStats.service.aplicado.count}</div>
                      <div className="text-white/25 text-xs">Aplicados</div>
                      <div className="text-xs text-green-400/70">€{creditStats.service.aplicado.total.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {serviceCredits.length === 0 && <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin créditos por error.</div>}
                  {serviceCredits.map(c => (
                    <div key={c.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-medium text-white/80">{c.customer_email}</div>
                        <div className="text-xs text-white/30 mt-0.5">{c.reason}</div>
                        {c.notes && <div className="text-xs text-white/20 mt-0.5 italic">{c.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#d4f53c] font-bold text-sm">€{Number(c.amount).toFixed(0)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status==="aplicado"?"bg-green-400/10 text-green-400":c.status==="cancelado"?"bg-white/5 text-white/20":"bg-blue-400/10 text-blue-400"}`}>{c.status}</span>
                        {c.status === "disponible" && (
                          <button onClick={() => setCreditModal({type:"apply", creditId: c.id, creditType:"service"})} className="px-2 py-0.5 border border-green-400/20 text-green-400 rounded text-xs hover:bg-green-400/10">Aplicar</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Loyalty credits ── */}
            {retencionTab === "loyalty" && (
              <div>
                {creditStats && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {([["3 meses","10€"],["6 meses","25€"],["12 meses","50€"]] as const).map(([l,a]) => (
                      <div key={l} className="border border-[#d4f53c]/20 bg-[#d4f53c]/5 rounded-xl p-3 text-center">
                        <div className="text-[#d4f53c] font-bold text-sm">{a}</div>
                        <div className="text-white/25 text-xs mt-0.5">{l}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  {loyaltyCredits.length === 0 && <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 text-center text-white/20 text-sm">Sin créditos de antigüedad generados aún.</div>}
                  {loyaltyCredits.map(c => (
                    <div key={c.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-medium text-white/80">{c.customer_email}</div>
                        <div className="text-xs text-white/30 mt-0.5">{c.milestone.replace("_"," ")} · {new Date(c.created_at).toLocaleDateString("es-ES")}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#d4f53c] font-bold">€{Number(c.amount).toFixed(0)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status==="aplicado"?"bg-green-400/10 text-green-400":c.status==="cancelado"?"bg-white/5 text-white/20":"bg-yellow-400/10 text-yellow-400"}`}>{c.status}</span>
                        {c.status === "disponible" && (
                          <button onClick={() => setCreditModal({type:"apply", creditId: c.id, creditType:"loyalty"})} className="px-2 py-0.5 border border-green-400/20 text-green-400 rounded text-xs hover:bg-green-400/10">Aplicar</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}


      </div>


        {/* NEGOCIO */}
        {mainTab === "negocio" && (
          <>
            {/* Panel de aviso del sistema */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-5">
              <p className="text-white/60 text-xs font-semibold mb-1">⚠️ Aviso del sistema</p>
              <p className="text-white/30 text-xs mb-3 leading-relaxed">
                Para mostrar un banner en toda la web ve a <strong className="text-white/50">Supabase → Table Editor → avisos_sistema</strong>.
                Edita la fila, pon <code className="text-[#d4f53c] text-[10px]">activo = true</code> y guarda. Para quitarlo pon <code className="text-[#d4f53c] text-[10px]">activo = false</code>.
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-center">
                  <div className="text-blue-300 font-bold mb-0.5">info</div>
                  <div className="text-white/30">Banner azul informativo</div>
                </div>
                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2 text-center">
                  <div className="text-yellow-300 font-bold mb-0.5">warning</div>
                  <div className="text-white/30">Banner amarillo de aviso</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                  <div className="text-red-300 font-bold mb-0.5">error</div>
                  <div className="text-white/30">Banner rojo de error</div>
                </div>
              </div>
            </div>

            <NegocioTab
              data={negocio}
              loading={negocioLoading}
              onLoad={loadNegocio}
            />
          </>
        )}

        {mainTab === "reportes" && (
          <ReportesTab token={adminToken} />
        )}

      {/* Modal pausa */}
      {pausaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold mb-1">
              {pausaModal.accion === "pausar" ? "Pausar suscripción 30 días" : "Reactivar suscripción"}
            </h3>
            <p className="text-white/40 text-xs mb-4">{pausaModal.order.cliente_email} · {pausaModal.order.plan}</p>
            {pausaModal.accion === "pausar" && (
              <textarea
                rows={2}
                placeholder="Motivo de la pausa (opcional)"
                value={pausaMotivo}
                onChange={e => setPausaMotivo(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => { setPausaModal(null); setPausaMotivo(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button>
              <button onClick={() => accionPausa(pausaModal.order.id, pausaModal.accion, pausaMotivo)} disabled={saving===pausaModal.order.id} className="flex-1 py-2 bg-[#d4f53c] text-[#080808] rounded-lg font-bold text-sm disabled:opacity-40">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal créditos */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold mb-4">
              {creditModal.type === "new_service" ? "Otorgar crédito por error" : creditModal.type === "apply" ? "Marcar crédito como aplicado" : "Cancelar crédito"}
            </h3>
            {creditModal.type === "new_service" && (
              <>
                <input type="number" min="1" max="500" placeholder="Importe (€)" value={creditForm.amount} onChange={e => setCreditForm(f => ({...f, amount: e.target.value}))} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-3" />
                <input type="text" placeholder="Motivo (obligatorio)" value={creditForm.reason} onChange={e => setCreditForm(f => ({...f, reason: e.target.value}))} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-3" />
                <textarea rows={2} placeholder="Nota interna (opcional)" value={creditForm.notes} onChange={e => setCreditForm(f => ({...f, notes: e.target.value}))} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />
              </>
            )}
            {(creditModal.type === "apply" || creditModal.type === "cancel") && (
              <input type="text" placeholder={creditModal.type === "apply" ? "Nota de aplicación (obligatoria)" : "Motivo de cancelación (obligatorio)"} value={creditForm.notes} onChange={e => setCreditForm(f => ({...f, notes: e.target.value}))} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4" />
            )}
            <div className="flex gap-2">
              <button onClick={() => { setCreditModal(null); setCreditForm({amount:"",reason:"",notes:""}); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button>
              <button
                disabled={saving==="credit" || (creditModal.type==="new_service" && (!creditForm.amount || !creditForm.reason.trim())) || ((creditModal.type==="apply"||creditModal.type==="cancel") && !creditForm.notes.trim())}
                onClick={() => {
                  if (creditModal.type === "new_service") {
                    accionCredit("/api/admin/credits", "POST", { order_id: creditModal.orderId, amount: Number(creditForm.amount), reason: creditForm.reason, notes: creditForm.notes });
                  } else {
                    accionCredit("/api/admin/credits", "PATCH", { accion: creditModal.type === "apply" ? "marcar_aplicado" : "cancelar", credit_id: creditModal.creditId, credit_type: creditModal.creditType, notes: creditForm.notes });
                  }
                }}
                className="flex-1 py-2 bg-[#d4f53c] text-[#080808] rounded-lg font-bold text-sm disabled:opacity-40"
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal referidos */}
      {referralModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display font-bold mb-1">
              {referralModal.accion === "liberar_credito" ? "¿Liberar crédito?" : referralModal.accion === "marcar_aplicado" ? "¿Marcar como aplicado?" : "¿Invalidar crédito?"}
            </h3>
            <p className="text-white/40 text-xs mb-4">{referralModal.referral.referrer_email} → {referralModal.referral.referred_email} · <strong className="text-[#d4f53c]">€{referralModal.referral.credit_amount?.toFixed(2)}</strong></p>
            <textarea
              rows={3}
              placeholder={referralModal.accion === "invalidar" ? "Motivo de invalidación (obligatorio)" : "Nota interna (recomendada)"}
              value={referralNota}
              onChange={e => setReferralNota(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setReferralModal(null); setReferralNota(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button>
              <button
                disabled={referralModal.accion === "invalidar" ? !referralNota.trim() : false}
                onClick={() => accionReferral(referralModal.accion, referralModal.referral.id, referralNota)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm disabled:opacity-40 ${referralModal.accion === "invalidar" ? "bg-red-500 text-white" : "bg-[#d4f53c] text-[#080808]"}`}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals existentes */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">

            {/* Bloquear agente */}
            {modal.tipo === "bloquear" && (
              <>
                <h3 className="font-display font-bold mb-4">Motivo de bloqueo</h3>
                <div className="space-y-2 mb-4">{MOTIVOS_BLOQUEO.map(m => <button key={m} onClick={() => setMotivo(m)} className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${motivo === m ? "border-[#d4f53c] bg-[rgba(212,245,60,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>{m}</button>)}</div>
                <textarea
                  rows={3}
                  placeholder="Nota para el agente (opcional) — se mostrará en su portal"
                  value={notaAgente}
                  onChange={e => setNotaAgente(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none"
                />
                <div className="flex gap-2"><button onClick={() => { setModal(null); setMotivo(""); setNotaAgente(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button disabled={!motivo} onClick={() => { accionAgente({ accion: "bloquear", agente_id: modal.id, motivo_bloqueo: motivo, nota_agente: notaAgente.trim() || undefined }); setNotaAgente(""); }} className="flex-1 py-2 bg-red-500 hover:bg-red-400 rounded-lg text-white font-bold text-sm disabled:opacity-40">Confirmar</button></div>
              </>
            )}

            {/* Nota para el agente (inactivos / bloqueados) */}
            {modal.tipo === "nota" && (
              <>
                <h3 className="font-display font-bold mb-1">Nota para el agente</h3>
                <p className="text-white/30 text-xs mb-4">Se mostrará en su portal, en la pantalla de estado. Déjalo vacío para no mostrar nada.</p>
                <textarea
                  rows={4}
                  placeholder="Ej: Contáctanos por WhatsApp para resolver esto."
                  value={notaAgente}
                  onChange={e => setNotaAgente(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none"
                />
                <div className="flex gap-2"><button onClick={() => { setModal(null); setNotaAgente(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button><button onClick={() => { accionAgente({ accion: "editar_nota", agente_id: modal.id, nota_agente: notaAgente.trim() || undefined }); setNotaAgente(""); }} className="flex-1 py-2 bg-[#d4f53c] hover:bg-[#b8e032] rounded-lg text-[#080808] font-bold text-sm">Guardar</button></div>
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

            {/* Nota interna + Nota para cliente */}
            {modal.tipo === "nota" && (
              <>
                <h3 className="font-display font-bold mb-1">Añadir nota interna</h3>
                <p className="text-white/25 text-xs mb-3">Solo visible para el admin.</p>
                <textarea rows={3} placeholder="Nota visible solo para el admin..." value={inputText} onChange={e => setInputText(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />

                <h3 className="font-display font-bold mb-1">Nota para el cliente</h3>
                <p className="text-white/25 text-xs mb-3">Se muestra en el portal del cliente.</p>
                <textarea rows={3} placeholder="Ej: Hemos recibido tu material, empezamos mañana..." value={notaAgente} onChange={e => setNotaAgente(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-4 resize-none" />

                <div className="flex gap-2">
                  <button onClick={() => { setModal(null); setInputText(""); setNotaAgente(""); }} className="flex-1 py-2 border border-white/10 rounded-lg text-white/40 text-sm">Cancelar</button>
                  <button disabled={!inputText && !notaAgente} onClick={() => { accionOrder({ accion: "añadir_nota", order_id: modal.id, nota: inputText, nota_cliente: notaAgente.trim() || undefined }); setNotaAgente(""); }} className="flex-1 py-2 bg-[#d4f53c] text-[#080808] rounded-lg font-bold text-sm disabled:opacity-40">Guardar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
