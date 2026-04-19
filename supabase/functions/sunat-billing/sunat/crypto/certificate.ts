import { encodeBase64 } from "jsr:@std/encoding/base64";

import type { SunatCredentials, SupabaseClientLike } from "../types.ts";

export interface LoadedCertificate {
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
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/[\s\r\n]/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseDnFromAsn1(der: Uint8Array): {
  subjectName: string;
  issuerName: string;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
} {
  const tbsOffset = findTbsCertificate(der);
  const tbsBytes = der.slice(tbsOffset.start, tbsOffset.end);

  let serialNumber = "";
  let subjectName = "";
  let issuerName = "";
  let notBefore = "";
  let notAfter = "";

  try {
    const serialEnd = findNextTag(tbsBytes, 0x02, 0);
    if (serialEnd.found) {
      const serialBytes = tbsBytes.slice(serialEnd.valueStart, serialEnd.valueEnd);
      serialNumber = Array.from(serialBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    const issuerSeq = findNextTag(tbsBytes, 0x30, serialEnd.nextPos || 0);
    if (issuerSeq.found) {
      issuerName = parseRdnSequence(tbsBytes, issuerSeq.valueStart, issuerSeq.valueEnd);
    }

    const validitySeq = findNextTag(tbsBytes, 0x30, issuerSeq.nextPos || 0);
    if (validitySeq.found) {
      const dates = parseValidity(tbsBytes, validitySeq.valueStart, validitySeq.valueEnd);
      notBefore = dates.notBefore;
      notAfter = dates.notAfter;
    }

    const subjectSeq = findNextTag(tbsBytes, 0x30, validitySeq.nextPos || 0);
    if (subjectSeq.found) {
      subjectName = parseRdnSequence(tbsBytes, subjectSeq.valueStart, subjectSeq.valueEnd);
    }
  } catch {}

  return { subjectName, issuerName, serialNumber, notBefore, notAfter };
}

function findTbsCertificate(der: Uint8Array): { start: number; end: number } {
  let pos = 0;
  if (der[pos] !== 0x30) return { start: 0, end: der.length };
  pos++;
  const outerLen = readLength(der, pos);
  pos = outerLen.nextPos;

  if (der[pos] === 0xa0) {
    pos++;
    const explLen = readLength(der, pos);
    pos = explLen.nextPos;
  }

  if (der[pos] !== 0x30) return { start: 0, end: der.length };
  const tbsStart = pos;
  pos++;
  const tbsLen = readLength(der, pos);
  return { start: tbsStart, end: tbsLen.nextPos + tbsLen.length };
}

function readLength(buf: Uint8Array, offset: number): { length: number; nextPos: number } {
  const first = buf[offset];
  if (first < 0x80) return { length: first, nextPos: offset + 1 };
  const numBytes = first & 0x7f;
  let len = 0;
  for (let i = 0; i < numBytes; i++) len = (len << 8) | buf[offset + 1 + i];
  return { length: len, nextPos: offset + 1 + numBytes };
}

function findNextTag(
  buf: Uint8Array,
  tag: number,
  startPos: number,
): { found: boolean; valueStart: number; valueEnd: number; nextPos: number } {
  let pos = startPos;
  while (pos < buf.length) {
    if (buf[pos] === tag) {
      pos++;
      const len = readLength(buf, pos);
      return {
        found: true,
        valueStart: len.nextPos,
        valueEnd: len.nextPos + len.length,
        nextPos: len.nextPos + len.length,
      };
    }
    pos++;
    const len = readLength(buf, pos);
    pos = len.nextPos + len.length;
  }
  return { found: false, valueStart: 0, valueEnd: 0, nextPos: startPos };
}

const OID_MAP: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "1.2.840.113549.1.9.1": "E",
};

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
              const vt = buf[pos];
              pos++;
              const valLen = readLength(buf, pos);
              const val = new TextDecoder().decode(buf.slice(valLen.nextPos, valLen.nextPos + valLen.length));
              pos = valLen.nextPos + valLen.length;
              const prefix = OID_MAP[oid] || oid;
              parts.push(`${prefix}=${val}`);
            } else {
              pos = seqEnd;
            }
          } else {
            pos = seqEnd;
          }
        } else {
          pos++;
          const l = readLength(buf, pos);
          pos = l.nextPos + l.length;
        }
      }
    } else {
      pos++;
      const l = readLength(buf, pos);
      pos = l.nextPos + l.length;
    }
  }
  return parts.join(", ");
}

