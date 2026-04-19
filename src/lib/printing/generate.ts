import jsPDF from "jspdf";
import type { Invoice } from "../types";
import type { SellerInfo } from "./seller-info";
import type { PrintOptions, PdfContext } from "./types";
import { drawHeader } from "./components/pdf-header";
import { drawCustomer } from "./components/pdf-customer";
import { drawItemsTable } from "./components/pdf-items-table";
import { drawTotals } from "./components/pdf-totals";
import { drawQrHash } from "./components/pdf-qr-hash";
import { drawFooter } from "./components/pdf-footer";
import { generateThermalTicket } from "./formats/thermal-ticket";
import { INVOICE_TYPES } from "../constants";

const FOOTER_SPACE = 22;
const TOTALS_HEIGHT = 55;
const QR_HASH_HEIGHT = 28;

function drawMiniHeader(ctx: PdfContext): number {
  const { doc, invoice, sellerInfo, pageWidth, margin } = ctx;
  const y = margin;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 77, 0);
  doc.text(sellerInfo.razonSocial || sellerInfo.nombreComercial, margin, y);

  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`RUC: ${sellerInfo.ruc}`, margin + 70, y);

  const typeLabel = INVOICE_TYPES[invoice.invoice_type]?.label || invoice.invoice_type.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`${typeLabel} ${invoice.number}`, pageWidth - margin, y, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 4, pageWidth - margin, y + 4);

  return y + 10;
}

function ensureSpace(ctx: PdfContext, y: number, needed: number): number {
  const pageHeight = ctx.doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - FOOTER_SPACE) {
    ctx.doc.addPage();
    return drawMiniHeader(ctx);
  }
  return y;
}

export async function generateInvoice(invoice: Invoice, sellerInfo: SellerInfo, options?: PrintOptions): Promise<jsPDF> {
  const opts: PrintOptions = options || {};

  if (opts.format === "thermal-80mm") {
    return generateThermalTicket(invoice, sellerInfo, opts);
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const ctx: PdfContext = {
    doc,
    invoice,
    sellerInfo,
    options: opts,
    pageWidth,
    margin,
    contentWidth,
  };

  let y = margin;
  y = await drawHeader(ctx, y);
  y = drawCustomer(ctx, y);
  y = drawItemsTable(ctx, y);

  y = ensureSpace(ctx, y, TOTALS_HEIGHT);
  y = drawTotals(ctx, y);

  y = ensureSpace(ctx, y, QR_HASH_HEIGHT);
  y = await drawQrHash(ctx, y);
  drawFooter(ctx, y);

  const action = opts.action || "download";
  if (action === "download") {
    doc.save(`${invoice.number}.pdf`);
  } else if (action === "print") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  return doc;
}
