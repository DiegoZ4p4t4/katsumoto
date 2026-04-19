import { encodeBase64 } from "jsr:@std/encoding/base64";
import { getCachedToken, setCachedToken, clearTokenCache } from "./token-cache.ts";
import type { SunatCredentials } from "../types.ts";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SendCpeResponse {
  numTicket: string;
  fecRecepcion: string;
}

interface StatusResponse {
  codRespuesta: string;
  error?: { numError: string; desError: string };
  arcCdr?: string;
  indCdrGenerado?: string;
}

export interface GreSendResult {
  success: boolean;
  ticket?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface GreStatusResult {
  success: boolean;
  statusCode: string;
  errorCode?: string;
  errorMessage?: string;
  cdrZip?: Uint8Array;
}

function getAuthUrl(credentials: SunatCredentials): string {
  const isProduction = credentials.modo_produccion === true ||
    credentials.modo_produccion === "true";
  return isProduction
    ? "https://api-seguridad.sunat.gob.pe/v1"
    : "https://api-test-seguridad.sunat.gob.pe/v1";
}

function getCpeUrl(credentials: SunatCredentials): string {
  const isProduction = credentials.modo_produccion === true ||
    credentials.modo_produccion === "true";
  return isProduction
    ? "https://api-cpe.sunat.gob.pe/v1"
    : "https://api-test.sunat.gob.pe/v1";
}

async function getToken(credentials: SunatCredentials): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;

  const clientId = String(credentials.gre_client_id || "");
  const clientSecret = String(credentials.gre_client_secret || "");
  if (!clientId || !clientSecret) {
    throw new Error("GRE: Falta gre_client_id o gre_client_secret. Configurar en Menú SOL de SUNAT.");
  }

  const authUrl = getAuthUrl(credentials);
  const username = `${String(credentials.ruc || "")}${String(credentials.usuario_sol || "")}`;
  const password = String(credentials.clave_sol || "");

  const body = new URLSearchParams({
    grant_type: "password",
    scope: "https://api-cpe.sunat.gob.pe",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  });

  const res = await fetch(
    `${authUrl}/clientessol/${clientId}/oauth2/token/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    clearTokenCache();
    throw new Error(`GRE Auth failed (HTTP ${res.status}): ${text}`);
  }

  const data: TokenResponse = await res.json();
  if (!data.access_token) {
    throw new Error(`GRE Auth: respuesta sin access_token`);
  }

  setCachedToken(data.access_token, data.expires_in || 3600);
  return data.access_token;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sendCpe(
  credentials: SunatCredentials,
  filename: string,
  zipBytes: Uint8Array,
): Promise<GreSendResult> {
  try {
    const token = await getToken(credentials);
    const cpeUrl = getCpeUrl(credentials);
    const hashZip = await sha256Hex(zipBytes);
    const nomArchivo = `${filename}.zip`;

    const res = await fetch(
      `${cpeUrl}/contribuyente/gem/comprobantes/${filename}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          archivo: {
            nomArchivo,
            arcGreZip: encodeBase64(zipBytes),
            hashZip,
          },
        }),
      },
    );

    if (res.status === 422) {
      const err = await res.json();
      const errors = err?.errors || [];
      const msgs = errors.map((e: { cod?: string; msg?: string }) =>
        `${e.cod || "?"}: ${e.msg || "validation error"}`
      ).join("; ");
      return {
        success: false,
        errorCode: "422",
        errorMessage: msgs || err?.msg || "Error de validacion",
      };
    }

    if (res.status === 500) {
      const err = await res.json();
      return {
        success: false,
        errorCode: err?.cod || "500",
        errorMessage: err?.msg || "Error interno SUNAT",
      };
    }

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        errorCode: String(res.status),
        errorMessage: text,
      };
    }

    const data: SendCpeResponse = await res.json();
    return {
      success: true,
      ticket: data.numTicket,
    };
  } catch (e) {
    return {
      success: false,
      errorCode: "REST_ERROR",
      errorMessage: (e as Error).message,
    };
  }
}

export async function checkStatus(
  credentials: SunatCredentials,
  ticket: string,
): Promise<GreStatusResult> {
  try {
    const token = await getToken(credentials);
    const cpeUrl = getCpeUrl(credentials);

    const res = await fetch(
      `${cpeUrl}/contribuyente/gem/comprobantes/envios/${ticket}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        statusCode: String(res.status),
        errorMessage: text,
      };
    }

    const data: StatusResponse = await res.json();
    const code = data.codRespuesta;

    if (code === "98") {
      return { success: true, statusCode: "98" };
    }

    if (code === "99") {
      return {
        success: false,
        statusCode: "99",
        errorCode: data.error?.numError || "99",
        errorMessage: data.error?.desError || "Rechazado por SUNAT",
      };
    }

    if (code === "0") {
      let cdrZip: Uint8Array | undefined;
      if (data.indCdrGenerado === "1" && data.arcCdr) {
        const cdrBase64 = data.arcCdr;
        const binary = atob(cdrBase64);
        cdrZip = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      }
      return {
        success: true,
        statusCode: "0",
        cdrZip,
      };
    }

    return {
      success: false,
      statusCode: code,
      errorMessage: `Codigo de respuesta desconocido: ${code}`,
    };
  } catch (e) {
    return {
      success: false,
      statusCode: "ERROR",
      errorMessage: (e as Error).message,
    };
  }
}
