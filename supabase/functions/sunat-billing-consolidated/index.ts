import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import { decodeBase64 } from "jsr:@std/encoding/base64";
import { strToU8, unzipSync, zipSync } from "npm:fflate@0.8.2";

type DbRecord = Record<string, unknown>;
type SupabaseClientLike = any;

interface SunatCredentials {
  ruc: unknown;
  razon_social: unknown;
  nombre_comercial: unknown;
  usuario_sol: unknown;
  clave_sol: unknown;
  certificado_path: unknown;
  certificado_password: unknown;
  ubigeo: unknown;
  departamento: unknown;
  provincia: unknown;
  distrito: unknown;
  direccion: unknown;
  modo_produccion: unknown;
}

interface SunatResult {
  success?: boolean;
  hash?: string | null;
  ticket?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  xml?: string | null;
  cdr_zip?: string | null;
  result?: unknown;
  [key: string]: unknown;
}

interface LoadedCertificate {
  p12Der: Uint8Array;
  certificateDer: Uint8Array;
  certificatePem: string;
  privateKeyPem: string;
  serialNumber: string;
  issuerName: string;
  subjectName: string;
  notBefore: string;
  notAfter: string;
}

interface SignedXmlResult {
  signedXml: string;
  digestValue: string;
  signatureValue: string;
  certificateBase64: string;
}

interface SendBillPayload {
  fileBasename: string;
  xml: string;
}

interface ParsedSendBillResponse {
  success: boolean;
  cdrZip?: Uint8Array;
  cdrXml?: string;
  statusCode?: string | null;
  statusMessage?: string | null;
  statusNotes?: string[];
  errorCode?: string | null;
  errorMessage?: string | null;
}

