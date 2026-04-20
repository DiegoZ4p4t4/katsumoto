import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { resolveAuth } from "./sunat/auth.ts";
import { createSunatClient } from "./sunat/client.ts";
import { VALID_ACTIONS } from "./sunat/constants.ts";
import { corsHeaders, error, json } from "./sunat/http.ts";
import { verifyCertInStorage } from "./sunat/storage.ts";
import {
  buildCredentialsFromConfig,
  buildDespatchDocument,
  buildNoteDocument,
  buildSummaryDocument,
  buildVoidedDocument,
  mapCertError,
  transformInvoiceToSunat,
} from "./sunat/transformers.ts";
import { tryDecrypt } from "./sunat/crypto/credentials.ts";
import type {
  DbRecord,
  SunatCredentials,
  SupabaseClientLike,
} from "./sunat/types.ts";

async function getConfig(
  supabase: SupabaseClientLike,
  orgId: string,
) {
  const { data } = await supabase.from("sunat_config").select("*").eq(
    "organization_id",
    orgId,
  ).single();
  const config = data as DbRecord | null;
  if (!config) {
    return { error: error("SUNAT no configurado", 422, "NO_CONFIG") };
  }
  if (!config.is_configured) {
    return {
      error: error("Configuracion SUNAT incompleta", 422, "CONFIG_INCOMPLETE"),
    };
  }

  if (!config.certificado_path) {
    return {
      error: error("Falta certificado digital.", 422, "NO_CERTIFICATE"),
    };
  }

  const certExists = await verifyCertInStorage(
    supabase,
    config.certificado_path as string,
  );
  if (!certExists) {
    return {
      error: error(
        "El certificado no se encuentra en Storage.",
        422,
        "CERT_MISSING_STORAGE",
      ),
    };
  }

  config.clave_sol = await tryDecrypt(
    (config.clave_sol as string | null) ?? null,
  );
  config.certificado_password = await tryDecrypt(
    (config.certificado_password as string | null) ?? null,
  );
  return {
    config,
    credentials: buildCredentialsFromConfig(config),
  };
}

async function updateSummaryLogStatus(
  supabase: SupabaseClientLike,
  summaryLogId: string | undefined,
  result: DbRecord,
) {
  if (!result.success || !summaryLogId) return;

  await (supabase.from("sunat_summary_log") as any).update({
    status: result.success ? "accepted" : "rejected",
    error_code: result.error_code || null,
    error_message: result.error_message || null,
  }).eq("id", summaryLogId);
}

async function handleTicketCheck(
  supabase: SupabaseClientLike,
  credentials: SunatCredentials,
  body: DbRecord,
  kind: "summary" | "voided",
) {
  const ticket = body.ticket as string;
  if (!ticket) return error("ticket is required");

  try {
    const client = createSunatClient(supabase);
    const result = await client.checkTicket(credentials, ticket, kind);
    await updateSummaryLogStatus(
      supabase,
      body.summary_log_id as string | undefined,
      result,
    );
    return json({ success: true, result });
  } catch (e) {
    return json({ success: false, error_message: (e as Error).message });
  }
}

