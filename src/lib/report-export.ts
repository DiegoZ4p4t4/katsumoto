import * as XLSX from "xlsx";
import { reportService, type AccountingRow } from "@/services/report.service";
import { toSoles } from "@/lib/format";

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function exportAccountingCSV(rows: AccountingRow[]) {
  const headers = reportService.getAccountingExportHeaders();
  const data = rows.map((r) =>
    reportService.getAccountingExportRow(r).map(csvEscape)
  );
  const csv = buildCSV(headers, data);
  const ts = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `reporte_contable_${ts}.csv`);
}

export function exportAccountingExcel(rows: AccountingRow[]) {
  const headers = reportService.getAccountingExportHeaders();
  const data = rows.map((r) => reportService.getAccountingExportRow(r));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  const amountCols = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  for (const col of amountCols) {
    for (let row = 1; row <= data.length; row++) {
      const addr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[addr];
      if (cell) cell.t = "n";
    }
  }

  ws["!cols"] = headers.map((h, i) => {
    if (i === 5) return { wch: 35 };
    if (i === 2) return { wch: 20 };
    if (amountCols.includes(i)) return { wch: 14 };
    return { wch: 16 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte Contable");

  const summary = reportService.getAccountingSummary(rows);
  const summaryHeaders = ["Concepto", "Valor"];
  const summaryData: (string | number)[][] = [
    ["Total Comprobantes", summary.count],
    ["Facturas", summary.facturas],
    ["Boletas", summary.boletas],
    ["Notas Crédito", summary.notasCredito],
    ["Notas Débito", summary.notasDebito],
    ["Total Gravada (S/.)", toSoles(summary.totalGravada).toFixed(2)],
    ["Total Exonerada (S/.)", toSoles(summary.totalExonerada).toFixed(2)],
    ["Total Inafecta (S/.)", toSoles(summary.totalInafecta).toFixed(2)],
    ["Total IGV (S/.)", toSoles(summary.totalIgv).toFixed(2)],
    ["Total General (S/.)", toSoles(summary.totalTotal).toFixed(2)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet([
    summaryHeaders,
    ...summaryData,
  ]);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  const ts = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `reporte_contable_${ts}.xlsx`);
}

export function exportSalesCSV(
  periods: {
    period: string;
    totalFacturas: number;
    totalBoletas: number;
    totalNotasCredito: number;
    totalNotasDebito: number;
    gravada: number;
    exonerada: number;
    inafecta: number;
    igv: number;
    total: number;
  }[],
  dateFrom: string,
  dateTo: string
) {
  const headers = [
    "Periodo",
    "Facturas",
    "Boletas",
    "Notas Crédito",
    "Notas Débito",
    "Gravada (S/.)",
    "Exonerada (S/.)",
    "Inafecta (S/.)",
    "IGV (S/.)",
    "Total (S/.)",
  ];

  const rows = periods.map((r) => [
    csvEscape(r.period),
    csvEscape(r.totalFacturas),
    csvEscape(r.totalBoletas),
    csvEscape(r.totalNotasCredito),
    csvEscape(r.totalNotasDebito),
    csvEscape(toSoles(r.gravada).toFixed(2)),
    csvEscape(toSoles(r.exonerada).toFixed(2)),
    csvEscape(toSoles(r.inafecta).toFixed(2)),
    csvEscape(toSoles(r.igv).toFixed(2)),
    csvEscape(toSoles(r.total).toFixed(2)),
  ]);

  const totalsRow = [
    csvEscape("TOTAL"),
    csvEscape(periods.reduce((s, r) => s + r.totalFacturas, 0)),
    csvEscape(periods.reduce((s, r) => s + r.totalBoletas, 0)),
    csvEscape(periods.reduce((s, r) => s + r.totalNotasCredito, 0)),
    csvEscape(periods.reduce((s, r) => s + r.totalNotasDebito, 0)),
    csvEscape(toSoles(periods.reduce((s, r) => s + r.gravada, 0)).toFixed(2)),
    csvEscape(toSoles(periods.reduce((s, r) => s + r.exonerada, 0)).toFixed(2)),
    csvEscape(toSoles(periods.reduce((s, r) => s + r.inafecta, 0)).toFixed(2)),
    csvEscape(toSoles(periods.reduce((s, r) => s + r.igv, 0)).toFixed(2)),
    csvEscape(toSoles(periods.reduce((s, r) => s + r.total, 0)).toFixed(2)),
  ];

  const csv = buildCSV(headers, [...rows, totalsRow]);
  downloadCSV(csv, `reporte_ventas_${dateFrom}_${dateTo}.csv`);
}

export function exportSalesExcel(
  periods: {
    period: string;
    totalFacturas: number;
    totalBoletas: number;
    totalNotasCredito: number;
    totalNotasDebito: number;
    gravada: number;
    exonerada: number;
    inafecta: number;
    igv: number;
    total: number;
  }[],
  dateFrom: string,
  dateTo: string
) {
  const headers = [
    "Periodo",
    "Facturas",
    "Boletas",
    "Notas Crédito",
    "Notas Débito",
    "Gravada (S/.)",
    "Exonerada (S/.)",
    "Inafecta (S/.)",
    "IGV (S/.)",
    "Total (S/.)",
  ];

  const data = periods.map((r) => [
    r.period,
    r.totalFacturas,
    r.totalBoletas,
    r.totalNotasCredito,
    r.totalNotasDebito,
    toSoles(r.gravada).toFixed(2),
    toSoles(r.exonerada).toFixed(2),
    toSoles(r.inafecta).toFixed(2),
    toSoles(r.igv).toFixed(2),
    toSoles(r.total).toFixed(2),
  ]);

  const totals = [
    "TOTAL",
    periods.reduce((s, r) => s + r.totalFacturas, 0),
    periods.reduce((s, r) => s + r.totalBoletas, 0),
    periods.reduce((s, r) => s + r.totalNotasCredito, 0),
    periods.reduce((s, r) => s + r.totalNotasDebito, 0),
    toSoles(periods.reduce((s, r) => s + r.gravada, 0)).toFixed(2),
    toSoles(periods.reduce((s, r) => s + r.exonerada, 0)).toFixed(2),
    toSoles(periods.reduce((s, r) => s + r.inafecta, 0)).toFixed(2),
    toSoles(periods.reduce((s, r) => s + r.igv, 0)).toFixed(2),
    toSoles(periods.reduce((s, r) => s + r.total, 0)).toFixed(2),
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data, totals]);
  ws["!cols"] = headers.map((_, i) =>
    i === 0 ? { wch: 14 } : { wch: 14 }
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas");
  XLSX.writeFile(wb, `reporte_ventas_${dateFrom}_${dateTo}.xlsx`);
}
