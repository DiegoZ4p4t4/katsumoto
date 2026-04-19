import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APIS_PERU_BASE = "https://dniruc.apisperu.com/api/v1";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "");
  if (!token || token.length < 10) return json({ error: "Unauthorized" }, 401);
  const userId = extractUserId(token);
  if (!userId) return json({ error: "Invalid token" }, 401);

  const apisToken = Deno.env.get("APIS_PERU_TOKEN");
  if (!apisToken) return json({ error: "APIS_PERU_TOKEN not configured" }, 500);

  let body: { type?: string; number?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { type, number: docNumber } = body;
  if (!type || !docNumber) return json({ error: "Missing type or number" }, 400);

  if (type !== "ruc" && type !== "dni") {
    return json({ error: "Invalid type, must be ruc or dni" }, 400);
  }

  const cleanNumber = docNumber.replace(/\D/g, "");
  if (type === "ruc" && cleanNumber.length !== 11) {
    return json({ error: "RUC must be 11 digits" }, 400);
  }
  if (type === "dni" && cleanNumber.length !== 8) {
    return json({ error: "DNI must be 8 digits" }, 400);
  }

  try {
    const apiUrl = `${APIS_PERU_BASE}/${type}/${cleanNumber}?token=${apisToken}`;
    const apiRes = await fetch(apiUrl);

    if (!apiRes.ok) {
      return json({ error: `${type.toUpperCase()} no encontrado o servicio no disponible` }, 502);
    }

    const data = await apiRes.json();

    if (type === "ruc" && !data.ruc) {
      return json({ error: "RUC no encontrado en SUNAT" }, 404);
    }
    if (type === "dni" && !data.success) {
      return json({ error: "DNI no encontrado en RENIEC" }, 404);
    }

    return json(data);
  } catch (err) {
    return json({ error: "Internal server error" }, 500);
  }
});
