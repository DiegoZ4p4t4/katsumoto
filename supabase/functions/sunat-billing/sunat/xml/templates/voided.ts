import type { DbRecord } from "../../types.ts";
import { ensureArray, escapeXml } from "../helpers.ts";

function buildVoidedLines(details: DbRecord[]): string {
  return ensureArray(details).map((detail, index) => `
  <sac:VoidedDocumentsLine>
    <cbc:LineID>${index + 1}</cbc:LineID>
    <cbc:DocumentTypeCode>${
    escapeXml(detail.tipo_documento)
  }</cbc:DocumentTypeCode>
    <sac:DocumentSerialID>${escapeXml(detail.serie)}</sac:DocumentSerialID>
    <sac:DocumentNumberID>${
    escapeXml(detail.correlativo)
  }</sac:DocumentNumberID>
    <sac:VoidReasonDescription>${
    escapeXml(
      detail.motivo_especifico || detail.motivo_baja || "ERROR EN EMISION",
    )
  }</sac:VoidReasonDescription>
  </sac:VoidedDocumentsLine>`).join("");
}

export function buildVoidedXml(
  document: DbRecord,
  credentials: DbRecord,
): string {
  const voidedId = `RA-${
    String(document.fecha_referencia || "").replaceAll("-", "")
  }-${escapeXml(document.correlativo)}`;
  const details = ensureArray(document.detalles as DbRecord[]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<VoidedDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.0</cbc:CustomizationID>
  <cbc:ID>${voidedId}</cbc:ID>
  <cbc:ReferenceDate>${escapeXml(document.fecha_referencia)}</cbc:ReferenceDate>
  <cbc:IssueDate>${escapeXml(document.fecha_emision)}</cbc:IssueDate>
  <cac:Signature>
    <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(credentials.razon_social)}</cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignatureSP</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${
    escapeXml(credentials.ruc)
  }</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${
    escapeXml(credentials.razon_social)
  }</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>${buildVoidedLines(details)}
</VoidedDocuments>`;
}
