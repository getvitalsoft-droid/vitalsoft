// app/api/version/route.ts
// Devuelve la versión actual del frontend.
// El cliente consulta esto periódicamente; si cambia, muestra aviso de actualización.
// La versión se genera en build time desde la variable APP_VERSION o del commit SHA.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const version =
    process.env.APP_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
    process.env.NEXT_PUBLIC_BUILD_ID ||
    "dev";

  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
