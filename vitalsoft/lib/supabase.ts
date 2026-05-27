import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con service role para operaciones del servidor (API routes)
export const supabase = createClient(url, key);

// Tipos
export interface Agente {
  id: string;
  nombre: string;
  email: string;
  codigo: string;
  creado_at: string;
}

export interface Venta {
  id: string;
  agente_id: string;
  agente_codigo: string;
  cliente_email: string;
  plan: string;
  importe: number;
  estado: "pendiente" | "pagado" | "cancelado";
  stripe_session_id?: string;
  creado_at: string;
}

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  social?: string;
  source?: string;
  notas?: string;
  videos: number;
  precio: number;
  agente_codigo?: string;
  creado_at: string;
}

// Generar código único estilo "VSMAR123"
export function generarCodigo(nombre: string): string {
  const iniciales = nombre.slice(0, 3).toUpperCase().replace(/\s/g, "");
  const aleatorio = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `VS${iniciales}${aleatorio}`;
}
