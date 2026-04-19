// ---------- Machine Enums ----------
export type MachineCategory =
  | "macheteadora"
  | "fumigadora"
  | "cosechadora"
  | "tractor"
  | "motosierra"
  | "bomba"
  | "generador"
  | "pulverizadora"
  | "sembradora"
  | "otro";

// ---------- Machine Model ----------
export interface MachineModel {
  id: string;
  organization_id: string;
  name: string;
  brand: string;
  model: string;
  category: MachineCategory;
  year: number | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MachineModelFormData {
  name: string;
  brand: string;
  model: string;
  category: MachineCategory;
  year?: number;
  description?: string;
}
