// app/cliente-preview/page.tsx
// Preview del portal de cliente con datos ficticios.
// Acceso: /cliente-preview?key=TU_CRON_SECRET

import ClientePreviewClient from "./ClientePreviewClient";

// No usar redirect() del servidor — el check de key lo hace el cliente
// para evitar problemas con variables de entorno en build time
export default function ClientePreviewPage() {
  return <ClientePreviewClient />;
}