interface ParsedTicketResponse {
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

const VALID_ACTIONS = ["test", "send", "check-ticket", "send-summary", "send-voided", "check-summary-ticket"];

const INVOICE_TYPE_MAP: Record<string, string> = { factura: "01", boleta: "03", nota_credito: "07", nota_debito: "08" };
const DOC_TYPE_MAP: Record<string, string> = { RUC: "6", DNI: "1", Pasaporte: "7", CE: "4", Otros: "0" };
const TAX_AFFECTATION_MAP: Record<string, string> = { gravado: "10", exonerado: "20", inafecto: "30", exportacion: "40" };
const CERT_ERROR_MAP: Record<string, string> = {
  "2076": "El RUC no corresponde al certificado digital.",
  "2074": "Certificado digital expirado.",
  "2073": "Clave del certificado digital incorrecta.",
};

const UBL_INVOICE_NAMESPACES = {
  xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  ccts: "urn:un:unece:uncefact:documentation:2",
  ds: "http://www.w3.org/2000/09/xmldsig#",
  ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  qdt: "urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2",
  sac: "urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1",
  udt: "urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2",
  xsi: "http://www.w3.org/2001/XMLSchema-instance",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

function errorResponse(message: string, status = 400, code?: string) {
  return jsonResponse({ success: false, error_code: code ?? "ERROR", error_message: message }, status);
}

function escapeXml(value: unknown): string {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function formatAmount(value: unknown, decimals = 2): string {
  const num = typeof value === "number" ? value : Number(value || 0);
  return num.toFixed(decimals);
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100;
}

function mapCertError(errorMessage: string): string {
  for (const [code, msg] of Object.entries(CERT_ERROR_MAP)) {
    if (errorMessage.includes(code)) return msg;
  }
  return errorMessage;
}

function getBillServiceEndpoint(credentials: SunatCredentials): string {
  const isProduction = credentials.modo_produccion === true || credentials.modo_produccion === "true";
  return isProduction
    ? "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService"
    : "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
}

function zipXml(filename: string, xml: string): Uint8Array {
  return zipSync({ [filename]: strToU8(xml) });
}

function unzipFirstFile(zipBytes: Uint8Array): { name: string; content: string } {
  const files = unzipSync(zipBytes);
  const [name, content] = Object.entries(files)[0] || [];
  if (!name || !content) throw new Error("El ZIP no contiene archivos.");
  return { name, content: new TextDecoder().decode(content) };
}

const ENCRYPTION_KEY = Deno.env.get("SUNAT_CREDENTIALS_KEY") ?? "katsumoto-enc-key-2026";

async function deriveKey(): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(32);
  const encoded = new TextEncoder().encode(ENCRYPTION_KEY);
  keyBytes.set(encoded.slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function tryDecrypt(value: string | null): Promise<string | null> {
  if (!value) return null;
  try {
    const combined = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    if (combined.length <= 12) return value;
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await deriveKey();
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch { return value; }
}

function extractUserId(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch { return null; }
}

async function resolveAuth(req: Request, supabase: SupabaseClientLike) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { error: errorResponse("Unauthorized", 401, "NO_AUTH") };
  const token = authHeader.replace("Bearer ", "");
  if (!token || token.length < 10) return { error: errorResponse("Unauthorized: empty token", 401, "NO_AUTH") };
  const userId = extractUserId(token);
  if (!userId) return { error: errorResponse("Invalid token", 401, "INVALID_TOKEN") };
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", userId).single();
  if (!profile) return { error: errorResponse("Profile not found", 403) };
  return { orgId: (profile as Record<string, unknown>).organization_id, role: (profile as Record<string, unknown>).role };
}

async function verifyCertInStorage(supabase: SupabaseClientLike, certPath: string | null): Promise<boolean> {
  if (!certPath) return false;
  const lastSlash = certPath.lastIndexOf("/");
  const dir = certPath.substring(0, lastSlash);
  const fileName = certPath.substring(lastSlash + 1);
  const { data, error: lsError } = await supabase.storage.from("sunat-documents").list(dir);
  if (lsError || !data) return false;
  return data.some((file: { name: string }) => file.name === fileName);
}

function buildCredentialsFromConfig(config: DbRecord): SunatCredentials {
  return {
    ruc: config.ruc, razon_social: config.razon_social,
    nombre_comercial: config.nombre_comercial || config.razon_social,
    usuario_sol: config.usuario_sol, clave_sol: config.clave_sol,
    certificado_path: config.certificado_path,
    certificado_password: config.certificado_password || null,
    ubigeo: config.ubigeo || "150101", departamento: config.departamento || "LIMA",
    provincia: config.provincia || "LIMA", distrito: config.distrito || "LIMA",
    direccion: config.direccion || "-", modo_produccion: config.modo_produccion || false,
  };
}

function extractFirstPemBlock(pemText: string, beginLabel: string): string | null {
  const startMarker = `-----BEGIN ${beginLabel}-----`;
  const endMarker = `-----END ${beginLabel}-----`;
  const startIdx = pemText.indexOf(startMarker);
  if (startIdx === -1) return null;
  const endIdx = pemText.indexOf(endMarker, startIdx);
  if (endIdx === -1) return null;
  return pemText.substring(startIdx, endIdx + endMarker.length);
}

function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/[\s\r\n]/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function readLength(buf: Uint8Array, offset: number): { length: number; nextPos: number } {
  const first = buf[offset];
  if (first < 0x80) return { length: first, nextPos: offset + 1 };
  const numBytes = first & 0x7f;
  let len = 0;
  for (let i = 0; i < numBytes; i++) len = (len << 8) | buf[offset + 1 + i];
  return { length: len, nextPos: offset + 1 + numBytes };
}

function findTbsCertificate(der: Uint8Array): { start: number; end: number } {
  let pos = 0;
  if (der[pos] !== 0x30) return { start: 0, end: der.length };
  pos++;
  const outerLen = readLength(der, pos);
  pos = outerLen.nextPos;
  if (der[pos] === 0xa0) { pos++; const explLen = readLength(der, pos); pos = explLen.nextPos; }
  if (der[pos] !== 0x30) return { start: 0, end: der.length };
  const tbsStart = pos;
  pos++;
  const tbsLen = readLength(der, pos);
  return { start: tbsStart, end: tbsLen.nextPos + tbsLen.length };
}

function findNextTag(buf: Uint8Array, tag: number, startPos: number): { found: boolean; valueStart: number; valueEnd: number; nextPos: number } {
  let pos = startPos;
  while (pos < buf.length) {
    if (buf[pos] === tag) {
      pos++;
      const len = readLength(buf, pos);
      return { found: true, valueStart: len.nextPos, valueEnd: len.nextPos + len.length, nextPos: len.nextPos + len.length };
    }
    pos++;
    const len = readLength(buf, pos);
    pos = len.nextPos + len.length;
  }
  return { found: false, valueStart: 0, valueEnd: 0, nextPos: startPos };
}

const OID_MAP: Record<string, string> = { "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST", "2.5.4.10": "O", "2.5.4.11": "OU", "1.2.840.113549.1.9.1": "E" };

function decodeOid(bytes: Uint8Array): string {
  let s = String(bytes[0] / 40) + "." + String(bytes[0] % 40);
  let n = 0;
  for (let i = 1; i < bytes.length; i++) { n = (n << 7) | (bytes[i] & 0x7f); if (!(bytes[i] & 0x80)) { s += "." + n; n = 0; } }
  return s;
}

function parseRdnSequence(buf: Uint8Array, start: number, end: number): string {
  const parts: string[] = [];
  let pos = start;
  while (pos < end) {
    if (buf[pos] === 0x31) {
      pos++;
      const setLen = readLength(buf, pos);
      const setEnd = setLen.nextPos + setLen.length;
      pos = setLen.nextPos;
      while (pos < setEnd) {
        if (buf[pos] === 0x30) {
          pos++;
          const seqLen = readLength(buf, pos);
          const seqEnd = seqLen.nextPos + seqLen.length;
          pos = seqLen.nextPos;
          if (buf[pos] === 0x06) {
            pos++;
            const oidLen = readLength(buf, pos);
            const oidBytes = buf.slice(oidLen.nextPos, oidLen.nextPos + oidLen.length);
            const oid = decodeOid(oidBytes);
            pos = oidLen.nextPos + oidLen.length;
            if (buf[pos] === 0x0c || buf[pos] === 0x13 || buf[pos] === 0x16) {
              const vt = buf[pos]; pos++;
              const valLen = readLength(buf, pos);
              const val = new TextDecoder().decode(buf.slice(valLen.nextPos, valLen.nextPos + valLen.length));
              pos = valLen.nextPos + valLen.length;
              parts.push(`${OID_MAP[oid] || oid}=${val}`);
            } else { pos = seqEnd; }
          } else { pos = seqEnd; }
        } else { pos++; const l = readLength(buf, pos); pos = l.nextPos + l.length; }
      }
    } else { pos++; const l = readLength(buf, pos); pos = l.nextPos + l.length; }
  }
  return parts.join(", ");
}

function formatTime(s: string): string {
  try {
    if (s.length === 13) {
      const y = parseInt(s.substring(0, 2));
      const fullYear = y >= 50 ? 1900 + y : 2000 + y;
      return new Date(fullYear, parseInt(s.substring(2, 4)) - 1, parseInt(s.substring(4, 6)), parseInt(s.substring(6, 8)), parseInt(s.substring(8, 10)), parseInt(s.substring(10, 12))).toISOString();
    }
    return new Date(s).toISOString();
  } catch { return s; }
}

function parseValidity(buf: Uint8Array, start: number, end: number): { notBefore: string; notAfter: string } {
  let notBefore = "";
  let notAfter = "";
  let pos = start;
  while (pos < end) {
    const t = buf[pos];
    if (t === 0x17 || t === 0x18) {
      pos++; const len = readLength(buf, pos);
      const val = new TextDecoder().decode(buf.slice(len.nextPos, len.nextPos + len.length));
      if (!notBefore) notBefore = formatTime(val); else notAfter = formatTime(val);
      pos = len.nextPos + len.length;
    } else { pos++; const len = readLength(buf, pos); pos = len.nextPos + len.length; }
  }
  return { notBefore, notAfter };
}

function parseDnFromAsn1(der: Uint8Array): { subjectName: string; issuerName: string; serialNumber: string; notBefore: string; notAfter: string } {
  const tbsOffset = findTbsCertificate(der);
  const tbsBytes = der.slice(tbsOffset.start, tbsOffset.end);
  let serialNumber = "", subjectName = "", issuerName = "", notBefore = "", notAfter = "";
  try {
    const serialEnd = findNextTag(tbsBytes, 0x02, 0);
    if (serialEnd.found) {
      const serialBytes = tbsBytes.slice(serialEnd.valueStart, serialEnd.valueEnd);
      serialNumber = Array.from(serialBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    const issuerSeq = findNextTag(tbsBytes, 0x30, serialEnd.nextPos || 0);
    if (issuerSeq.found) issuerName = parseRdnSequence(tbsBytes, issuerSeq.valueStart, issuerSeq.valueEnd);
    const validitySeq = findNextTag(tbsBytes, 0x30, issuerSeq.nextPos || 0);
    if (validitySeq.found) { const dates = parseValidity(tbsBytes, validitySeq.valueStart, validitySeq.valueEnd); notBefore = dates.notBefore; notAfter = dates.notAfter; }
    const subjectSeq = findNextTag(tbsBytes, 0x30, validitySeq.nextPos || 0);
    if (subjectSeq.found) subjectName = parseRdnSequence(tbsBytes, subjectSeq.valueStart, subjectSeq.valueEnd);
  } catch {}
  return { subjectName, issuerName, serialNumber, notBefore, notAfter };
}

async function downloadText(supabase: SupabaseClientLike, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("sunat-documents").download(path);
  if (error || !data) throw new Error(`No se pudo descargar ${path}: ${error?.message || "not found"}`);
  return await data.text();
}

async function downloadBinary(supabase: SupabaseClientLike, path: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from("sunat-documents").download(path);
  if (error || !data) throw new Error(`No se pudo descargar ${path}: ${error?.message || "not found"}`);
  return new Uint8Array(await data.arrayBuffer());
}

async function loadP12FromStorage(supabase: SupabaseClientLike, credentials: SunatCredentials): Promise<LoadedCertificate> {
  const basePath = String(credentials.certificado_path || "");
  if (!basePath) throw new Error("No hay `certificado_path` configurado.");
  const dir = basePath.substring(0, basePath.lastIndexOf("/"));
  const keyPemText = await downloadText(supabase, `${dir}/private_key.pem`);
  const certPemText = await downloadText(supabase, `${dir}/certificate.pem`);
  const privateKeyPem = extractFirstPemBlock(keyPemText, "PRIVATE KEY");
  if (!privateKeyPem) throw new Error("No se encontró la clave privada en el archivo PEM.");
  const certificatePem = extractFirstPemBlock(certPemText, "CERTIFICATE");
  if (!certificatePem) throw new Error("No se encontró el certificado en el archivo PEM.");
  const certDer = pemToDer(certificatePem);
  const p12Bytes = await downloadBinary(supabase, basePath).catch(() => certDer);
  const meta = parseDnFromAsn1(certDer);
  return { p12Der: p12Bytes, certificateDer: certDer, certificatePem, privateKeyPem, serialNumber: meta.serialNumber, issuerName: meta.issuerName, subjectName: meta.subjectName, notBefore: meta.notBefore, notAfter: meta.notAfter };
}

function canonicalizeXml(xml: string): string {
  let result = xml;
  result = result.replace(/^<\?xml[^?]*\?>\s*/, "");
  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  result = result.replace(/<([\w:][\w:.-]*)((?:\s[^>]*?)?)\s*\/>/g, (_, tagName, attrs) => `<${tagName}${attrs}></${tagName}>`);
  return result;
}

async function sha256Base64(content: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return encodeBase64(new Uint8Array(digest));
}

function extractRootNamespaces(xml: string): string {
  const stripped = xml.replace(/^<\?xml[^?]*\?>\s*/, "");
  const rootMatch = stripped.match(/^<[\w:.-]+([\s\S]*?)(?:\s*\/\s*>|>)/);
  if (!rootMatch) return 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"';
  const attrs = rootMatch[1];
  const nsList: Array<{ prefix: string; uri: string }> = [];
  const nsRegex = /xmlns(?::([\w.-]+))?="([^"]*)"/g;
  let match;
  while ((match = nsRegex.exec(attrs)) !== null) nsList.push({ prefix: match[1] || "", uri: match[2] });
  if (!nsList.some((ns) => ns.prefix === "ds")) nsList.push({ prefix: "ds", uri: "http://www.w3.org/2000/09/xmldsig#" });
  nsList.sort((a, b) => { if (a.prefix === "") return -1; if (b.prefix === "") return 1; return a.prefix.localeCompare(b.prefix); });
  return nsList.map((ns) => ns.prefix ? `xmlns:${ns.prefix}="${ns.uri}"` : `xmlns="${ns.uri}"`).join(" ");
}

function escapeXmlSigner(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function buildSignedInfoForSigning(digestValue: string, rootNamespaces: string): string {
  return `<ds:SignedInfo ${rootNamespaces}><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${escapeXmlSigner(digestValue)}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
}

function buildSignatureXml(digestValue: string, signatureValue: string, certificateBase64: string): string {
  return `<ds:Signature Id="SignatureSP"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${escapeXmlSigner(digestValue)}</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>${escapeXmlSigner(signatureValue)}</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>${certificateBase64}</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature>`;
}

function injectSignature(xml: string, signatureXml: string): string {
  if (xml.includes("<ext:ExtensionContent/>")) return xml.replace("<ext:ExtensionContent/>", `<ext:ExtensionContent>${signatureXml}</ext:ExtensionContent>`);
  if (xml.includes("<ext:ExtensionContent></ext:ExtensionContent>")) return xml.replace("<ext:ExtensionContent></ext:ExtensionContent>", `<ext:ExtensionContent>${signatureXml}</ext:ExtensionContent>`);
  throw new Error("No se encontró `ext:ExtensionContent` en el XML para insertar la firma.");
}

async function signXml(xml: string, certificate: LoadedCertificate): Promise<SignedXmlResult> {
  const canonicalizedDoc = canonicalizeXml(xml);
  const digestValue = await sha256Base64(canonicalizedDoc);
  const rootNamespaces = extractRootNamespaces(xml);
  const signedInfo = buildSignedInfoForSigning(digestValue, rootNamespaces);
  const canonicalizedSignedInfo = canonicalizeXml(signedInfo);
  const privateKeyDer = pemToDer(certificate.privateKeyPem);
  const privateKey = await crypto.subtle.importKey("pkcs8", privateKeyDer.buffer as ArrayBuffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(canonicalizedSignedInfo));
  const signatureValue = encodeBase64(new Uint8Array(signature));
  const certificateBase64 = encodeBase64(certificate.certificateDer);
  const signatureXml = buildSignatureXml(digestValue, signatureValue, certificateBase64);
  return { signedXml: injectSignature(xml, signatureXml), digestValue, signatureValue, certificateBase64 };
}

function buildUsernameToken(username: string, password: string): string {
  return `<soapenv:Header>
  <wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <wsse:UsernameToken>
      <wsse:Username>${escapeXml(username)}</wsse:Username>
      <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${escapeXml(password)}</wsse:Password>
    </wsse:UsernameToken>
  </wsse:Security>
</soapenv:Header>`;
}

function buildSendBillEnvelope(username: string, password: string, fileName: string, contentBase64: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
${buildUsernameToken(username, password)}
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${escapeXml(fileName)}</fileName>
      <contentFile>${contentBase64}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function buildSendSummaryEnvelope(username: string, password: string, fileName: string, contentBase64: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
${buildUsernameToken(username, password)}
  <soapenv:Body>
    <ser:sendSummary>
      <fileName>${escapeXml(fileName)}</fileName>
      <contentFile>${contentBase64}</contentFile>
    </ser:sendSummary>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function buildGetStatusEnvelope(username: string, password: string, ticket: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
${buildUsernameToken(username, password)}
  <soapenv:Body>
    <ser:getStatus>
      <ticket>${escapeXml(ticket)}</ticket>
    </ser:getStatus>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function decodeXmlEntities(value: string): string {
  return value.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&amp;", "&");
}

function extractTag(xml: string, tags: string[]): string | null {
  for (const tag of tags) {
    const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, "i");
    const match = xml.match(regex);
    if (match?.[1]) return decodeXmlEntities(match[1].trim());
  }
  return null;
}

function extractTags(xml: string, tags: string[]): string[] {
  for (const tag of tags) {
    const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, "gi");
    const matches = [...xml.matchAll(regex)].map((match) => decodeXmlEntities(match[1].trim())).filter(Boolean);
    if (matches.length > 0) return matches;
  }
  return [];
}

function parseCdr(cdrZip: Uint8Array) {
  const cdrFile = unzipFirstFile(cdrZip);
  return { cdrXml: cdrFile.content, statusCode: extractTag(cdrFile.content, ["ResponseCode"]), statusMessage: extractTag(cdrFile.content, ["Description"]), statusNotes: extractTags(cdrFile.content, ["Note"]) };
}

function parseSoapFault(xml: string): ParsedSendBillResponse {
  const faultCode = extractTag(xml, ["faultcode"]);
  const faultString = extractTag(xml, ["faultstring"]);
  return { success: false, errorCode: faultCode, errorMessage: faultString || "SOAP Fault sin detalle." };
}

function parseSendBillResponse(xml: string): ParsedSendBillResponse {
  if (xml.includes("<Fault>") || xml.includes(":Fault>")) return parseSoapFault(xml);
  const applicationResponse = extractTag(xml, ["applicationResponse"]);
  if (!applicationResponse) return { success: false, errorMessage: "SUNAT no devolvió `applicationResponse`." };
  const cdrZip = decodeBase64(applicationResponse);
  const cdr = parseCdr(cdrZip);
  return { success: true, cdrZip, cdrXml: cdr.cdrXml, statusCode: cdr.statusCode, statusMessage: cdr.statusMessage, statusNotes: cdr.statusNotes };
}

function parseSendSummaryResponse(xml: string): ParsedTicketResponse {
  if (xml.includes("<Fault>") || xml.includes(":Fault>")) return parseSoapFault(xml);
  const ticket = extractTag(xml, ["ticket"]);
  if (!ticket) return { success: false, errorMessage: "SUNAT no devolvió ticket para el resumen." };
  return { success: true, ticket };
}

function parseGetStatusResponse(xml: string): ParsedTicketResponse {
  if (xml.includes("<Fault>") || xml.includes(":Fault>")) return parseSoapFault(xml);
  const statusCode = extractTag(xml, ["statusCode"]);
  const statusMessage = extractTag(xml, ["statusMessage"]);
  const content = extractTag(xml, ["content"]);
  if (content) {
    const cdrZip = decodeBase64(content);
    const cdr = parseCdr(cdrZip);
    return { success: true, statusCode: cdr.statusCode || statusCode, statusMessage: cdr.statusMessage || statusMessage, statusNotes: cdr.statusNotes, cdrZip, cdrXml: cdr.cdrXml };
  }
  return { success: true, statusCode, statusMessage };
}

function getSoapCredentials(credentials: SunatCredentials) {
  return { username: `${String(credentials.ruc || "")}${String(credentials.usuario_sol || "")}`, password: String(credentials.clave_sol || "") };
}

async function sendBill(payload: SendBillPayload, credentials: SunatCredentials) {
  const { username, password } = getSoapCredentials(credentials);
  const zipBytes = zipXml(`${payload.fileBasename}.xml`, payload.xml);
  const envelope = buildSendBillEnvelope(username, password, `${payload.fileBasename}.zip`, encodeBase64(zipBytes));
  const res = await fetch(getBillServiceEndpoint(credentials), { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" }, body: envelope });
  const raw = await res.text();
  if (!res.ok) { const fault = parseSendBillResponse(raw); throw new Error(fault.errorMessage || `SUNAT respondió HTTP ${res.status}`); }
  return parseSendBillResponse(raw);
}

async function sendSummarySoap(payload: SendBillPayload, credentials: SunatCredentials) {
  const { username, password } = getSoapCredentials(credentials);
  const zipBytes = zipXml(`${payload.fileBasename}.xml`, payload.xml);
  const envelope = buildSendSummaryEnvelope(username, password, `${payload.fileBasename}.zip`, encodeBase64(zipBytes));
  const res = await fetch(getBillServiceEndpoint(credentials), { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" }, body: envelope });
  const raw = await res.text();
  if (!res.ok) { const fault = parseSendSummaryResponse(raw); throw new Error(fault.errorMessage || `SUNAT respondió HTTP ${res.status}`); }
  return parseSendSummaryResponse(raw);
}

async function getStatus(ticket: string, credentials: SunatCredentials) {
  const { username, password } = getSoapCredentials(credentials);
  const envelope = buildGetStatusEnvelope(username, password, ticket);
  const res = await fetch(getBillServiceEndpoint(credentials), { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" }, body: envelope });
  const raw = await res.text();
  if (!res.ok) { const fault = parseGetStatusResponse(raw); throw new Error(fault.errorMessage || `SUNAT respondió HTTP ${res.status}`); }
  return parseGetStatusResponse(raw);
}

function buildInvoiceNamespaces(): string {
  return Object.entries(UBL_INVOICE_NAMESPACES).map(([key, value]) => `${key === "xmlns" ? "xmlns" : `xmlns:${key}`}="${value}"`).join(" ");
}

function buildInvoiceXml(document: DbRecord, credentials: DbRecord): string {
  const customer = (document.client as DbRecord) || {};
  const items = ensureArray(document.detalles as DbRecord[]);
  const legends = ensureArray(document.leyendas as DbRecord[]);
  const legendXml = legends.map((l) => `\n  <sac:AdditionalInformation>\n    <sac:AdditionalProperty>\n      <cbc:ID>${escapeXml(l.code)}</cbc:ID>\n      <cbc:Value>${escapeXml(l.value)}</cbc:Value>\n    </sac:AdditionalProperty>\n  </sac:AdditionalInformation>`).join("");
  const linesXml = items.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${escapeXml(item.unidad || "NIU")}">${formatAmount(item.cantidad, 2)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">${formatAmount(item.mto_valor_venta)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${formatAmount(item.mto_precio_unitario, 6)}</cbc:PriceAmount>
        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${formatAmount(item.total_impuestos)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="PEN">${formatAmount(item.mto_base_igv)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="PEN">${formatAmount(item.igv)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>${formatAmount(item.porcentaje_igv, 2)}</cbc:Percent>
          <cbc:TaxExemptionReasonCode>${escapeXml(item.tip_afe_igv)}</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${escapeXml(item.descripcion)}</cbc:Description>
      <cac:SellersItemIdentification><cbc:ID>${escapeXml(item.codigo || "")}</cbc:ID></cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="PEN">${formatAmount(item.mto_valor_unitario, 6)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${buildInvoiceNamespaces()}>
  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(document.serie)}-${escapeXml(document.correlativo)}</cbc:ID>
  <cbc:IssueDate>${escapeXml(document.fecha_emision)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="${escapeXml(document.tipo_operacion || "0101")}">${escapeXml(document.tipo_documento)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${escapeXml(document.moneda || "PEN")}</cbc:DocumentCurrencyCode>${legendXml}
  <cac:Signature>
    <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
    <cac:SignatoryParty><cac:PartyIdentification><cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${escapeXml(credentials.razon_social)}</cbc:Name></cac:PartyName></cac:SignatoryParty>
    <cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#SignatureSP</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${escapeXml(credentials.ruc)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(credentials.nombre_comercial || credentials.razon_social)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:ID>${escapeXml(credentials.ubigeo || "150101")}</cbc:ID>
        <cbc:StreetName>${escapeXml(credentials.direccion || "-")}</cbc:StreetName>
        <cbc:CityName>${escapeXml(credentials.provincia || "LIMA")}</cbc:CityName>
        <cbc:CountrySubentity>${escapeXml(credentials.departamento || "LIMA")}</cbc:CountrySubentity>
        <cbc:District>${escapeXml(credentials.distrito || "LIMA")}</cbc:District>
        <cac:Country><cbc:IdentificationCode>PE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(credentials.razon_social)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cbc:CustomerAssignedAccountID>${escapeXml(customer.numero_documento)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>${escapeXml(customer.tipo_documento)}</cbc:AdditionalAccountID>
    <cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(customer.razon_social)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentTerms><cbc:ID>FormaPago</cbc:ID><cbc:PaymentMeansID>${escapeXml(document.forma_pago_tipo || "Contado")}</cbc:PaymentMeansID></cac:PaymentTerms>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${formatAmount(document.total_impuestos)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${formatAmount(document.mto_oper_gravadas)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${formatAmount(document.mto_igv)}</cbc:TaxAmount>
      <cac:TaxCategory><cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${formatAmount(document.valor_venta)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${formatAmount(document.mto_imp_venta)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${formatAmount(document.mto_imp_venta)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${linesXml}
</Invoice>`;
}

function buildNoteXml(document: DbRecord, credentials: DbRecord, kind: "credit-note" | "debit-note"): string {
  const rootTag = kind === "credit-note" ? "CreditNote" : "DebitNote";
  const xmlns = kind === "credit-note" ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" : "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2";
  const ns = `xmlns="${xmlns}" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`;
  const customer = (document.client as DbRecord) || {};
  const items = ensureArray(document.detalles as DbRecord[]);
  const legends = ensureArray(document.leyendas as DbRecord[]);
  const lineTag = kind === "credit-note" ? "cac:CreditNoteLine" : "cac:DebitNoteLine";
  const qtyTag = kind === "credit-note" ? "cbc:CreditedQuantity" : "cbc:DebitedQuantity";
  const totalTag = kind === "credit-note" ? "cac:LegalMonetaryTotal" : "cac:RequestedMonetaryTotal";
  const legendXml = legends.map((l) => `\n  <sac:AdditionalInformation>\n    <sac:AdditionalProperty>\n      <cbc:ID>${escapeXml(l.code)}</cbc:ID>\n      <cbc:Value>${escapeXml(l.value)}</cbc:Value>\n    </sac:AdditionalProperty>\n  </sac:AdditionalInformation>`).join("");
  const linesXml = items.map((item, index) => `
  <${lineTag}>
    <cbc:ID>${index + 1}</cbc:ID>
    <${qtyTag} unitCode="${escapeXml(item.unidad || "NIU")}">${formatAmount(item.cantidad, 2)}</${qtyTag}>
    <cbc:LineExtensionAmount currencyID="PEN">${formatAmount(item.mto_valor_venta)}</cbc:LineExtensionAmount>
    <cac:PricingReference><cac:AlternativeConditionPrice><cbc:PriceAmount currencyID="PEN">${formatAmount(item.mto_precio_unitario, 6)}</cbc:PriceAmount><cbc:PriceTypeCode>01</cbc:PriceTypeCode></cac:AlternativeConditionPrice></cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${formatAmount(item.total_impuestos)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="PEN">${formatAmount(item.mto_base_igv)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="PEN">${formatAmount(item.igv)}</cbc:TaxAmount>
        <cac:TaxCategory><cbc:Percent>${formatAmount(item.porcentaje_igv, 2)}</cbc:Percent><cbc:TaxExemptionReasonCode>${escapeXml(item.tip_afe_igv)}</cbc:TaxExemptionReasonCode><cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item><cbc:Description>${escapeXml(item.descripcion)}</cbc:Description><cac:SellersItemIdentification><cbc:ID>${escapeXml(item.codigo || "")}</cbc:ID></cac:SellersItemIdentification></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="PEN">${formatAmount(item.mto_valor_unitario, 6)}</cbc:PriceAmount></cac:Price>
  </${lineTag}>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} ${ns}>
  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(document.serie)}-${escapeXml(document.correlativo)}</cbc:ID>
  <cbc:IssueDate>${escapeXml(document.fecha_emision)}</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>${escapeXml(document.moneda || "PEN")}</cbc:DocumentCurrencyCode>${legendXml}
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>${escapeXml(document.num_doc_afectado)}</cbc:ReferenceID>
    <cbc:ResponseCode>${escapeXml(document.cod_motivo)}</cbc:ResponseCode>
    <cbc:Description>${escapeXml(document.des_motivo)}</cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${escapeXml(document.num_doc_afectado)}</cbc:ID><cbc:DocumentTypeCode>${escapeXml(document.tipo_doc_afectado || "01")}</cbc:DocumentTypeCode></cac:InvoiceDocumentReference></cac:BillingReference>
  <cac:Signature>
    <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
    <cac:SignatoryParty><cac:PartyIdentification><cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${escapeXml(credentials.razon_social)}</cbc:Name></cac:PartyName></cac:SignatoryParty>
    <cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#SignatureSP</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${escapeXml(credentials.ruc)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(credentials.razon_social)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cbc:CustomerAssignedAccountID>${escapeXml(customer.numero_documento)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>${escapeXml(customer.tipo_documento)}</cbc:AdditionalAccountID>
    <cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(customer.razon_social)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${formatAmount(document.total_impuestos)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${formatAmount(document.mto_oper_gravadas)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${formatAmount(document.mto_igv)}</cbc:TaxAmount>
      <cac:TaxCategory><cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <${totalTag}><cbc:PayableAmount currencyID="PEN">${formatAmount(document.mto_imp_venta)}</cbc:PayableAmount></${totalTag}>${linesXml}
</${rootTag}>`;
}

function buildSummaryXml(document: DbRecord, credentials: DbRecord): string {
  const summaryId = `RC-${String(document.fecha_resumen || "").replaceAll("-", "")}-${escapeXml(document.correlativo)}`;
  const details = ensureArray(document.detalles as DbRecord[]);
  const linesXml = details.map((detail, index) => `
  <sac:SummaryDocumentsLine>
    <cbc:LineID>${index + 1}</cbc:LineID>
    <cbc:DocumentTypeCode>${escapeXml(detail.tipo_documento)}</cbc:DocumentTypeCode>
    <cbc:ID>${escapeXml(detail.serie_numero)}</cbc:ID>
    <cac:AccountingCustomerParty>
      <cbc:CustomerAssignedAccountID>${escapeXml(detail.cliente_numero)}</cbc:CustomerAssignedAccountID>
      <cbc:AdditionalAccountID>${escapeXml(detail.cliente_tipo)}</cbc:AdditionalAccountID>
    </cac:AccountingCustomerParty>
    <cac:Status><cbc:ConditionCode>${escapeXml(detail.estado || "1")}</cbc:ConditionCode></cac:Status>
    <sac:TotalAmount currencyID="PEN">${formatAmount(detail.total)}</sac:TotalAmount>
    <sac:BillingPayment><cbc:PaidAmount currencyID="PEN">${formatAmount(detail.mto_oper_gravadas)}</cbc:PaidAmount><cbc:InstructionID>01</cbc:InstructionID></sac:BillingPayment>
    <sac:BillingPayment><cbc:PaidAmount currencyID="PEN">${formatAmount(detail.mto_oper_exoneradas)}</cbc:PaidAmount><cbc:InstructionID>02</cbc:InstructionID></sac:BillingPayment>
    <sac:BillingPayment><cbc:PaidAmount currencyID="PEN">${formatAmount(detail.mto_oper_inafectas)}</cbc:PaidAmount><cbc:InstructionID>03</cbc:InstructionID></sac:BillingPayment>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${formatAmount(detail.mto_igv)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxAmount currencyID="PEN">${formatAmount(detail.mto_igv)}</cbc:TaxAmount>
        <cac:TaxCategory><cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </sac:SummaryDocumentsLine>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<SummaryDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.1</cbc:CustomizationID>
  <cbc:ID>${summaryId}</cbc:ID>
  <cbc:ReferenceDate>${escapeXml(document.fecha_resumen)}</cbc:ReferenceDate>
  <cbc:IssueDate>${escapeXml(document.fecha_generacion)}</cbc:IssueDate>
  <cac:Signature>
    <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
    <cac:SignatoryParty><cac:PartyIdentification><cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${escapeXml(credentials.razon_social)}</cbc:Name></cac:PartyName></cac:SignatoryParty>
    <cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#SignatureSP</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${escapeXml(credentials.ruc)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(credentials.razon_social)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>
  </cac:AccountingSupplierParty>${linesXml}
</SummaryDocuments>`;
}

function buildVoidedXml(document: DbRecord, credentials: DbRecord): string {
  const voidedId = `RA-${String(document.fecha_referencia || "").replaceAll("-", "")}-${escapeXml(document.correlativo)}`;
  const details = ensureArray(document.detalles as DbRecord[]);
  const linesXml = details.map((detail, index) => `
  <sac:VoidedDocumentsLine>
    <cbc:LineID>${index + 1}</cbc:LineID>
    <cbc:DocumentTypeCode>${escapeXml(detail.tipo_documento)}</cbc:DocumentTypeCode>
    <sac:DocumentSerialID>${escapeXml(detail.serie)}</sac:DocumentSerialID>
    <sac:DocumentNumberID>${escapeXml(detail.correlativo)}</sac:DocumentNumberID>
    <sac:VoidReasonDescription>${escapeXml(detail.motivo_especifico || detail.motivo_baja || "ERROR EN EMISION")}</sac:VoidReasonDescription>
  </sac:VoidedDocumentsLine>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<VoidedDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.0</cbc:CustomizationID>
  <cbc:ID>${voidedId}</cbc:ID>
  <cbc:ReferenceDate>${escapeXml(document.fecha_referencia)}</cbc:ReferenceDate>
  <cbc:IssueDate>${escapeXml(document.fecha_emision)}</cbc:IssueDate>
  <cac:Signature>
    <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
    <cac:SignatoryParty><cac:PartyIdentification><cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${escapeXml(credentials.razon_social)}</cbc:Name></cac:PartyName></cac:SignatoryParty>
    <cac:DigitalSignatureAttachment><cac:ExternalReference><cbc:URI>#SignatureSP</cbc:URI></cac:ExternalReference></cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${escapeXml(credentials.ruc)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(credentials.razon_social)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>
  </cac:AccountingSupplierParty>${linesXml}
</VoidedDocuments>`;
}

function buildProbeXml(credentials: SunatCredentials): string {
  const ruc = String(credentials.ruc || "");
  const issueDate = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>TEST-1</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyIdentification><cbc:ID schemeID="6">${ruc}</cbc:ID></cac:PartyIdentification></cac:Party></cac:AccountingSupplierParty>
</Invoice>`;
}

function buildFileBasename(credentials: SunatCredentials, document: DbRecord): string {
  return `${String(credentials.ruc || "")}-${String(document.tipo_documento || "")}-${String(document.serie || "")}-${String(document.correlativo || "")}`;
}

function buildAsyncFileBasename(credentials: SunatCredentials, document: DbRecord, prefix: "RC" | "RA"): string {
  const date = String(document.fecha_resumen || document.fecha_referencia || document.fecha_emision || "").replaceAll("-", "");
  return `${String(credentials.ruc || "")}-${prefix}-${date}-${String(document.correlativo || "")}`;
}

const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const DECENAS = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const ESPECIALES: Record<string, string> = { "10": "DIEZ", "11": "ONCE", "12": "DOCE", "13": "TRECE", "14": "CATORCE", "15": "QUINCE", "16": "DIECISEIS", "17": "DIECISIETE", "18": "DIECIOCHO", "19": "DIECINUEVE", "20": "VEINTE", "21": "VEINTIUNO", "22": "VEINTIDOS", "23": "VEINTITRES", "24": "VEINTICUATRO", "25": "VEINTICINCO", "26": "VEINTISEIS", "27": "VEINTISIETE", "28": "VEINTIOCHO", "29": "VEINTINUEVE" };
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function decenas(n: number): string {
  const key = String(n);
  if (ESPECIALES[key]) return ESPECIALES[key];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function centenas(n: number): string {
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${decenas(resto)}`;
}

function miles(n: number): string {
  if (n === 0) return "";
  if (n < 10) { const prefix = n === 1 ? "" : UNIDADES[n]; return `${prefix} MIL`; }
  const m = Math.floor(n / 1000);
  const resto = n % 1000;
  if (m < 10) { const prefix = m === 1 ? "" : UNIDADES[m]; return resto === 0 ? `${prefix} MIL` : `${prefix} MIL ${centenas(resto)}`; }
  return resto === 0 ? `${centenas(m)} MIL` : `${centenas(m)} MIL ${centenas(resto)}`;
}

function millones(n: number): string {
  if (n === 0) return "";
  const mm = Math.floor(n / 1000000);
  const resto = n % 1000000;
  if (mm < 10) {
    const sp = mm === 1 ? "UN MILLON" : `${UNIDADES[mm]} MILLONES`;
    return resto === 0 ? sp : `${sp} ${miles(resto) || centenas(resto)}`;
  }
  const literal = `${centenas(mm)} MILLONES`;
  return resto === 0 ? literal : `${literal} ${miles(resto) || centenas(resto)}`;
}

function numeroALetras(n: number): string {
  if (n === 0) return "CERO";
  const entero = Math.floor(n);
  const centavos = Math.round((n - entero) * 100);
  let texto = "";
  if (entero >= 1000000) texto = millones(entero);
  else if (entero >= 1000) texto = miles(entero);
  else if (entero >= 100) texto = centenas(entero);
  else texto = decenas(entero);
  return `${texto} CON ${String(centavos).padStart(2, "0")}/100 SOLES`;
}

function transformInvoiceToSunat(invoice: DbRecord, items: DbRecord[], customer: DbRecord) {
  const invoiceType = invoice.invoice_type as string;
  const sunatTypeCode = INVOICE_TYPE_MAP[invoiceType];
  if (!sunatTypeCode) throw new Error(`Tipo no soportado: ${invoiceType}`);
  const sunatDocCode = DOC_TYPE_MAP[customer.document_type as string] || "0";
  const gravada = centsToDecimal(invoice.gravada_cents as number);
  const exonerada = centsToDecimal(invoice.exonerada_cents as number);
  const inafecta = centsToDecimal(invoice.inafecta_cents as number);
  const exportacion = centsToDecimal(invoice.exportacion_cents as number);
  const igv = centsToDecimal(invoice.igv_cents as number);
  const total = centsToDecimal(invoice.total_cents as number);
  const valorVenta = gravada + exonerada + inafecta;
  const formaPago = (invoice.payment_method as string) === "credit" ? "Credito" : "Contado";
  const isExport = invoiceType === "factura" && exportacion > 0 && gravada === 0 && exonerada === 0;
  const detalles = items.map((item) => {
    const tipAfeIgv = TAX_AFFECTATION_MAP[item.tax_affectation as string] || "10";
    const qty = item.quantity as number;
    const valorVentaItem = centsToDecimal(item.line_total_cents as number);
    const igvItem = centsToDecimal(item.igv_cents as number);
    return {
      codigo: item.product_sku || item.product_id || "", unidad: "NIU",
      descripcion: item.product_name, cantidad: qty,
      mto_valor_unitario: centsToDecimal(item.unit_price_cents as number),
      mto_valor_venta: valorVentaItem,
      mto_base_igv: tipAfeIgv === "10" ? valorVentaItem : 0,
      porcentaje_igv: tipAfeIgv === "10" ? 18.0 : 0.0,
      igv: igvItem, tip_afe_igv: tipAfeIgv, total_impuestos: igvItem,
      mto_precio_unitario: qty > 0 ? Math.round(((valorVentaItem + igvItem) / qty) * 1000000) / 1000000 : 0,
    };
  });
  const client: DbRecord = { tipo_documento: sunatDocCode, numero_documento: customer.document_number, razon_social: customer.name };
  if (customer.address) client.direccion = customer.address;
  return {
    sunatTypeCode,
    document: {
      tipo_documento: sunatTypeCode, serie: invoice.serie, correlativo: invoice.correlativo,
      fecha_emision: invoice.issue_date, tipo_operacion: isExport ? "0200" : "0101",
      moneda: "PEN", forma_pago_tipo: formaPago, client,
      mto_oper_gravadas: gravada, mto_oper_exoneradas: exonerada, mto_oper_inafectas: inafecta,
      mto_igv: igv, total_impuestos: igv, valor_venta: isExport ? exportacion : valorVenta,
      sub_total: isExport ? exportacion : valorVenta, mto_imp_venta: total,
      detalles, leyendas: [{ code: "1000", value: numeroALetras(total) }],
    } as DbRecord,
  };
}

function buildNoteDocument(invoice: DbRecord, items: DbRecord[], customer: DbRecord, body: DbRecord) {
  const invoiceType = invoice.invoice_type as string;
  const sunatTypeCode = INVOICE_TYPE_MAP[invoiceType];
  const sunatDocCode = DOC_TYPE_MAP[customer.document_type as string] || "0";
  const gravada = centsToDecimal(invoice.gravada_cents as number);
  const exonerada = centsToDecimal(invoice.exonerada_cents as number);
  const inafecta = centsToDecimal(invoice.inafecta_cents as number);
  const igv = centsToDecimal(invoice.igv_cents as number);
  const total = centsToDecimal(invoice.total_cents as number);
  const detalles = items.map((item) => {
    const tipAfeIgv = TAX_AFFECTATION_MAP[item.tax_affectation as string] || "10";
    const qty = item.quantity as number;
    const valorVentaItem = centsToDecimal(item.line_total_cents as number);
    const igvItem = centsToDecimal(item.igv_cents as number);
    return {
      codigo: item.product_sku || item.product_id || "", unidad: "NIU",
      descripcion: item.product_name, cantidad: qty,
      mto_valor_unitario: centsToDecimal(item.unit_price_cents as number),
      mto_valor_venta: valorVentaItem,
      mto_base_igv: tipAfeIgv === "10" ? valorVentaItem : 0,
      porcentaje_igv: tipAfeIgv === "10" ? 18.0 : 0.0,
      igv: igvItem, tip_afe_igv: tipAfeIgv, total_impuestos: igvItem,
      mto_precio_unitario: qty > 0 ? Math.round(((valorVentaItem + igvItem) / qty) * 1000000) / 1000000 : 0,
    };
  });
  return {
    tipo_documento: sunatTypeCode, serie: invoice.serie, correlativo: invoice.correlativo,
    fecha_emision: invoice.issue_date,
    tipo_doc_afectado: (body.tipo_doc_afectado as string) || "01",
    num_doc_afectado: (body.num_doc_afectado as string) || invoice.number || `${invoice.serie}-${invoice.correlativo}`,
    cod_motivo: (body.cod_motivo as string) || "01",
    des_motivo: (body.des_motivo as string) || invoice.notes || "ANULACION DE LA OPERACION",
    moneda: "PEN",
    client: { tipo_documento: sunatDocCode, numero_documento: customer.document_number, razon_social: customer.name },
    mto_oper_gravadas: gravada, mto_oper_exoneradas: exonerada, mto_oper_inafectas: inafecta,
    mto_igv: igv, total_impuestos: igv, valor_venta: gravada + exonerada + inafecta,
    mto_imp_venta: total, detalles, leyendas: [{ code: "1000", value: numeroALetras(total) }],
  };
}

function buildSummaryDocument(boletas: DbRecord[], fecha: string, correlativo: number) {
  return {
    fecha_resumen: fecha, fecha_generacion: new Date().toISOString().split("T")[0],
    correlativo: String(correlativo),
    detalles: boletas.map((boleta) => {
      const customer = boleta.customer as DbRecord;
      return {
        tipo_documento: "03",
        serie_numero: `${boleta.serie}-${String(boleta.correlativo).padStart(6, "0")}`,
        estado: "1",
        cliente_tipo: DOC_TYPE_MAP[customer?.document_type as string] || "1",
        cliente_numero: customer?.document_number || "00000000",
        total: centsToDecimal(boleta.total_cents as number),
        mto_oper_gravadas: centsToDecimal(boleta.gravada_cents as number),
        mto_oper_exoneradas: centsToDecimal(boleta.exonerada_cents as number),
        mto_oper_inafectas: centsToDecimal(boleta.inafecta_cents as number),
        mto_igv: centsToDecimal(boleta.igv_cents as number),
      };
    }),
  };
}

function buildVoidedDocument(invoice: DbRecord, motivo: string, correlativo: number) {
  const tipoDoc = INVOICE_TYPE_MAP[invoice.invoice_type as string] || "01";
  return {
    correlativo: String(correlativo),
    fecha_referencia: invoice.issue_date,
    fecha_emision: new Date().toISOString().split("T")[0],
    motivo_baja: motivo,
    detalles: [{ tipo_documento: tipoDoc, serie: invoice.serie, correlativo: String(invoice.correlativo), motivo_especifico: motivo }],
  };
}

async function getConfig(supabase: SupabaseClientLike, orgId: string) {
  const { data } = await supabase.from("sunat_config").select("*").eq("organization_id", orgId).single();
  const config = data as DbRecord | null;
  if (!config) return { error: errorResponse("SUNAT no configurado", 422, "NO_CONFIG") };
  if (!config.is_configured) return { error: errorResponse("Configuracion SUNAT incompleta", 422, "CONFIG_INCOMPLETE") };
  if (!config.certificado_path) return { error: errorResponse("Falta certificado digital.", 422, "NO_CERTIFICATE") };
  const certExists = await verifyCertInStorage(supabase, config.certificado_path as string);
  if (!certExists) return { error: errorResponse("El certificado no se encuentra en Storage.", 422, "CERT_MISSING_STORAGE") };
  config.clave_sol = await tryDecrypt((config.clave_sol as string | null) ?? null);
  config.certificado_password = await tryDecrypt((config.certificado_password as string | null) ?? null);
  return { config, credentials: buildCredentialsFromConfig(config) };
}

async function updateSummaryLogStatus(supabase: SupabaseClientLike, summaryLogId: string | undefined, result: DbRecord) {
  if (!result.success || !summaryLogId) return;
  await (supabase.from("sunat_summary_log") as any).update({
    status: result.success ? "accepted" : "rejected",
    error_code: result.error_code || null, error_message: result.error_message || null,
  }).eq("id", summaryLogId);
}

async function handleTicketCheck(supabase: SupabaseClientLike, credentials: SunatCredentials, body: DbRecord, kind: "summary" | "voided") {
  const ticket = body.ticket as string;
  if (!ticket) return errorResponse("ticket is required");
  try {
    const result = await getStatus(ticket, credentials);
    await updateSummaryLogStatus(supabase, body.summary_log_id as string | undefined, result as unknown as DbRecord);
    return jsonResponse({ success: true, result });
  } catch (e) { return jsonResponse({ success: false, error_message: (e as Error).message }); }
}

async function handleSummary(supabase: SupabaseClientLike, orgId: string, credentials: SunatCredentials, body: DbRecord) {
  const fecha = body.fecha as string;
  if (!fecha) return errorResponse("fecha is required (YYYY-MM-DD)");
  const { data: boletas } = await supabase.from("invoices").select("id, serie, correlativo, total_cents, gravada_cents, exonerada_cents, inafecta_cents, igv_cents, customer:customers(document_type, document_number)").eq("organization_id", orgId).eq("invoice_type", "boleta").eq("issue_date", fecha).is("sunat_sent_at", null);
  if (!boletas || boletas.length === 0) return errorResponse("No hay boletas pendientes para esa fecha", 404, "NO_BOLETAS");
  const { count } = await supabase.from("sunat_summary_log").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("tipo", "resumen_diario").eq("fecha_referencia", fecha);
  const correlativo = (count || 0) + 1;
  const summaryDoc = buildSummaryDocument(boletas as DbRecord[], fecha, correlativo);
  try {
    const loaded = await loadP12FromStorage(supabase, credentials);
    const unsignedXml = buildSummaryXml(summaryDoc, credentials as unknown as DbRecord);
    const signed = await signXml(unsignedXml, loaded);
    const fileBasename = buildAsyncFileBasename(credentials, summaryDoc, "RC");
    const result = await sendSummarySoap({ fileBasename, xml: signed.signedXml }, credentials);
    const logStatus = result.success ? "processing" : "rejected";
    const { data: logEntry } = await (supabase.from("sunat_summary_log") as any).insert({
      organization_id: orgId, tipo: "resumen_diario", ticket: result.ticket || null,
      fecha_referencia: fecha, status: logStatus, error_code: result.errorCode || null, error_message: result.errorMessage || null,
    }).select().single();
    if (result.success && result.ticket) {
      const now = new Date().toISOString();
      for (const boleta of boletas as { id: string }[]) {
        await (supabase.from("invoices") as any).update({ sunat_ticket: result.ticket, sunat_sent_at: now, status: "issued" }).eq("id", boleta.id);
      }
    }
    return jsonResponse({ success: result.success, ticket: result.ticket || null, boletas_count: boletas.length, error_code: result.errorCode || null, error_message: result.errorMessage || null, log_id: (logEntry as DbRecord | null)?.id || null });
  } catch (e) { return jsonResponse({ success: false, error_message: mapCertError((e as Error).message) }); }
}

async function handleVoided(supabase: SupabaseClientLike, orgId: string, credentials: SunatCredentials, body: DbRecord) {
  const invoiceId = body.invoice_id as string;
  const motivo = (body.motivo as string) || "ERROR EN EMISION";
  if (!invoiceId) return errorResponse("invoice_id is required");
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).eq("organization_id", orgId).single();
  if (!invoice) return errorResponse("Invoice not found", 404);
  const invoiceRecord = invoice as DbRecord;
  const fecha = invoiceRecord.issue_date as string;
  const { count } = await supabase.from("sunat_summary_log").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("tipo", "comunicacion_baja").gte("created_at", new Date().toISOString().split("T")[0]);
  const correlativo = (count || 0) + 1;
  const voidedDoc = buildVoidedDocument(invoiceRecord, motivo, correlativo);
  try {
    const loaded = await loadP12FromStorage(supabase, credentials);
    const unsignedXml = buildVoidedXml(voidedDoc, credentials as unknown as DbRecord);
    const signed = await signXml(unsignedXml, loaded);
    const fileBasename = buildAsyncFileBasename(credentials, voidedDoc, "RA");
    const result = await sendSummarySoap({ fileBasename, xml: signed.signedXml }, credentials);
    const logStatus = result.success ? "processing" : "rejected";
    const { data: logEntry } = await (supabase.from("sunat_summary_log") as any).insert({
      organization_id: orgId, tipo: "comunicacion_baja", ticket: result.ticket || null,
      fecha_referencia: fecha, status: logStatus, error_code: result.errorCode || null, error_message: result.errorMessage || null,
    }).select().single();
    if (result.success) {
      await (supabase.from("invoices") as any).update({ status: "cancelled", sunat_ticket: result.ticket || null }).eq("id", invoiceId);
    }
    return jsonResponse({ success: result.success, ticket: result.ticket || null, error_code: result.errorCode || null, error_message: result.errorMessage || null, log_id: (logEntry as DbRecord | null)?.id || null });
  } catch (e) { return jsonResponse({ success: false, error_message: mapCertError((e as Error).message) }); }
}

async function handleSend(supabase: SupabaseClientLike, orgId: string, credentials: SunatCredentials, body: DbRecord) {
  const invoiceId = body.invoice_id as string;
  if (!invoiceId) return errorResponse("invoice_id is required");
  const { data: invoice, error: invErr } = await supabase.from("invoices").select("*").eq("id", invoiceId).eq("organization_id", orgId).single();
  if (invErr || !invoice) return errorResponse("Invoice not found", 404);
  const invoiceRecord = invoice as DbRecord;
  if (invoiceRecord.status !== "issued") return errorResponse(`Invoice status '${invoiceRecord.status}', must be 'issued'`, 422, "INVALID_STATUS");
  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId);
  if (!items || items.length === 0) return errorResponse("Invoice has no items", 422, "NO_ITEMS");
  const { data: customer } = await supabase.from("customers").select("*").eq("id", invoiceRecord.customer_id).single();
  const customerRecord = customer as DbRecord | null;
  if (!customerRecord) return errorResponse("Customer not found", 404, "NO_CUSTOMER");
  if (invoiceRecord.invoice_type === "factura" && customerRecord.document_type !== "RUC") return errorResponse("Factura requiere cliente con RUC", 422, "INVALID_DOC_TYPE");
  let result: DbRecord;
  try {
    const loaded = await loadP12FromStorage(supabase, credentials);
    const invoiceType = invoiceRecord.invoice_type as string;
    let unsignedXml: string;
    let fileBasename: string;
    if (invoiceType === "nota_credito" || invoiceType === "nota_debito") {
      const noteDocument = buildNoteDocument(invoiceRecord, items as DbRecord[], customerRecord, body);
      unsignedXml = buildNoteXml(noteDocument, credentials as unknown as DbRecord, invoiceType === "nota_credito" ? "credit-note" : "debit-note");
      fileBasename = buildFileBasename(credentials, noteDocument);
    } else {
      const transformed = transformInvoiceToSunat(invoiceRecord, items as DbRecord[], customerRecord);
      unsignedXml = buildInvoiceXml(transformed.document, credentials as unknown as DbRecord);
      fileBasename = buildFileBasename(credentials, transformed.document);
    }
    const signed = await signXml(unsignedXml, loaded);
    const soapResult = await sendBill({ fileBasename, xml: signed.signedXml }, credentials);
    if (!soapResult.success) {
      result = { success: false, error_code: soapResult.errorCode || soapResult.statusCode || "SOAP_ERROR", error_message: soapResult.errorMessage || soapResult.statusMessage || "Error enviando a SUNAT.", xml: signed.signedXml } as DbRecord;
    } else {
      result = { success: true, hash: signed.digestValue, xml: signed.signedXml, cdr_zip: soapResult.cdrZip ? btoa(String.fromCharCode(...soapResult.cdrZip)) : null, result: { mode: "direct-deno-phase-2", digest_value: signed.digestValue, certificate_subject: loaded.subjectName, status_code: soapResult.statusCode, status_message: soapResult.statusMessage, status_notes: soapResult.statusNotes || [] } } as DbRecord;
    }
  } catch (e) {
    await (supabase.from("invoices") as any).update({ sunat_error_code: "CALL_FAILED", sunat_error_message: (e as Error).message, sunat_sent_at: new Date().toISOString() }).eq("id", invoiceId);
    return jsonResponse({ success: false, error_message: mapCertError((e as Error).message) });
  }
  const isSuccess = result.success === true;
  const now = new Date().toISOString();
  const updateData: DbRecord = { sunat_sent_at: now, sunat_error_code: null, sunat_error_message: null };
  if (isSuccess) {
    updateData.sunat_hash = result.hash || null;
    updateData.sunat_accepted_at = now;
    updateData.status = "accepted";
    if (result.xml) {
      const xmlPath = `${orgId}/${(invoice.issue_date as string)?.substring(0, 7) || "unknown"}/${invoiceRecord.serie}-${invoiceRecord.correlativo}.xml`;
      const xmlBytes = new TextEncoder().encode(result.xml as string);
      const { error: xmlErr } = await supabase.storage.from("sunat-documents").upload(xmlPath, xmlBytes, { contentType: "application/xml", upsert: true });
      if (!xmlErr) updateData.sunat_xml_path = xmlPath;
    }
    if (result.cdr_zip) {
      const cdrPath = `${orgId}/${(invoice.issue_date as string)?.substring(0, 7) || "unknown"}/${invoiceRecord.serie}-${invoiceRecord.correlativo}-cdr.zip`;
      const cdrBytes = Uint8Array.from(atob(result.cdr_zip as string), (c) => c.charCodeAt(0));
      const { error: cdrErr } = await supabase.storage.from("sunat-documents").upload(cdrPath, cdrBytes, { contentType: "application/zip", upsert: true });
      if (!cdrErr) updateData.sunat_cdr_path = cdrPath;
    }
    if (result.ticket) updateData.sunat_ticket = result.ticket;
  } else {
    updateData.sunat_error_code = result.error_code || "UNKNOWN";
    updateData.sunat_error_message = mapCertError((result.error_message as string) || "Error desconocido");
  }
  await (supabase.from("invoices") as any).update(updateData).eq("id", invoiceId);
  return jsonResponse({ success: isSuccess, hash: result.hash || null, ticket: result.ticket || null, error_code: result.error_code || null, error_message: updateData.sunat_error_message as string || null, xml_path: updateData.sunat_xml_path || null, cdr_path: updateData.sunat_cdr_path || null });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);
  let body: DbRecord;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON", 400); }
  const action = body.action as string;
  if (!action || !VALID_ACTIONS.includes(action)) return errorResponse(`Invalid action. Use: ${VALID_ACTIONS.join(", ")}`);
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const auth = await resolveAuth(req, supabase);
  if (auth.error) return auth.error;
  const cfg = await getConfig(supabase as SupabaseClientLike, String(auth.orgId!));
  if (cfg.error) return cfg.error;
  const orgId = String(auth.orgId!);
  const credentials = cfg.credentials as SunatCredentials;

  if (action === "test") {
    try {
      const loaded = await loadP12FromStorage(supabase, credentials);
      const probeXml = buildProbeXml(credentials);
      const signed = await signXml(probeXml, loaded);
      return jsonResponse({ success: true, result: { mode: "direct-deno", certificate_subject: loaded.subjectName, certificate_issuer: loaded.issuerName, certificate_not_after: loaded.notAfter, digest_value: signed.digestValue, signature_length: signed.signatureValue.length } });
    } catch (e) { return jsonResponse({ success: false, error_message: mapCertError((e as Error).message) }); }
  }

  if (action === "check-ticket") return handleTicketCheck(supabase, credentials, body, "voided");
  if (action === "check-summary-ticket") return handleTicketCheck(supabase, credentials, body, "summary");
  if (action === "send-summary") return handleSummary(supabase, orgId, credentials, body);
  if (action === "send-voided") return handleVoided(supabase, orgId, credentials, body);
  if (action === "send") return handleSend(supabase, orgId, credentials, body);
  return errorResponse("Unhandled action", 500);
});