async function handleSummary(
  supabase: SupabaseClientLike,
  orgId: string,
  credentials: SunatCredentials,
  body: DbRecord,
) {
  const fecha = body.fecha as string;
  if (!fecha) return error("fecha is required (YYYY-MM-DD)");

  const { data: boletas } = await supabase
    .from("invoices")
    .select(
      "id, serie, correlativo, total_cents, gravada_cents, exonerada_cents, inafecta_cents, igv_cents, customer:customers(document_type, document_number)",
    )
    .eq("organization_id", orgId)
    .eq("invoice_type", "boleta")
    .eq("issue_date", fecha)
    .is("sunat_sent_at", null);

  const { data: ncBoletasRaw } = await supabase
    .from("invoices")
    .select(
      "id, serie, correlativo, total_cents, gravada_cents, exonerada_cents, inafecta_cents, igv_cents, motivo_nota, reference_invoice_id, customer:customers(document_type, document_number)",
    )
    .eq("organization_id", orgId)
    .eq("invoice_type", "nota_credito")
    .eq("issue_date", fecha)
    .is("sunat_sent_at", null)
    .not("reference_invoice_id", "is", null);

  const ncBoletas = (ncBoletasRaw || []).filter((nc: any) =>
    (nc as DbRecord).serie as string && ((nc as DbRecord).serie as string).startsWith("BC")
  );

  const ncRefIds = ncBoletas.map((nc: any) => (nc as DbRecord).reference_invoice_id).filter(Boolean);

  const parentMap: Record<string, DbRecord> = {};
  if (ncRefIds.length > 0) {
    const { data: parentInvoices } = await supabase
      .from("invoices")
      .select("id, invoice_type, number, serie, correlativo")
      .in("id", ncRefIds);
    for (const p of parentInvoices || []) {
      parentMap[(p as DbRecord).id as string] = p as DbRecord;
    }
  }

  const ncEnriched = ncBoletas.map((nc: any) => {
    const ncRecord = nc as DbRecord;
    const parentId = ncRecord.reference_invoice_id as string;
    const parent = parentMap[parentId];
    if (parent) {
      const parentSunatType: Record<string, string> = { factura: "01", boleta: "03" };
      ncRecord.reference_invoice_number = parent.number || `${parent.serie}-${String(parent.correlativo).padStart(6, "0")}`;
      ncRecord.reference_tipo_doc = parentSunatType[parent.invoice_type as string] || "03";
    }
    return ncRecord;
  });

  const allDocs: DbRecord[] = [
    ...(boletas || []),
    ...ncEnriched,
  ];

  if (allDocs.length === 0) {
    return error("No hay boletas ni NC a boleta pendientes para esa fecha", 404, "NO_BOLETAS");
  }

  const { count } = await supabase
    .from("sunat_summary_log")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("tipo", "resumen_diario")
    .eq("fecha_referencia", fecha);

  const correlativo = (count || 0) + 1;
  const summaryDoc = buildSummaryDocument(
    allDocs,
    fecha,
    correlativo,
  );

  try {
    const client = createSunatClient(supabase);
    const result = await client.sendSummary(credentials, summaryDoc);
    const logStatus = result.success ? "processing" : "rejected";

    const { data: logEntry } = await (supabase.from("sunat_summary_log") as any)
      .insert({
        organization_id: orgId,
        tipo: "resumen_diario",
        ticket: result.ticket || null,
        fecha_referencia: fecha,
        status: logStatus,
        error_code: result.error_code || null,
        error_message: result.error_message || null,
      }).select().single();

    if (result.success && result.ticket) {
      const now = new Date().toISOString();
      for (const doc of allDocs as { id: string }[]) {
        await (supabase.from("invoices") as any).update({
          sunat_ticket: result.ticket,
          sunat_sent_at: now,
          status: "issued",
        }).eq("id", doc.id);
      }
    }

    return json({
      success: result.success,
      ticket: result.ticket || null,
      boletas_count: allDocs.length,
      error_code: result.error_code || null,
      error_message: result.error_message || null,
      log_id: (logEntry as DbRecord | null)?.id || null,
    });
  } catch (e) {
    return json({ success: false, error_message: (e as Error).message });
  }
}

async function handleVoided(
  supabase: SupabaseClientLike,
  orgId: string,
  credentials: SunatCredentials,
  body: DbRecord,
) {
  const invoiceId = body.invoice_id as string;
  const motivo = (body.motivo as string) || "ERROR EN EMISION";
  if (!invoiceId) return error("invoice_id is required");

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .single();
  if (!invoice) return error("Invoice not found", 404);

  const invoiceRecord = invoice as DbRecord;
  const fecha = invoiceRecord.issue_date as string;
  const { count } = await supabase
    .from("sunat_summary_log")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("tipo", "comunicacion_baja")
    .gte("created_at", new Date().toISOString().split("T")[0]);
  const correlativo = (count || 0) + 1;

  const voidedDoc = buildVoidedDocument(invoiceRecord, motivo, correlativo);

  try {
    const client = createSunatClient(supabase);
    const result = await client.sendVoided(credentials, voidedDoc);
    const logStatus = result.success ? "processing" : "rejected";

    const { data: logEntry } = await (supabase.from("sunat_summary_log") as any)
      .insert({
        organization_id: orgId,
        tipo: "comunicacion_baja",
        ticket: result.ticket || null,
        fecha_referencia: fecha,
        status: logStatus,
        error_code: result.error_code || null,
        error_message: result.error_message || null,
      }).select().single();

    if (result.success) {
      await (supabase.from("invoices") as any).update({
        status: "cancelled",
        sunat_ticket: result.ticket || null,
      }).eq("id", invoiceId);
    }

    return json({
      success: result.success,
      ticket: result.ticket || null,
      error_code: result.error_code || null,
      error_message: result.error_message || null,
      log_id: (logEntry as DbRecord | null)?.id || null,
    });
  } catch (e) {
    return json({ success: false, error_message: (e as Error).message });
  }
}

