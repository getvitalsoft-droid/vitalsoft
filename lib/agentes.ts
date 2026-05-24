// ─────────────────────────────────────────────────────────────────────────────
// VitalSoft — Sistema de Agentes y Referidos
// Almacenamiento en memoria (reemplazar con DB en producción)
// ─────────────────────────────────────────────────────────────────────────────

export interface Agente {
  id: string;
  nombre: string;
  email: string;
  codigo: string;          // código único de referido ej: "MARIA23"
  creado: string;
  ventas: Venta[];
}

export interface Venta {
  id: string;
  fecha: string;
  plan: string;
  importe: number;
  clienteEmail: string;
  estado: "pendiente" | "pagado" | "cancelado";
}

// Store en memoria — en producción usar Supabase/Prisma
export const agentes: Agente[] = [];

// Generar código único aleatorio estilo "VS-ABC123"
export function generarCodigo(nombre: string): string {
  const iniciales = nombre.slice(0, 3).toUpperCase().replace(/\s/g, "");
  const aleatorio = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `VS${iniciales}${aleatorio}`;
}

export function buscarAgente(codigo: string): Agente | undefined {
  return agentes.find(a => a.codigo.toUpperCase() === codigo.toUpperCase());
}

export function buscarAgentePorEmail(email: string): Agente | undefined {
  return agentes.find(a => a.email.toLowerCase() === email.toLowerCase());
}
