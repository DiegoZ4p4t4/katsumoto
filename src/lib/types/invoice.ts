import type { Cents, TaxAffectation } from "./common";
import type { Customer } from "./customer";

// ---------- Invoice Enums ----------
export type InvoiceType = "factura" | "boleta" | "nota_credito" | "nota_debito";
export type InvoiceStatus = "draft" | "issued" | "accepted" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "debit_card" | "credit_card" | "transfer" | "yape" | "plin" | "credit";

// ---------- Invoice Item ----------
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price_cents: Cents;
  discount_percent: number;
  discount_cents: Cents;
  line_total_cents: Cents;
  tax_affectation: TaxAffectation;
  igv_cents: Cents;
  created_at: string;
}

// ---------- Invoice ----------
export interface Invoice {
  id: string;
  organization_id: string;
  number: string;
  serie: string;
  correlativo: number;
  invoice_type: InvoiceType;
  customer_id: string;
  branch_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  subtotal_cents: Cents;
  gravada_cents: Cents;
  exonerada_cents: Cents;
  inafecta_cents: Cents;
  exportacion_cents: Cents;
  igv_rate: number;
  igv_cents: Cents;
  total_cents: Cents;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Pick<Customer, "id" | "name" | "document_number" | "document_type">;
  items?: InvoiceItem[];
  payment_method?: PaymentMethod;
  register_id?: string | null;
  sunat_hash?: string | null;
  sunat_xml_path?: string | null;
  sunat_cdr_path?: string | null;
  sunat_ticket?: string | null;
  sunat_error_code?: string | null;
  sunat_error_message?: string | null;
  sunat_sent_at?: string | null;
  sunat_accepted_at?: string | null;
  reference_invoice_id?: string | null;
  motivo_nota?: string | null;
  descripcion_motivo?: string | null;
}

// ---------- Invoice Form Data ----------
export interface InvoiceItemFormData {
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price_cents: Cents;
  discount_percent: number;
  tax_affectation?: TaxAffectation;
}

export interface InvoiceFormData {
  customer_id: string;
  invoice_type: InvoiceType;
  issue_date: string;
  due_date?: string;
  notes?: string;
  items: InvoiceItemFormData[];
}
