import type { PdfContext } from "../types";
import { IGV_RATE } from "../../constants";
import { getLegalBasisText, determineTax } from "../../tax-engine";

export function drawFooter(ctx: PdfContext, y: number): number {
  const { doc, invoice, sellerInfo, options, pageWidth, margin, contentWidth } = ctx;

  if (invoice.notes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Observaciones:", margin, y);
    y += 4;
    doc.setTextColor(60, 60, 60);
    doc.text(invoice.notes, margin, y, { maxWidth: contentWidth });
    y += 8;
  }

  if (options.taxConfig && invoice.exonerada_cents > 0) {
    const determination = determineTax({
      sellerProvinceCode: options.taxConfig.sellerProvinceCode,
      sellerDistrictCode: options.taxConfig.sellerDistrictCode,
      productFamily: null,
      selvaLawEnabled: options.taxConfig.selvaLawEnabled,
    });
    const legalText = getLegalBasisText(
      determination,
      options.taxConfig.sellerProvinceCode,
      options.taxConfig.sellerDistrictCode,
    );
    if (legalText) {
      doc.setFillColor(240, 253, 244);
      const textLines = doc.splitTextToSize(legalText, contentWidth);
      const boxHeight = textLines.length * 3.5 + 8;
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "F");
      doc.setFontSize(6.5);
      doc.setTextColor(22, 101, 52);
      doc.text("Base Legal:", margin + 3, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(21, 128, 61);
      doc.text(textLines, margin + 3, y + 8);
      y += boxHeight + 4;
    }
  }

  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const footerName = sellerInfo.razonSocial || sellerInfo.nombreComercial;
  doc.text(`Documento generado por ${footerName}`, pageWidth / 2, footerY, { align: "center" });
  doc.text(
    `emitido el ${new Date().toLocaleDateString("es-PE")} · IGV ${(IGV_RATE * 100).toFixed(0)}% conforme a normativa SUNAT · Catálogo No. 7`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" },
  );

  return y;
}
