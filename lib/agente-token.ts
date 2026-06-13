import crypto from "crypto";

// Sesión del portal de agentes: 1 hora. Se cachea en localStorage para que si
// el agente cierra y reabre la pestaña dentro de esa hora no tenga que pedir
// un enlace nuevo — pero pasada la hora, el token deja de ser válido igualmente.
const DURACION_SESION_MS = 60 * 60 * 1000;

export function signToken(agenteId: string, email: string): string {
  const exp = Date.now() + DURACION_SESION_MS;
  const payload = `${agenteId}:${email}:${exp}`;
  const sig = crypto.createHmac("sha256", process.env.CRON_SECRET!).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyToken(token: string): { agenteId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [agenteId, email, expStr, sig] = parts;
    if (Date.now() > parseInt(expStr)) return null;
    const payload = `${agenteId}:${email}:${expStr}`;
    const expected = crypto.createHmac("sha256", process.env.CRON_SECRET!).update(payload).digest("hex");
    if (sig !== expected) return null;
    return { agenteId, email };
  } catch { return null; }
}
