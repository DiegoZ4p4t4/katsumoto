import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { auditService } from "@/services/audit.service";

import type { StoreOrder } from "@/lib/types";

const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const orderService = {
  async getAll(): Promise<StoreOrder[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("store_orders")
      .select("*, items:store_order_items(*)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<StoreOrder | null> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("store_orders")
      .select("*, items:store_order_items(*)")
      .eq("organization_id", orgId)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    if (!VALID_ORDER_TRANSITIONS[status]) {
      throw new Error(`Estado de pedido inválido: ${status}`);
    }
    const { data: current } = await supabase
      .from("store_orders")
      .select("status")
      .eq("id", id)
      .single();
    if (!current) throw new Error("Pedido no encontrado");
    const allowed = VALID_ORDER_TRANSITIONS[current.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(`Transición no permitida: ${current.status} → ${status}`);
    }
    const { error } = await supabase
      .from("store_orders")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    const action = status === "cancelled" ? "order.cancel" : "order.status_change";
    auditService.log(action, "order", id, { status: current.status }, { status });
  },

  async fulfillOrder(orderId: string): Promise<string> {
    const { data: invoiceId, error } = await supabase.rpc("fulfill_store_order", {
      p_order_id: orderId,
    });
    if (error) throw error;
    return invoiceId;
  },

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.getById(orderId);
    if (!order) throw new Error("Pedido no encontrado");
    if (order.status === "completed") throw new Error("No se puede anular un pedido completado");

    const { error } = await supabase
      .from("store_orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (error) throw error;
    auditService.log("order.cancel", "order", orderId, { status: order.status }, { status: "cancelled" });
  },

  async create(data: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerDocumentType: string;
    customerDocumentNumber: string;
    branchId: string;
    shippingAddress?: string;
    shippingDepartmentCode?: string;
    shippingProvinceCode?: string;
    shippingDistrictCode?: string;
    subtotalCents: number;
    gravadaCents: number;
    exoneradaCents: number;
    inafectaCents: number;
    igvCents: number;
    totalCents: number;
    notes?: string;
    items: Array<{
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
      taxAffectation: string;
      igvCents: number;
    }>;
  }): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const orgId = await getCurrentOrgId();

    const productIds = data.items.map((item) => item.productId).filter(Boolean);
    if (productIds.length > 0 && data.branchId) {
      const { data: branchStocks } = await supabase
        .from("branch_stock")
        .select("product_id, stock")
        .eq("branch_id", data.branchId)
        .in("product_id", productIds);
      const stockMap = new Map((branchStocks || []).map((s: { product_id: string; stock: number }) => [s.product_id, s.stock]));
      const insufficient: string[] = [];
      for (const item of data.items) {
        const available = stockMap.get(item.productId) ?? 0;
        if (item.quantity > available) {
          insufficient.push(`${item.productName}: solicitado ${item.quantity}, disponible ${available}`);
        }
      }
      if (insufficient.length > 0) {
        throw new Error(`Stock insuficiente para los siguientes productos:\n${insufficient.join("\n")}`);
      }
    }

    const { data: orderId, error: orderError } = await supabase
      .from("store_orders")
      .insert({
        organization_id: orgId,
        order_number: data.orderNumber,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        customer_document_type: data.customerDocumentType,
        customer_document_number: data.customerDocumentNumber,
        branch_id: data.branchId,
        shipping_address: data.shippingAddress || null,
        shipping_department_code: data.shippingDepartmentCode || "",
        shipping_province_code: data.shippingProvinceCode || "",
        shipping_district_code: data.shippingDistrictCode || "",
        subtotal_cents: data.subtotalCents,
        gravada_cents: data.gravadaCents,
        exonerada_cents: data.exoneradaCents,
        inafecta_cents: data.inafectaCents,
        igv_cents: data.igvCents,
        total_cents: data.totalCents,
        notes: data.notes || null,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    if (data.items.length > 0) {
      const orderItems = data.items.map((item) => ({
        order_id: orderId.id,
        product_id: item.productId,
        product_name: item.productName,
        product_sku: item.productSku,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
        line_total_cents: item.lineTotalCents,
        tax_affectation: item.taxAffectation,
        igv_cents: item.igvCents,
      }));
      const { error: itemsError } = await supabase
        .from("store_order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;
    }

    return orderId.id;
  },
};
