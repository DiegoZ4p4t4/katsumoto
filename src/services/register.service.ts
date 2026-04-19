import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { auditService } from "@/services/audit.service";
import type { CashRegister, RegisterTransaction } from "@/lib/types";

export const registerService = {
  async getAll(): Promise<CashRegister[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("organization_id", orgId)
      .order("opened_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByBranch(branchId: string): Promise<CashRegister[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId)
      .order("opened_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getOpenByBranch(branchId: string): Promise<CashRegister | null> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async open(branchId: string, openingAmountCents: number): Promise<CashRegister> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const orgId = await getCurrentOrgId();

    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("type")
      .eq("id", branchId)
      .single();
    if (branchError) throw branchError;
    if (branch?.type === "warehouse") throw new Error("No se puede abrir caja en un almacén. Solo Puntos de Venta y Tienda Virtual pueden tener cajas.");

    const { data: existingOpen } = await supabase
      .from("cash_registers")
      .select("id, number")
      .eq("branch_id", branchId)
      .eq("status", "open")
      .maybeSingle();
    if (existingOpen) throw new Error(`Ya existe una caja abierta (Caja #${existingOpen.number}) en esta sede`);

    const { data: nextNumber, error: rpcError } = await supabase
      .rpc("get_next_register_number", { p_branch_id: branchId });
    if (rpcError) throw rpcError;

    const { data, error } = await supabase
      .from("cash_registers")
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        number: nextNumber,
        status: "open",
        opening_amount_cents: openingAmountCents,
        opened_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    auditService.log("register.open", "cash_register", data.id, undefined, {
      branch_id: branchId, number: nextNumber,
    });
    return data;
  },

  async close(
    registerId: string,
    closingAmountCents: number,
    expectedClosingCents: number
  ): Promise<CashRegister> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const difference = closingAmountCents - expectedClosingCents;

    const { data, error } = await supabase
      .from("cash_registers")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        closing_amount_cents: closingAmountCents,
        expected_closing_cents: expectedClosingCents,
        difference_cents: difference,
      })
      .eq("id", registerId)
      .select()
      .single();
    if (error) throw error;
    auditService.log("register.close", "cash_register", registerId, undefined, {
      closing_amount_cents: closingAmountCents, difference_cents: difference,
    });
    return data;
  },

  async getAllTransactions(): Promise<RegisterTransaction[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("register_transactions")
      .select("*, invoices!left(number), cash_registers!inner(organization_id)")
      .eq("cash_registers.organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((t: Record<string, unknown> & { invoices?: { number?: string } }) => {
      const { cash_registers: _, invoices, ...rest } = t;
      return {
        ...rest,
        invoice_number: invoices?.number || undefined,
      };
    });
  },

  async getTransactions(registerId: string): Promise<RegisterTransaction[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("register_transactions")
      .select("*, cash_registers!inner(organization_id)")
      .eq("cash_registers.organization_id", orgId)
      .eq("register_id", registerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row: Record<string, unknown>) => {
      const { cash_registers: _, ...tx } = row;
      return tx as unknown as RegisterTransaction;
    });
  },

  async addTransaction(
    registerId: string,
    paymentMethod: string,
    amountCents: number,
    description: string,
    invoiceId?: string | null
  ): Promise<RegisterTransaction> {
    const orgId = await getCurrentOrgId();
    const { data: register } = await supabase
      .from("cash_registers")
      .select("id")
      .eq("id", registerId)
      .eq("organization_id", orgId)
      .single();
    if (!register) throw new Error("Caja no encontrada en la organización actual");

    const { data, error } = await supabase
      .from("register_transactions")
      .insert({
        register_id: registerId,
        invoice_id: invoiceId || null,
        payment_method: paymentMethod,
        amount_cents: amountCents,
        description,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
