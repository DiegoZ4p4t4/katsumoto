// ── Invoice Schemas (Zod) ──
// Validation schemas for invoice-related forms

import { z } from "zod";
import { TaxAffectationEnum } from "./product.schema";

// ── Enums matching domain types ──
export const InvoiceTypeEnum = z.enum(["factura", "boleta", "nota_credito", "nota_debito"]);
export const InvoiceStatusEnum = z.enum(["draft", "issued", "accepted", "paid", "cancelled"]);
export const PaymentMethodEnum = z.enum(["cash", "debit_card", "credit_card", "transfer", "yape", "plin", "credit"]);

// ── Invoice Item (form state) ──
export const invoiceItemFormSchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().min(1, "Nombre de producto requerido"),
  product_sku: z.string().optional(),
  quantity: z.number().min(1, "Cantidad mínima es 1"),
  unit_price_cents: z.number().min(0, "Precio no puede ser negativo"),
  discount_percent: z.number().min(0, "Descuento no puede ser negativo").max(100, "Máximo 100%").default(0),
  tax_affectation: TaxAffectationEnum.optional(),
});
export type InvoiceItemFormValues = z.infer<typeof invoiceItemFormSchema>;

// ── Invoice Form (general) ──
export const invoiceFormSchema = z.object({
  customer_id: z.string().min(1, "Cliente requerido"),
  invoice_type: InvoiceTypeEnum,
  issue_date: z.string().min(1, "Fecha de emisión requerida"),
  due_date: z.string().optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  items: z.array(invoiceItemFormSchema).min(1, "Al menos un item requerido"),
});
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// ── CreateInvoice LocalItem (UI-facing, uses Soles not cents) ──
export const createInvoiceItemSchema = z.object({
  productId: z.string().min(1, "Producto requerido"),
  productName: z.string().min(1, "Nombre requerido"),
  quantity: z.number().min(1, "Cantidad mínima es 1"),
  unitPriceSoles: z.number().min(0, "Precio no puede ser negativo"),
  discount: z.number().min(0, "Descuento no puede ser negativo").max(100, "Máximo 100%"),
});
export type CreateInvoiceItemValues = z.infer<typeof createInvoiceItemSchema>;

export const createInvoiceFormSchema = z.object({
  invoiceType: InvoiceTypeEnum,
  clientId: z.string().min(1, "Cliente requerido"),
  items: z.array(createInvoiceItemSchema).min(1, "Agrega al menos un producto"),
});
export type CreateInvoiceFormValues = z.infer<typeof createInvoiceFormSchema>;
