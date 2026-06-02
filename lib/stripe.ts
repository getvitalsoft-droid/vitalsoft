export const STRIPE_PAYMENT_LINKS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK ?? "#",
  growth:  process.env.NEXT_PUBLIC_STRIPE_GROWTH_LINK ?? "#",
  scale:   process.env.NEXT_PUBLIC_STRIPE_SCALE_LINK ?? "#",
  pro:     process.env.NEXT_PUBLIC_STRIPE_PRO_LINK ?? "#",
  custom:  process.env.NEXT_PUBLIC_STRIPE_CUSTOM_LINK ?? "#",
} as const;

export type PlanKey = keyof typeof STRIPE_PAYMENT_LINKS;

const EXACT_PRICES: Record<number, number> = {
  1: 25, 2: 45, 3: 60, 4: 80, 5: 100,
  6: 115, 7: 130, 8: 140, 9: 145, 10: 150,
};

export function calcPrice(videos: number): number {
  if (videos <= 10) return EXACT_PRICES[videos];
  if (videos <= 20) return 150 + (videos - 10) * 10;
  if (videos <= 30) return 250 + (videos - 20) * 10;
  if (videos <= 40) return 350 + (videos - 30) * 10;
  if (videos <= 60) return 450 + Math.round((videos - 40) * 8);
  if (videos <= 80) return 610 + Math.round((videos - 60) * 7);
  return 750 + Math.round((videos - 80) * 6);
}

export function fullPrice(videos: number): number {
  if (videos === 1) return 25;
  return 25 + (videos - 1) * 20;
}

export function savings(videos: number): number {
  return Math.max(0, fullPrice(videos) - calcPrice(videos));
}

// ref debe ser el código del agente sin prefijo, ej: "VSAIROZN"
// El webhook espera client_reference_id = "ref_VSAIROZN"
export function buildStripeUrl(plan: PlanKey, ref?: string): string {
  const base = STRIPE_PAYMENT_LINKS[plan];
  if (base === "#") return "#";
  if (!ref) return base;
  return `${base}?client_reference_id=ref_${ref}`;
}

export interface PricingPlan {
  key: PlanKey; name: string; price: number; videos: number;
  featured?: boolean; features: string[]; turnaround: string; revisions: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "starter", name: "Starter", price: 150, videos: 10,
    features: ["10 clips al mes", "Formato 9:16 vertical", "Subtítulos animados", "Drive compartido incluido"],
    turnaround: "Entrega en 48h", revisions: "1 ajuste por clip",
  },
  {
    key: "growth", name: "Growth", price: 250, videos: 20, featured: true,
    features: ["20 clips al mes", "3 formatos (9:16, 1:1, 16:9)", "Subtítulos animados", "Soporte prioritario"],
    turnaround: "Entrega en 36h", revisions: "2 ajustes por clip",
  },
  {
    key: "scale", name: "Scale", price: 350, videos: 30,
    features: ["30 clips al mes", "3 formatos (9:16, 1:1, 16:9)", "Subtítulos avanzados", "Producción dedicada"],
    turnaround: "Entrega en 24h", revisions: "3 ajustes por clip",
  },
  {
    key: "pro", name: "Pro", price: 450, videos: 40,
    features: ["40 clips al mes", "3 formatos + clips prioritarios", "Subtítulos premium", "Producción dedicada"],
    turnaround: "Prioridad máxima", revisions: "4 ajustes por clip",
  },
];
