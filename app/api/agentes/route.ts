import { NextRequest, NextResponse } from "next/server";
import { agentes, generarCodigo, buscarAgentePorEmail, Agente } from "@/lib/agentes";

// GET — listar todos los agentes (protegido con token admin)
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ agentes, total: agentes.length });
}

// POST — registrar nuevo agente
export async function POST(req: NextRequest) {
  try {
    const { nombre, email } = await req.json();
    if (!nombre?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nombre y email requeridos." }, { status: 400 });
    }

    // Comprobar si ya existe
    const existe = buscarAgentePorEmail(email);
    if (existe) {
      return NextResponse.json({
        agente: existe,
        mensaje: "Ya tienes una cuenta de agente.",
        linkBase: `https://vitalsoft.pro?ref=${existe.codigo}`,
      });
    }

    const nuevo: Agente = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      codigo: generarCodigo(nombre),
      creado: new Date().toISOString(),
      ventas: [],
    };
    agentes.push(nuevo);

    console.log("[VitalSoft] Nuevo agente:", nuevo);

    return NextResponse.json({
      agente: nuevo,
      mensaje: `¡Bienvenido ${nuevo.nombre}! Tu código de referido es ${nuevo.codigo}`,
      links: {
        general:  `https://vitalsoft.pro?ref=${nuevo.codigo}`,
        starter:  `https://vitalsoft.pro/starter?ref=${nuevo.codigo}`,
        growth:   `https://vitalsoft.pro/growth?ref=${nuevo.codigo}`,
        scale:    `https://vitalsoft.pro/scale?ref=${nuevo.codigo}`,
        pro:      `https://vitalsoft.pro/pro?ref=${nuevo.codigo}`,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
