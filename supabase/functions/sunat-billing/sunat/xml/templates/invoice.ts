import type { DbRecord } from "../../types.ts";
import { ensureArray, escapeXml, formatAmount } from "../helpers.ts";
import { UBL_INVOICE_NAMESPACES } from "../namespaces.ts";

function buildNamespaces(): string {
  return Object.entries(UBL_INVOICE_NAMESPACES)
    .map(([key, value]) =>
      `${key === "xmlns" ? "xmlns" : `xmlns:${key}`}="${value}"`
    )
    .join(" ");
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

function buildTaxSubtotals(document: DbRecord): string {
  const gravada = Number(document.mto_oper_gravadas || 0);
  const exonerada = Number(document.mto_oper_exoneradas || 0);
  const inafecta = Number(document.mto_oper_inafectas || 0);
  const igv = Number(document.mto_igv || 0);
  const moneda = escapeXml(document.moneda || "PEN");
  const subtotals: string[] = [];

  subtotals.push(`
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${moneda}">${formatAmount(gravada)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${moneda}">${formatAmount(igv)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`);

  if (exonerada > 0) {
    subtotals.push(`
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${moneda}">${formatAmount(exonerada)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${moneda}">0</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>9997</cbc:ID>
          <cbc:Name>EXO</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`);
  }

  if (inafecta > 0) {
    subtotals.push(`
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${moneda}">${formatAmount(inafecta)}</cbc:TaxAmount>
      <cbc:TaxAmount currencyID="${moneda}">0</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>9998</cbc:ID>
          <cbc:Name>INA</cbc:Name>
          <cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`);
  }

  if (subtotals.length === 0) {
    subtotals.push(`
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${moneda}">0</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${moneda}">0</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`);
  }

  return subtotals.join("");
}

function buildInvoiceLineXml(items: DbRecord[], moneda: string): string {
  return ensureArray(items).map((item, index) => {
    const tipAfeIgv = escapeXml(item.tip_afe_igv || "10");
    const tributo = tipAfeIgv === "10" ? { id: "1000", name: "IGV", code: "VAT" }
      : tipAfeIgv === "20" ? { id: "9997", name: "EXO", code: "VAT" }
      : tipAfeIgv === "30" ? { id: "9998", name: "INA", code: "FRE" }
      : tipAfeIgv === "40" ? { id: "9995", name: "EXP", code: "FRE" }
      : { id: "1000", name: "IGV", code: "VAT" };

    return `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${escapeXml(item.unidad || "NIU")}">${
      formatAmount(item.cantidad, 2)
    }</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${moneda}">${
      formatAmount(item.mto_valor_venta)
    }</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="${moneda}">${
      formatAmount(item.mto_precio_unitario, 10)
    }</cbc:PriceAmount>
        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${moneda}">${
      formatAmount(item.total_impuestos)
    }</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${moneda}">${
      formatAmount(item.mto_base_igv)
    }</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${moneda}">${
      formatAmount(item.igv)
    }</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>${formatAmount(item.porcentaje_igv, 2)}</cbc:Percent>
          <cbc:TaxExemptionReasonCode>${tipAfeIgv}</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>${tributo.id}</cbc:ID>
            <cbc:Name>${tributo.name}</cbc:Name>
            <cbc:TaxTypeCode>${tributo.code}</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${escapeXml(item.descripcion || "")}</cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${escapeXml(item.codigo || "")}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${moneda}">${
      formatAmount(item.mto_valor_unitario, 10)
    }</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }).join("");
}

export function buildInvoiceXml(
  document: DbRecord,
  credentials: DbRecord,
): string {
  const customer = (document.client as DbRecord) || {};
  const items = ensureArray(document.detalles as DbRecord[]);
  const legends = ensureArray(document.leyendas as DbRecord[]);
  const moneda = escapeXml(document.moneda || "PEN");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice ${buildNamespaces()}>
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
  <cbc:InvoiceTypeCode listID="${
    escapeXml(document.tipo_operacion || "0101")
  }">${escapeXml(document.tipo_documento)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${moneda}</cbc:DocumentCurrencyCode>
  <cac:Signature>
    <cbc:ID>SIGN${escapeXml(credentials.ruc)}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${escapeXml(credentials.ruc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(String(credentials.razon_social || ""))}</cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#GREENTER-SIGN</cbc:URI>
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
        <cbc:RegistrationName>${escapeXml(customer.razon_social || "")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>${escapeXml(document.forma_pago_tipo || "Contado")}</cbc:PaymentMeansID>
  </cac:PaymentTerms>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${moneda}">${formatAmount(document.total_impuestos)}</cbc:TaxAmount>${buildTaxSubtotals(document)}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${moneda}">${formatAmount(document.valor_venta)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${moneda}">${formatAmount(document.mto_imp_venta)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${moneda}">${formatAmount(document.mto_imp_venta)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${buildInvoiceLineXml(items, moneda)}
</Invoice>`;
}
