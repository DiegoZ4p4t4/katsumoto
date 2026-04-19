import { loadP12FromStorage } from "./crypto/certificate.ts";
import { signXml } from "./crypto/xml-signer.ts";
import { getStatus, sendBill, sendSummary } from "./soap/soap-client.ts";
import { sendCpe, checkStatus } from "./gre/gre-rest-client.ts";
import { buildDespatchXml } from "./xml/templates/despatch.ts";
import { buildInvoiceXml } from "./xml/templates/invoice.ts";
import { buildNoteXml } from "./xml/templates/note.ts";
import { buildSummaryXml } from "./xml/templates/summary.ts";
import { buildVoidedXml } from "./xml/templates/voided.ts";
import { zipXml } from "./utils/zip.ts";
import type {
  DbRecord,
  SunatClient,
  SunatCredentials,
  SunatResult,
  SupabaseClientLike,
} from "./types.ts";

function buildProbeXml(credentials: SunatCredentials): string {
  const ruc = String(credentials.ruc || "");
  const issueDate = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
 xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
 xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>TEST-1</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${ruc}</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingSupplierParty>
</Invoice>`;
}

export function buildFileBasename(
  credentials: SunatCredentials,
  document: DbRecord,
): string {
  return `${String(credentials.ruc || "")}-${
    String(document.tipo_documento || "")
  }-${String(document.serie || "")}-${String(document.correlativo || "")}`;
}

function buildAsyncFileBasename(
  credentials: SunatCredentials,
  document: DbRecord,
  prefix: "RC" | "RA",
): string {
  const date = String(
    document.fecha_resumen || document.fecha_referencia ||
      document.fecha_emision || "",
  ).replaceAll("-", "");
  return `${String(credentials.ruc || "")}-${prefix}-${date}-${
    String(document.correlativo || "")
  }`;
}

export class DirectSunatClient implements SunatClient {
  constructor(private readonly supabase: SupabaseClientLike) {}

  async testConnection(credentials: SunatCredentials): Promise<SunatResult> {
    const loaded = await loadP12FromStorage(this.supabase, credentials);
    const probeXml = buildProbeXml(credentials);
    const signed = await signXml(probeXml, loaded);

    return {
      success: true,
      hash: signed.digestValue,
      result: {
        mode: "direct-deno-phase-1",
        certificate_subject: loaded.subjectName,
        certificate_issuer: loaded.issuerName,
        certificate_not_after: loaded.notAfter,
        digest_value: signed.digestValue,
        signature_length: signed.signatureValue.length,
      },
    };
  }

  async checkTicket(
    credentials: SunatCredentials,
    ticket: string,
    _kind: "summary" | "voided",
  ): Promise<SunatResult> {
    const result = await getStatus(ticket, credentials);

    return {
      success: result.success,
      cdr_zip: result.cdrZip
        ? btoa(String.fromCharCode(...result.cdrZip))
        : null,
      error_code: result.errorCode || result.statusCode || null,
      error_message: result.errorMessage || result.statusMessage || null,
      result: {
        mode: "direct-deno-phase-async",
        status_code: result.statusCode,
        status_message: result.statusMessage,
        status_notes: result.statusNotes || [],
      },
    };
  }

  async sendSummary(
    credentials: SunatCredentials,
    document: DbRecord,
  ): Promise<SunatResult> {
    const loaded = await loadP12FromStorage(this.supabase, credentials);
    const unsignedXml = buildSummaryXml(
      document,
      credentials as unknown as DbRecord,
    );
    const signed = await signXml(unsignedXml, loaded);
    const fileBasename = buildAsyncFileBasename(credentials, document, "RC");
    try {
      const result = await sendSummary(
        {
          fileBasename,
          xml: signed.signedXml,
        },
        credentials,
      );
      return {
        success: result.success,
        ticket: result.ticket || null,
        xml: signed.signedXml,
        error_code: result.errorCode || null,
        error_message: result.errorMessage || null,
        result: {
          mode: "direct-deno-phase-async",
          digest_value: signed.digestValue,
        },
      };
    } catch (e) {
      return {
        success: false,
        xml: signed.signedXml,
        error_code: "SOAP_ERROR",
        error_message: (e as Error).message,
      };
    }
  }

  async sendVoided(
    credentials: SunatCredentials,
    document: DbRecord,
  ): Promise<SunatResult> {
    const loaded = await loadP12FromStorage(this.supabase, credentials);
    const unsignedXml = buildVoidedXml(
      document,
      credentials as unknown as DbRecord,
    );
    const signed = await signXml(unsignedXml, loaded);
    const fileBasename = buildAsyncFileBasename(credentials, document, "RA");
    const result = await sendSummary(
      {
        fileBasename,
        xml: signed.signedXml,
      },
      credentials,
    );

    return {
      success: result.success,
      ticket: result.ticket || null,
      xml: signed.signedXml,
      error_code: result.errorCode || null,
      error_message: result.errorMessage || null,
      result: {
        mode: "direct-deno-phase-async",
        digest_value: signed.digestValue,
      },
    };
  }

  async sendInvoice(
    credentials: SunatCredentials,
    document: DbRecord,
    kind: "invoice" | "boleta" | "credit-note" | "debit-note",
  ): Promise<SunatResult> {
    const loaded = await loadP12FromStorage(this.supabase, credentials);
    const unsignedXml = kind === "credit-note" || kind === "debit-note"
      ? buildNoteXml(
        document,
        credentials as unknown as DbRecord,
        kind,
      )
      : buildInvoiceXml(
        document,
        credentials as unknown as DbRecord,
      );
    const signed = await signXml(unsignedXml, loaded);
    const fileBasename = buildFileBasename(credentials, document);
    const soapResult = await sendBill(
      {
        fileBasename,
        xml: signed.signedXml,
      },
      credentials,
    );

    if (!soapResult.success) {
      return {
        success: false,
        error_code: soapResult.errorCode || soapResult.statusCode ||
          "SOAP_ERROR",
        error_message: soapResult.errorMessage || soapResult.statusMessage ||
          "Error enviando a SUNAT.",
        xml: signed.signedXml,
      };
    }

    return {
      success: true,
      hash: signed.digestValue,
      xml: signed.signedXml,
      cdr_zip: soapResult.cdrZip
        ? btoa(String.fromCharCode(...soapResult.cdrZip))
        : null,
      result: {
        mode: "direct-deno-phase-2",
        document_kind: kind,
        digest_value: signed.digestValue,
        certificate_subject: loaded.subjectName,
        status_code: soapResult.statusCode,
        status_message: soapResult.statusMessage,
        status_notes: soapResult.statusNotes || [],
      },
    };
  }

  async sendDespatch(
    credentials: SunatCredentials,
    document: DbRecord,
    greVersion: string = "2.0",
  ): Promise<SunatResult> {
    const loaded = await loadP12FromStorage(this.supabase, credentials);
    const unsignedXml = buildDespatchXml(
      document,
      credentials as unknown as DbRecord,
      greVersion,
    );
    const signed = await signXml(unsignedXml, loaded);
    const fileBasename = buildFileBasename(credentials, document);
    const zipBytes = zipXml(`${fileBasename}.xml`, signed.signedXml);

    const result = await sendCpe(credentials, fileBasename, zipBytes);

    if (!result.success) {
      return {
        success: false,
        error_code: result.errorCode || "REST_ERROR",
        error_message: result.errorMessage || "Error enviando GRE via REST.",
        xml: signed.signedXml,
        gre_version: greVersion,
      };
    }

    return {
      success: true,
      hash: signed.digestValue,
      xml: signed.signedXml,
      ticket: result.ticket || null,
      gre_version: greVersion,
      result: {
        mode: "direct-deno-gre-rest",
        document_kind: "despatch",
        digest_value: signed.digestValue,
        certificate_subject: loaded.subjectName,
      },
    };
  }

  async checkDespatchTicket(
    credentials: SunatCredentials,
    ticket: string,
  ): Promise<SunatResult> {
    const result = await checkStatus(credentials, ticket);

    if (result.statusCode === "98") {
      return {
        success: true,
        result: {
          mode: "direct-deno-gre-rest",
          status_code: "98",
          status_message: "En proceso",
        },
      };
    }

    if (result.statusCode === "99") {
      return {
        success: false,
        error_code: result.errorCode || "99",
        error_message: result.errorMessage || "Rechazado por SUNAT",
        result: {
          mode: "direct-deno-gre-rest",
          status_code: "99",
        },
      };
    }

    return {
      success: true,
      hash: null,
      cdr_zip: result.cdrZip
        ? btoa(String.fromCharCode(...result.cdrZip))
        : null,
      result: {
        mode: "direct-deno-gre-rest",
        status_code: "0",
        status_message: "Aceptado",
        has_cdr: !!result.cdrZip,
      },
    };
  }
}
