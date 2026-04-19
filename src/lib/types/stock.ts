// ---------- Stock Enums ----------
export type MovementType = "in" | "out" | "adjustment" | "transfer" | "return";

// ---------- Stock Movement ----------
export interface StockMovement {
  id: string;
  organization_id: string;
  product_id: string;
  branch_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  transfer_to_branch_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
