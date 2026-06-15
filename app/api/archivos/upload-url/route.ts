// POST /api/archivos/upload-url
// Genera una URL firmada para subir un archivo directamente a Supabase Storage
// desde el navegador del cliente o del admin.
//
// Body: { order_id, nombre, tipo: "bruto" | "clip", tamanio_bytes, token? }
// - Si tipo="bruto": autenticado por token de cliente (x-cliente-token)
// - Si tipo="clip":  autenticado por JWT admin (Authorization: Bearer)
//
// Returns: { upload_url, storage_path }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyToken as verifyClienteToken } from "@/lib/cliente-token";
import { rateLimit, LIMITS, getIP } from "@/lib/rateLimit";

const BUCKET = "vitalsoft-archivos";
const URL_EXPIRY = 60 * 60; // 1 hora para completar la subida

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sbAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function sanitizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = rateLimit(`upload-url:${ip}`, LIMITS.checkout);
  if (!allowed) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = await req.json();
  const { order_id, nombre, tipo, tamanio_bytes } = body;

  if (!order_id || !nombre || !tipo) {
    return NextResponse.json({ error: "order_id, nombre y tipo son requeridos" }, { status: 400 });
  }
  if (!["bruto", "clip"].includes(tipo)) {
    return NextResponse.json({ error: "tipo debe ser bruto o clip" }, { status: 400 });
  }
  if (tamanio_bytes && tamanio_bytes > 10 * 1024 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 10 GB)" }, { status: 400 });
  }

  // Autenticación según tipo
  let subido_por: "cliente" | "admin";
  if (tipo === "bruto") {
    // Cliente sube su material — verificar token de cliente
    const clienteToken = req.headers.get("x-cliente-token");
    if (!clienteToken) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const payload = verifyClienteToken(clienteToken);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido o caducado" }, { status: 401 });
    }
    // Verificar que el order pertenece a este cliente
    const { data: order } = await sb
      .from("orders")
      .select("id, cliente_email")
      .eq("id", order_id)
      .single();
    if (!order || order.cliente_email !== payload.email) {
      return NextResponse.json({ error: "Order no encontrado" }, { status: 404 });
    }
    subido_por = "cliente";
  } else {
    // Admin sube clips — verificar JWT Supabase
    const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!bearer) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { data: { user }, error } = await sbAuth.auth.getUser(bearer);
    if (error || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim());
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    subido_por = "admin";
  }

  // Construir path en el bucket: orders/{order_id}/{tipo}/{timestamp}_{nombre}
  const ts = Date.now();
  const nombreSanitizado = sanitizarNombre(nombre);
  const storage_path = `orders/${order_id}/${tipo}/${ts}_${nombreSanitizado}`;

  // Generar URL firmada de subida (el archivo se sube directamente desde el navegador)
  const { data, error: storageError } = await sb.storage
    .from(BUCKET)
    .createSignedUploadUrl(storage_path);

  if (storageError || !data) {
    console.error("[upload-url]", storageError);
    return NextResponse.json({ error: "Error al preparar la subida" }, { status: 500 });
  }

  return NextResponse.json({
    upload_url: data.signedUrl,
    storage_path,
    token: data.token,
    subido_por,
  });
}
