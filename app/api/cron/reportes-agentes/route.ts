import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vitalsoft.pro";
const MAX_REPORTES_SIN_RELLENAR = 4;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun, 5=Vie

  // Solo ejecutar lunes (1) o viernes (5)
  if (diaSemana !== 1 && diaSemana !== 5) {
    return NextResponse.json({ ok: true, mensaje: "No es lunes ni viernes, sin acción." });
  }

  const { data: agentes } = await supabase
    .from("agentes")
    .select("id, nombre, email, aprobado, bloqueado, pausado, reportes_sin_rellenar, ultimo_reporte")
    .eq("aprobado", true)
    .eq("bloqueado", false);

  if (!agentes?.length) return NextResponse.json({ ok: true, procesados: 0 });

  let enviados = 0;
  let inactivados = 0;

  for (const agente of agentes) {
    if (agente.pausado) continue;

    if (diaSemana === 5) {
      // Viernes — email de aviso: el lunes toca reporte
      await resend.emails.send({
        from: "VitalSoft <notificaciones@vitalsoft.pro>",
        to: agente.email,
        subject: "📋 Recordatorio: tu reporte semanal es el lunes",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#f0f0f0;padding:32px;border-radius:12px">
            <div style="font-size:20px;font-weight:900;margin-bottom:24px"><span style="color:#d4f53c">Vital</span>Soft</div>
            <h2 style="font-size:16px;margin-bottom:8px">Hola ${agente.nombre} 👋</h2>
            <p style="color:#aaa;font-size:14px;margin-bottom:16px">Te recordamos que el <strong style="color:#d4f53c">próximo lunes</strong> toca enviar tu reporte semanal de actividad.</p>
            <p style="color:#aaa;font-size:14px;margin-bottom:24px">Cuéntanos cómo va la prospección: contactos realizados, leads interesados, cierres pendientes o cualquier novedad.</p>
            <a href="${SITE}/agentes" style="display:inline-block;background:#d4f53c;color:#080808;font-weight:900;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px">
              Ir al portal →
            </a>
            <p style="color:#555;font-size:11px;margin-top:24px">4 semanas consecutivas sin reportar = cuenta inactiva automáticamente.</p>
          </div>
        `,
      }).catch(() => {});
      enviados++;
    }

    if (diaSemana === 1) {
      // Lunes — comprobar si ya reportó esta semana
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // lunes de esta semana
      inicioSemana.setHours(0, 0, 0, 0);

      const yaReportoEstaSemana = agente.ultimo_reporte &&
        new Date(agente.ultimo_reporte) >= inicioSemana;

      if (!yaReportoEstaSemana) {
        const nuevoContador = (agente.reportes_sin_rellenar || 0) + 1;

        if (nuevoContador >= MAX_REPORTES_SIN_RELLENAR) {
          // Pasar a inactivo
          await supabase.from("agentes").update({
            bloqueado: true,
            reportes_sin_rellenar: nuevoContador,
            motivo_bloqueo: `Inactividad automática: ${nuevoContador} reportes semanales sin rellenar`,
          }).eq("id", agente.id);

          await resend.emails.send({
            from: "VitalSoft <notificaciones@vitalsoft.pro>",
            to: agente.email,
            subject: "Cuenta VitalSoft Agentes desactivada por inactividad",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#f0f0f0;padding:32px;border-radius:12px">
                <div style="font-size:20px;font-weight:900;margin-bottom:24px"><span style="color:#d4f53c">Vital</span>Soft</div>
                <h2 style="font-size:16px;margin-bottom:8px">Hola ${agente.nombre}</h2>
                <p style="color:#aaa;font-size:14px;margin-bottom:16px">Tu cuenta ha sido desactivada automáticamente por no haber enviado reporte durante ${nuevoContador} semanas consecutivas.</p>
                <p style="color:#aaa;font-size:14px;margin-bottom:24px">Si quieres reactivarla, escríbenos a <a href="mailto:hola@vitalsoft.pro?subject=Reactivación cuenta agente&body=Hola, quiero reactivar mi cuenta. Mi email es ${agente.email}" style="color:#d4f53c">hola@vitalsoft.pro</a>.</p>
              </div>
            `,
          }).catch(() => {});
          inactivados++;
        } else {
          // Incrementar contador y enviar recordatorio de lunes
          await supabase.from("agentes").update({ reportes_sin_rellenar: nuevoContador }).eq("id", agente.id);

          await resend.emails.send({
            from: "VitalSoft <notificaciones@vitalsoft.pro>",
            to: agente.email,
            subject: `📋 Lunes — envía tu reporte semanal (${MAX_REPORTES_SIN_RELLENAR - nuevoContador} semanas restantes)`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080808;color:#f0f0f0;padding:32px;border-radius:12px">
                <div style="font-size:20px;font-weight:900;margin-bottom:24px"><span style="color:#d4f53c">Vital</span>Soft</div>
                <h2 style="font-size:16px;margin-bottom:8px">Hola ${agente.nombre} 👋</h2>
                <p style="color:#aaa;font-size:14px;margin-bottom:16px">Es <strong style="color:#d4f53c">lunes</strong> — toca enviar tu reporte semanal de actividad.</p>
                <p style="color:#aaa;font-size:14px;margin-bottom:8px">Llevas <strong style="color:#ff6b6b">${nuevoContador} semana${nuevoContador > 1 ? "s" : ""} sin reportar</strong>. Tras ${MAX_REPORTES_SIN_RELLENAR} tu cuenta pasa a inactiva automáticamente.</p>
                <p style="color:#aaa;font-size:14px;margin-bottom:24px">Accede al portal y envía tu actualización. Solo tarda 2 minutos.</p>
                <a href="${SITE}/agentes" style="display:inline-block;background:#d4f53c;color:#080808;font-weight:900;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px">
                  Enviar reporte ahora →
                </a>
              </div>
            `,
          }).catch(() => {});
          enviados++;
        }
      } else {
        // Resetear contador si ya reportó esta semana
        if ((agente.reportes_sin_rellenar || 0) > 0) {
          await supabase.from("agentes").update({ reportes_sin_rellenar: 0 }).eq("id", agente.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, dia: diaSemana === 1 ? "lunes" : "viernes", enviados, inactivados });
}
