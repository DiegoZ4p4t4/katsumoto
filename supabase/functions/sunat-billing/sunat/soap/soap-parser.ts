import { decodeBase64 } from "jsr:@std/encoding/base64";

import { unzipFirstFile } from "../utils/zip.ts";

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function extractTag(xml: string, tags: string[]): string | null {
  for (const tag of tags) {
    const regex = new RegExp(
      `<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`,
      "i",
    );
    const match = xml.match(regex);
    if (match?.[1]) return decodeXmlEntities(match[1].trim());
  }
  return null;
}

function extractTags(xml: string, tags: string[]): string[] {
  for (const tag of tags) {
    const regex = new RegExp(
      `<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`,
      "gi",
    );
    const matches = [...xml.matchAll(regex)].map((match) =>
      decodeXmlEntities(match[1].trim())
    ).filter(Boolean);
    if (matches.length > 0) return matches;
  }
  return [];
}

function parseCdr(cdrZip: Uint8Array) {
  const cdrFile = unzipFirstFile(cdrZip);

  return {
    cdrXml: cdrFile.content,
    statusCode: extractTag(cdrFile.content, ["ResponseCode"]),
    statusMessage: extractTag(cdrFile.content, ["Description"]),
    statusNotes: extractTags(cdrFile.content, ["Note"]),
  };
}

export interface ParsedSendBillResponse {
  success: boolean;
  cdrZip?: Uint8Array;
  cdrXml?: string;
  statusCode?: string | null;
  statusMessage?: string | null;
  statusNotes?: string[];
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface ParsedTicketResponse {
  success: boolean;
  ticket?: string | null;
  statusCode?: string | null;
  statusMessage?: string | null;
  statusNotes?: string[];
  cdrZip?: Uint8Array;
  cdrXml?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export function parseSoapFault(xml: string): ParsedSendBillResponse {
  const faultCode = extractTag(xml, ["faultcode"]);
  const faultString = extractTag(xml, ["faultstring"]);

  return {
    success: false,
    errorCode: faultCode,
    errorMessage: faultString || "SOAP Fault sin detalle.",
  };
}

export function parseSendBillResponse(xml: string): ParsedSendBillResponse {
  if (xml.includes("<Fault>") || xml.includes(":Fault>")) {
    return parseSoapFault(xml);
  }

  const applicationResponse = extractTag(xml, [
    "applicationResponse",
  ]);

  if (!applicationResponse) {
    return {
      success: false,
      errorMessage: "SUNAT no devolvió `applicationResponse`.",
    };
  }

  const cdrZip = decodeBase64(applicationResponse);
  const cdr = parseCdr(cdrZip);

  return {
    success: true,
    cdrZip,
    cdrXml: cdr.cdrXml,
    statusCode: cdr.statusCode,
    statusMessage: cdr.statusMessage,
    statusNotes: cdr.statusNotes,
  };
}

export function parseSendSummaryResponse(xml: string): ParsedTicketResponse {
  if (xml.includes("<Fault>") || xml.includes(":Fault>")) {
    return parseSoapFault(xml);
  }

  const ticket = extractTag(xml, ["ticket"]);
  if (!ticket) {
    return {
      success: false,
      errorMessage: "SUNAT no devolvió ticket para el resumen.",
    };
  }

  return {
    success: true,
    ticket,
  };
}

export function parseGetStatusResponse(xml: string): ParsedTicketResponse {
  if (xml.includes("<Fault>") || xml.includes(":Fault>")) {
    return parseSoapFault(xml);
  }

  const statusCode = extractTag(xml, ["statusCode"]);
  const statusMessage = extractTag(xml, ["statusMessage"]);
  const content = extractTag(xml, ["content"]);

  if (content) {
    const cdrZip = decodeBase64(content);
    const cdr = parseCdr(cdrZip);
    return {
      success: true,
      statusCode: cdr.statusCode || statusCode,
      statusMessage: cdr.statusMessage || statusMessage,
      statusNotes: cdr.statusNotes,
      cdrZip,
      cdrXml: cdr.cdrXml,
    };
  }

  return {
    success: true,
    statusCode,
    statusMessage,
  };
}
