const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN") ?? "";
const FUNCTION_NAME = Deno.env.get("SUNAT_FUNCTION_NAME") ?? "sunat-billing";
const ACTION = Deno.env.get("SUNAT_ACTION") ?? "test";
const INVOICE_ID = Deno.env.get("SUNAT_INVOICE_ID") ?? "";
const TICKET = Deno.env.get("SUNAT_TICKET") ?? "";
const SUMMARY_LOG_ID = Deno.env.get("SUNAT_SUMMARY_LOG_ID") ?? "";
const FECHA = Deno.env.get("SUNAT_FECHA") ?? "";
const MOTIVO = Deno.env.get("SUNAT_MOTIVO") ?? "ERROR EN EMISION";

function fail(message: string): never {
  console.error(message);
  Deno.exit(1);
}

if (!SUPABASE_URL) fail("Falta SUPABASE_URL");
if (!SUPABASE_ANON_KEY) fail("Falta SUPABASE_ANON_KEY");
if (!SUPABASE_ACCESS_TOKEN) fail("Falta SUPABASE_ACCESS_TOKEN");

const body: Record<string, unknown> = { action: ACTION };

if (ACTION === "send" && INVOICE_ID) body.invoice_id = INVOICE_ID;
if (ACTION === "send-voided" && INVOICE_ID) body.invoice_id = INVOICE_ID;
if (ACTION === "send-voided") body.motivo = MOTIVO;
if (ACTION === "check-ticket" || ACTION === "check-summary-ticket") {
  if (!TICKET) fail(`Falta SUNAT_TICKET para action=${ACTION}`);
  body.ticket = TICKET;
}
if (ACTION === "check-summary-ticket" && SUMMARY_LOG_ID) {
  body.summary_log_id = SUMMARY_LOG_ID;
}
if (ACTION === "send-summary") {
  if (!FECHA) fail("Falta SUNAT_FECHA para action=send-summary");
  body.fecha = FECHA;
}

const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
  },
  body: JSON.stringify(body),
});

const raw = await response.text();

console.log(`HTTP ${response.status}`);

try {
  const parsed = JSON.parse(raw);
  console.log(JSON.stringify(parsed, null, 2));
} catch {
  console.log(raw);
}
