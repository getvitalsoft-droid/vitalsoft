"use client";
import { useState, useEffect, type ReactNode } from "react";
import { calcPrice } from "@/lib/stripe";

interface Venta {
  id: string; plan: string; importe: number; creado_at: string;
  estado: string; cliente_email?: string;
}
interface AgenteData {
  id: string; nombre: string; email: string; codigo: string; creado_at: string;
  aprobado: boolean; bloqueado: boolean; motivo_bloqueo?: string; nota_agente?: string;
  estado_agente?: string; ausente_hasta?: string; reactivacion_solicitada?: boolean;
  ultimo_acceso?: string; ultimo_reporte?: string;
  metodo_cobro?: string; datos_cobro?: string; contacto_alternativo?: string;
  reportes_sin_rellenar?: number;
  onboarding_docs_leidos?: boolean;
  onboarding_completado_at?: string;
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
    if (res.ok) { onSave({ ...agente, estado_agente: "ausente", ausente_hasta: new Date(hasta).toISOString() }); setOk(true); setTimeout(() => setOk(false), 2500); }
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
              <li>
                Guarda los cambios. Gmail enviará un correo de verificación a {direccion} con un enlace o un código de confirmación.
                <span className="block text-white/30 mt-1">
                  Si todavía no has configurado la recepción (sección de abajo), ese correo no te llegará — pide primero la activación de recepción a VitalSoft.
                </span>
              </li>
              <li>
                Vuelve a <span className="text-white/65">Ajustes → Ver todas las opciones de configuración → Cuentas e importación</span>. Verás {direccion} marcado como "pendiente de verificación" — pulsa <span className="text-white/65">Verificar</span> e introduce el código o confirma el enlace recibido.
              </li>
              <li>Listo — ya puedes escribir como {direccion}.</li>
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

function OverlayCard({ color, icon, title, children }: { color: "red" | "yellow" | "green"; icon: string; title: string; children: ReactNode }) {
  const styles = {
    red: { bg: "bg-red-500/[0.07]", border: "border-red-500/25", text: "text-red-400" },
    yellow: { bg: "bg-yellow-400/[0.07]", border: "border-yellow-400/25", text: "text-yellow-400" },
    green: { bg: "bg-green-400/[0.07]", border: "border-green-400/25", text: "text-green-400" },
  }[color];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-xl bg-black/50">
      <div className={`max-w-sm w-full rounded-2xl p-7 border ${styles.bg} ${styles.border}`}>
        <div className="text-3xl mb-3">{icon}</div>
        <h2 className={`font-display font-black text-lg mb-3 ${styles.text}`}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function EstadoOverlay({ agente, token, onSave }: { agente: AgenteData; token: string; onSave: (a: AgenteData) => void }) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // ── BLOQUEADO — rojo, permanente ──────────────────────────────────────────
  if (agente.bloqueado) {
    return (
      <OverlayCard color="red" icon="🔒" title="Cuenta inhabilitada">
        <p className="text-white/50 text-sm mb-3">
          VitalSoft ha inhabilitado tu cuenta de agente de manera permanente.
        </p>
        {agente.motivo_bloqueo && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 mb-3">
            <div className="text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Motivo</div>
            <div className="text-white/70 text-sm">{agente.motivo_bloqueo}</div>
          </div>
        )}
        {agente.nota_agente && <p className="text-white/40 text-xs leading-relaxed mb-4">{agente.nota_agente}</p>}
        <a href={`mailto:hola@vitalsoft.pro?subject=Mi cuenta de agente ha sido inhabilitada&body=Hola, mi código de agente es ${agente.codigo} y me gustaría más información sobre por qué se ha inhabilitado mi cuenta.`}
          target="_blank" rel="noopener noreferrer"
          className="block text-center w-full py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-semibold hover:border-white/20 transition-all">
          Contactar con VitalSoft
        </a>
      </OverlayCard>
    );
  }

