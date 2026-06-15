// POST /api/archivos/confirmar
// Llamado tras completar la subida al bucket.
// Registra el archivo en la tabla `archivos` y actualiza el estado del order si aplica.
//
// Body: { order_id, storage_path, nombre, tipo, tamanio_bytes, subido_por }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyClientToken } from "@/lib/cliente-token";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sbAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, storage_path, nombre, tipo, tamanio_bytes } = body;

  if (!order_id || !storage_path || !nombre || !tipo) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  // Autenticación — mismo criterio que upload-url
  let subido_por: "cliente" | "admin";
  if (tipo === "bruto") {
    const clienteToken = req.headers.get("x-cliente-token");
    if (!clienteToken) return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    const payload = verifyClientToken(clienteToken);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    const { data: order } = await sb.from("orders").select("cliente_email").eq("id", order_id).single();
    if (!order || order.cliente_email !== payload) {
      return NextResponse.json({ error: "Order no encontrado" }, { status: 404 });
    }
    subido_por = "cliente";
  } else {
    const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!bearer) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { data: { user }, error } = await sbAuth.auth.getUser(bearer);
    if (error || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim());
    if (!adminEmails.includes(user.email || "")) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    subido_por = "admin";
  }

  // Verificar que el archivo existe realmente en el bucket antes de registrarlo
  const { data: fileData, error: fileError } = await sb.storage
    .from("vitalsoft-archivos")
    .list(storage_path.split("/").slice(0, -1).join("/"), {
      search: storage_path.split("/").pop(),
    });

  if (fileError || !fileData?.length) {
    return NextResponse.json({ error: "Archivo no encontrado en storage. ¿Se completó la subida?" }, { status: 400 });
  }

  // Registrar en tabla archivos
  const { data: archivo, error: dbError } = await sb
    .from("archivos")
    .insert({
      order_id,
      tipo,
      nombre,
      storage_path,
      tamanio_bytes: tamanio_bytes || null,
      subido_por,
    })
    .select()
    .single();

  if (dbError) {
    console.error("[confirmar]", dbError);
    return NextResponse.json({ error: "Error al registrar el archivo" }, { status: 500 });
  }

  // Si es un bruto, actualizar el estado del order a "esperando_material" → "material_recibido"
  if (tipo === "bruto") {
    await sb
      .from("orders")
      .update({
        estado: "material_recibido",
        fecha_material: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("estado", "esperando_material"); // Solo si estaba esperando, no pisar estados posteriores
  }

  // Log de actividad
  await sb.from("activity_logs").insert({
    admin: subido_por === "admin" ? "admin" : "cliente",
    accion: tipo === "bruto" ? "material_subido" : "clip_subido",
    objetivo_tipo: "order",
    objetivo_id: order_id,
    detalle: `${nombre} (${tamanio_bytes ? Math.round(tamanio_bytes / 1024 / 1024) + " MB" : "tamaño desconocido"})`,
  }).catch(console.error);

  return NextResponse.json({ success: true, archivo });
}
