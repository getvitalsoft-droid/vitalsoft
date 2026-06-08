import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vitalsoft.pro";
const SEMANAS_PARA_INACTIVO = 3;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hoy = new Date();
  // Solo ejecutar lunes
  if (hoy.getDay() !== 1) return NextResponse.json({ ok: true, mensaje: "No es lunes." });

  // Registrar inicio de ejecución
  await supabase.from("activity_logs").insert({
    admin: "system", accion: "cron_reportes_agentes_inicio",
    objetivo_tipo: "system", detalle: `Cron ejecutado: ${hoy.toISOString()}`,
  });

  const { data: agentes } = await supabase
    .from("agentes")
    .select("id, nombre, email, aprobado, estado_agente, ausente_hasta, reportes_sin_rellenar, ultimo_reporte, primer_recordatorio_enviado")
    .eq("aprobado", true)
    .neq("estado_agente", "inactivo");

  if (!agentes?.length) return NextResponse.json({ ok: true, procesados: 0 });

  const inicioSemana = new Date(hoy);
  inicioSemana.setHours(0, 0, 0, 0);

  let enviados = 0;
  let inactivados = 0;

  for (const agente of agentes) {
    // Respetar ausencia temporal — ni recordatorio ni conteo
    if (agente.ausente_hasta && new Date(agente.ausente_hasta) >= hoy) {
      // Si la ausencia ya venció, limpiarla
      continue;
    }
    if (agente.ausente_hasta && new Date(agente.ausente_hasta) < hoy) {
      await supabase.from("agentes").update({ ausente_hasta: null, estado_agente: "activo" }).eq("id", agente.id);
    }

    const yaReportoEstaSemana = agente.ultimo_reporte &&
      new Date(agente.ultimo_reporte) >= inicioSemana;

    if (yaReportoEstaSemana) {
      // Reportó — resetear contador
      if ((agente.reportes_sin_rellenar || 0) > 0) {
        await supabase.from("agentes").update({ reportes_sin_rellenar: 0 }).eq("id", agente.id);
      }
      continue;
    }

    const nuevoContador = (agente.reportes_sin_rellenar || 0) + 1;

    if (nuevoContador >= SEMANAS_PARA_INACTIVO) {
      // Pasar a inactivo — sin email alarmante
      await supabase.from("agentes").update({
        estado_agente: "inactivo",
        reportes_sin_rellenar: nuevoContador,
      }).eq("id", agente.id);

      await resend.emails.send({
        from: "VitalSoft <notificaciones@vitalsoft.pro>",
        to: agente.email,
        subject: "Tu cuenta VitalSoft Agentes está en pausa",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#f0f0f0;padding:32px;border-radius:12px">
            <div style="font-size:20px;font-weight:900;margin-bottom:24px"><span style="color:#d4f53c">Vital</span>Soft</div>
            <h2 style="font-size:16px;margin-bottom:12px">Hola ${agente.nombre}</h2>
            <p style="color:#aaa;font-size:14px;margin-bottom:16px">Llevamos 3 semanas sin saber nada de ti, así que hemos marcado tu cuenta como inactiva.</p>
            <p style="color:#aaa;font-size:14px;margin-bottom:24px">Cuando quieras retomarlo, solo tienes que escribirnos y te reactivamos en minutos. Sin trámites.</p>
            <a href="mailto:hola@vitalsoft.pro?subject=Reactivar cuenta agente&body=Hola, quiero reactivar mi cuenta. Mi email es ${agente.email}" style="display:inline-block;background:#d4f53c;color:#080808;font-weight:900;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px">
              Reactivar mi cuenta →
            </a>
          </div>
        `,
      }).catch(() => {});
      inactivados++;
    } else {
      // Incrementar contador y enviar recordatorio
      await supabase.from("agentes").update({ reportes_sin_rellenar: nuevoContador }).eq("id", agente.id);

      const esPrimero = !agente.primer_recordatorio_enviado;
      if (esPrimero) {
        await supabase.from("agentes").update({ primer_recordatorio_enviado: true }).eq("id", agente.id);
      }

      const plantilla = esPrimero ? `
            <div style="background:#111;border-radius:8px;padding:16px;margin-bottom:20px">
              <p style="font-size:11px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Plantilla de ejemplo</p>
              <p style="font-size:13px;color:#666;font-style:italic;line-height:1.7;margin:0">
                "Esta semana contacté con [X] personas. [Nombre] mostró interés en el plan Growth para su podcast. Pendiente de enviarle el link. Para la próxima semana planeo contactar con [perfil]."
              </p>
            </div>` : "";

      await resend.emails.send({
        from: "VitalSoft <notificaciones@vitalsoft.pro>",
        to: agente.email,
        subject: "Reporte semanal VitalSoft — lunes",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#f0f0f0;padding:32px;border-radius:12px">
            <div style="font-size:20px;font-weight:900;margin-bottom:24px"><span style="color:#d4f53c">Vital</span>Soft</div>
            <h2 style="font-size:16px;margin-bottom:12px">Hola ${agente.nombre} 👋</h2>
            <p style="color:#aaa;font-size:14px;margin-bottom:20px">Es lunes — si tienes novedades esta semana, cuéntanoslas desde el portal.</p>
            ${plantilla}
            <a href="${SITE}/agentes" style="display:inline-block;background:#d4f53c;color:#080808;font-weight:900;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px">
              Ir al portal →
            </a>
            <p style="color:#555;font-size:11px;margin-top:24px">Si no tienes nada que reportar esta semana, no pasa nada.</p>
          </div>
        `,
      }).catch(() => {});
      enviados++;
    }
  }

  await supabase.from("activity_logs").insert({
    admin: "system", accion: "cron_reportes_agentes_fin",
    objetivo_tipo: "system",
    detalle: `Completado: ${enviados} recordatorios enviados, ${inactivados} agentes inactivados`,
  });

  return NextResponse.json({ ok: true, enviados, inactivados });
}
