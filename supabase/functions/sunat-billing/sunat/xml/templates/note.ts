import type { DbRecord } from "../../types.ts";
import { ensureArray, escapeXml, formatAmount } from "../helpers.ts";

function buildNamespaces(kind: "credit-note" | "debit-note"): string {
  const xmlns = kind === "credit-note"
    ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
    : "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2";

  return [
    `xmlns="${xmlns}"`,
    'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
    'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"',
    'xmlns:ccts="urn:un:unece:uncefact:documentation:2"',
    'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"',
    'xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"',
    'xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"',
    'xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1"',
    'xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"',
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
  ].join(" ");
}

function buildLegendExtensionXml(legends: DbRecord[]): string {
  if (!legends || legends.length === 0) return "";
  const props = legends.map((legend) => `
      <sac:AdditionalProperty>
        <cbc:ID>${escapeXml(legend.code)}</cbc:ID>
        <cbc:Value>${escapeXml(legend.value)}</cbc:Value>
      </sac:AdditionalProperty>`).join("");
  return `
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sac:AdditionalInformation>${props}
        </sac:AdditionalInformation>
      </ext:ExtensionContent>
    </ext:UBLExtension>`;
}

function buildLineXml(
  kind: "credit-note" | "debit-note",
  items: DbRecord[],
): string {
  const lineTag = kind === "credit-note"
    ? "cac:CreditNoteLine"
    : "cac:DebitNoteLine";
  const qtyTag = kind === "credit-note"
    ? "cbc:CreditedQuantity"
    : "cbc:DebitedQuantity";

  return ensureArray(items).map((item, index) => `
  <${lineTag}>
    <cbc:ID>${index + 1}</cbc:ID>
    <${qtyTag} unitCode="${escapeXml(item.unidad || "NIU")}">${
    formatAmount(item.cantidad, 2)
  }</${qtyTag}>
    <cbc:LineExtensionAmount currencyID="PEN">${
    formatAmount(item.mto_valor_venta)
  }</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${
    formatAmount(item.mto_precio_unitario, 6)
  }</cbc:PriceAmount>
        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${
    formatAmount(item.total_impuestos)
  }</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="PEN">${
    formatAmount(item.mto_base_igv)
  }</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="PEN">${
    formatAmount(item.igv)
  }</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>${formatAmount(item.porcentaje_igv, 2)}</cbc:Percent>
          <cbc:TaxExemptionReasonCode>${
    escapeXml(item.tip_afe_igv)
  }</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${escapeXml(item.descripcion)}</cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${escapeXml(item.codigo || "")}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${
    formatAmount(item.mto_valor_unitario, 6)
  }</cbc:PriceAmount>
    </cac:Price>
  </${lineTag}>`).join("");
}

function buildMonetaryTotalXml(
  kind: "credit-note" | "debit-note",
  document: DbRecord,
): string {
  const totalTag = kind === "credit-note"
    ? "cac:LegalMonetaryTotal"
    : "cac:RequestedMonetaryTotal";

  return `
  <${totalTag}>
    <cbc:PayableAmount currencyID="PEN">${
    formatAmount(document.mto_imp_venta)
  }</cbc:PayableAmount>
  </${totalTag}>`;
}

export function buildNoteXml(
  document: DbRecord,
  credentials: DbRecord,
  kind: "credit-note" | "debit-note",
): string {
  const rootTag = kind === "credit-note" ? "CreditNote" : "DebitNote";
  const customer = (document.client as DbRecord) || {};
  const items = ensureArray(document.detalles as DbRecord[]);
  const legends = ensureArray(document.leyendas as DbRecord[]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} ${buildNamespaces(kind)}>
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>${buildLegendExtensionXml(legends)}
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(document.serie)}-${
    escapeXml(document.correlativo)
  }</cbc:ID>
  <cbc:IssueDate>${escapeXml(document.fecha_emision)}</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>${
    escapeXml(document.moneda || "PEN")
  }</cbc:DocumentCurrencyCode>
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>${escapeXml(document.num_doc_afectado)}</cbc:ReferenceID>
    <cbc:ResponseCode>${escapeXml(document.cod_motivo)}</cbc:ResponseCode>
    <cbc:Description>${escapeXml(document.des_motivo)}</cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${escapeXml(document.num_doc_afectado)}</cbc:ID>
      <cbc:DocumentTypeCode>${
    escapeXml(document.tipo_doc_afectado || "01")
  }</cbc:DocumentTypeCode>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
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
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${escapeXml(credentials.ruc)}</cbc:ID>
      </cac:PartyIdentification>${
    credentials.nombre_comercial
      ? `
      <cac:PartyName>
        <cbc:Name>${escapeXml(String(credentials.nombre_comercial))}</cbc:Name>
      </cac:PartyName>`
      : ""
  }
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(String(credentials.razon_social))}</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:ID>${escapeXml(String(credentials.ubigeo || "150101"))}</cbc:ID>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cbc:CityName>${escapeXml(String(credentials.provincia || "LIMA"))}</cbc:CityName>
          <cbc:CountrySubentity>${escapeXml(String(credentials.departamento || "LIMA"))}</cbc:CountrySubentity>
          <cbc:District>${escapeXml(String(credentials.distrito || "LIMA"))}</cbc:District>
          <cac:AddressLine>
            <cbc:Line>${escapeXml(String(credentials.direccion || "-"))}</cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${escapeXml(customer.tipo_documento)}">${
    escapeXml(customer.numero_documento)
  }</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${
    escapeXml(customer.razon_social || "")
  }</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${
    formatAmount(document.total_impuestos)
  }</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${
    formatAmount(document.mto_oper_gravadas)
  }</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${
    formatAmount(document.mto_igv)
  }</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>${buildMonetaryTotalXml(kind, document)}${
    buildLineXml(kind, items)
  }
</${rootTag}>`;
}
