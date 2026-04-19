import type { PdfContext } from "../types";
import { formatCents } from "../../format";
import { IGV_RATE, PAYMENT_METHODS } from "../../constants";

export function drawTotals(ctx: PdfContext, y: number): number {
  const { doc, invoice, pageWidth, margin } = ctx;
  const totalsX = pageWidth - margin - 80;
  const valuesX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 77, 0);
  doc.text("Desglose TRIBUTARIO", totalsX - 5, y);
  y += 6;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(totalsX - 5, y, valuesX, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  doc.setTextColor(80, 80, 80);
  doc.text("Base Imponible:", totalsX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatCents(invoice.subtotal_cents), valuesX, y, { align: "right" });
  y += 5;

  if (invoice.gravada_cents > 0) {
    doc.setTextColor(200, 60, 0);
    doc.text("Op. Gravadas (Cód. 10):", totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCents(invoice.gravada_cents), valuesX, y, { align: "right" });
    y += 5;
  }

  if (invoice.exonerada_cents > 0) {
    doc.setTextColor(37, 99, 235);
    doc.text("Op. Exoneradas (Cód. 20):", totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCents(invoice.exonerada_cents), valuesX, y, { align: "right" });
    y += 5;
  }

  if (invoice.inafecta_cents > 0) {
    doc.setTextColor(180, 120, 0);
    doc.text("Op. Inafectas (Cód. 30):", totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCents(invoice.inafecta_cents), valuesX, y, { align: "right" });
    y += 5;
  }

  if (invoice.exportacion_cents > 0) {
    doc.setTextColor(120, 50, 180);
    doc.text("Op. Exportación (Cód. 40):", totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCents(invoice.exportacion_cents), valuesX, y, { align: "right" });
    y += 5;
  }

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8.5);
  doc.text(`IGV (${(IGV_RATE * 100).toFixed(0)}%):`, totalsX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatCents(invoice.igv_cents), valuesX, y, { align: "right" });
  y += 2;

  doc.setDrawColor(255, 77, 0);
  doc.setLineWidth(1);
  doc.line(totalsX - 5, y, valuesX, y);
  y += 8;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 77, 0);
  doc.text("TOTAL:", totalsX, y);
  doc.text(formatCents(invoice.total_cents), valuesX, y, { align: "right" });
  y += 10;

  if (invoice.payment_method) {
    const methodInfo = PAYMENT_METHODS[invoice.payment_method];
    const methodLabel = methodInfo?.label || invoice.payment_method;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Método de Pago:", totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(methodLabel, valuesX, y, { align: "right" });
    y += 2;
  }

  return y + 12;
}
