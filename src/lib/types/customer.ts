import type { DocumentType } from "./common";

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  document_type: DocumentType;
  document_number: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  department_code: string;
  province_code: string;
  district_code: string;
  is_selva_zone: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  document_type: DocumentType;
  document_number: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  department_code?: string;
  province_code?: string;
  district_code?: string;
}
