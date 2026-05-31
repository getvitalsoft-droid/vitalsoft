// app/cliente-preview/page.tsx
// Preview del portal de cliente con datos ficticios.
// Solo accesible en desarrollo o con ADMIN_PREVIEW_KEY.
// Para producción: visita /cliente-preview?key=TU_CRON_SECRET

import { redirect } from "next/navigation";
import ClientePreviewClient from "./ClientePreviewClient";

export default function ClientePreviewPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const key = searchParams.key;
  const secret = process.env.CRON_SECRET || "";

  // En producción requiere la clave
  if (process.env.NODE_ENV === "production" && key !== secret) {
    redirect("/");
  }

  return <ClientePreviewClient />;
}
