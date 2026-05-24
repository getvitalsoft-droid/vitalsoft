import { NextRequest, NextResponse } from "next/server";
import { supabase, generarCodigo } from "@/lib/supabase";
import { enviarEmailBienvenidaAgente } from "@/lib/emails";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data: agentes, error } = await supabase
    .from("agentes")
    .select("*, ventas(*)")
    .order("creado_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agentes, total: agentes?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email } = await req.json();
    if (!nombre?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nombre y email requeridos." }, { status: 400 });
    }
    const emailLower = email.trim().toLowerCase();

    // Comprobar si ya existe
    const { data: existente } = await supabase
      .from("agentes").select("*, ventas(*)")
      .eq("email", emailLower).single();

    if (existente) {
      return NextResponse.json({
        agente: existente,
        mensaje: `¡Bienvenido de nuevo ${existente.nombre}!`,
        links: buildLinks(existente.codigo),
      });
    }

    // Generar código único
    let codigo = generarCodigo(nombre);
    const { data: codExiste } = await supabase.from("agentes").select("id").eq("codigo", codigo).single();
    if (codExiste) codigo = generarCodigo(nombre + Date.now());

    const { data: nuevo, error } = await supabase
      .from("agentes")
      .insert({ nombre: nombre.trim(), email: emailLower, codigo })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const links = buildLinks(nuevo.codigo);

    // Email de bienvenida
    try { await enviarEmailBienvenidaAgente({ agente: nuevo, links }); }
    catch (e) { console.error("[Agentes] Error email bienvenida:", e); }

    return NextResponse.json({
      agente: { ...nuevo, ventas: [] },
      mensaje: `¡Bienvenido ${nuevo.nombre}! Tu código es ${nuevo.codigo}`,
      links,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function buildLinks(codigo: string) {
  const base = "https://vitalsoft.pro";
  return {
    general: `${base}?ref=${codigo}`,
    starter: `${base}/starter?ref=${codigo}`,
    growth:  `${base}/growth?ref=${codigo}`,
    scale:   `${base}/scale?ref=${codigo}`,
    pro:     `${base}/pro?ref=${codigo}`,
  };
}