  // ── INACTIVO — amarillo, por falta de reportes ────────────────────────────
  if (agente.estado_agente === "inactivo") {
    const enviarReporte = async () => {
      if (!mensaje.trim()) return;
      setLoading(true);
      const res = await fetch("/api/agentes/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agente-token": token },
        body: JSON.stringify({ accion: "reporte_reactivacion", mensaje: mensaje.trim() }),
      });
      if (res.ok) onSave({ ...agente, estado_agente: "activo", reactivacion_solicitada: false });
      setLoading(false);
    };

    const solicitar = async () => {
      setLoading(true);
      const res = await fetch("/api/agentes/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agente-token": token },
        body: JSON.stringify({ accion: "solicitar_reactivacion" }),
      });
      if (res.ok) onSave({ ...agente, reactivacion_solicitada: true });
      setLoading(false);
    };

    return (
      <OverlayCard color="yellow" icon="⏸️" title="Cuenta en inactividad prolongada">
        <p className="text-white/50 text-sm mb-3">
          Al estar más de 3 semanas sin enviar tu reporte semanal, tu cuenta ha sido marcada como inactiva.
        </p>
        {agente.nota_agente && <p className="text-white/40 text-xs leading-relaxed mb-4">{agente.nota_agente}</p>}

        <p className="text-white/40 text-xs leading-relaxed mb-2">
          Para volver, envía tu reporte de esta semana — tu cuenta se reactivará automáticamente. A partir de ahora, hazlo cada lunes para mantenerla activa.
        </p>
        <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={4}
          placeholder="Esta semana contacté con..."
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none mb-3 resize-none focus:border-yellow-400/30" />
        <button onClick={enviarReporte} disabled={loading || !mensaje.trim()}
          className="w-full py-2.5 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30 text-yellow-400 text-sm font-bold transition-all disabled:opacity-40 mb-3">
          {loading ? "Enviando..." : "Enviar reporte y reactivar mi cuenta"}
        </button>

        <div className="border-t border-white/[0.06] pt-3">
          {agente.reactivacion_solicitada ? (
            <p className="text-white/30 text-xs text-center">Solicitud enviada — te contactaremos pronto.</p>
          ) : (
            <button onClick={solicitar} disabled={loading}
              className="w-full text-white/30 hover:text-white/50 text-xs underline transition-all disabled:opacity-50">
              O si prefieres hablar antes, pide que te contactemos
            </button>
          )}
        </div>
      </OverlayCard>
    );
  }

  // ── AUSENTE — verde, voluntario y temporal ────────────────────────────────
  const ausenteVigente = agente.estado_agente === "ausente" && agente.ausente_hasta && new Date(agente.ausente_hasta) >= new Date();
  if (ausenteVigente) {
    const volver = async () => {
      setLoading(true);
      const res = await fetch("/api/agentes/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agente-token": token },
        body: JSON.stringify({ accion: "volver_ausente" }),
      });
      if (res.ok) onSave({ ...agente, estado_agente: "activo", ausente_hasta: undefined });
      setLoading(false);
    };

    const fecha = new Date(agente.ausente_hasta!).toLocaleDateString("es-ES", { day: "numeric", month: "long" });

    return (
      <OverlayCard color="green" icon="🌴" title="Ausencia temporal">
        <p className="text-white/50 text-sm mb-5">
          Tu cuenta está marcada como ausente hasta el <span className="text-white/80 font-semibold">{fecha}</span>. No recibirás recordatorios durante este periodo.
        </p>
        <button onClick={volver} disabled={loading}
          className="w-full py-2.5 rounded-xl bg-green-400/15 hover:bg-green-400/25 border border-green-400/30 text-green-400 text-sm font-bold transition-all disabled:opacity-50">
          {loading ? "Procesando..." : "Volver antes de tiempo"}
        </button>
      </OverlayCard>
    );
  }

  return null;
}

