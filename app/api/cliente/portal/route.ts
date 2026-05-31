// app/api/cliente/portal/route.ts
// GET — devuelve todos los datos que el cliente ve en su portal

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyClientToken } from "@/lib/cliente-token";
import { getOrCreateRefCode } from "@/lib/referrals";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ESTADO_LABELS: Record<string, string> = {
  pago_realizado: "Pago recibido",
  onboarding_pendiente: "Configuración pendiente",
  esperando_material: "Esperando tu material",
  material_recibido: "Material recibido",
  material_invalido: "Revisar material",
  validado: "Material validado",
  en_edicion: "En edición",
  revision: "En revisión",
  completado: "Entregado",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-cliente-token");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const email = verifyClientToken(token);
  if (!email) return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });

  // Obtener el order más reciente no cancelado
  const { data: orders } = await sb
    .from("orders")
    .select("*")
    .eq("cliente_email", email)
    .order("fecha_pago", { ascending: false })
    .limit(5);

  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: "No se encontró tu cuenta" }, { status: 404 });
  }

  const order = orders.find(o => o.estado !== "cancelado") || orders[0];

  // Créditos disponibles (loyalty + service + referral)
  const [loyalty, service, referrals] = await Promise.all([
    sb.from("loyalty_credits").select("id, milestone, amount, status, created_at")
      .eq("customer_email", email).eq("status", "disponible"),
    sb.from("service_credits").select("id, amount, reason, status, created_at")
      .eq("customer_email", email).eq("status", "disponible"),
    sb.from("client_referrals").select("id, referred_email, credit_amount, status, created_at")
      .eq("referrer_email", email)
      .order("created_at", { ascending: false }).limit(10),
  ]);

  const totalCredito =
    (loyalty.data || []).reduce((s, c) => s + Number(c.amount), 0) +
    (service.data || []).reduce((s, c) => s + Number(c.amount), 0) +
    (referrals.data || [])
      .filter(r => r.status === "disponible")
      .reduce((s, r) => s + Number(r.credit_amount), 0);

  // Código de referido
  let refLink = `https://vitalsoft.pro`;
  if (order.stripe_customer_id) {
    try {
      const code = await getOrCreateRefCode(order.stripe_customer_id, email);
      refLink = `https://vitalsoft.pro?client_ref=${code}`;
    } catch { /* no crítico */ }
  }

  return NextResponse.json({
    email,
    order: {
      id: order.id,
      plan: order.plan,
      importe: order.importe,
      estado: order.estado,
      estadoLabel: ESTADO_LABELS[order.estado] || order.estado,
      driveFolder: order.drive_folder_id
        ? `https://drive.google.com/drive/folders/${order.drive_folder_id}`
        : null,
      is_paused: order.is_paused,
      pause_until: order.pause_until,
      stripe_subscription_id: order.stripe_subscription_id,
      notas_cliente: order.notas_cliente,
      fecha_pago: order.fecha_pago,
    },
    creditos: {
      total: totalCredito,
      loyalty: loyalty.data || [],
      service: service.data || [],
      referrals: referrals.data || [],
    },
    refLink,
  });
}
