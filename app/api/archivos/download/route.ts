// GET /api/archivos/download?id=ARCHIVO_ID
// Genera una URL firmada temporal para descargar un archivo.
// El navegador es redirigido a esa URL — el archivo nunca pasa por nuestro servidor.
// URLs expiran en 1 hora.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyClientToken } from "@/lib/cliente-token";

const BUCKET = "vitalsoft-archivos";
const EXPIRY = 60 * 60; // 1 hora

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sbAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  // Autenticación
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const clienteToken = req.headers.get("x-cliente-token");

  let esAdmin = false;
  let clienteEmail: string | null = null;

  if (bearer) {
    const { data: { user } } = await sbAuth.auth.getUser(bearer);
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim());
    if (user && adminEmails.includes(user.email || "")) esAdmin = true;
  } else if (clienteToken) {
    const payload = verifyClientToken(clienteToken);
    if (payload) clienteEmail = payload;
  }

  if (!esAdmin && !clienteEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener el archivo
  const { data: archivo, error: dbError } = await sb
    .from("archivos")
    .select("id, tipo, storage_path, nombre, order_id")
    .eq("id", id)
    .is("borrado_at", null)
    .single();

  if (dbError || !archivo) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  // Cliente solo puede descargar clips, no brutos
  if (!esAdmin && archivo.tipo === "bruto") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Cliente solo puede descargar archivos de su propio order
  if (!esAdmin && clienteEmail) {
    const { data: order } = await sb
      .from("orders")
      .select("cliente_email")
      .eq("id", archivo.order_id)
      .single();
    if (!order || order.cliente_email !== clienteEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  // Generar URL firmada de descarga
  const { data, error: storageError } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(archivo.storage_path, EXPIRY, {
      download: archivo.nombre, // Fuerza descarga con el nombre original
    });

  if (storageError || !data?.signedUrl) {
    console.error("[download]", storageError);
    return NextResponse.json({ error: "Error al generar enlace de descarga" }, { status: 500 });
  }

  // Redirigir directamente al archivo — sin pasar por nuestro servidor
  return NextResponse.redirect(data.signedUrl);
}
