import type { TaxAffectation } from "./common";

export interface GeoDepartment {
  code: string;
  name: string;
  isAllSelva: boolean;
}

export interface GeoProvince {
  code: string;
  departmentCode: string;
  name: string;
  isSelva: boolean;
}

export interface GeoDistrict {
  code: string;
  provinceCode: string;
  departmentCode: string;
  name: string;
  isSelva: boolean;
}

export interface TaxDetermination {
  affectation: TaxAffectation;
  sunatCode: string;
  rate: number;
  label: string;
  justification: string;
  law: string;
  confidence: "high" | "medium" | "low";
}
