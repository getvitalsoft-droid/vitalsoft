import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const ROOT_FOLDER_ID = "1kInzDf07mAt-kJtNkcEvu-kGId8Ee4fg";
const INSTRUCCIONES_ID = "1LdgreqF9mRJbsNcMPfrVlBOEJq_hpshDNHhTo3IYkWQ";

async function getServiceAccountToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${encode({ alg: "RS256", typ: "JWT" })}.${encode(payload)}`;

  const pemKey = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const keyData = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  // Fix TypeScript error: usar Array.from en vez de spread de Uint8Array
  const signatureBytes = Array.from(new Uint8Array(signatureBuffer));
  const signatureB64 = btoa(String.fromCharCode(...signatureBytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signingInput}.${signatureB64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function crearCarpeta(nombre: string, parentId: string, token: string): Promise<string> {
  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nombre,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Error creando carpeta "${nombre}": ${data.error?.message}`);
  return data.id;
}

async function copiarArchivo(fileId: string, parentId: string, nombre: string, token: string): Promise<void> {
  await fetch(`${DRIVE_API}/files/${fileId}/copy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: nombre, parents: [parentId] }),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { clienteNombre, clienteEmail, plan, orderId } = await req.json();
    if (!clienteNombre || !orderId) {
      return NextResponse.json({ error: "Datos requeridos." }, { status: 400 });
    }

    const token = await getServiceAccountToken();
    const mes = new Date().toLocaleDateString("es-ES", { month: "short", year: "numeric" }).replace(" ", "");
    const nombreCarpeta = `${clienteNombre} — ${plan} — ${mes}`;

    const clienteId = await crearCarpeta(nombreCarpeta, ROOT_FOLDER_ID, token);

    const [mat, shorts] = await Promise.all([
      crearCarpeta("01_Material_Original", clienteId, token),
      crearCarpeta("02_Shorts_Entregados", clienteId, token),
      crearCarpeta("03_Revisiones", clienteId, token),
      crearCarpeta("04_Archivos_Finales", clienteId, token),
    ]);

    await copiarArchivo(INSTRUCCIONES_ID, clienteId, "INSTRUCCIONES — Léeme primero", token);

    const driveUrl = `https://drive.google.com/drive/folders/${clienteId}`;
    const materialUrl = `https://drive.google.com/drive/folders/${mat}`;
    const entregaUrl = `https://drive.google.com/drive/folders/${shorts}`;

    await supabase.from("orders").update({
      drive_folder_id: clienteId,
      material_link: materialUrl,
      entrega_link: entregaUrl,
    }).eq("id", orderId);

    await supabase.from("activity_logs").insert({
      admin: "sistema", accion: "drive_creado", objetivo_tipo: "order",
      objetivo_id: orderId,
      detalle: `Carpeta creada: ${nombreCarpeta}`,
    });

    return NextResponse.json({ success: true, driveUrl, materialUrl, folderId: clienteId });

  } catch (err: any) {
    console.error("[Drive] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
