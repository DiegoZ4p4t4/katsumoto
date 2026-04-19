import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { buildUpdatePayload } from "@/lib/utils";
import type { ManagedCategoryFamily, ManagedCategoryGroup, ManagedCategory } from "@/lib/types";

function toFamily(row: Record<string, unknown>): ManagedCategoryFamily {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    icon: row.icon,
    color: row.color,
    activeColor: row.active_color,
    order: row.sort_order,
  };
}

function toGroup(row: Record<string, unknown>): ManagedCategoryGroup {
  return {
    id: row.id,
    familyId: row.family_id,
    key: row.key,
    label: row.label,
    icon: row.icon,
    color: row.color,
    order: row.sort_order,
  };
}

function toCategory(row: Record<string, unknown>): ManagedCategory {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    order: row.sort_order,
    imageUrl: row.image_url,
  };
}

export const categoryService = {
  async getFamilies(): Promise<ManagedCategoryFamily[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("managed_category_families")
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order");
    if (error) throw error;
    return data.map(toFamily);
  },

  async getGroups(familyId?: string): Promise<ManagedCategoryGroup[]> {
    const orgId = await getCurrentOrgId();
    let query = supabase
      .from("managed_category_groups")
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order");

    if (familyId) query = query.eq("family_id", familyId);

    const { data, error } = await query;
    if (error) throw error;
    return data.map(toGroup);
  },

  async getCategories(groupId?: string): Promise<ManagedCategory[]> {
    const orgId = await getCurrentOrgId();
    let query = supabase
      .from("managed_categories")
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order");

    if (groupId) query = query.eq("group_id", groupId);

    const { data, error } = await query;
    if (error) throw error;
    return data.map(toCategory);
  },

  async getAllGrouped(): Promise<{
    families: ManagedCategoryFamily[];
    groups: ManagedCategoryGroup[];
    categories: ManagedCategory[];
  }> {
    const orgId = await getCurrentOrgId();
    const [familiesRes, groupsRes, categoriesRes] = await Promise.all([
      supabase.from("managed_category_families").select("*").eq("organization_id", orgId).order("sort_order"),
      supabase.from("managed_category_groups").select("*").eq("organization_id", orgId).order("sort_order"),
      supabase.from("managed_categories").select("*").eq("organization_id", orgId).order("sort_order"),
    ]);

    if (familiesRes.error) throw familiesRes.error;
    if (groupsRes.error) throw groupsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    return {
      families: familiesRes.data.map(toFamily),
      groups: groupsRes.data.map(toGroup),
      categories: categoriesRes.data.map(toCategory),
    };
  },

  async createFamily(data: { key: string; label: string; icon?: string; color?: string; activeColor?: string; sortOrder?: number }): Promise<ManagedCategoryFamily> {
    const { data: result, error } = await supabase
      .from("managed_category_families")
      .insert({
        organization_id: (await getCurrentOrgId()),
        key: data.key,
        label: data.label,
        icon: data.icon || "Package",
        color: data.color || "",
        active_color: data.activeColor || "",
        sort_order: data.sortOrder || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return toFamily(result);
  },

  async updateFamily(id: string, data: Partial<{ key: string; label: string; icon: string; color: string; activeColor: string; sortOrder: number }>): Promise<void> {
    const update = buildUpdatePayload(data, ["key", "label", "icon", "color", "sortOrder"]);
    if (data.activeColor !== undefined) update.active_color = data.activeColor;
    const { error } = await supabase.from("managed_category_families").update(update).eq("id", id);
    if (error) throw error;
  },

  async deleteFamily(id: string): Promise<void> {
    const { error } = await supabase.from("managed_category_families").delete().eq("id", id);
    if (error) throw error;
  },

  async createGroup(data: { familyId: string; key: string; label: string; icon?: string; color?: string; sortOrder?: number }): Promise<ManagedCategoryGroup> {
    const { data: result, error } = await supabase
      .from("managed_category_groups")
      .insert({
        organization_id: (await getCurrentOrgId()),
        family_id: data.familyId,
        key: data.key,
        label: data.label,
        icon: data.icon || "Tag",
        color: data.color || "",
        sort_order: data.sortOrder || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return toGroup(result);
  },

  async updateGroup(id: string, data: Partial<{ key: string; label: string; icon: string; color: string; sortOrder: number }>): Promise<void> {
    const update = buildUpdatePayload(data, ["key", "label", "icon", "color", "sortOrder"]);
    const { error } = await supabase.from("managed_category_groups").update(update).eq("id", id);
    if (error) throw error;
  },

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase.from("managed_category_groups").delete().eq("id", id);
    if (error) throw error;
  },

  async createCategory(data: { groupId: string; name: string; imageUrl?: string; sortOrder?: number }): Promise<ManagedCategory> {
    const { data: result, error } = await supabase
      .from("managed_categories")
      .insert({
        organization_id: (await getCurrentOrgId()),
        group_id: data.groupId,
        name: data.name,
        image_url: data.imageUrl || null,
        sort_order: data.sortOrder || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return toCategory(result);
  },

  async updateCategory(id: string, data: Partial<{ name: string; imageUrl: string | null; sortOrder: number }>): Promise<void> {
    const update = buildUpdatePayload(data, ["name", "sortOrder"]);
    if (data.imageUrl !== undefined) update.image_url = data.imageUrl;
    const { error } = await supabase.from("managed_categories").update(update).eq("id", id);
    if (error) throw error;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("managed_categories").delete().eq("id", id);
    if (error) throw error;
  },
};
