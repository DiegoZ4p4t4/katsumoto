import { supabase } from "@/lib/supabase";
import type { TaxAffectation } from "@/lib/types";

export interface TaxConfigRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  seller_department_code: string;
  seller_province_code: string;
  seller_district_code: string;
  seller_is_selva: boolean;
  selva_law_enabled: boolean;
  default_tax_affectation: TaxAffectation;
  legal_text_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxConfigSaveData {
  seller_department_code: string;
  seller_province_code: string;
  seller_district_code: string;
  seller_is_selva: boolean;
  selva_law_enabled: boolean;
  default_tax_affectation?: TaxAffectation;
  legal_text_template?: string | null;
}

export const taxConfigService = {
  async getByOrg(orgId: string): Promise<TaxConfigRow | null> {
    const { data, error } = await supabase
      .from("tax_configurations")
      .select("*")
      .eq("organization_id", orgId)
      .is("branch_id", null)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getByBranch(branchId: string): Promise<TaxConfigRow | null> {
    const { data, error } = await supabase
      .from("tax_configurations")
      .select("*")
      .eq("branch_id", branchId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getForBranch(branchId: string, orgId: string): Promise<TaxConfigRow | null> {
    const branchConfig = await this.getByBranch(branchId);
    if (branchConfig) return branchConfig;
    return this.getByOrg(orgId);
  },

  async getAllForOrg(orgId: string): Promise<TaxConfigRow[]> {
    const { data, error } = await supabase
      .from("tax_configurations")
      .select("*")
      .eq("organization_id", orgId);
    if (error) throw error;
    return data ?? [];
  },

  async upsert(orgId: string, config: TaxConfigSaveData): Promise<TaxConfigRow> {
    const payload = {
      organization_id: orgId,
      branch_id: null,
      seller_department_code: config.seller_department_code,
      seller_province_code: config.seller_province_code,
      seller_district_code: config.seller_district_code,
      seller_is_selva: config.seller_is_selva,
      selva_law_enabled: config.selva_law_enabled,
      default_tax_affectation: config.default_tax_affectation ?? "gravado",
      legal_text_template: config.legal_text_template ?? null,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.getByOrg(orgId);
    if (existing) {
      const { data, error } = await supabase
        .from("tax_configurations")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from("tax_configurations")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async upsertForBranch(branchId: string, orgId: string, config: TaxConfigSaveData): Promise<TaxConfigRow> {
    const payload = {
      organization_id: orgId,
      branch_id: branchId,
      seller_department_code: config.seller_department_code,
      seller_province_code: config.seller_province_code,
      seller_district_code: config.seller_district_code,
      seller_is_selva: config.seller_is_selva,
      selva_law_enabled: config.selva_law_enabled,
      default_tax_affectation: config.default_tax_affectation ?? "gravado",
      legal_text_template: config.legal_text_template ?? null,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.getByBranch(branchId);
    if (existing) {
      const { data, error } = await supabase
        .from("tax_configurations")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from("tax_configurations")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
