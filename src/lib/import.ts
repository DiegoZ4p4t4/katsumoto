import Papa from "papaparse";
import { productFormSchema, type ProductFormValues } from "@/lib/schemas";

export interface ImportColumn {
  key: string;
  label: string;
  required: boolean;
  example?: string;
}

export interface ColumnMapping {
  [csvHeader: string]: string | null;
}

export interface RowValidation {
  row: Record<string, string>;
  rowIndex: number;
  data: ProductFormValues | null;
  errors: string[];
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  { key: "sku", label: "SKU", required: true },
  { key: "name", label: "Nombre", required: true },
  { key: "category", label: "Categoría", required: true },
  { key: "price_soles", label: "Precio Venta (S/.)", required: true },
  { key: "cost_soles", label: "Costo (S/.)", required: false },
  { key: "stock", label: "Stock Actual", required: false },
  { key: "min_stock", label: "Stock Mínimo", required: false },
  { key: "max_stock", label: "Stock Máximo", required: false },
  { key: "product_family", label: "Familia (productos/servicios)", required: false },
  { key: "category_group", label: "Grupo (repuestos/herramientas/...)", required: false },
  { key: "description", label: "Descripción", required: false },
  { key: "unit", label: "Unidad", required: false },
  { key: "tax_affectation", label: "Afectación IGV", required: false },
  { key: "supplier", label: "Proveedor", required: false },
  { key: "tags", label: "Tags (separados por ;)", required: false },
];

const HEADER_ALIASES: Record<string, string[]> = {
  sku: ["sku", "SKU", "código", "codigo", "code", "cod"],
  name: ["nombre", "name", "producto", "descripción del producto", "descripcion del producto", "producto nombre"],
  category: ["categoría", "categoria", "category", "cat"],
  price_soles: ["precio", "precio venta", "precio venta (s/.)", "precio_venta", "price", "venta", "precio tienda"],
  cost_soles: ["costo", "costo (s/.)", "costo_venta", "cost", "precio costo", "precio compra"],
  stock: ["stock", "stock actual", "cantidad", "inventario", "existencia"],
  min_stock: ["stock mínimo", "stock minimo", "min_stock", "minimo", "mínimo"],
  max_stock: ["stock máximo", "stock maximo", "max_stock", "maximo", "máximo"],
  product_family: ["familia", "product_family", "tipo", "tipo producto"],
  category_group: ["grupo", "category_group", "grupo categoría", "grupo categoria"],
  description: ["descripción", "descripcion", "description", "desc", "detalle"],
  unit: ["unidad", "unit", "uom", "medida", "unidad de medida"],
  tax_affectation: ["afectación igv", "afectacion igv", "tax", "igv", "tax_affectation", "afectacion"],
  supplier: ["proveedor", "supplier", "proveedores", "marca"],
  tags: ["tags", "etiquetas", "tag", "etiqueta"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[-_.]/g, " ").replace(/\s+/g, " ").replace(/(s\/.)/g, "").trim();
}

export function autoDetectMapping(csvHeaders: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of csvHeaders) {
    const normalized = normalizeHeader(header);
    let matched = false;
    for (const [fieldKey, aliases] of Object.entries(HEADER_ALIASES)) {
      const normalizedAliases = aliases.map(normalizeHeader);
      if (normalizedAliases.includes(normalized) || normalizedAliases.some(a => normalized.includes(a))) {
        mapping[header] = fieldKey;
        matched = true;
        break;
      }
    }
    if (!matched) {
      mapping[header] = null;
    }
  }
  return mapping;
}

export function parseCSVFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error("Error al parsear CSV: " + results.errors[0].message));
          return;
        }
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error: (err: Error) => {
        reject(new Error("Error al leer archivo: " + err.message));
      },
    });
  });
}

function parseNumber(val: string | undefined, fallback: number): number {
  if (!val || val.trim() === "" || val === "—") return fallback;
  const cleaned = val.replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

export function mapRowToFormValues(
  row: Record<string, string>,
  mapping: ColumnMapping
): ProductFormValues {
  const mapped: Record<string, string> = {};
  for (const [csvHeader, fieldKey] of Object.entries(mapping)) {
    if (fieldKey && row[csvHeader] !== undefined) {
      mapped[fieldKey] = (row[csvHeader] ?? "").toString();
    }
  }

  const tags = mapped.tags
    ? mapped.tags.split(";").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    name: mapped.name || "",
    sku: mapped.sku || "",
    product_family: (mapped.product_family as "productos" | "servicios") || "productos",
    category_group: (mapped.category_group as "herramientas" | "repuestos" | "maquinas" | "transporte" | "maintenance") || "repuestos",
    category: mapped.category || "",
    description: mapped.description || "",
    price_soles: parseNumber(mapped.price_soles, 0),
    cost_soles: parseNumber(mapped.cost_soles, 0),
    stock: Math.round(parseNumber(mapped.stock, 0)),
    min_stock: Math.round(parseNumber(mapped.min_stock, 0)),
    max_stock: Math.round(parseNumber(mapped.max_stock, 100)),
    unit: mapped.unit || "Unidad",
    supplier: mapped.supplier || "",
    tax_affectation: (mapped.tax_affectation as "gravado" | "exonerado" | "inafecto" | "exportacion") || "gravado",
    image_url: "",
    tags,
    selectedMachineIds: [],
    priceTiers: [],
  };
}

export function validateRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): RowValidation[] {
  return rows.map((row, i) => {
    const values = mapRowToFormValues(row, mapping);
    const result = productFormSchema.safeParse(values);
    if (result.success) {
      return { row, rowIndex: i, data: result.data, errors: [] };
    }
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return { row, rowIndex: i, data: null, errors };
  });
}