function decodeOid(bytes: Uint8Array): string {
  let s = String(bytes[0] / 40) + "." + String(bytes[0] % 40);
  let n = 0;
  for (let i = 1; i < bytes.length; i++) {
    n = (n << 7) | (bytes[i] & 0x7f);
    if (!(bytes[i] & 0x80)) {
      s += "." + n;
      n = 0;
    }
  }
  return s;
}

function parseValidity(buf: Uint8Array, start: number, end: number): { notBefore: string; notAfter: string } {
  let notBefore = "";
  let notAfter = "";
  let pos = start;
  while (pos < end) {
    const tag = buf[pos];
    if (tag === 0x17 || tag === 0x18) {
      pos++;
      const len = readLength(buf, pos);
      const val = new TextDecoder().decode(buf.slice(len.nextPos, len.nextPos + len.length));
      if (!notBefore) notBefore = formatTime(val);
      else notAfter = formatTime(val);
      pos = len.nextPos + len.length;
    } else {
      pos++;
      const len = readLength(buf, pos);
      pos = len.nextPos + len.length;
    }
  }
  return { notBefore, notAfter };
}

function formatTime(s: string): string {
  try {
    if (s.length === 13) {
      const y = parseInt(s.substring(0, 2));
      const fullYear = y >= 50 ? 1900 + y : 2000 + y;
      const d = new Date(
        fullYear,
        parseInt(s.substring(2, 4)) - 1,
        parseInt(s.substring(4, 6)),
        parseInt(s.substring(6, 8)),
        parseInt(s.substring(8, 10)),
        parseInt(s.substring(10, 12)),
      );
      return d.toISOString();
    }
    return new Date(s).toISOString();
  } catch {
    return s;
  }
}

async function downloadText(
  supabase: SupabaseClientLike,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage.from("sunat-documents").download(path);
  if (error || !data) {
    throw new Error(`No se pudo descargar ${path}: ${error?.message || "not found"}`);
  }
  return await data.text();
}

async function downloadBinary(
  supabase: SupabaseClientLike,
  path: string,
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from("sunat-documents").download(path);
  if (error || !data) {
    throw new Error(`No se pudo descargar ${path}: ${error?.message || "not found"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}

export async function downloadCertificate(
  supabase: SupabaseClientLike,
  certPath: string,
): Promise<Uint8Array> {
  return downloadBinary(supabase, certPath);
}

export async function loadP12FromStorage(
  supabase: SupabaseClientLike,
  credentials: SunatCredentials,
): Promise<LoadedCertificate> {
  const basePath = String(credentials.certificado_path || "");
  if (!basePath) {
    throw new Error("No hay `certificado_path` configurado.");
  }

  const dir = basePath.substring(0, basePath.lastIndexOf("/"));

  const keyPemText = await downloadText(supabase, `${dir}/private_key.pem`);
  const certPemText = await downloadText(supabase, `${dir}/certificate.pem`);

  const privateKeyPem = extractFirstPemBlock(keyPemText, "PRIVATE KEY");
  if (!privateKeyPem) {
    throw new Error("No se encontró la clave privada en el archivo PEM.");
  }

  const certificatePem = extractFirstPemBlock(certPemText, "CERTIFICATE");
  if (!certificatePem) {
    throw new Error("No se encontró el certificado en el archivo PEM.");
  }

  const certDer = pemToDer(certificatePem);
  const p12Bytes = await downloadBinary(supabase, basePath).catch(() => certDer);

  const meta = parseDnFromAsn1(certDer);

  return {
    p12Der: p12Bytes,
    certificateDer: certDer,
    certificatePem,
    privateKeyPem,
    serialNumber: meta.serialNumber,
    issuerName: meta.issuerName,
    subjectName: meta.subjectName,
    notBefore: meta.notBefore,
    notAfter: meta.notAfter,
  };
}

export async function loadP12(
  _p12Bytes: Uint8Array,
  _password = "",
): Promise<LoadedCertificate> {
  throw new Error("loadP12 no soportado - use PEM files con loadP12FromStorage.");
}
