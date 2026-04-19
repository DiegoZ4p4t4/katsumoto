import { supabase, getCurrentOrgId } from "@/lib/supabase";
import type { StockMovement } from "@/lib/types";

export const stockService = {
  async getAllMovements(): Promise<StockMovement[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("organization_id", orgId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getMovementsByBranch(branchId: string): Promise<StockMovement[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async adjust(
    productId: string,
    branchId: string,
    movementType: string,
    quantity: number,
    notes: string | null
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const orgId = await getCurrentOrgId();

    const { data, error } = await supabase.rpc("adjust_stock", {
      p_organization_id: orgId,
      p_product_id: productId,
      p_branch_id: branchId,
      p_movement_type: movementType,
      p_quantity: quantity,
      p_notes: notes,
      p_created_by: user.id,
    });
    if (error) throw error;
    return data;
  },

  async transfer(
    productId: string,
    fromBranchId: string,
    toBranchId: string,
    quantity: number,
    notes: string | null
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const orgId = await getCurrentOrgId();

    const { data, error } = await supabase.rpc("transfer_stock", {
      p_organization_id: orgId,
      p_product_id: productId,
      p_from_branch_id: fromBranchId,
      p_to_branch_id: toBranchId,
      p_quantity: quantity,
      p_notes: notes,
      p_created_by: user.id,
    });
    if (error) throw error;
    return data;
  },
};
