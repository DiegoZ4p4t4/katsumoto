import autoTable from "jspdf-autotable";
import type { PdfContext } from "../types";
import { formatCents } from "../../format";
import { TAX_AFFECTATION_TYPES } from "../../constants";

export function drawItemsTable(ctx: PdfContext, y: number): number {
  const { doc, invoice, margin } = ctx;

  const tableData = (invoice.items || []).map((item, idx) => {
    const taxInfo = TAX_AFFECTATION_TYPES[item.tax_affectation || "gravado"];
    return [
      String(idx + 1),
      item.product_name + (item.product_sku ? `\n${item.product_sku}` : ""),
      String(item.quantity),
      formatCents(item.unit_price_cents),
      item.discount_percent > 0 ? `${item.discount_percent}%` : "—",
      taxInfo ? `${taxInfo.label} (${taxInfo.rate})` : "Gravado",
      item.igv_cents > 0 ? formatCents(item.igv_cents) : "—",
      formatCents(item.line_total_cents),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Descripción", "Cant.", "P. Unit.", "Desc.", "Afectación", "IGV", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [255, 77, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 50 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "center", cellWidth: 14 },
      5: { halign: "center", cellWidth: 24 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "right", cellWidth: 26, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable.finalY + 8;
}
