// GET /api/archivos/[orderId]
// Devuelve los archivos de un order.
// - Admin: todos (brutos + clips)
// - Cliente: solo clips (brutos son internos)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyToken as verifyClienteToken } from "@/lib/cliente-token";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sbAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;
  if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

  // Detectar si es admin o cliente
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const clienteToken = req.headers.get("x-cliente-token");

  let esAdmin = false;
  let clienteEmail: string | null = null;

  if (bearer) {
    const { data: { user } } = await sbAuth.auth.getUser(bearer);
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim());
    if (user && adminEmails.includes(user.email || "")) esAdmin = true;
  } else if (clienteToken) {
    const payload = verifyClienteToken(clienteToken);
    if (payload) clienteEmail = payload.email;
  }

  if (!esAdmin && !clienteEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Si es cliente, verificar que el order le pertenece
  if (!esAdmin && clienteEmail) {
    const { data: order } = await sb
      .from("orders")
      .select("cliente_email")
      .eq("id", orderId)
      .single();
    if (!order || order.cliente_email !== clienteEmail) {
      return NextResponse.json({ error: "Order no encontrado" }, { status: 404 });
    }
  }

  // Obtener archivos — cliente solo ve clips, admin ve todo
  let query = sb
    .from("archivos")
    .select("id, tipo, nombre, tamanio_bytes, subido_por, creado_at, storage_path")
    .eq("order_id", orderId)
    .is("borrado_at", null)
    .order("creado_at", { ascending: false });

  if (!esAdmin) query = query.eq("tipo", "clip");

  const { data: archivos, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ archivos: archivos || [] });
}
