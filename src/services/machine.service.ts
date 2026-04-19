import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { buildUpdatePayload } from "@/lib/utils";
import type { MachineModel, MachineModelFormData, ProductMachineModel } from "@/lib/types";

export const machineService = {
  async getAll(): Promise<MachineModel[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("machine_models")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<MachineModel | null> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("machine_models")
      .select("*")
      .eq("organization_id", orgId)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(formData: MachineModelFormData): Promise<MachineModel> {
    const organization_id = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("machine_models")
      .insert({
        organization_id,
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        category: formData.category,
        year: formData.year || null,
        description: formData.description || null,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<MachineModelFormData>): Promise<MachineModel> {
    const orgId = await getCurrentOrgId();
    const updateData = buildUpdatePayload(formData, [
      "name", "brand", "model", "category", "year", "description",
    ]);

    const { data, error } = await supabase
      .from("machine_models")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const orgId = await getCurrentOrgId();
    const { error } = await supabase
      .from("machine_models")
      .update({ is_active: false })
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
  },

  async getAllProductMachines(): Promise<ProductMachineModel[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("product_machines")
      .select("*, machine_models!inner(organization_id)")
      .eq("machine_models.organization_id", orgId);
    if (error) throw error;
    return (data || []).map((row: Record<string, unknown>) => {
      const { machine_models: _, ...pm } = row;
      return pm as unknown as ProductMachineModel;
    });
  },
};
