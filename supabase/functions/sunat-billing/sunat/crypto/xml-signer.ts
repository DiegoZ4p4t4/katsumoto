import { encodeBase64 } from "jsr:@std/encoding/base64";

import type { LoadedCertificate } from "./certificate.ts";
import { canonicalizeXml } from "./c14n.ts";

export interface SignedXmlResult {
  signedXml: string;
  digestValue: string;
  signatureValue: string;
  certificateBase64: string;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return bytes.buffer;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function sha256Base64(content: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content),
  );
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
  while ((match = nsRegex.exec(attrs)) !== null) {
    nsList.push({ prefix: match[1] || "", uri: match[2] });
  }

  if (!nsList.some((ns) => ns.prefix === "ds")) {
    nsList.push({ prefix: "ds", uri: "http://www.w3.org/2000/09/xmldsig#" });
  }

  nsList.sort((a, b) => {
    if (a.prefix === "") return -1;
    if (b.prefix === "") return 1;
    return a.prefix.localeCompare(b.prefix);
  });

  return nsList
    .map((ns) =>
      ns.prefix ? `xmlns:${ns.prefix}="${ns.uri}"` : `xmlns="${ns.uri}"`
    )
    .join(" ");
}

function buildSignedInfoForSigning(
  digestValue: string,
  rootNamespaces: string,
): string {
  return `<ds:SignedInfo ${rootNamespaces}><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${
    escapeXml(digestValue)
  }</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
}

function buildSignatureXml(
  digestValue: string,
  signatureValue: string,
  certificateBase64: string,
): string {
  return `<ds:Signature Id="SignatureSP"><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${
    escapeXml(digestValue)
  }</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>${
    escapeXml(signatureValue)
  }</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>${certificateBase64}</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature>`;
}

function injectSignature(xml: string, signatureXml: string): string {
  if (xml.includes("<ext:ExtensionContent/>")) {
    return xml.replace(
      "<ext:ExtensionContent/>",
      `<ext:ExtensionContent>${signatureXml}</ext:ExtensionContent>`,
    );
  }

  if (xml.includes("<ext:ExtensionContent></ext:ExtensionContent>")) {
    return xml.replace(
      "<ext:ExtensionContent></ext:ExtensionContent>",
      `<ext:ExtensionContent>${signatureXml}</ext:ExtensionContent>`,
    );
  }

  throw new Error(
    "No se encontró `ext:ExtensionContent` en el XML para insertar la firma.",
  );
}

export async function signXml(
  xml: string,
  certificate: LoadedCertificate,
): Promise<SignedXmlResult> {
  const canonicalizedDoc = canonicalizeXml(xml);
  const digestValue = await sha256Base64(canonicalizedDoc);

  const rootNamespaces = extractRootNamespaces(xml);
  const signedInfo = buildSignedInfoForSigning(digestValue, rootNamespaces);
  const canonicalizedSignedInfo = canonicalizeXml(signedInfo);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(certificate.privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(canonicalizedSignedInfo),
  );

  const signatureValue = encodeBase64(new Uint8Array(signature));
  const certificateBase64 = encodeBase64(certificate.certificateDer);
  const signatureXml = buildSignatureXml(
    digestValue,
    signatureValue,
    certificateBase64,
  );

  return {
    signedXml: injectSignature(xml, signatureXml),
    digestValue,
    signatureValue,
    certificateBase64,
  };
}