async function handleSend(
  supabase: SupabaseClientLike,
  orgId: string,
  credentials: SunatCredentials,
  body: DbRecord,
) {
  const invoiceId = body.invoice_id as string;
  if (!invoiceId) return error("invoice_id is required");

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .single();
  if (invErr || !invoice) return error("Invoice not found", 404);
  const invoiceRecord = invoice as DbRecord;
  if (invoiceRecord.status !== "issued") {
    return error(
      `Invoice status '${invoiceRecord.status}', must be 'issued'`,
      422,
      "INVALID_STATUS",
    );
  }

  const { data: items } = await supabase.from("invoice_items").select("*").eq(
    "invoice_id",
    invoiceId,
  );
  if (!items || items.length === 0) {
    return error("Invoice has no items", 422, "NO_ITEMS");
  }

  const { data: customer } = await supabase.from("customers").select("*").eq(
    "id",
    invoiceRecord.customer_id,
  ).single();
  const customerRecord = customer as DbRecord | null;
  if (!customerRecord) return error("Customer not found", 404, "NO_CUSTOMER");

  if (
    invoiceRecord.invoice_type === "factura" &&
    customerRecord.document_type !== "RUC"
  ) {
    return error("Factura requiere cliente con RUC", 422, "INVALID_DOC_TYPE");
  }

  let result: DbRecord;
  try {
    const client = createSunatClient(supabase);
    const invoiceType = invoiceRecord.invoice_type as string;

    if (invoiceType === "nota_credito" || invoiceType === "nota_debito") {
      const noteBody: DbRecord = {};

      if (invoiceRecord.reference_invoice_id) {
        const { data: parentInvoice } = await supabase
          .from("invoices")
          .select("invoice_type, number, serie, correlativo")
          .eq("id", invoiceRecord.reference_invoice_id)
          .eq("organization_id", orgId)
          .single();

        if (parentInvoice) {
          const parent = parentInvoice as DbRecord;
          const parentSunatType: Record<string, string> = { factura: "01", boleta: "03" };
          noteBody.tipo_doc_afectado = parentSunatType[parent.invoice_type as string] || "01";
          noteBody.num_doc_afectado = parent.number as string || `${parent.serie}-${parent.correlativo}`;

          if (parent.invoice_type === "boleta") {
            return error(
              "NC a boleta debe enviarse via resumen diario (send-summary)",
              422,
              "USE_SEND_SUMMARY",
            );
          }
        }
      } else {
        noteBody.tipo_doc_afectado = (body.tipo_doc_afectado as string) || "01";
        noteBody.num_doc_afectado = (body.num_doc_afectado as string) || invoiceRecord.number as string || `${invoiceRecord.serie}-${invoiceRecord.correlativo}`;
      }

      noteBody.cod_motivo = (invoiceRecord.motivo_nota as string) || (body.cod_motivo as string) || "01";
      noteBody.des_motivo = (invoiceRecord.descripcion_motivo as string) || (body.des_motivo as string) || invoiceRecord.notes as string || "ANULACION DE LA OPERACION";

      const noteDocument = buildNoteDocument(
        invoiceRecord,
        items as DbRecord[],
        customerRecord,
        noteBody,
      );
      result = await client.sendInvoice(
        credentials,
        noteDocument,
        invoiceType === "nota_credito" ? "credit-note" : "debit-note",
      );
    } else {
      const transformed = transformInvoiceToSunat(
        invoiceRecord,
        items as DbRecord[],
        customerRecord,
      );
      result = await client.sendInvoice(
        credentials,
        transformed.document,
        transformed.sunatTypeCode === "01" ? "invoice" : "boleta",
      );
    }
  } catch (e) {
    await (supabase.from("invoices") as any).update({
      sunat_error_code: "CALL_FAILED",
      sunat_error_message: (e as Error).message,
      sunat_sent_at: new Date().toISOString(),
    }).eq("id", invoiceId);

    return json({
      success: false,
      error_message: mapCertError((e as Error).message),
    });
  }

  const isSuccess = result.success === true;
  const now = new Date().toISOString();
  const updateData: DbRecord = {
    sunat_sent_at: now,
    sunat_error_code: null,
    sunat_error_message: null,
  };

  if (isSuccess) {
    updateData.sunat_hash = result.hash || null;
    updateData.sunat_accepted_at = now;
    updateData.status = "accepted";
    if (result.xml) {
      const xmlPath = `${orgId}/${
        (invoice.issue_date as string)?.substring(0, 7) || "unknown"
      }/${invoiceRecord.serie}-${invoiceRecord.correlativo}.xml`;
      const xmlBytes = new TextEncoder().encode(result.xml as string);
      const { error: xmlErr } = await supabase.storage
        .from("sunat-documents")
        .upload(xmlPath, xmlBytes, {
          contentType: "application/xml",
          upsert: true,
        });
      if (!xmlErr) updateData.sunat_xml_path = xmlPath;
    }
    if (result.cdr_zip) {
      const cdrPath = `${orgId}/${
        (invoice.issue_date as string)?.substring(0, 7) || "unknown"
      }/${invoiceRecord.serie}-${invoiceRecord.correlativo}-cdr.zip`;
      const cdrBytes = Uint8Array.from(
        atob(result.cdr_zip as string),
        (c) => c.charCodeAt(0),
      );
      const { error: cdrErr } = await supabase.storage
        .from("sunat-documents")
        .upload(cdrPath, cdrBytes, {
          contentType: "application/zip",
          upsert: true,
        });
      if (!cdrErr) updateData.sunat_cdr_path = cdrPath;
    }
    if (result.ticket) updateData.sunat_ticket = result.ticket;
  } else {
    updateData.sunat_error_code = result.error_code || "UNKNOWN";
    updateData.sunat_error_message = mapCertError(
      (result.error_message as string) || "Error desconocido",
    );
  }

  await (supabase.from("invoices") as any).update(updateData).eq(
    "id",
    invoiceId,
  );

  return json({
    success: isSuccess,
    hash: result.hash || null,
    ticket: result.ticket || null,
    error_code: result.error_code || null,
    error_message: updateData.sunat_error_message as string || null,
    xml_path: updateData.sunat_xml_path || null,
    cdr_path: updateData.sunat_cdr_path || null,
  });
}

