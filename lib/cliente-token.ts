// lib/cliente-token.ts
// Verificación de tokens para el portal de cliente.
// Separado del route handler porque Next.js no permite exportar
// funciones arbitrarias desde app/api/*/route.ts

import crypto from "crypto";

const SECRET = process.env.CRON_SECRET || "vitalsoft-secret";

export function signClientToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + 60 * 60 * 1000 })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifyClientToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;

    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.email || !data.exp) return null;
    if (Date.now() > data.exp) return null;

    return data.email as string;
  } catch {
    return null;
  }
}