function ConfirmarDocs({ agente, token, onSave }: { agente: AgenteData; token: string; onSave: (a: AgenteData) => void }) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  if (agente.onboarding_docs_leidos) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-[rgba(212,245,60,0.04)] border border-[rgba(212,245,60,0.12)] rounded-xl">
        <span className="text-[#d4f53c] text-sm">✓</span>
        <span className="text-white/40 text-xs">Documentación confirmada — vuelve a Inicio para continuar.</span>
      </div>
    );
  }

  const confirmar = async () => {
    if (!codigo.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/agentes/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-agente-token": token },
      body: JSON.stringify({ accion: "confirmar_docs", codigo_confirmacion: codigo.trim() }),
    });
    if (res.ok) {
      setOk(true);
      onSave({ ...agente, onboarding_docs_leidos: true });
    } else {
      const d = await res.json();
      setError(d.error || "Código incorrecto.");
    }
    setLoading(false);
  };

  if (ok) return (
    <div className="flex items-center gap-2 py-3 px-4 bg-[rgba(212,245,60,0.04)] border border-[rgba(212,245,60,0.12)] rounded-xl">
      <span className="text-[#d4f53c] text-sm">✓</span>
      <span className="text-white/40 text-xs">¡Perfecto! Vuelve a Inicio para continuar.</span>
    </div>
  );

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
      <p className="text-white/60 text-xs font-semibold mb-1">He leído la documentación completa</p>
      <p className="text-white/25 text-[11px] mb-4 leading-relaxed">Introduce tu código de agente para confirmar que has leído y entendido todo.</p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Tu código (ej: ${agente.codigo.slice(0, 4)}...)`}
          value={codigo}
          onChange={e => { setCodigo(e.target.value.toUpperCase()); setError(""); }}
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-white/20"
        />
        <button onClick={confirmar} disabled={loading || !codigo.trim()}
          className="px-4 py-2 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-bold text-xs rounded-lg disabled:opacity-40 transition-all">
          {loading ? "..." : "Confirmar"}
        </button>
      </div>
      {error && <p className="text-red-400 text-[11px] mt-2">{error}</p>}
    </div>
  );
}

function ChecklistOnboarding({ agente, token, onSave, onIrADocs, onIrAAjustes }: {
  agente: AgenteData; token: string;
  onSave: (a: AgenteData) => void;
  onIrADocs: () => void;
  onIrAAjustes: () => void;
}) {
  const [colapsado, setColapsado] = useState(false);

  const items = [
    {
      id: "docs",
      label: "Lee la documentación completa",
      desc: "Contiene todo lo que necesitas saber para vender correctamente.",
      hecho: !!agente.onboarding_docs_leidos,
      accion: <button onClick={onIrADocs} className="text-[#d4f53c] text-xs font-semibold underline">Ir a Documentación →</button>,
    },
    {
      id: "cobro",
      label: "Configura tu método de cobro",
      desc: "Necesitamos saber cómo enviarte tus comisiones.",
      hecho: !!agente.metodo_cobro,
      accion: <button onClick={onIrAAjustes} className="text-[#d4f53c] text-xs font-semibold underline">Ir a Ajustes →</button>,
    },
    {
      id: "contacto",
      label: "Añade un contacto alternativo",
      desc: "WhatsApp u otro canal por si necesitamos localizarte.",
      hecho: !!agente.contacto_alternativo,
      accion: <button onClick={onIrAAjustes} className="text-[#d4f53c] text-xs font-semibold underline">Ir a Ajustes →</button>,
    },
  ];

  const total = items.length;
  const hechos = items.filter(i => i.hecho).length;
  const todoCompleto = hechos === total;

  // Si ya estaba completado antes de esta sesión, no mostrar nada
  if (agente.onboarding_completado_at) return null;

  if (colapsado && todoCompleto) {
    return (
      <div className="bg-[rgba(212,245,60,0.04)] border border-[rgba(212,245,60,0.15)] rounded-xl px-5 py-3 flex items-center justify-between">
        <span className="text-[#d4f53c] text-xs font-semibold">✓ Cuenta configurada — ¡ya estás listo para vender!</span>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/70 text-xs font-semibold">Primeros pasos</p>
          <p className="text-white/25 text-[10px] mt-0.5">{hechos} de {total} completados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {items.map(item => (
              <div key={item.id} className={`w-6 h-1.5 rounded-full transition-all ${item.hecho ? "bg-[#d4f53c]" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className={`flex gap-3 p-3 rounded-lg border transition-all ${item.hecho ? "border-[rgba(212,245,60,0.1)] bg-[rgba(212,245,60,0.03)] opacity-60" : "border-white/[0.06] bg-white/[0.02]"}`}>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${item.hecho ? "border-[#d4f53c] bg-[#d4f53c]" : "border-white/20"}`}>
              {item.hecho && <span className="text-[#080808] text-[10px] font-black">✓</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold mb-0.5 ${item.hecho ? "text-white/40 line-through" : "text-white/70"}`}>{item.label}</p>
              {!item.hecho && (
                <>
                  <p className="text-white/30 text-[11px] mb-2 leading-relaxed">{item.desc}</p>
                  {item.accion}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {todoCompleto && (
        <button onClick={() => {
          setColapsado(true);
          // Marcar onboarding completado en BD (fire & forget)
          fetch("/api/agentes/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-agente-token": token },
            body: JSON.stringify({ accion: "completar_onboarding" }),
          }).catch(() => {});
          onSave({ ...agente, onboarding_completado_at: new Date().toISOString() });
        }}
          className="mt-4 w-full py-2.5 bg-[#d4f53c] hover:bg-[#b8e032] text-[#080808] font-display font-bold text-xs rounded-xl transition-all">
          ¡Todo listo! Empezar a vender →
        </button>
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
  const [sesionEnOtraPestana, setSesionEnOtraPestana] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Leer token de la URL (enlace de email)
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      loadDashboard(t);
      return;
    }
    // Sin token en la URL — intentar recuperar sesión guardada (dentro de la hora)
    const saved = window.localStorage.getItem("vs_agente_token");
    if (saved) {
      setToken(saved);
      loadDashboard(saved);
    }

    // Si esta pestaña queda en "Revisa tu email" y el agente abre el enlace en
    // otra pestaña (mismo origen), localStorage se actualiza ahí y este evento
    // nos avisa aquí — ya no necesitamos esta pestaña.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vs_agente_token" && e.newValue) {
        setSesionEnOtraPestana(true);
        setTimeout(() => { try { window.close(); } catch {} }, 1500);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
        // Guardar sesión para futuras visitas (evita pedir enlace nuevo / abrir otra pestaña)
        window.localStorage.setItem("vs_agente_token", t);
        // Limpiar token de la URL sin recargar
        window.history.replaceState({}, "", "/agentes");
      } else {
        // Token inválido/caducado — limpiar sesión guardada si era la que falló
        window.localStorage.removeItem("vs_agente_token");
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
        {sesionEnOtraPestana ? (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="font-display font-bold text-xl mb-2">Ya iniciaste sesión</h2>
            <p className="text-white/40 text-sm mb-6">Hemos detectado que abriste el enlace en otra pestaña. Esta ya no la necesitas — puedes cerrarla.</p>
            <button onClick={() => window.close()} className="text-white/25 text-xs underline hover:text-white/50">Cerrar esta pestaña</button>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">📬</div>
            <h2 className="font-display font-bold text-xl mb-2">Revisa tu email</h2>
            <p className="text-white/40 text-sm mb-6">Si tu email está registrado como agente activo, recibirás el enlace en unos segundos.</p>
            <button onClick={() => setStep("magic")} className="text-white/25 text-xs underline hover:text-white/50">← Volver</button>
          </>
        )}
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
      <EstadoOverlay agente={agente} token={token} onSave={a => setAgente(a)} />
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
            {/* Checklist onboarding — solo si no está completado */}
            <ChecklistOnboarding
              agente={agente}
              token={token}
              onSave={a => setAgente(a)}
              onIrADocs={() => setTab("docs")}
              onIrAAjustes={() => setTab("ajustes")}
            />

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

            <button onClick={() => { window.localStorage.removeItem("vs_agente_token"); setAgente(null); setToken(""); setStep("magic"); }}
              className="w-full py-2.5 border border-white/[0.06] text-white/25 font-display font-semibold rounded-xl text-xs hover:border-white/15 hover:text-white/40 transition-all">
              Cerrar sesión en este dispositivo
            </button>
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
                  <p>VitalSoft es un servicio de edición por suscripción. Convertimos contenido largo (podcasts, entrevistas, vídeos) en clips cortos para TikTok, Reels y YouTube Shorts. El cliente sube su material a su portal de cliente y nosotros entregamos los clips en 24–48h.</p>
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
                      "Responde sus dudas: el servicio no requiere aprender nada, solo subir el material desde su portal de cliente.",
                      "El cobro es automático por Stripe. Tú no gestionas pagos.",
                      "Tu comisión del 20% se libera a los 14 días del pago.",
                    ].map((s, i) => (
                      <li key={i} className="flex gap-2"><span className="text-[#d4f53c] font-bold flex-shrink-0">{i + 1}.</span>{s}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-white/70 font-semibold mb-3">Cómo hablar del precio</p>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 mb-4">
                    <p className="text-white/50 text-[11px] leading-relaxed mb-3">
                      <span className="text-white/70 font-semibold">No defiendas el precio — habla de lo que el cliente recupera.</span>{" "}
                      La mayoría de creadores dedican entre 10 y 20 horas al mes a sacar clips de su contenido largo. Cuando lo entienden así, 250€ deja de parecer un gasto y se convierte en una decisión obvia.
                    </p>
                    <p className="text-white/40 text-[11px] leading-relaxed">Céntrate en tres cosas: <span className="text-white/60">horas recuperadas</span>, <span className="text-white/60">consistencia de publicación</span> (ya no se procrastina la tarea), y <span className="text-white/60">eliminar una tarea que no les gusta hacer</span>. No menciones lo que vale su hora — muchos creadores pequeños no se identifican con cifras grandes.</p>
                  </div>

                  <p className="text-white/70 font-semibold mb-2">Objeciones frecuentes</p>
                  <div className="space-y-4">
                    {[
                      ["— Es caro.", "Entiendo la preocupación. Muchos creadores lo comparan con hacerlo ellos mismos o con contratar un editor. La diferencia es que VitalSoft está pensado para convertir una grabación larga en semanas de contenido sin que tengas que dedicar horas a revisar, cortar, subtitular y exportar. Si actualmente dedicas 10–15 horas al mes a esta tarea, el coste real suele ser bastante superior a la cuota del servicio."],
                      ["— Ya tengo editor.", "Perfecto. Si tu editor te funciona, no hay motivo para cambiar. Lo que ofrecemos es un sistema con plazos definidos, ajustes incluidos y capacidad de producir volumen constante sin depender de una sola persona. Si en algún momento eso te resulta útil, aquí estamos."],
                      ["— ¿No es más barato contratar un editor?", "Un editor a 15€ por clip, en el plan Growth (20 clips), son 300€ más el tiempo que pasas coordinando, revisando y explicando tu estilo. VitalSoft son 250€ y cero gestión — subes el material y recibes los clips."],
                      ["— ¿Y si no me gustan los clips?", "Cada plan incluye ajustes por clip. Si algo no encaja, se corrige."],
                      ["— ¿Cuántos clips salen de un episodio?", "Depende del contenido. Un episodio de 60 minutos suele generar entre 8 y 15 clips. Por eso los planes se definen por capacidad mensual, no por episodio."],
                      ["— ¿Puedo cancelar?", "Sí, sin permanencia, desde el portal del cliente."],
                    ].map(([q, a]) => (
                      <div key={q} className="border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                        <p className="text-white/60 font-semibold mb-1">{q}</p>
                        <p>{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[rgba(255,200,50,0.04)] border border-[rgba(255,200,50,0.1)] rounded-xl p-4">
                  <p className="text-white/60 text-xs font-semibold mb-2">⚠️ Lo que más perjudica ahora mismo no es el precio</p>
                  <p className="text-white/40 text-[11px] leading-relaxed">Es no tener casos reales ni muestras de trabajo. Un cliente puede entender perfectamente el ROI y aun así pensar: "vale, pero ¿quién dice que los clips serán buenos?". Esa objeción no se gana con argumentos — se gana con muestras. Cuando las tengamos, os avisamos para que las uséis.</p>
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

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                  <p className="text-white/40 text-[11px] leading-relaxed">
                    <span className="text-white/60 font-semibold">⚠️ Esta documentación es tu referencia para cada venta.</span>{" "}
                    Revísala periódicamente — está sujeta a cambios. Por ejemplo, el sistema de entrega ya usa un portal propio integrado en VitalSoft.
                  </p>
                </div>

                <ConfirmarDocs agente={agente} token={token} onSave={a => setAgente(a)} />

              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