async function handleSendDespatch(
  supabase: SupabaseClientLike,
  orgId: string,
  credentials: SunatCredentials,
  body: DbRecord,
) {
  const despatchId = body.despatch_id as string;
  if (!despatchId) return error("despatch_id is required");

  const { data: despatch, error: dErr } = await supabase
    .from("despatches")
    .select("*")
    .eq("id", despatchId)
    .eq("organization_id", orgId)
    .single();
  if (dErr || !despatch) return error("Despatch not found", 404);
  const despatchRecord = despatch as DbRecord;
  if (despatchRecord.status !== "issued") {
    return error(
      `Despatch status '${despatchRecord.status}', must be 'issued'`,
      422,
      "INVALID_STATUS",
    );
  }

  const { data: items } = await supabase.from("despatch_items").select("*").eq(
    "despatch_id",
    despatchId,
  );
  if (!items || items.length === 0) {
    return error("Despatch has no items", 422, "NO_ITEMS");
  }

  const despatchDoc = buildDespatchDocument(
    despatchRecord,
    items as DbRecord[],
  );

  const initialGreVersion = String(credentials.gre_version || "2.0");

  let result: DbRecord;
  let usedGreVersion = initialGreVersion;
  try {
    const client = createSunatClient(supabase);
    result = await client.sendDespatch(credentials, despatchDoc, initialGreVersion);
  } catch (e) {
    await (supabase.from("despatches") as any).update({
      sunat_error_code: "CALL_FAILED",
      sunat_error_message: (e as Error).message,
      sunat_sent_at: new Date().toISOString(),
    }).eq("id", despatchId);
    return json({
      success: false,
      error_message: mapCertError((e as Error).message),
    });
  }

  const isSuccess = result.success === true;
  const now = new Date().toISOString();
  const updateData: DbRecord = {
    sunat_sent_at: now,
    sunat_error_code: null,
    sunat_error_message: null,
  };

  if (isSuccess) {
    updateData.sunat_hash = result.hash || null;
    updateData.status = "processing";
    if (result.ticket) updateData.sunat_ticket = result.ticket;
    if (result.xml) {
      const xmlPath = `${orgId}/${
        (despatchRecord.issue_date as string)?.substring(0, 7) || "unknown"
      }/${despatchRecord.serie}-${despatchRecord.correlativo}.xml`;
      const xmlBytes = new TextEncoder().encode(result.xml as string);
      const { error: xmlErr } = await supabase.storage
        .from("sunat-documents")
        .upload(xmlPath, xmlBytes, {
          contentType: "application/xml",
          upsert: true,
        });
      if (!xmlErr) updateData.sunat_xml_path = xmlPath;
    }
  } else {
    updateData.status = "rejected";
    updateData.sunat_error_code = result.error_code || "UNKNOWN";
    updateData.sunat_error_message = mapCertError(
      (result.error_message as string) || "Error desconocido",
    );
  }

  await (supabase.from("despatches") as any).update(updateData).eq(
    "id",
    despatchId,
  );

  return json({
    success: isSuccess,
    hash: result.hash || null,
    ticket: result.ticket || null,
    error_code: result.error_code || null,
    error_message: updateData.sunat_error_message as string || null,
    xml_path: updateData.sunat_xml_path || null,
    gre_version: usedGreVersion,
  });
}

