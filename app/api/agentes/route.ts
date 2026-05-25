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

    const { data: existente } = await supabase
      .from("agentes").select("*, ventas(*)")
      .eq("email", emailLower).single();

    if (existente) {
      if (existente.bloqueado) {
        return NextResponse.json({ error: "Esta cuenta ha sido desactivada. Contacta con VitalSoft." }, { status: 403 });
      }
      return NextResponse.json({
        agente: existente,
        aprobado: existente.aprobado,
        pendiente: !existente.aprobado,
        mensaje: existente.aprobado
          ? `¡Bienvenido de nuevo ${existente.nombre}!`
          : "Tu solicitud está pendiente de aprobación. Te avisaremos por email cuando esté activa.",
        links: existente.aprobado ? buildLinks(existente.codigo) : null,
      });
    }

    // Nuevo agente — pendiente de aprobación
    let codigo = generarCodigo(nombre);
    const { data: codExiste } = await supabase.from("agentes").select("id").eq("codigo", codigo).single();
    if (codExiste) codigo = generarCodigo(nombre + Date.now());

    const { data: nuevo, error } = await supabase
      .from("agentes")
      .insert({ nombre: nombre.trim(), email: emailLower, codigo, aprobado: false })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    console.log("[VitalSoft] Nueva solicitud agente:", nuevo);

    return NextResponse.json({
      agente: { ...nuevo, ventas: [] },
      aprobado: false,
      pendiente: true,
      mensaje: "Solicitud recibida. Revisaremos tu perfil y te avisaremos por email en 24–48h.",
      links: null,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — aprobar/bloquear agente (solo admin)
export async function PATCH(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { agente_id, aprobado, bloqueado, notas_admin } = await req.json();
  const { data, error } = await supabase
    .from("agentes")
    .update({ aprobado, bloqueado, notas_admin })
    .eq("id", agente_id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enviar email de bienvenida al aprobar
  if (aprobado && data) {
    try { await enviarEmailBienvenidaAgente({ agente: data, links: buildLinks(data.codigo) }); }
    catch (e) { console.error("Error email aprobación:", e); }
  }
  return NextResponse.json({ success: true, agente: data });
}

function buildLinks(codigo: string) {
  const base = "https://vitalsoft.pro";
  return { general: `${base}?ref=${codigo}`, starter: `${base}/starter?ref=${codigo}`, growth: `${base}/growth?ref=${codigo}`, scale: `${base}/scale?ref=${codigo}`, pro: `${base}/pro?ref=${codigo}` };
}
