export type BranchType = "warehouse" | "pos" | "online";

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  type: BranchType;
  address: string | null;
  phone: string | null;
  department_code: string;
  province_code: string;
  district_code: string;
  is_selva_zone: boolean;
  invoice_serie_prefix: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchStock {
  id: string;
  branch_id: string;
  product_id: string;
  stock: number;
  min_stock: number;
}

export interface BranchFormData {
  name: string;
  code: string;
  type: BranchType;
  address?: string;
  phone?: string;
  department_code?: string;
  province_code?: string;
  district_code?: string;
}