async function handleCheckDespatchTicket(
  supabase: SupabaseClientLike,
  orgId: string,
  credentials: SunatCredentials,
  body: DbRecord,
) {
  const despatchId = body.despatch_id as string;
  const ticket = body.ticket as string;
  if (!despatchId) return error("despatch_id is required");
  if (!ticket) return error("ticket is required");

  const { data: despatch } = await supabase
    .from("despatches")
    .select("*")
    .eq("id", despatchId)
    .eq("organization_id", orgId)
    .single();
  if (!despatch) return error("Despatch not found", 404);

  try {
    const client = createSunatClient(supabase);
    const result = await client.checkDespatchTicket(credentials, ticket);

    const updateData: DbRecord = {};

    if (result.success && result.result) {
      const statusResult = result.result as DbRecord;
      const statusCode = String(statusResult.status_code || "");

      if (statusCode === "0") {
        updateData.status = "accepted";
        updateData.sunat_accepted_at = new Date().toISOString();
        if (result.cdr_zip) {
          const despatchRecord = despatch as DbRecord;
          const cdrPath = `${orgId}/${
            (despatchRecord.issue_date as string)?.substring(0, 7) || "unknown"
          }/${despatchRecord.serie}-${despatchRecord.correlativo}-cdr.zip`;
          const cdrBytes = Uint8Array.from(
            atob(result.cdr_zip as string),
            (c) => c.charCodeAt(0),
          );
          const { error: cdrErr } = await supabase.storage
            .from("sunat-documents")
            .upload(cdrPath, cdrBytes, {
              contentType: "application/zip",
              upsert: true,
            });
          if (!cdrErr) updateData.sunat_cdr_path = cdrPath;
        }
      } else if (statusCode === "99") {
        updateData.status = "rejected";
        updateData.sunat_error_code = result.error_code || "99";
        updateData.sunat_error_message = result.error_message || "Rechazado por SUNAT";
      }
    }

    if (Object.keys(updateData).length > 0) {
      await (supabase.from("despatches") as any).update(updateData).eq(
        "id",
        despatchId,
      );
    }

    return json({
      success: result.success,
      status_code: (result.result as DbRecord)?.status_code || null,
      error_code: result.error_code || null,
      error_message: result.error_message || null,
      cdr_path: updateData.sunat_cdr_path || null,
    });
  } catch (e) {
    return json({ success: false, error_message: (e as Error).message });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") return error("Method not allowed", 405);

  let body: DbRecord;
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON", 400);
  }

  const action = body.action as string;
  if (!action || !VALID_ACTIONS.includes(action)) {
    return error(`Invalid action. Use: ${VALID_ACTIONS.join(", ")}`);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const auth = await resolveAuth(req, supabase);
  if (auth.error) return auth.error;

  const cfg = await getConfig(
    supabase as SupabaseClientLike,
    String(auth.orgId!),
  );
  if (cfg.error) return cfg.error;

  const orgId = String(auth.orgId!);
  const credentials = cfg.credentials as SunatCredentials;

  if (action === "test") {
    try {
      const client = createSunatClient(supabase);
      const result = await client.testConnection(credentials);
      return json({ success: true, result });
    } catch (e) {
      return json({
        success: false,
        error_message: mapCertError((e as Error).message),
      });
    }
  }

  if (action === "check-ticket") {
    return handleTicketCheck(supabase, credentials, body, "voided");
  }

  if (action === "check-summary-ticket") {
    return handleTicketCheck(supabase, credentials, body, "summary");
  }

  if (action === "send-summary") {
    return handleSummary(supabase, orgId, credentials, body);
  }

  if (action === "send-voided") {
    return handleVoided(supabase, orgId, credentials, body);
  }

  if (action === "send") {
    return handleSend(supabase, orgId, credentials, body);
  }

  if (action === "send-despatch") {
    return handleSendDespatch(supabase, orgId, credentials, body);
  }

  if (action === "check-despatch-ticket") {
    return handleCheckDespatchTicket(supabase, orgId, credentials, body);
  }

  return error("Unhandled action", 500);
});
