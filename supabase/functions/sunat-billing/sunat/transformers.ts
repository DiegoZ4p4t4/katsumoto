import {
  CERT_ERROR_MAP,
  DOC_TYPE_MAP,
  INVOICE_TYPE_MAP,
  TAX_AFFECTATION_MAP,
} from "./constants.ts";
import { numeroALetras } from "./utils/number-to-words.ts";
import type { DbRecord, SunatCredentials } from "./types.ts";

export function centsToDecimal(cents: number): number {
  return Math.round(cents) / 100;
}

export function mapCertError(errorMessage: string): string {
  for (const [code, msg] of Object.entries(CERT_ERROR_MAP)) {
    if (errorMessage.includes(code)) return msg;
  }
  return errorMessage;
}

export function buildCredentialsFromConfig(config: DbRecord): SunatCredentials {
  return {
    ruc: config.ruc,
    razon_social: config.razon_social,
    nombre_comercial: config.nombre_comercial || config.razon_social,
    usuario_sol: config.usuario_sol,
    clave_sol: config.clave_sol,
    certificado_path: config.certificado_path,
    certificado_password: config.certificado_password || null,
    ubigeo: config.ubigeo || "150101",
    departamento: config.departamento || "LIMA",
    provincia: config.provincia || "LIMA",
    distrito: config.distrito || "LIMA",
    direccion: config.direccion || "-",
    modo_produccion: config.modo_produccion || false,
    gre_version: config.gre_version || "2.0",
    gre_client_id: config.gre_client_id || null,
    gre_client_secret: config.gre_client_secret || null,
  };
}

export function transformInvoiceToSunat(
  invoice: DbRecord,
  items: DbRecord[],
  customer: DbRecord,
) {
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
  const formaPago = (invoice.payment_method as string) === "credit"
    ? "Credito"
    : "Contado";
  const isExport = invoiceType === "factura" && exportacion > 0 &&
    gravada === 0 && exonerada === 0;

  const detalles = items.map((item) => {
    const tipAfeIgv = TAX_AFFECTATION_MAP[item.tax_affectation as string] ||
      "10";
    const qty = item.quantity as number;
    const valorVentaItem = centsToDecimal(item.line_total_cents as number);
    const igvItem = centsToDecimal(item.igv_cents as number);

    return {
      codigo: item.product_sku || item.product_id || "",
      unidad: "NIU",
      descripcion: item.product_name,
      cantidad: qty,
      mto_valor_unitario: centsToDecimal(item.unit_price_cents as number),
      mto_valor_venta: valorVentaItem,
      mto_base_igv: valorVentaItem,
      porcentaje_igv: tipAfeIgv === "10" ? 18.0 : 0.0,
      igv: igvItem,
      tip_afe_igv: tipAfeIgv,
      total_impuestos: igvItem,
      mto_precio_unitario: qty > 0
        ? Math.round(((valorVentaItem + igvItem) / qty) * 1000000) / 1000000
        : 0,
    };
  });

  const client: DbRecord = {
    tipo_documento: sunatDocCode,
    numero_documento: customer.document_number,
    razon_social: customer.name,
  };

  if (customer.address) client.direccion = customer.address;

  return {
    sunatTypeCode,
    document: {
      tipo_documento: sunatTypeCode,
      serie: invoice.serie,
      correlativo: invoice.correlativo,
      fecha_emision: invoice.issue_date,
      tipo_operacion: isExport ? "0200" : "0101",
      moneda: "PEN",
      forma_pago_tipo: formaPago,
      client,
      mto_oper_gravadas: gravada,
      mto_oper_exoneradas: exonerada,
      mto_oper_inafectas: inafecta,
      mto_igv: igv,
      total_impuestos: igv,
      valor_venta: isExport ? exportacion : valorVenta,
      sub_total: isExport ? exportacion : valorVenta,
      mto_imp_venta: total,
      detalles,
      leyendas: [{ code: "1000", value: numeroALetras(total) }],
    } as DbRecord,
  };
}

export function buildNoteDocument(
  invoice: DbRecord,
  items: DbRecord[],
  customer: DbRecord,
  body: DbRecord,
) {
  const invoiceType = invoice.invoice_type as string;
  const sunatTypeCode = INVOICE_TYPE_MAP[invoiceType];
  const sunatDocCode = DOC_TYPE_MAP[customer.document_type as string] || "0";
  const gravada = centsToDecimal(invoice.gravada_cents as number);
  const exonerada = centsToDecimal(invoice.exonerada_cents as number);
  const inafecta = centsToDecimal(invoice.inafecta_cents as number);
  const igv = centsToDecimal(invoice.igv_cents as number);
  const total = centsToDecimal(invoice.total_cents as number);

  const detalles = items.map((item) => {
    const tipAfeIgv = TAX_AFFECTATION_MAP[item.tax_affectation as string] ||
      "10";
    const qty = item.quantity as number;
    const valorVentaItem = centsToDecimal(item.line_total_cents as number);
    const igvItem = centsToDecimal(item.igv_cents as number);

    return {
      codigo: item.product_sku || item.product_id || "",
      unidad: "NIU",
      descripcion: item.product_name,
      cantidad: qty,
      mto_valor_unitario: centsToDecimal(item.unit_price_cents as number),
      mto_valor_venta: valorVentaItem,
      mto_base_igv: valorVentaItem,
      porcentaje_igv: tipAfeIgv === "10" ? 18.0 : 0.0,
      igv: igvItem,
      tip_afe_igv: tipAfeIgv,
      total_impuestos: igvItem,
      mto_precio_unitario: qty > 0
        ? Math.round(((valorVentaItem + igvItem) / qty) * 1000000) / 1000000
        : 0,
    };
  });

  return {
    tipo_documento: sunatTypeCode,
    serie: invoice.serie,
    correlativo: invoice.correlativo,
    fecha_emision: invoice.issue_date,
    tipo_doc_afectado: (body.tipo_doc_afectado as string) || "01",
    num_doc_afectado: (body.num_doc_afectado as string) || invoice.number ||
      `${invoice.serie}-${invoice.correlativo}`,
    cod_motivo: (body.cod_motivo as string) || "01",
    des_motivo: (body.des_motivo as string) || invoice.notes ||
      "ANULACION DE LA OPERACION",
    moneda: "PEN",
    client: {
      tipo_documento: sunatDocCode,
      numero_documento: customer.document_number,
      razon_social: customer.name,
    },
    mto_oper_gravadas: gravada,
    mto_oper_exoneradas: exonerada,
    mto_oper_inafectas: inafecta,
    mto_igv: igv,
    total_impuestos: igv,
    valor_venta: gravada + exonerada + inafecta,
    mto_imp_venta: total,
    detalles,
    leyendas: [{ code: "1000", value: numeroALetras(total) }],
  };
}

