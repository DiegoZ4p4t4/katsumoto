import type { Cents } from "./common";
import type { PaymentMethod } from "./invoice";

// ---------- Cash Register ----------
export interface CashRegister {
  id: string;
  organization_id: string;
  branch_id: string;
  number: number;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  opened_by: string | null;
  closed_by: string | null;
  opening_amount_cents: Cents;
  closing_amount_cents: Cents | null;
  expected_closing_cents: Cents | null;
  difference_cents: Cents | null;
}

export interface RegisterTransaction {
  id: string;
  register_id: string;
  invoice_id: string | null;
  payment_method: PaymentMethod;
  amount_cents: Cents;
  invoice_number?: string;
  invoice_number_copy?: string;
  description: string;
  created_at: string;
}
