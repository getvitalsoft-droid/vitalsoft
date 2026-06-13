"use client";
import { useState, useEffect } from "react";
import { calcPrice } from "@/lib/stripe";

interface Venta {
  id: string; plan: string; importe: number; creado_at: string;
  estado: string; cliente_email?: string;
}
interface AgenteData {
  id: string; nombre: string; email: string; codigo: string; creado_at: string;
  aprobado: boolean; bloqueado: boolean;
  estado_agente?: string; ausente_hasta?: string;
  ultimo_acceso?: string; ultimo_reporte?: string;
  metodo_cobro?: string; datos_cobro?: string; contacto_alternativo?: string;
  reportes_sin_rellenar?: number;
  ventas?: Venta[];
}

const COMISION_PCT = 0.20;
const BASE = "https://vitalsoft.pro";

function buildLinks(codigo: string) {
  return {
    general: `${BASE}?ref=${codigo}`,
    starter: `${BASE}/pagar?ref=${codigo}&clips=10`,
    growth:  `${BASE}/pagar?ref=${codigo}&clips=20`,
    scale:   `${BASE}/pagar?ref=${codigo}&clips=30`,
    pro:     `${BASE}/pagar?ref=${codigo}&clips=40`,
  };
}

type Tab = "inicio" | "links" | "ventas" | "ajustes" | "docs";

const METODOS_COBRO = ["Bizum", "Transferencia bancaria", "PayPal", "Revolut", "Otro"];

