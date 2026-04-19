import { escapeXml } from "../xml/helpers.ts";

export function buildUsernameToken(username: string, password: string): string {
  return `<soapenv:Header>
  <wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <wsse:UsernameToken>
      <wsse:Username>${escapeXml(username)}</wsse:Username>
      <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${
    escapeXml(password)
  }</wsse:Password>
    </wsse:UsernameToken>
  </wsse:Security>
</soapenv:Header>`;
}

export function buildSendBillEnvelope(
  username: string,
  password: string,
  fileName: string,
  contentBase64: string,
): string {
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

export function buildSendSummaryEnvelope(
  username: string,
  password: string,
  fileName: string,
  contentBase64: string,
): string {
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

export function buildGetStatusEnvelope(
  username: string,
  password: string,
  ticket: string,
): string {
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
