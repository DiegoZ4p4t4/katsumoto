import QRCode from "qrcode";
import type { PdfContext } from "../types";
import { INVOICE_TYPE_SUNAT_CODE, DOCUMENT_TYPE_SUNAT_CODE } from "../../types/sunat";
import { INVOICE_TYPES } from "../../constants";

const QR_SIZE_MM = 22;

export async function drawQrHash(ctx: PdfContext, y: number): Promise<number> {
  const { doc, invoice, sellerInfo, pageWidth, margin } = ctx;

  const leftX = margin;
  const rightX = pageWidth - margin;
  const hasHash = !!invoice.sunat_hash;

  const typeCode = INVOICE_TYPE_SUNAT_CODE[invoice.invoice_type] || "01";
  const typeLabel = INVOICE_TYPES[invoice.invoice_type]?.label || invoice.invoice_type.toUpperCase();
  const docTypeCode = DOCUMENT_TYPE_SUNAT_CODE[invoice.customer?.document_type || "DNI"] || "1";
  const docNumber = invoice.customer?.document_number || "00000000";

  const qrData = [
    sellerInfo.ruc,
    typeCode,
    invoice.serie || invoice.number.split("-")[0] || "",
    String(invoice.correlativo || invoice.number.split("-")[1] || ""),
    (invoice.igv_cents / 100).toFixed(2),
    (invoice.total_cents / 100).toFixed(2),
    invoice.issue_date || new Date().toISOString().split("T")[0],
    docTypeCode,
    docNumber,
    invoice.sunat_hash || "",
  ].join("|");

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);
  y += 6;

  let qrImageDataBase64: string | null = null;
  try {
    qrImageDataBase64 = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    qrImageDataBase64 = null;
  }

  const textX = leftX;
  const textMaxWidth = rightX - (qrImageDataBase64 ? QR_SIZE_MM + 4 : 0) - leftX;

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  doc.text("Representación Impresa de:", textX, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text(`${typeLabel} ${invoice.number}`, textX + 48, y);
  y += 5;

  if (hasHash) {
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Hash: ${invoice.sunat_hash}`, textX, y, { maxWidth: textMaxWidth });
    y += 5;
  }

  if (qrImageDataBase64) {
    const qrX = rightX - QR_SIZE_MM;
    const qrY = y - QR_SIZE_MM - 2;
    doc.addImage(qrImageDataBase64, "PNG", qrX, qrY, QR_SIZE_MM, QR_SIZE_MM);
  }

  y += 4;

  return Math.max(y, (qrImageDataBase64 ? y + 2 : y));
}