function AjustesCobro({ agente, token, onSave }: { agente: AgenteData; token: string; onSave: (a: AgenteData) => void }) {
  const [metodo, setMetodo] = useState(agente.metodo_cobro || "");
  const [datos, setDatos] = useState(agente.datos_cobro || "");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "actualizar_perfil", metodo_cobro: metodo, datos_cobro: datos }),
    });
    if (res.ok) { const d = await res.json(); if (d.agente) onSave(d.agente); setOk(true); setTimeout(() => setOk(false), 2500); }
    setSaving(false);
  };

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20";

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
      <p className="text-white/60 text-xs font-semibold mb-1">Método de cobro de comisiones</p>
      {agente.metodo_cobro && !metodo && (
        <p className="text-white/30 text-xs mb-3">Actual: <span className="text-white/50">{agente.metodo_cobro} · {agente.datos_cobro}</span></p>
      )}
      {!agente.metodo_cobro && <p className="text-white/25 text-xs mb-3">Indícanos cómo quieres recibir tus comisiones cuando se liberen.</p>}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {METODOS_COBRO.map(m => (
          <button key={m} type="button" onClick={() => { setMetodo(m); setDatos(m === agente.metodo_cobro ? (agente.datos_cobro || "") : ""); }}
            className={`text-xs px-3 py-2 rounded-lg border transition-all ${metodo === m ? "border-[#d4f53c] bg-[rgba(232,255,71,0.06)] text-[#d4f53c]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
            {m}
          </button>
        ))}
      </div>
      {metodo && (
        <div className="space-y-2">
          <input type="text"
            placeholder={metodo === "Bizum" ? "Número de teléfono" : metodo === "PayPal" || metodo === "Revolut" ? "Email o usuario" : metodo === "Transferencia bancaria" ? "IBAN (ES00 0000 ...)" : "Datos de contacto para el pago"}
            value={datos} onChange={e => setDatos(e.target.value)} className={inp} />
          {ok && <p className="text-[#d4f53c] text-xs">✓ Guardado</p>}
          <button onClick={save} disabled={saving || !datos.trim()}
            className="w-full py-2.5 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl text-sm transition-all disabled:opacity-40">
            {saving ? "Guardando..." : "Guardar método de cobro"}
          </button>
        </div>
      )}
    </div>
  );
}

function AjustesContacto({ agente, token, onSave }: { agente: AgenteData; token: string; onSave: (a: AgenteData) => void }) {
  const [contacto, setContacto] = useState(agente.contacto_alternativo || "");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "actualizar_perfil", contacto_alternativo: contacto }),
    });
    if (res.ok) { const d = await res.json(); if (d.agente) onSave(d.agente); setOk(true); setTimeout(() => setOk(false), 2500); }
    setSaving(false);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
      <p className="text-white/60 text-xs font-semibold mb-1">Contacto alternativo</p>
      <p className="text-white/30 text-xs mb-3">WhatsApp, Telegram, teléfono o email secundario para contactarte si es urgente.</p>
      {agente.contacto_alternativo && <p className="text-white/30 text-xs mb-2">Actual: <span className="text-white/50">{agente.contacto_alternativo}</span></p>}
      <input type="text" placeholder="+34 600 000 000 (WhatsApp) o email@alternativo.com"
        value={contacto} onChange={e => setContacto(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20 mb-2" />
      {ok && <p className="text-[#d4f53c] text-xs mb-2">✓ Guardado</p>}
      <button onClick={save} disabled={saving || !contacto.trim()}
        className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/60 font-display font-bold rounded-xl text-sm transition-all disabled:opacity-40">
        {saving ? "Guardando..." : "Guardar contacto"}
      </button>
    </div>
  );
}

function AjustesAusencia({ agente, token, onSave }: { agente: AgenteData; token: string; onSave: (a: AgenteData) => void }) {
  const [hasta, setHasta] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const estaAusente = agente.estado_agente === "ausente" && agente.ausente_hasta;

  const marcarAusente = async () => {
    if (!hasta) return;
    setSaving(true);
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "ausente", ausente_hasta: new Date(hasta).toISOString() }),
    });
    if (res.ok) { const d = await res.json(); if (d.agente) onSave({ ...agente, estado_agente: "ausente", ausente_hasta: new Date(hasta).toISOString() }); setOk(true); setTimeout(() => setOk(false), 2500); }
    setSaving(false);
  };

  const volverActivo = async () => {
    setSaving(true);
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "volver_ausente" }),
    });
    if (res.ok) onSave({ ...agente, estado_agente: "activo", ausente_hasta: undefined });
    setSaving(false);
  };

  // Fecha mínima: mañana
  const manana = new Date(); manana.setDate(manana.getDate() + 1);
  const minDate = manana.toISOString().split("T")[0];

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
      <p className="text-white/60 text-xs font-semibold mb-2">Ausencia temporal</p>
      {estaAusente ? (
        <>
          <p className="text-white/40 text-sm mb-1">Estás marcado como ausente hasta el <span className="text-white/70">{new Date(agente.ausente_hasta!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</span>.</p>
          <p className="text-white/25 text-xs mb-4">Durante este tiempo no recibirás recordatorios de reporte.</p>
          <button onClick={volverActivo} disabled={saving}
            className="w-full py-2.5 bg-[#d4f53c] text-[#080808] font-display font-black rounded-xl text-sm transition-all disabled:opacity-40">
            Ya estoy de vuelta
          </button>
        </>
      ) : (
        <>
          <p className="text-white/30 text-xs mb-3">Si sabes que vas a estar ocupado un tiempo, indica hasta cuándo. No recibirás recordatorios durante ese periodo.</p>
          <div className="flex gap-2 items-center mb-3">
            <input type="date" min={minDate} value={hasta} onChange={e => setHasta(e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors" />
          </div>
          {ok && <p className="text-[#d4f53c] text-xs mb-2">✓ Guardado</p>}
          <button onClick={marcarAusente} disabled={saving || !hasta}
            className="w-full py-2.5 border border-white/10 text-white/40 font-display font-bold rounded-xl text-sm hover:border-white/20 transition-all disabled:opacity-40">
            Marcar como ausente
          </button>
        </>
      )}
    </div>
  );
}

function generarAlias(nombre: string): string {
  const primerNombre = (nombre || "").trim().split(/\s+/)[0] || "agente";
  return primerNombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9]/g, "");
}

function AjustesCorreo({ agente, token }: { agente: AgenteData; token: string }) {
  const [abierto, setAbierto] = useState(false);
  const [smtp, setSmtp] = useState<{ server: string; port: number; username: string; password: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState("");

  const alias = generarAlias(agente.nombre);
  const direccion = `${alias}@vitalsoft.pro`;
  const nombreVisible = `${(agente.nombre || "").trim().split(/\s+/)[0]} | VitalSoft`;

  const cargarSmtp = async () => {
    if (smtp) return;
    setLoading(true);
    const res = await fetch("/api/agentes/correo", { headers: { "x-agente-token": token } });
    if (res.ok) setSmtp(await res.json());
    setLoading(false);
  };

  const toggle = () => {
    const next = !abierto;
    setAbierto(next);
    if (next) cargarSmtp();
  };

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(key);
    setTimeout(() => setCopiado(""), 2000);
  };

  const campo = (label: string, valor: string, key: string) => (
    <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 mb-2">
      <div className="min-w-0">
        <div className="text-white/25 text-[10px] uppercase tracking-widest">{label}</div>
        <div className="text-white/70 text-xs font-mono truncate">{valor}</div>
      </div>
      <button onClick={() => copiar(valor, key)}
        className={`flex-shrink-0 ml-2 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${copiado === key ? "bg-[#d4f53c] text-[#080808]" : "border border-white/10 text-white/40 hover:border-white/20"}`}>
        {copiado === key ? "✓" : "Copiar"}
      </button>
    </div>
  );

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
      <button onClick={toggle} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-white/60 text-xs font-semibold">¿Quieres un correo propio de la empresa?</p>
          <p className="text-white/25 text-xs mt-1">Configura {direccion} en tu Gmail para escribir y recibir como agente VitalSoft.</p>
        </div>
        <span className="text-white/30 text-lg flex-shrink-0 ml-3">{abierto ? "−" : "+"}</span>
      </button>

      {abierto && (
        <div className="mt-5 space-y-6">
          {/* ENVIAR */}
          <div>
            <p className="text-[#d4f53c] text-xs font-semibold mb-3">Para escribir desde {direccion}</p>
            <ol className="space-y-2.5 text-white/45 text-xs leading-relaxed list-decimal list-inside">
              <li>En el Gmail de tu cuenta personal, entra en <span className="text-white/65">Ajustes</span> (icono de engranaje).</li>
              <li>Pulsa <span className="text-white/65">Ver todas las opciones de configuración</span> y abre la pestaña <span className="text-white/65">Cuentas e importación</span>.</li>
              <li>En la sección <span className="text-white/65">Enviar correo como</span>, pulsa <span className="text-white/65">Añadir otra dirección de correo electrónico</span>.</li>
              <li>
                Se abrirá una ventana que pide nombre y dirección. Pon esto:
                {campo("Nombre", nombreVisible, "nombre")}
                {campo("Dirección de correo", direccion, "direccion")}
                Deja marcada la opción <span className="text-white/65">Tratarlo como un alias</span> y pulsa siguiente.
              </li>
              <li>
                En el siguiente paso te pedirá los datos del servidor SMTP. Pon estos:
                {loading && <p className="text-white/30 text-xs mt-2">Cargando datos...</p>}
                {smtp && (
                  <div className="mt-2">
                    {campo("Servidor SMTP", smtp.server, "server")}
                    {campo("Puerto", String(smtp.port), "port")}
                    {campo("Nombre de usuario", smtp.username, "username")}
                    {campo("Contraseña", smtp.password, "password")}
                  </div>
                )}
              </li>
              <li>Guarda los cambios. Gmail enviará un correo de verificación — confírmalo y ya podrás escribir como {direccion}.</li>
            </ol>
          </div>

          {/* RECIBIR */}
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-[#d4f53c] text-xs font-semibold mb-2">Para recibir mensajes en {direccion}</p>
            <p className="text-white/45 text-xs leading-relaxed">
              Esto lo configuramos nosotros manualmente. Contáctanos por el canal habitual o escribe a{" "}
              <a href={`mailto:hola@vitalsoft.pro?subject=Quiero recibir correos en ${direccion}&body=Hola, quiero activar la recepción de correos en ${direccion}. Mi Gmail personal donde quiero recibirlos es: `}
                target="_blank" rel="noopener noreferrer" className="text-white/65 underline">
                hola@vitalsoft.pro
              </a>
              {" "}indicando tu Gmail personal. Te llegará un correo de verificación que deberás confirmar.
            </p>
          </div>

          <div className="pt-1">
            <p className="text-white/25 text-xs">
              ¿Dudas o algo no funciona? Escríbenos por el canal habitual o a{" "}
              <a href="mailto:hola@vitalsoft.pro" target="_blank" rel="noopener noreferrer" className="text-white/40 underline">hola@vitalsoft.pro</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentesPage() {
  const [step, setStep] = useState<"magic" | "pending" | "dashboard" | "register" | "registered">("magic");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [agente, setAgente] = useState<AgenteData | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [customClips, setCustomClips] = useState(20);
  const [tab, setTab] = useState<Tab>("inicio");
  const [reporte, setReporte] = useState("");
  const [reporteOk, setReporteOk] = useState(false);
  const [reporteEnviado, setReporteEnviado] = useState("");
  const [editandoReporte, setEditandoReporte] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Leer token de la URL
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      loadDashboard(t);
    }
  }, []);

  const loadDashboard = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/agentes/activity", {
        headers: { "x-agente-token": t },
      });
      if (res.ok) {
        const data = await res.json();
        setAgente(data.agente);
        setVentas(data.ventas || []);
        setStep("dashboard");
        // Limpiar token de la URL sin recargar
        window.history.replaceState({}, "", "/agentes");
      } else {
        setError("Enlace inválido o caducado. Solicita uno nuevo.");
      }
    } catch { setError("Error de conexión."); }
    setLoading(false);
  };

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/agentes/magic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setStep("pending");
    else {
      const d = await res.json();
      setError(d.error || "Error al enviar.");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/agentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email }),
    });
    const d = await res.json();
    if (res.ok || res.status === 201) {
      setStep("registered");
    } else {
      setError(d.error || "Error al registrarse.");
    }
    setLoading(false);
  };

  const copyLink = (link: string, key: string) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  // Detectar si ya reportó esta semana
  const yaReportoEstaSemana = (() => {
    if (!agente?.ultimo_reporte) return false;
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    lunes.setHours(0, 0, 0, 0);
    return new Date(agente.ultimo_reporte) >= lunes;
  })();

  const sendReporte = async () => {
    if (!reporte.trim() || !token) return;
    setLoading(true);
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "reporte", mensaje: reporte }),
    });
    if (res.ok) {
      setReporteEnviado(reporte);
      setReporteOk(true);
      setEditandoReporte(false);
      setReporte("");
      setAgente(a => a ? { ...a, ultimo_reporte: new Date().toISOString() } : a);
      setTimeout(() => setReporteOk(false), 3000);
    }
    setLoading(false);
  };

  const cargarYEditar = async () => {
    if (reporteEnviado) {
      setReporte(reporteEnviado);
      setEditandoReporte(true);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "obtener_ultimo_reporte" }),
    });
    if (res.ok) {
      const d = await res.json();
      setReporteEnviado(d.texto || "");
      setReporte(d.texto || "");
    }
    setEditandoReporte(true);
    setLoading(false);
  };

  if (!mounted) return <main className="min-h-screen bg-[#080808]" />;

  const links = agente ? buildLinks(agente.codigo) : null;
  const customLink = agente ? `${BASE}/pagar?ref=${agente.codigo}&clips=${customClips}` : "";
  const customPrice = calcPrice(customClips);

  const totalComision = ventas
    .filter(v => v.estado === "liberada" || v.estado === "pagada")
    .reduce((sum, v) => sum + Number(v.importe) * COMISION_PCT, 0);

  const pendienteComision = ventas
    .filter(v => v.estado === "pendiente")
    .reduce((sum, v) => sum + Number(v.importe) * COMISION_PCT, 0);

  const inp = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20";

  // ── Login magic link ─────────────────────────────────────────────────────────
  if (step === "magic") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="font-display font-black text-xl mb-1"><span className="text-[#d4f53c]">Vital</span><span className="text-white/70">Soft</span></div>
          <p className="text-white/30 text-xs">Portal de Agentes</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7">
          <h1 className="font-display font-bold text-lg mb-1">Accede a tu portal</h1>
          <p className="text-white/35 text-sm mb-6">Te enviamos un enlace de acceso a tu email. Caduca en 1 hora.</p>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">{error}</p>}
          <form onSubmit={handleMagic} className="space-y-3">
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className={inp} />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar enlace de acceso →"}
            </button>
          </form>
          <p className="text-center text-white/20 text-xs mt-4">
            ¿Quieres ser agente?{" "}
            <button onClick={() => { setStep("register"); setError(""); }} className="text-white/40 hover:text-white/60 underline">
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </main>
  );

  // ── Email enviado ─────────────────────────────────────────────────────────────
  if (step === "pending") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-display font-bold text-xl mb-2">Revisa tu email</h2>
        <p className="text-white/40 text-sm mb-6">Si tu email está registrado como agente activo, recibirás el enlace en unos segundos.</p>
        <button onClick={() => setStep("magic")} className="text-white/25 text-xs underline hover:text-white/50">← Volver</button>
      </div>
    </main>
  );

  // ── Formulario de registro ────────────────────────────────────────────────────
  if (step === "register") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="font-display font-black text-xl mb-1"><span className="text-[#d4f53c]">Vital</span><span className="text-white/70">Soft</span></div>
          <p className="text-white/30 text-xs">Portal de Agentes</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7">
          <h1 className="font-display font-bold text-lg mb-1">Únete como agente</h1>
          <p className="text-white/35 text-sm mb-6">Gana un 20% de comisión por cada cliente que traigas. Sin permanencia, a tu ritmo.</p>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">{error}</p>}
          <form onSubmit={handleRegister} className="space-y-3">
            <input type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className={inp} />
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className={inp} />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl transition-all disabled:opacity-50">
              {loading ? "Enviando..." : "Solicitar acceso →"}
            </button>
          </form>
          <p className="text-center text-white/20 text-xs mt-4">
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => { setStep("magic"); setError(""); }} className="text-white/40 hover:text-white/60 underline">
              Accede aquí
            </button>
          </p>
        </div>
      </div>
    </main>
  );

  // ── Registro completado ───────────────────────────────────────────────────────
  if (step === "registered") return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-display font-bold text-xl mb-2">Solicitud recibida</h2>
        <p className="text-white/40 text-sm mb-6">Revisamos tu solicitud y te avisamos en 24–48h con tu acceso y código de agente.</p>
        <button onClick={() => setStep("magic")} className="text-white/25 text-xs underline hover:text-white/50">← Volver al acceso</button>
      </div>
    </main>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  if (!agente || !links) return <main className="min-h-screen bg-[#080808]" />;

  const TABS: { key: Tab; label: string }[] = [
    { key: "inicio", label: "Inicio" },
    { key: "links", label: "Links" },
    { key: "ventas", label: `Ventas (${ventas.length})` },
    { key: "ajustes", label: "Ajustes" },
    { key: "docs", label: "Documentación" },
  ];

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-display font-black text-lg"><span className="text-[#d4f53c]">Vital</span><span className="text-white/70">Soft</span></div>
            <div className="text-white/40 text-xs mt-0.5">Hola, <span className="text-white/70">{agente.nombre}</span> · Código: <span className="text-[#d4f53c] font-mono">{agente.codigo}</span></div>
          </div>
          {agente.estado_agente === "ausente" && (
            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full font-semibold">Ausente temporalmente</span>
          )}
          {agente.estado_agente === "inactivo" && (
            <span className="bg-white/10 border border-white/20 text-white/50 text-xs px-3 py-1 rounded-full font-semibold">Cuenta inactiva</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 min-w-fit text-xs py-2 px-3 rounded-lg font-display font-semibold transition-all whitespace-nowrap ${tab === t.key ? "bg-[#d4f53c] text-[#080808]" : "text-white/40 hover:text-white/70"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB INICIO ── */}
        {tab === "inicio" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Ventas", value: ventas.length },
                { label: "Comisión liberada", value: `€${totalComision.toFixed(0)}` },
                { label: "Pendiente", value: `€${pendienteComision.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-center">
                  <div className="font-display font-black text-xl text-[#d4f53c]">{s.value}</div>
                  <div className="text-white/30 text-[10px] mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Reporte semanal */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/60 text-xs font-semibold">Reporte semanal</p>
                <span className="text-white/20 text-[10px]">Se espera cada lunes</span>
              </div>

              {(yaReportoEstaSemana || reporteEnviado) && !editandoReporte ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#d4f53c] text-xs font-semibold">✓ Reporte de esta semana enviado</span>
                  </div>
                  {reporteEnviado && (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-3 mb-3">
                      <p className="text-white/45 text-xs leading-relaxed whitespace-pre-wrap">{reporteEnviado}</p>
                    </div>
                  )}
                  {!reporteEnviado && (
                    <p className="text-white/25 text-xs mb-3">Ya enviaste tu reporte esta semana.</p>
                  )}
                  <button
                    onClick={cargarYEditar}
                    disabled={loading}
                    className="text-white/30 text-xs underline hover:text-white/50 transition-colors disabled:opacity-50">
                    {loading ? "Cargando..." : "Editar o añadir información →"}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-white/30 text-xs mb-3">Cuéntanos cómo va la semana. Contactos, leads, preguntas... lo que sea.</p>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 mb-3">
                    <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2">Plantilla de ejemplo</p>
                    <p className="text-white/30 text-xs italic leading-relaxed">
                      "Esta semana contacté con [X] personas. [Nombre] mostró interés en el plan Growth. Pendiente de enviarle el link. Para la próxima semana planeo contactar con [perfil]."
                    </p>
                  </div>
                  <textarea rows={4}
                    placeholder={"Esta semana contacté con X personas...\nPendiente: enviar link a [nombre].\nPara la próxima semana: ..."}
                    value={reporte} onChange={e => setReporte(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors placeholder:text-white/20 resize-none mb-3" />
                  {reporteOk && <p className="text-[#d4f53c] text-xs mb-2">✓ Reporte enviado correctamente</p>}
                  <div className="flex gap-2">
                    {editandoReporte && (
                      <button onClick={() => { setEditandoReporte(false); setReporte(""); }}
                        className="flex-1 py-2.5 border border-white/10 text-white/30 font-display font-bold rounded-xl text-sm">
                        Cancelar
                      </button>
                    )}
                    <button onClick={sendReporte} disabled={loading || !reporte.trim()}
                      className="flex-1 py-2.5 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-black rounded-xl text-sm transition-all disabled:opacity-40">
                      {editandoReporte ? "Actualizar reporte" : "Enviar reporte"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dudas o preguntas */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-white/35 text-xs leading-relaxed">
                ¿Tienes dudas o preguntas? Envíalas por el canal habitual de comunicación o escríbenos a{" "}
                <a href={`mailto:hola@vitalsoft.pro?subject=Duda agente ${agente?.codigo || ""}&body=Hola, soy ${agente?.nombre || "agente"} y tengo una pregunta:%0A%0A`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-white/50 hover:text-white/70 underline transition-colors">
                  hola@vitalsoft.pro
                </a>
              </p>
            </div>

            {/* Info comisiones */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-xs text-white/35 space-y-1">
              <p className="font-semibold text-white/50 mb-2">Cómo funcionan las comisiones</p>
              <p>· 20% del primer mes de cada cliente que contrates</p>
              <p>· Periodo de retención de 14 días desde el pago</p>
              <p>· La comisión se libera automáticamente después de 14 días</p>

            </div>
          </div>
        )}

        {/* ── TAB LINKS ── */}
        {tab === "links" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {[
                { key: "general", label: "🌐 Landing completa", link: links.general, desc: "Para clientes que todavía están explorando" },
                { key: "starter", label: "Starter — 10 clips/mes · €150", link: links.starter, desc: "" },
                { key: "growth",  label: "Growth — 20 clips/mes · €250", link: links.growth, desc: "" },
                { key: "scale",   label: "Scale — 30 clips/mes · €350", link: links.scale, desc: "" },
                { key: "pro",     label: "Pro — 40 clips/mes · €450", link: links.pro, desc: "" },
              ].map(l => (
                <div key={l.key} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white/70 text-xs font-semibold">{l.label}</div>
                    {l.desc && <div className="text-white/25 text-[10px] mt-0.5">{l.desc}</div>}
                    <div className="text-white/20 text-[10px] font-mono truncate mt-1">{l.link}</div>
                  </div>
                  <button onClick={() => copyLink(l.link, l.key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied === l.key ? "bg-[#d4f53c] text-[#080808]" : "border border-white/10 text-white/40 hover:border-white/20"}`}>
                    {copied === l.key ? "✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>

            {/* Link personalizado */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
              <p className="text-white/60 text-xs font-semibold mb-3">Link personalizado</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="number" min={1} max={100} value={customClips} onChange={e => setCustomClips(Number(e.target.value))}
                  className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm text-center outline-none focus:border-[rgba(232,255,71,0.4)]" />
                <span className="text-white/40 text-sm">clips/mes</span>
                <span className="text-[#d4f53c] font-bold text-sm">→ €{customPrice}/mes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-white/30 text-xs font-mono truncate">{customLink}</div>
                <button onClick={() => copyLink(customLink, "custom")}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all ${copied === "custom" ? "bg-[#d4f53c] text-[#080808]" : "border border-white/10 text-white/40 hover:border-white/20"}`}>
                  {copied === "custom" ? "✓" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB VENTAS ── */}
        {tab === "ventas" && (
          <div className="space-y-3">
            {ventas.length === 0 ? (
              <div className="text-center py-12 text-white/25 text-sm">Aún no tienes ventas registradas.</div>
            ) : ventas.map(v => (
              <div key={v.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white/70 text-sm font-semibold">{v.plan}</div>
                  <div className="text-white/30 text-xs">{new Date(v.creado_at).toLocaleDateString("es-ES")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#d4f53c] font-bold text-sm">+€{(Number(v.importe) * COMISION_PCT).toFixed(0)}</div>
                  <div className={`text-xs ${v.estado === "pagada" ? "text-green-400" : v.estado === "liberada" ? "text-[#d4f53c]" : v.estado === "invalida" ? "text-red-400" : "text-white/30"}`}>
                    {v.estado}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB AJUSTES ── */}
        {tab === "ajustes" && (
          <div className="space-y-4">
            {/* Datos cuenta */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
              <p className="text-white/60 text-xs font-semibold mb-3">Tu cuenta</p>
              <p className="text-white/40 text-sm mb-0.5">{agente.nombre}</p>
              <p className="text-white/25 text-xs">{agente.email}</p>
              {agente.ultimo_acceso && <p className="text-white/20 text-xs mt-2">Último acceso: {new Date(agente.ultimo_acceso).toLocaleString("es-ES")}</p>}
              {agente.ultimo_reporte && <p className="text-white/20 text-xs">Último reporte: {new Date(agente.ultimo_reporte).toLocaleString("es-ES")}</p>}
            </div>

            {/* Método de cobro */}
            <AjustesCobro agente={agente} token={token} onSave={a => setAgente(a)} />

            {/* Contacto alternativo */}
            <AjustesContacto agente={agente} token={token} onSave={a => setAgente(a)} />

            {/* Ausencia temporal */}
            <AjustesAusencia agente={agente} token={token} onSave={a => setAgente(a)} />

              {/* Correo propio @vitalsoft.pro */}
              <AjustesCorreo agente={agente} token={token} />

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-xs text-white/30 space-y-1">
              <p>· Si en algún momento quieres tomarte un descanso, márcalo como ausente y no recibirás recordatorios durante ese periodo.</p>
              <p>· Si necesitas cualquier cosa, escríbenos a <a href="mailto:hola@vitalsoft.pro?subject=Duda cuenta agente&body=Hola, soy agente VitalSoft. Mi email: " target="_blank" rel="noopener noreferrer" className="text-white/50 underline">hola@vitalsoft.pro</a></p>
            </div>
          </div>
        )}

        {/* ── TAB DOCS ── */}
        {tab === "docs" && (
          <div className="space-y-4 text-sm">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[#d4f53c] font-display font-bold text-base mb-4">Guía del agente VitalSoft</p>

              <div className="space-y-5 text-white/50 text-xs leading-relaxed">
                <div>
                  <p className="text-white/70 font-semibold mb-2">¿Qué es VitalSoft?</p>
                  <p>VitalSoft es un servicio de edición por suscripción. Convertimos contenido largo (podcasts, entrevistas, vídeos) en clips cortos para TikTok, Reels y YouTube Shorts. El cliente sube su material a un Drive compartido y nosotros entregamos los clips en 24–48h.</p>
                </div>

                <div>
                  <p className="text-white/70 font-semibold mb-2">¿A quién vas a hablar?</p>
                  <p className="mb-2">El cliente ideal es alguien que ya graba contenido largo de forma regular y no tiene tiempo ni equipo para convertirlo en clips para redes:</p>
                  <ul className="space-y-1">
                    {["Podcasters con episodios semanales", "YouTubers con vídeos de +30 minutos", "Coaches con clases o formaciones grabadas", "Marcas que hacen entrevistas o eventos", "Speakers con charlas y ponencias"].map(i => (
                      <li key={i} className="flex gap-2"><span className="text-[#d4f53c]">·</span>{i}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-white/70 font-semibold mb-2">Planes y precios</p>
                  <div className="space-y-1">
                    {[["Starter", "10 clips/mes", "€150", "€30"], ["Growth", "20 clips/mes", "€250", "€50"], ["Scale", "30 clips/mes", "€350", "€70"], ["Pro", "40 clips/mes", "€450", "€90"]].map(([plan, clips, precio, comision]) => (
                      <div key={plan} className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                        <span className="text-white/60 font-semibold">{plan}</span>
                        <span>{clips}</span>
                        <span className="text-white/60">{precio}/mes</span>
                        <span className="text-[#d4f53c] font-bold">Tu comisión: {comision}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2">También existe calculadora personalizada de 1 a 100 clips. Usa el link de tu landing general para ese caso.</p>
                </div>

                <div>
                  <p className="text-white/70 font-semibold mb-2">Cómo vender</p>
                  <ol className="space-y-2">
                    {[
                      "Identifica a tu contacto — ¿graba contenido largo de forma regular?",
                      "Usa el link de la landing general para que explore o el link directo al plan si ya sabes cuál encaja.",
                      "Responde sus dudas: el servicio no requiere aprender nada, solo subir el material al Drive.",
                      "El cobro es automático por Stripe. Tú no gestionas pagos.",
                      "Tu comisión del 20% se libera a los 14 días del pago.",
                    ].map((s, i) => (
                      <li key={i} className="flex gap-2"><span className="text-[#d4f53c] font-bold flex-shrink-0">{i + 1}.</span>{s}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-white/70 font-semibold mb-2">Objeciones frecuentes</p>
                  <div className="space-y-3">
                    {[
                      ["¿No es más barato contratar un editor?", "La diferencia no es el precio, es la previsibilidad. Con un editor gestionas personas, plazos y revisiones. Con VitalSoft tienes un sistema: subes el material y recibes clips. Sin gestión."],
                      ["¿Y si no me gustan los clips?", "Cada plan incluye ajustes por clip. Si algo no encaja, se corrige."],
                      ["¿Cuántos clips salen de un episodio?", "Depende del contenido. Un episodio de 60 minutos suele generar entre 8 y 15 clips. Por eso los planes se definen por capacidad mensual, no por episodio."],
                      ["¿Puedo cancelar?", "Sí, sin permanencia, desde el portal del cliente."],
                    ].map(([q, a]) => (
                      <div key={q}>
                        <p className="text-white/60 font-semibold mb-1">— {q}</p>
                        <p>{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/70 font-semibold mb-2">Reglas importantes</p>
                  <ul className="space-y-1">
                    {[
                      "No prometas resultados garantizados ni viralidad — VitalSoft ofrece producción de clips, no crecimiento asegurado.",
                      "No compartas tu código con personas que no sean clientes reales — las ventas inválidas se invalidan.",
                      "Envía un reporte de actividad desde este portal al menos una vez al mes.",
                      "Los reportes semanales son cada lunes. Si pasas 3 semanas sin reportar tu cuenta pasa a inactiva, pero puedes reactivarla cuando quieras.",
                    ].map(r => (
                      <li key={r} className="flex gap-2"><span className="text-red-400/60">·</span>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.1)] rounded-xl p-4">
                  <p className="text-white/50 font-semibold mb-1">¿Tienes dudas?</p>
                  <p>Escríbenos a <a href="mailto:hola@vitalsoft.pro?subject=Duda agente VitalSoft&body=Hola, soy agente con código " target="_blank" rel="noopener noreferrer" className="text-[#d4f53c] underline">hola@vitalsoft.pro</a> o envía un reporte desde la pestaña Inicio.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
