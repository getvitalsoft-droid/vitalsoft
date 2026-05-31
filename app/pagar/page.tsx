// app/pagar/page.tsx
// Página de pago directo para links de agentes.
// Recibe ?ref=CODIGO&clips=N y abre el popup de pago inmediatamente.
// El cliente solo ve el popup — no la landing completa.

import PagarClient from "./PagarClient";

export default function PagarPage({
  searchParams,
}: {
  searchParams: { ref?: string; clips?: string };
}) {
  return (
    <PagarClient
      ref={searchParams.ref || ""}
      clips={Number(searchParams.clips) || 10}
    />
  );
}
