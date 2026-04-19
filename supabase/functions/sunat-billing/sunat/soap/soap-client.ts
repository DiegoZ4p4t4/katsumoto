import { encodeBase64 } from "jsr:@std/encoding/base64";

import type { SunatCredentials } from "../types.ts";
import { getBillServiceEndpoint } from "../utils/endpoints.ts";
import { zipXml } from "../utils/zip.ts";
import {
  buildGetStatusEnvelope,
  buildSendBillEnvelope,
  buildSendSummaryEnvelope,
} from "./soap-envelope.ts";
import { parseSendBillResponse, parseSendSummaryResponse, parseGetStatusResponse, type ParsedSendBillResponse } from "./soap-parser.ts";

export interface SendBillPayload {
  fileBasename: string;
  xml: string;
}

function getSoapCredentials(credentials: SunatCredentials) {
  return {
    username: `${String(credentials.ruc || "")}${
      String(credentials.usuario_sol || "")
    }`,
    password: String(credentials.clave_sol || ""),
  };
}

export async function sendBill(
  payload: SendBillPayload,
  credentials: SunatCredentials,
) {
  return sendBillToEndpoint(payload, credentials, getBillServiceEndpoint(credentials));
}

export async function sendBillToEndpoint(
  payload: SendBillPayload,
  credentials: SunatCredentials,
  endpoint: string,
): Promise<ParsedSendBillResponse> {
  const { username, password } = getSoapCredentials(credentials);
  const zipBytes = zipXml(`${payload.fileBasename}.xml`, payload.xml);
  const envelope = buildSendBillEnvelope(
    username,
    password,
    `${payload.fileBasename}.zip`,
    encodeBase64(zipBytes),
  );

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "urn:sendBill",
    },
    body: envelope,
  });

  const raw = await res.text();
  if (!res.ok) {
    const fault = parseSendBillResponse(raw);
    throw new Error(fault.errorMessage || `SUNAT respondió HTTP ${res.status}`);
  }

  return parseSendBillResponse(raw);
}

export async function sendBillRaw(
  payload: SendBillPayload,
  credentials: SunatCredentials,
  endpoint: string,
): Promise<{ rawResponse: string; httpStatus: number }> {
  const { username, password } = getSoapCredentials(credentials);
  const zipBytes = zipXml(`${payload.fileBasename}.xml`, payload.xml);
  const envelope = buildSendBillEnvelope(
    username,
    password,
    `${payload.fileBasename}.zip`,
    encodeBase64(zipBytes),
  );

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "",
    },
    body: envelope,
  });

  const raw = await res.text();
  return { rawResponse: raw, httpStatus: res.status };
}

export async function sendSummary(
  payload: SendBillPayload,
  credentials: SunatCredentials,
) {
  const { username, password } = getSoapCredentials(credentials);
  const zipBytes = zipXml(`${payload.fileBasename}.xml`, payload.xml);
  const envelope = buildSendSummaryEnvelope(
    username,
    password,
    `${payload.fileBasename}.zip`,
    encodeBase64(zipBytes),
  );

  const res = await fetch(getBillServiceEndpoint(credentials), {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "",
    },
    body: envelope,
  });

  const raw = await res.text();
  if (!res.ok) {
    const fault = parseSendSummaryResponse(raw);
    throw new Error(fault.errorMessage || `SUNAT respondió HTTP ${res.status}`);
  }

  return parseSendSummaryResponse(raw);
}

export async function getStatus(ticket: string, credentials: SunatCredentials) {
  const { username, password } = getSoapCredentials(credentials);
  const envelope = buildGetStatusEnvelope(username, password, ticket);

  const res = await fetch(getBillServiceEndpoint(credentials), {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "",
    },
    body: envelope,
  });

  const raw = await res.text();
  if (!res.ok) {
    const fault = parseGetStatusResponse(raw);
    throw new Error(fault.errorMessage || `SUNAT respondió HTTP ${res.status}`);
  }

  return parseGetStatusResponse(raw);
}
