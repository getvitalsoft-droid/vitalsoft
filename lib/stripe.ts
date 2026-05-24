// ─────────────────────────────────────────────────────────────────────────────
// VitalSoft — Stripe Utility & Pricing Logic
// ─────────────────────────────────────────────────────────────────────────────

export const STRIPE_PAYMENT_LINKS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK ?? "#",
  growth: process.env.NEXT_PUBLIC_STRIPE_GROWTH_LINK ?? "#",
  scale: process.env.NEXT_PUBLIC_STRIPE_SCALE_LINK ?? "#",
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_LINK ?? "#",
  custom: process.env.NEXT_PUBLIC_STRIPE_CUSTOM_LINK ?? "#",
} as const;

export type PlanKey = keyof typeof STRIPE_PAYMENT_LINKS;

/**
 * Precios exactos para 1–10 vídeos.
 * Ancla: 10 vídeos = €150 (plan Starter)
 */
const EXACT_PRICES: Record<number, number> = {
  1: 25,
  2: 45,
  3: 60,
  4: 80,
  5: 100,
  6: 115,
  7: 130,
  8: 140,
  9: 145,
  10: 150,
};

/**
 * Tabla de precios con anclas perfectas en los 4 planes:
 *   10 → €150  (Starter)
 *   20 → €250  (Growth)
 *   30 → €350  (Scale)
 *   40 → €450  (Pro)
 * 
 * Tramos 1–40: €10/vídeo marginal desde el tramo 11
 * Tramos >40:  descuentos progresivos más agresivos
 *   41–60 → €8/vídeo marginal  → 60 = €610
 *   61–80 → €7/vídeo marginal  → 80 = €750
 *   81–100→ €6/vídeo marginal  → 100= €870
 */
export function calcPrice(videos: number): number {
  if (videos <= 10) return EXACT_PRICES[videos];
  if (videos <= 20) return 150 + (videos - 10) * 10;
  if (videos <= 30) return 250 + (videos - 20) * 10;
  if (videos <= 40) return 350 + (videos - 30) * 10;
  if (videos <= 60) return 450 + Math.round((videos - 40) * 8);
  if (videos <= 80) return 610 + Math.round((videos - 60) * 7);
  return 750 + Math.round((videos - 80) * 6);
}

/** Precio de referencia sin descuentos (tarifa unitaria €25 + €20 adicionales) */
export function fullPrice(videos: number): number {
  if (videos === 1) return 25;
  return 25 + (videos - 1) * 20;
}

/** Ahorro respecto a tarifa individual */
export function savings(videos: number): number {
  return Math.max(0, fullPrice(videos) - calcPrice(videos));
}

/**
 * Build a Stripe payment link URL with optional pre-filled params.
 */
export function buildStripeUrl(
  plan: PlanKey,
  opts: { email?: string; videos?: number } = {}
): string {
  const base = STRIPE_PAYMENT_LINKS[plan];
  if (base === "#") return "#";
  const params = new URLSearchParams();
  if (opts.email) params.set("prefilled_email", opts.email);
  if (opts.videos) params.set("client_reference_id", `${opts.videos}vids`);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Plans Data
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingPlan {
  key: PlanKey;
  name: string;
  price: number;
  videos: number;
  featured?: boolean;
  features: string[];
  turnaround: string;
  revisions: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    price: 150,
    videos: 10,
    features: [
      "10 clips de formato corto",
      "Subtítulos animados",
      "Formato vertical 9:16",
      "Soporte por email",
    ],
    turnaround: "Entrega en 48h",
    revisions: "1 revisión por clip",
  },
  {
    key: "growth",
    name: "Growth",
    price: 250,
    videos: 20,
    featured: true,
    features: [
      "20 clips de formato corto",
      "Subtítulos animados",
      "Formatos multiplataforma",
      "Soporte prioritario",
    ],
    turnaround: "Entrega en 36h",
    revisions: "2 revisiones por clip",
  },
  {
    key: "scale",
    name: "Scale",
    price: 350,
    videos: 30,
    features: [
      "30 clips de formato corto",
      "Subtítulos avanzados",
      "Formatos multiplataforma",
      "Editor dedicado",
    ],
    turnaround: "Entrega en 24h",
    revisions: "Revisiones ilimitadas",
  },
  {
    key: "pro",
    name: "Pro",
    price: 450,
    videos: 40,
    features: [
      "40 clips de formato corto",
      "Subtítulos premium + B-roll",
      "Todos los formatos + largo",
      "Llamada estratégica mensual",
    ],
    turnaround: "Entrega en 24h",
    revisions: "Revisiones ilimitadas",
  },
];
