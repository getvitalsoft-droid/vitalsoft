import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/agente-token";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-agente-token");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido o caducado" }, { status: 401 });

  const password = process.env.RESEND_AGENTS_SMTP_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: "Configuración no disponible" }, { status: 500 });
  }

  return NextResponse.json({
    server: "smtp.resend.com",
    port: 465,
    username: "resend",
    password,
  });
}
