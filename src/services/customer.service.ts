import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { buildUpdatePayload } from "@/lib/utils";
import type { Customer, CustomerFormData } from "@/lib/types";
import { isUbigeoSelva } from "@/lib/tax-engine";

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Customer | null> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(formData: CustomerFormData): Promise<Customer> {
    const organization_id = await getCurrentOrgId();
    if (formData.document_number) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id, name")
        .eq("organization_id", organization_id)
        .eq("document_number", formData.document_number)
        .eq("is_active", true)
        .maybeSingle();
      if (existing) {
        throw new Error(`Ya existe un cliente activo con ${formData.document_type} ${formData.document_number}: ${existing.name}`);
      }
    }
    const is_selva_zone = isUbigeoSelva(
      formData.department_code || "",
      formData.province_code || "",
      formData.district_code,
    );
    const { data, error } = await supabase
      .from("customers")
      .insert({
        organization_id,
        name: formData.name,
        document_type: formData.document_type,
        document_number: formData.document_number,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        department_code: formData.department_code || "",
        province_code: formData.province_code || "",
        district_code: formData.district_code || "",
        is_selva_zone,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<CustomerFormData>): Promise<Customer> {
    const orgId = await getCurrentOrgId();
    const updateData = buildUpdatePayload(formData, [
      "name", "document_type", "document_number", "phone", "email",
      "address", "city", "department_code", "province_code", "district_code",
    ]);

    if (formData.department_code !== undefined || formData.province_code !== undefined || formData.district_code !== undefined) {
      updateData.is_selva_zone = isUbigeoSelva(
        formData.department_code || "",
        formData.province_code || "",
        formData.district_code,
      );
    }

    const { data, error } = await supabase
      .from("customers")
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
      .from("customers")
      .update({ is_active: false })
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
  },

  async search(query: string): Promise<Customer[]> {
    const orgId = await getCurrentOrgId();
    const sanitized = query.replace(/[%_,]/g, "");
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .or(`name.ilike.%${sanitized}%,document_number.ilike.%${sanitized}%`)
      .order("name")
      .limit(20);
    if (error) throw error;
    return data;
  },

  async getInvoiceCounts(): Promise<Record<string, number>> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("customers")
      .select("id, invoices(count)")
      .eq("organization_id", orgId)
      .eq("is_active", true);
    if (error) throw error;
    const result: Record<string, number> = {};
    for (const row of data || []) {
      const invoices = (row as Record<string, unknown>).invoices;
      const count = Array.isArray(invoices) && invoices.length > 0
        ? ((invoices[0] as Record<string, unknown>).count as number) ?? 0
        : 0;
      result[row.id as string] = count;
    }
    return result;
  },
};