export function buildSummaryDocument(
  documents: DbRecord[],
  fecha: string,
  correlativo: number,
) {
  return {
    fecha_resumen: fecha,
    fecha_generacion: new Date().toISOString().split("T")[0],
    correlativo: String(correlativo),
    detalles: documents.map((doc) => {
      const customer = doc.customer as DbRecord;
      const tipoDoc = INVOICE_TYPE_MAP[doc.invoice_type as string] || "03";
      const detail: DbRecord = {
        tipo_documento: tipoDoc,
        serie_numero: `${doc.serie}-${
          String(doc.correlativo).padStart(6, "0")
        }`,
        estado: "1",
        cliente_tipo: DOC_TYPE_MAP[customer?.document_type as string] || "1",
        cliente_numero: customer?.document_number || "00000000",
        total: centsToDecimal(doc.total_cents as number),
        mto_oper_gravadas: centsToDecimal(doc.gravada_cents as number),
        mto_oper_exoneradas: centsToDecimal(doc.exonerada_cents as number),
        mto_oper_inafectas: centsToDecimal(doc.inafecta_cents as number),
        mto_igv: centsToDecimal(doc.igv_cents as number),
      };

      if (doc.reference_invoice_number) {
        detail.ref_tipo_documento = doc.reference_tipo_doc as string || "03";
        detail.ref_serie_numero = doc.reference_invoice_number as string;
      }

      return detail;
    }),
  };
}

export function buildVoidedDocument(
  invoice: DbRecord,
  motivo: string,
  correlativo: number,
) {
  const tipoDoc = INVOICE_TYPE_MAP[invoice.invoice_type as string] || "01";

  return {
    correlativo: String(correlativo),
    fecha_referencia: invoice.issue_date,
    fecha_emision: new Date().toISOString().split("T")[0],
    motivo_baja: motivo,
    detalles: [{
      tipo_documento: tipoDoc,
      serie: invoice.serie,
      correlativo: String(invoice.correlativo),
      motivo_especifico: motivo,
    }],
  };
}

const DOC_TYPE_SCHEME_NAME: Record<string, string> = {
  "1": "DNI",
  "6": "RUC",
};

function parseConductorName(fullName: string): { firstName: string; familyName: string } {
  const parts = String(fullName || "").trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", familyName: "" };
  return { firstName: parts[0], familyName: parts.slice(1).join(" ") };
}

export function buildDespatchDocument(
  despatch: DbRecord,
  items: DbRecord[],
): DbRecord {
  const detalles = items.map((item) => ({
    codigo: item.product_sku || item.product_id || "",
    unit: item.unit || "NIU",
    descripcion: item.product_name,
    quantity: item.quantity,
  }));

  const { firstName, familyName } = parseConductorName(
    String(despatch.conductor_nombre || ""),
  );

  return {
    tipo_documento: "09",
    serie: despatch.serie,
    correlativo: despatch.correlativo,
    fecha_emision: despatch.issue_date,
    motivo_traslado: despatch.motivo_traslado || "01",
    descripcion_motivo: despatch.descripcion_motivo,
    modalidad_traslado: despatch.modalidad_traslado || "01",
    fecha_inicio_traslado: despatch.fecha_inicio_traslado,
    peso_bruto_total: Number(despatch.peso_bruto_total || 0),
    numero_bultos: Number(despatch.numero_bultos || 0),
    remitente_ubigeo: despatch.remitente_ubigeo,
    remitente_direccion: despatch.remitente_direccion,
    destino_ubigeo: despatch.destino_ubigeo,
    destino_direccion: despatch.destino_direccion,
    destinatario_tipo_doc: despatch.destinatario_tipo_doc,
    destinatario_documento: despatch.destinatario_documento,
    destinatario_nombre: despatch.destinatario_nombre,
    transportista_tipo_doc: despatch.transportista_tipo_doc,
    transportista_documento: despatch.transportista_documento,
    transportista_nombre: despatch.transportista_nombre,
    transportista_scheme_name: DOC_TYPE_SCHEME_NAME[String(despatch.transportista_tipo_doc)] || "RUC",
    conductor_tipo_doc: despatch.conductor_tipo_doc,
    conductor_documento: despatch.conductor_documento,
    conductor_nombre: despatch.conductor_nombre,
    conductor_first_name: firstName,
    conductor_family_name: familyName,
    conductor_scheme_name: DOC_TYPE_SCHEME_NAME[String(despatch.conductor_tipo_doc)] || "DNI",
    conductor_licencia: despatch.conductor_licencia,
    vehiculo_placa: despatch.vehiculo_placa,
    detalles,
  };
}
