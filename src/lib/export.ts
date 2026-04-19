import type { Product } from "./types";
import { formatCents, formatDate } from "./format";

/**
 * Triggers a CSV file download in the browser.
 */
function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Escapes a value for CSV (handles commas, quotes, newlines).
 */
function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string from headers and rows.
 */
function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.join(","));
  return [headerLine, ...dataLines].join("\n");
}

// ==========================================
// Export Inventory to CSV
// ==========================================
export function exportInventoryCSV(
  products: Product[],
  getMachinesForProduct: (id: string) => { name: string; brand: string; model: string }[]
) {
  const headers = [
    "SKU",
    "Código de Barras",
    "Nombre",
    "Categoría",
    "Descripción",
    "Unidad",
    "Precio Venta (S/.)",
    "Costo (S/.)",
    "Margen (%)",
    "Stock Actual",
    "Stock Mínimo",
    "Stock Máximo",
    "Estado Stock",
    "Afectación IGV",
    "Proveedor",
    "Máquinas Compatibles",
  ];

  const rows = products.map((p) => {
    const margin =
      p.cost_cents > 0 && p.price_cents > 0
        ? ((1 - p.cost_cents / p.price_cents) * 100).toFixed(1)
        : "—";

    const stockStatus =
      p.stock === 0
        ? "Agotado"
        : p.stock <= p.min_stock
        ? "Stock Bajo"
        : p.stock > p.max_stock
        ? "Excedido"
        : "Normal";

    const machines = getMachinesForProduct(p.id);
    const machinesStr =
      machines.length > 0
        ? machines.map((m) => `${m.name} (${m.brand} ${m.model})`).join("; ")
        : "—";

    return [
      csvEscape(p.sku),
      csvEscape(p.barcode),
      csvEscape(p.name),
      csvEscape(p.category),
      csvEscape(p.description),
      csvEscape(p.unit),
      csvEscape(formatCents(p.price_cents)),
      csvEscape(formatCents(p.cost_cents)),
      csvEscape(margin),
      csvEscape(p.stock),
      csvEscape(p.min_stock),
      csvEscape(p.max_stock),
      csvEscape(stockStatus),
      csvEscape(p.tax_affectation || "gravado"),
      csvEscape(p.supplier),
      csvEscape(machinesStr),
    ];
  });

  const csv = buildCSV(headers, rows);
  const timestamp = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `inventario_${timestamp}.csv`);
}

// ==========================================
// Export Stock Movements to CSV
// ==========================================
export interface MovementExportRow {
  date: string;
  productName: string;
  productSku: string;
  movementType: string;
  quantity: number;
  branchName: string;
  transferToBranch: string | null;
  referenceType: string | null;
  notes: string | null;
}

export function exportMovementsCSV(movements: MovementExportRow[]) {
  const headers = [
    "Fecha",
    "Producto",
    "SKU",
    "Tipo de Movimiento",
    "Cantidad",
    "Sede",
    "Sede Destino",
    "Tipo Referencia",
    "Notas",
  ];

  const rows = movements.map((m) => [
    csvEscape(formatDate(m.date)),
    csvEscape(m.productName),
    csvEscape(m.productSku),
    csvEscape(m.movementType),
    csvEscape(m.quantity),
    csvEscape(m.branchName),
    csvEscape(m.transferToBranch || "—"),
    csvEscape(m.referenceType || "—"),
    csvEscape(m.notes || "—"),
  ]);

  const csv = buildCSV(headers, rows);
  const timestamp = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `movimientos_stock_${timestamp}.csv`);
}