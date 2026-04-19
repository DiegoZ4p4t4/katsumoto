import type { DbRecord } from "../../types.ts";
import { ensureArray, escapeXml, formatAmount } from "../helpers.ts";
import { UBL_DESPATCH_NAMESPACES } from "../namespaces.ts";

function buildNamespaces(): string {
  return Object.entries(UBL_DESPATCH_NAMESPACES)
    .map(([key, value]) =>
      `${key === "xmlns" ? "xmlns" : `xmlns:${key}`}="${value}"`
    )
    .join(" ");
}

function buildDespatchLineXml(items: DbRecord[]): string {
  return ensureArray(items).map((item, index) => `
  <cac:DespatchLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:DeliveredQuantity unitCode="${escapeXml(item.unit || "NIU")}">${formatAmount(item.quantity, 2)}</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>${index + 1}</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description>${escapeXml(item.descripcion || "")}</cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${escapeXml(item.codigo || "")}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>`).join("");
}

export function buildDespatchXml(
  document: DbRecord,
  credentials: DbRecord,
  greVersion: string = "2.0",
): string {
  const items = ensureArray(document.detalles as DbRecord[]);
  const motivoTraslado = escapeXml(document.motivo_traslado || "01");
  const isV2 = greVersion === "2.0";
  const customizationId = isV2 ? "2.0" : "1.0";
  const typeCode = isV2
    ? `<cbc:DespatchAdviceTypeCode listAgencyName="PE:SUNAT" listName="Motivo de traslado" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo20">${motivoTraslado}</cbc:DespatchAdviceTypeCode>`
    : `<cbc:DespatchAdviceTypeCode listID="SUNAT:Identificador de Tipo de Guia">09</cbc:DespatchAdviceTypeCode>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice ${buildNamespaces()}>
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>${customizationId}</cbc:CustomizationID>
  <cbc:ID>${escapeXml(document.serie)}-${escapeXml(document.correlativo)}</cbc:ID>
  <cbc:IssueDate>${escapeXml(document.fecha_emision)}</cbc:IssueDate>
  <cbc:IssueTime>00:00:00</cbc:IssueTime>
  ${typeCode}
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
        <cbc:URI>#SignatureSP</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:DespatchSupplierParty>
    <cbc:CustomerAssignedAccountID schemeID="6">${escapeXml(credentials.ruc)}</cbc:CustomerAssignedAccountID>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(String(credentials.razon_social))}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DespatchSupplierParty>
  <cac:DeliveryCustomerParty>
    <cbc:CustomerAssignedAccountID schemeID="${escapeXml(document.destinatario_tipo_doc)}">${escapeXml(document.destinatario_documento)}</cbc:CustomerAssignedAccountID>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(document.destinatario_nombre)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DeliveryCustomerParty>
  <cac:Shipment>
    <cbc:ID>1</cbc:ID>
    <cbc:HandlingCode>${motivoTraslado}</cbc:HandlingCode>
    <cbc:HandlingInstructions>${escapeXml(document.descripcion_motivo)}</cbc:HandlingInstructions>
    <cbc:GrossWeightMeasure unitCode="KGM">${formatAmount(document.peso_bruto_total)}</cbc:GrossWeightMeasure>
    <cbc:TotalTransportHandlingUnitQuantity>${escapeXml(document.numero_bultos)}</cbc:TotalTransportHandlingUnitQuantity>
    <cac:ShipmentStage>
      <cbc:TransportModeCode>01</cbc:TransportModeCode>
      <cac:TransitPeriod>
        <cbc:StartDate>${escapeXml(document.fecha_inicio_traslado)}</cbc:StartDate>
      </cac:TransitPeriod>
      <cac:CarrierParty>
        <cac:PartyIdentification>
          <cbc:ID schemeID="${escapeXml(document.transportista_tipo_doc)}">${escapeXml(document.transportista_documento)}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
          <cbc:Name>${escapeXml(document.transportista_nombre)}</cbc:Name>
        </cac:PartyName>
      </cac:CarrierParty>
      <cac:TransportMeans>
        <cac:RoadTransport>
          <cbc:LicensePlateID>${escapeXml(document.vehiculo_placa)}</cbc:LicensePlateID>
        </cac:RoadTransport>
      </cac:TransportMeans>
      <cac:DriverPerson>
        <cbc:ID schemeID="${escapeXml(document.conductor_tipo_doc)}">${escapeXml(document.conductor_documento)}</cbc:ID>
        <cbc:FirstName>${escapeXml(document.conductor_first_name)}</cbc:FirstName>
        <cbc:FamilyName>${escapeXml(document.conductor_family_name)}</cbc:FamilyName>
        <cac:IdentityDocumentReference>
          <cbc:ID>${escapeXml(document.conductor_licencia)}</cbc:ID>
        </cac:IdentityDocumentReference>
      </cac:DriverPerson>
    </cac:ShipmentStage>
    <cac:Delivery>
      <cac:DeliveryAddress>
        <cbc:ID>${escapeXml(document.destino_ubigeo)}</cbc:ID>
        <cac:AddressLine>
          <cbc:Line>${escapeXml(document.destino_direccion)}</cbc:Line>
        </cac:AddressLine>
        <cac:Country>
          <cbc:IdentificationCode>PE</cbc:IdentificationCode>
        </cac:Country>
      </cac:DeliveryAddress>
    </cac:Delivery>
    <cac:OriginAddress>
      <cbc:ID>${escapeXml(document.remitente_ubigeo)}</cbc:ID>
      <cac:AddressLine>
        <cbc:Line>${escapeXml(document.remitente_direccion)}</cbc:Line>
      </cac:AddressLine>
      <cac:Country>
        <cbc:IdentificationCode>PE</cbc:IdentificationCode>
      </cac:Country>
    </cac:OriginAddress>
  </cac:Shipment>${buildDespatchLineXml(items)}
</DespatchAdvice>`;
}
