import type { PdfContext } from "../types";
import { INVOICE_TYPES } from "../../constants";

const LOGO_MAX_W = 30;
const LOGO_MAX_H = 15;

function formatDatePDF(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function drawHeader(ctx: PdfContext, y: number): Promise<number> {
  const { doc, invoice, sellerInfo, options, pageWidth, margin } = ctx;
  const startY = y;

  let textOffsetX = margin;
  if (sellerInfo.logoUrl) {
    const imgData = await loadImageAsBase64(sellerInfo.logoUrl);
    if (imgData) {
      try {
        doc.addImage(imgData, "AUTO", margin, startY, LOGO_MAX_W, LOGO_MAX_H);
      } catch {
        // skip logo on format error
      }
      textOffsetX = margin + LOGO_MAX_W + 4;
    }
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 77, 0);
  doc.text(sellerInfo.razonSocial || sellerInfo.nombreComercial, textOffsetX, startY + 7);

  let rucY = startY + 12;
  if (sellerInfo.nombreComercial && sellerInfo.razonSocial !== sellerInfo.nombreComercial) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(sellerInfo.nombreComercial, textOffsetX, startY + 12);
    rucY = startY + 17;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`RUC: ${sellerInfo.ruc}`, textOffsetX, rucY);

  const addrParts = [sellerInfo.direccion, sellerInfo.distrito, sellerInfo.provincia, sellerInfo.departamento].filter(Boolean);
  if (addrParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(addrParts.join(", "), textOffsetX, rucY + 4);
  }

  if (sellerInfo.phone || sellerInfo.email) {
    const parts: string[] = [];
    if (sellerInfo.phone) parts.push(`Tel: ${sellerInfo.phone}`);
    if (sellerInfo.email) parts.push(sellerInfo.email);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(parts.join(" · "), textOffsetX, rucY + 8);
  }

  const typeInfo = INVOICE_TYPES[invoice.invoice_type];
  const typeLabel = typeInfo?.label || invoice.invoice_type.toUpperCase();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(typeLabel.toUpperCase(), pageWidth - margin, startY + 7, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`N° ${invoice.number}`, pageWidth - margin, startY + 14, { align: "right" });

  if (options.branchName) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Sede: ${options.branchName}`, pageWidth - margin, startY + 20, { align: "right" });
  }

  y = startY + 24;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Fecha de Emisión:", margin, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(formatDatePDF(invoice.issue_date), margin + 35, y);

  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Moneda:", margin + 90, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("PEN (Soles)", margin + 110, y);

  return y + 10;
}
