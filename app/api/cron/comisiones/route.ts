import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { enviarEmailAgenteComisionDisponible } from "@/lib/emails";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // BUG 4 FIX: excluir ventas de agentes bloqueados
    const { data: ventas, error } = await supabase
      .from("ventas")
      .select("*, agentes(*)")
      .eq("estado", "pendiente_validacion")
      .eq("sospechoso", false)
      .lte("disponible_at", new Date().toISOString());

    if (error) throw error;
    if (!ventas || ventas.length === 0) {
      return NextResponse.json({ procesadas: 0, mensaje: "Sin comisiones pendientes" });
    }

    let procesadas = 0;
    let saltadas = 0;
    const errores: string[] = [];

    for (const venta of ventas) {
      try {
        // No liberar si el agente está bloqueado
        if (venta.agentes?.bloqueado) {
          await supabase.from("ventas").update({ estado: "invalida", notas_admin: "Agente bloqueado al liberar comisión" }).eq("id", venta.id);
          await supabase.from("activity_logs").insert({
            admin: "cron", accion: "comision_bloqueada", objetivo_tipo: "venta",
            objetivo_id: venta.id,
            detalle: `Agente ${venta.agente_codigo} bloqueado — comisión invalidada`,
          });
          saltadas++;
          continue;
        }

        await supabase.from("ventas").update({ estado: "disponible" }).eq("id", venta.id);
        await supabase.from("activity_logs").insert({
          admin: "cron", accion: "comision_disponible", objetivo_tipo: "venta",
          objetivo_id: venta.id,
          detalle: `€${(Number(venta.importe) * 0.20).toFixed(2)} disponible · agente ${venta.agente_codigo || "directo"}`,
        });

        if (venta.agentes) {
          const comision = Math.round(Number(venta.importe) * 0.20 * 100) / 100;
          await enviarEmailAgenteComisionDisponible({ agente: venta.agentes, comision, plan: venta.plan });
        }
        procesadas++;
      } catch (err) {
        console.error(`[Cron] Error venta ${venta.id}:`, err);
        errores.push(venta.id);
      }
    }

    return NextResponse.json({ procesadas, saltadas, errores: errores.length });
  } catch (err) {
    console.error("[Cron] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
