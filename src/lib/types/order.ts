import type { Cents, DocumentType, TaxAffectation } from "./common";

export type StoreOrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

export interface StoreOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_cents: Cents;
  line_total_cents: Cents;
  tax_affectation: TaxAffectation;
  igv_cents: Cents;
}

export interface StoreOrder {
  id: string;
  organization_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_document_type: DocumentType;
  customer_document_number: string;
  branch_id: string;
  shipping_address: string | null;
  shipping_department_code: string;
  shipping_province_code: string;
  shipping_district_code: string;
  items: StoreOrderItem[];
  subtotal_cents: Cents;
  gravada_cents: Cents;
  exonerada_cents: Cents;
  inafecta_cents: Cents;
  igv_cents: Cents;
  total_cents: Cents;
  status: StoreOrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
