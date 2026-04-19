import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Invoice } from "../../types";
import type { SellerInfo } from "../seller-info";
import type { PrintOptions } from "../types";
import { INVOICE_TYPES, IGV_RATE, PAYMENT_METHODS } from "../../constants";
import { formatCents } from "../../format";
import { getLegalBasisText, determineTax } from "../../tax-engine";
import { INVOICE_TYPE_SUNAT_CODE, DOCUMENT_TYPE_SUNAT_CODE } from "../../types/sunat";

const THERMAL_W = 80;
const MARGIN = 4;
const CONTENT_W = THERMAL_W - MARGIN * 2;
const FONT_SM = 6;
const FONT_MD = 7;
const FONT_LG = 9;
const FONT_XL = 12;

function centerText(doc: jsPDF, text: string, y: number, fontSize: number) {
  doc.setFontSize(fontSize);
  const tw = doc.getTextWidth(text);
  doc.text(text, (THERMAL_W - tw) / 2, y);
}

export async function generateThermalTicket(invoice: Invoice, sellerInfo: SellerInfo, options?: PrintOptions): Promise<jsPDF> {
  const estimatedHeight = 200;
  const doc = new jsPDF({ unit: "mm", format: [THERMAL_W, estimatedHeight] });
  let y = MARGIN + 3;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  centerText(doc, sellerInfo.razonSocial || sellerInfo.nombreComercial, y, FONT_LG);
  y += 4;

  if (sellerInfo.nombreComercial && sellerInfo.razonSocial !== sellerInfo.nombreComercial) {
    doc.setFont("helvetica", "normal");
    centerText(doc, sellerInfo.nombreComercial, y, FONT_MD);
    y += 3;
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  centerText(doc, `RUC: ${sellerInfo.ruc}`, y, FONT_MD);
  y += 3;

  const addrParts = [sellerInfo.direccion, sellerInfo.distrito, sellerInfo.provincia, sellerInfo.departamento].filter(Boolean);
  if (addrParts.length > 0) {
    centerText(doc, addrParts.join(", "), y, FONT_SM);
    y += 3;
  }

  if (sellerInfo.phone) {
    centerText(doc, `Tel: ${sellerInfo.phone}`, y, FONT_SM);
    y += 3;
  }

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, THERMAL_W - MARGIN, y);
  y += 4;

  const typeInfo = INVOICE_TYPES[invoice.invoice_type];
  const typeLabel = typeInfo?.label || invoice.invoice_type.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  centerText(doc, typeLabel.toUpperCase(), y, FONT_LG);
  y += 4;
  centerText(doc, invoice.number, y, FONT_MD);
  y += 4;

  if (options?.branchName) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    centerText(doc, `Sede: ${options.branchName}`, y, FONT_SM);
    y += 3;
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(FONT_SM);
  doc.text(`Fecha: ${new Date(invoice.issue_date).toLocaleDateString("es-PE")}`, MARGIN, y);
  y += 3;

  doc.line(MARGIN, y, THERMAL_W - MARGIN, y);
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SM);
  doc.setTextColor(100, 100, 100);
  doc.text("CLIENTE", MARGIN, y);
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(FONT_MD);
  doc.text(invoice.customer?.name || "—", MARGIN, y);
  y += 3;

  const docLabel = invoice.customer?.document_type || "DOC";
  doc.setFontSize(FONT_SM);
  doc.setTextColor(80, 80, 80);
  doc.text(`${docLabel}: ${invoice.customer?.document_number || "—"}`, MARGIN, y);
  y += 3;

  doc.line(MARGIN, y, THERMAL_W - MARGIN, y);
  y += 3;

  (invoice.items || []).forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_SM);
    doc.setTextColor(30, 30, 30);
    doc.text(item.product_name, MARGIN, y);
    y += 2.5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(FONT_SM);
    const lineTotal = formatCents(item.line_total_cents);
    const qtyPrice = `${item.quantity} x ${formatCents(item.unit_price_cents)}`;
    doc.text(qtyPrice, MARGIN + 1, y);
    doc.text(lineTotal, THERMAL_W - MARGIN, y, { align: "right" });
    y += 3;
  });

  doc.line(MARGIN, y, THERMAL_W - MARGIN, y);
  y += 3;

  const rightX = THERMAL_W - MARGIN;

  doc.setFontSize(FONT_SM);
  doc.setTextColor(80, 80, 80);
  doc.text("Op. Gravadas:", MARGIN, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatCents(invoice.gravada_cents), rightX, y, { align: "right" });
  y += 2.5;

  if (invoice.exonerada_cents > 0) {
    doc.setTextColor(80, 80, 80);
    doc.text("Op. Exoneradas:", MARGIN, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCents(invoice.exonerada_cents), rightX, y, { align: "right" });
    y += 2.5;
  }

  if (invoice.inafecta_cents > 0) {
    doc.setTextColor(80, 80, 80);
    doc.text("Op. Inafectas:", MARGIN, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCents(invoice.inafecta_cents), rightX, y, { align: "right" });
    y += 2.5;
  }

  doc.setTextColor(80, 80, 80);
  doc.text(`IGV (${(IGV_RATE * 100).toFixed(0)}%):`, MARGIN, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatCents(invoice.igv_cents), rightX, y, { align: "right" });
  y += 1;

  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, THERMAL_W - MARGIN, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(FONT_XL);
  doc.text("TOTAL:", MARGIN, y);
  doc.text(formatCents(invoice.total_cents), rightX, y, { align: "right" });
  y += 4;

  if (invoice.payment_method) {
    const methodLabel = PAYMENT_METHODS[invoice.payment_method]?.label || invoice.payment_method;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SM);
    doc.setTextColor(80, 80, 80);
    doc.text(`Pago: ${methodLabel}`, MARGIN, y);
    y += 3;
  }

  if (invoice.notes) {
    doc.setFontSize(FONT_SM);
    doc.setTextColor(100, 100, 100);
    doc.text(`Obs: ${invoice.notes}`, MARGIN, y, { maxWidth: CONTENT_W });
    y += 4;
  }

  if (options?.taxConfig && invoice.exonerada_cents > 0) {
    const determination = determineTax({
      sellerProvinceCode: options.taxConfig.sellerProvinceCode,
      sellerDistrictCode: options.taxConfig.sellerDistrictCode,
      productFamily: null,
      selvaLawEnabled: options.taxConfig.selvaLawEnabled,
    });
    const legalText = getLegalBasisText(determination, options.taxConfig.sellerProvinceCode, options.taxConfig.sellerDistrictCode);
    if (legalText) {
      doc.setFontSize(5);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(legalText, CONTENT_W);
      doc.text(lines, MARGIN, y);
      y += lines.length * 2.5 + 2;
    }
  }

  if (invoice.sunat_hash) {
    doc.line(MARGIN, y, THERMAL_W - MARGIN, y);
    y += 3;

    doc.setFontSize(5.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Representación Impresa:", MARGIN, y);
    y += 2.5;

    const typeCode = INVOICE_TYPE_SUNAT_CODE[invoice.invoice_type] || "01";
    const docTypeCode = DOCUMENT_TYPE_SUNAT_CODE[invoice.customer?.document_type || "DNI"] || "1";
    const docNumber = invoice.customer?.document_number || "00000000";

    const qrData = [
      sellerInfo.ruc, typeCode,
      invoice.serie || invoice.number.split("-")[0] || "",
      String(invoice.correlativo || invoice.number.split("-")[1] || ""),
      invoice.igv_cents.toFixed(0), invoice.total_cents.toFixed(0),
      invoice.issue_date || new Date().toISOString().split("T")[0],
      docTypeCode, docNumber, invoice.sunat_hash,
    ].join("|");

    try {
      const qrBase64 = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });
      doc.addImage(qrBase64, "PNG", (THERMAL_W - 20) / 2, y, 20, 20);
      y += 22;
    } catch {
      // skip QR on error
    }

    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Hash: ${invoice.sunat_hash.substring(0, 24)}...`, MARGIN, y);
    y += 3;
  }

  y += 2;
  doc.setFontSize(5);
  doc.setTextColor(150, 150, 150);
  const generatedBy = sellerInfo.razonSocial || sellerInfo.nombreComercial;
  centerText(doc, `Generado por ${generatedBy}`, y, 5);
  y += 2;
  centerText(doc, new Date().toLocaleDateString("es-PE"), y, 5);
  y += 4;

  doc.internal.pageSize.setHeight(y + MARGIN);

  const action = options?.action || "download";
  if (action === "download") {
    doc.save(`${invoice.number}-ticket.pdf`);
  } else if (action === "print") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  return doc;
}
