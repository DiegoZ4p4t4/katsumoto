import type { PdfContext } from "../types";

export function drawCustomer(ctx: PdfContext, y: number): number {
  const { doc, invoice, margin, contentWidth } = ctx;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, "F");
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("CLIENTE", margin + 4, y);
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customer?.name || "—", margin + 4, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const docLabel = invoice.customer?.document_type || "DOC";
  doc.text(`${docLabel}: ${invoice.customer?.document_number || "—"}`, margin + 4, y);
  y += 12;

  return y;
}
