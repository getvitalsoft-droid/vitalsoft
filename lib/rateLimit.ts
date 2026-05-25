// ─────────────────────────────────────────────────────────────────────────────
// VitalSoft — Rate Limiting en memoria
// Para producción con mucho tráfico, reemplazar por Upstash Redis
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  store.forEach((v, k) => { if (v.resetAt < now) store.delete(k); });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;  // ventana de tiempo en ms
  max: number;       // máximo de requests permitidos
}

export function rateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, resetIn: entry.resetAt - now };
}

// Configs predefinidas
export const LIMITS = {
  // Registro de agentes: 5 intentos por IP cada hora
  agentesRegistro: { windowMs: 60 * 60 * 1000, max: 5 },
  // Login admin: 10 intentos por IP cada 15 minutos
  adminLogin: { windowMs: 15 * 60 * 1000, max: 10 },
  // Checkout: 20 por IP cada hora
  checkout: { windowMs: 60 * 60 * 1000, max: 20 },
  // Contacto/leads: 10 por IP cada hora
  contacto: { windowMs: 60 * 60 * 1000, max: 10 },
} as const;

export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
