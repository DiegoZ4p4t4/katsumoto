import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ENCRYPTION_KEY = Deno.env.get("SUNAT_CREDENTIALS_KEY") ?? "katsumoto-enc-key-2026";

async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyBytes = new Uint8Array(32);
  const encoded = encoder.encode(ENCRYPTION_KEY);
  keyBytes.set(encoded.slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), 12);
  return btoa(String.fromCharCode(...combined));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
function errorRes(message: string, status = 400) {
  return json({ error: message }, status);
}

function extractUserId(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

async function verifyCertificateInStorage(supabase: ReturnType<typeof createClient>, certPath: string | null): Promise<boolean> {
  if (!certPath) return false;
  const lastSlash = certPath.lastIndexOf("/");
  const dir = certPath.substring(0, lastSlash);
  const fileName = certPath.substring(lastSlash + 1);
  const { data, error } = await supabase.storage.from("sunat-documents").list(dir);
  if (error || !data) return false;
  return data.some((f) => f.name === fileName);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorRes("Invalid JSON");
  }

  const action = body.action as string;
  if (!"save get".includes(action)) {
    return errorRes("Invalid action. Use: save, get");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return errorRes("Unauthorized: missing header", 401);
  const token = authHeader.replace("Bearer ", "");
  if (!token || token.length < 10) return errorRes("Unauthorized: empty token", 401);

  const userId = extractUserId(token);
  if (!userId) return errorRes("Unauthorized: invalid token", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userId)
    .single();
  if (!profile) return errorRes("Profile not found", 403);

  const orgId = profile.organization_id;

  if (action === "get") {
    const { data, error } = await supabase
      .from("sunat_config")
      .select("*")
      .eq("organization_id", orgId)
      .single();
    if (error && error.code !== "PGRST116") return errorRes(error.message);
    if (!data) return json(null);

    const certExists = await verifyCertificateInStorage(supabase, data.certificado_path);
    const { clave_sol, certificado_password, ...safeConfig } = data;
    return json({
      ...safeConfig,
      has_clave_sol: !!clave_sol,
      has_certificado_password: !!certificado_password,
      certificado_exists_in_storage: certExists,
    });
  }

  if (action === "save") {
    const formData = body.formData as Record<string, unknown>;
    if (!formData) return errorRes("formData is required");

    const { data: existing } = await supabase
      .from("sunat_config")
      .select("id, clave_sol, certificado_password, certificado_path")
      .eq("organization_id", orgId)
      .maybeSingle();

    const certPath = (formData.certificado_path as string) || null;

    if (certPath) {
      const certExists = await verifyCertificateInStorage(supabase, certPath);
      if (!certExists) {
        return errorRes("El archivo de certificado no se encuentra en Storage. Suba el certificado nuevamente.");
      }
    }

    const rowData: Record<string, unknown> = {
      ruc: formData.ruc,
      razon_social: formData.razon_social,
      nombre_comercial: formData.nombre_comercial || "",
      ubigeo: formData.ubigeo || "",
      departamento: formData.departamento || "",
      provincia: formData.provincia || "",
      distrito: formData.distrito || "",
      direccion: formData.direccion || "",
      usuario_sol: formData.usuario_sol,
      modo_produccion: formData.modo_produccion || false,
      certificado_path: certPath,
    };

    const claveSol = (formData.clave_sol as string) || "";
    if (claveSol.trim() !== "") {
      rowData.clave_sol = await encrypt(claveSol);
    } else if (existing?.clave_sol) {
      rowData.clave_sol = existing.clave_sol;
    } else {
      rowData.clave_sol = "";
    }

    const certPassword = (formData.certificado_password as string) || "";
    if (certPassword.trim() !== "") {
      rowData.certificado_password = await encrypt(certPassword);
    } else if (existing?.certificado_password) {
      rowData.certificado_password = existing.certificado_password;
    } else {
      rowData.certificado_password = null;
    }

    const effectiveCertPath = certPath || (existing?.certificado_path as string | null);
    rowData.is_configured = !!(
      formData.ruc &&
      formData.razon_social &&
      formData.usuario_sol &&
      rowData.clave_sol &&
      effectiveCertPath
    );

    if (existing) {
      const { data, error } = await supabase
        .from("sunat_config")
        .update(rowData)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return errorRes(error.message);
      const { clave_sol, certificado_password, ...safeData } = data;
      return json({
        ...safeData,
        has_clave_sol: !!clave_sol,
        has_certificado_password: !!certificado_password,
      });
    }

    rowData.organization_id = orgId;
    const { data, error } = await supabase
      .from("sunat_config")
      .insert(rowData)
      .select()
      .single();
    if (error) return errorRes(error.message);
    const { clave_sol, certificado_password, ...safeData } = data;
    return json({
      ...safeData,
      has_clave_sol: !!clave_sol,
      has_certificado_password: !!certificado_password,
    });
  }

  return errorRes("Unhandled action", 500);
});
