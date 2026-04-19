import type { DbRecord } from "../../types.ts";
import { ensureArray, escapeXml, formatAmount } from "../helpers.ts";

function buildSummaryLines(details: DbRecord[]): string {
  return ensureArray(details).map((detail, index) => {
    let line = `
  <sac:SummaryDocumentsLine>
    <cbc:LineID>${index + 1}</cbc:LineID>
    <cbc:DocumentTypeCode>${
    escapeXml(detail.tipo_documento)
  }</cbc:DocumentTypeCode>
    <cbc:ID>${escapeXml(detail.serie_numero)}</cbc:ID>
    <cac:AccountingCustomerParty>
      <cbc:CustomerAssignedAccountID>${
    escapeXml(detail.cliente_numero)
  }</cbc:CustomerAssignedAccountID>
      <cbc:AdditionalAccountID>${
    escapeXml(detail.cliente_tipo)
  }</cbc:AdditionalAccountID>
    </cac:AccountingCustomerParty>
    <cac:Status>
      <cbc:ConditionCode>${escapeXml(detail.estado || "1")}</cbc:ConditionCode>
    </cac:Status>`;

    if (detail.ref_tipo_documento && detail.ref_serie_numero) {
      line += `
    <cac:BillingReference>
      <cac:InvoiceDocumentReference>
        <cbc:ID>${escapeXml(detail.ref_serie_numero)}</cbc:ID>
        <cbc:DocumentTypeCode>${escapeXml(detail.ref_tipo_documento)}</cbc:DocumentTypeCode>
      </cac:InvoiceDocumentReference>
    </cac:BillingReference>`;
    }

    line += `
    <sac:TotalAmount currencyID="PEN">${
    formatAmount(detail.total)
  }</sac:TotalAmount>
    <sac:BillingPayment>
      <cbc:PaidAmount currencyID="PEN">${
    formatAmount(detail.mto_oper_gravadas)
  }</cbc:PaidAmount>
      <cbc:InstructionID>01</cbc:InstructionID>
    </sac:BillingPayment>
    <sac:BillingPayment>
      <cbc:PaidAmount currencyID="PEN">${
    formatAmount(detail.mto_oper_exoneradas)
  }</cbc:PaidAmount>
      <cbc:InstructionID>02</cbc:InstructionID>
    </sac:BillingPayment>
    <sac:BillingPayment>
      <cbc:PaidAmount currencyID="PEN">${
    formatAmount(detail.mto_oper_inafectas)
  }</cbc:PaidAmount>
      <cbc:InstructionID>03</cbc:InstructionID>
    </sac:BillingPayment>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${
    formatAmount(detail.mto_igv)
  }</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxAmount currencyID="PEN">${
    formatAmount(detail.mto_igv)
  }</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>18.00</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </sac:SummaryDocumentsLine>`;
    return line;
  }).join("");
}

export function buildSummaryXml(
  document: DbRecord,
  credentials: DbRecord,
): string {
  const summaryId = `RC-${
    String(document.fecha_resumen || "").replaceAll("-", "")
  }-${escapeXml(document.correlativo)}`;
  const details = ensureArray(document.detalles as DbRecord[]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<SummaryDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.1</cbc:CustomizationID>
  <cbc:ID>${summaryId}</cbc:ID>
  <cbc:ReferenceDate>${escapeXml(document.fecha_resumen)}</cbc:ReferenceDate>
  <cbc:IssueDate>${escapeXml(document.fecha_generacion)}</cbc:IssueDate>
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
  </cac:AccountingSupplierParty>${buildSummaryLines(details)}
</SummaryDocuments>`;
}
