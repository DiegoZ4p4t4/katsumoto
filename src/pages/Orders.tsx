import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrders } from "@/hooks/useOrders";
import { useBranches } from "@/hooks/useBranches";
import { getBranchStock, getWarehouseBranchId } from "@/lib/utils/stock";
import { formatCents, formatDate } from "@/lib/format";
import { TAX_AFFECTATION_TYPES } from "@/lib/constants";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import type { StoreOrder, StoreOrderStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package, Clock, CheckCircle, XCircle, Truck, Loader2,
  Eye, ShoppingBag, User, Phone, Mail, FileText, AlertTriangle,
  AlertCircle, RefreshCw,
} from "lucide-react";

const statusConfig: Record<StoreOrderStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }>; nextLabel: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", icon: Clock, nextLabel: "Confirmar" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: CheckCircle, nextLabel: "Procesar" },
  processing: { label: "Procesando", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400", icon: Loader2, nextLabel: "Completar" },
  completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", icon: CheckCircle, nextLabel: "" },
  cancelled: { label: "Anulado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: XCircle, nextLabel: "" },
};

const nextStatus: Partial<Record<StoreOrderStatus, StoreOrderStatus>> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "completed",
};

export default function Orders() {
  const { orders: storeOrders, updateOrderStatus, fulfillOrder, cancelOrder, isFulfilling, isLoading: ordersLoading, error: ordersError } = useOrders();
  const { branches, branchStocks, isLoading: branchesLoading, error: branchesError } = useBranches();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState<StoreOrder | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const warehouseBranchId = useMemo(() => getWarehouseBranchId(branches), [branches]);

  const getWarehouseStockForProduct = useMemo(() => {
    if (!warehouseBranchId) return (_productId: string) => 0;
    return (productId: string) => getBranchStock(branchStocks, warehouseBranchId, productId);
  }, [warehouseBranchId, branchStocks]);

  const orders = useMemo(() => storeOrders.filter(o => statusFilter === "all" || o.status === statusFilter), [storeOrders, statusFilter]);
  const pendingCount = useMemo(() => storeOrders.filter(o => o.status === "pending").length, [storeOrders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of storeOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [storeOrders]);

  const pagination = usePagination({ totalItems: orders.length });
  const paginated = useMemo(
    () => orders.slice(pagination.startIndex, pagination.endIndex),
    [orders, pagination.startIndex, pagination.endIndex]
  );

  if (ordersLoading || branchesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const queryError = ordersError || branchesError;
  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground text-center">Error al cargar los pedidos</p>
        <p className="text-xs text-muted-foreground">{queryError.message}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />Reintentar
        </Button>
      </div>
    );
  }

  const handleStatusChange = (id: string, status: StoreOrderStatus) => {
    if (status === "completed") {
      fulfillOrder(id);
    } else if (status === "cancelled") {
      cancelOrder(id);
    } else {
      updateOrderStatus(id, status);
    }
    if (viewOrder?.id === id) {
      const updated = orders.find((o) => o.id === id);
      if (updated) setViewOrder({ ...updated, status });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pedidos Online</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {storeOrders.length} pedidos · {pendingCount} pendientes
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="processing">En proceso</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="cancelled">Anulados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["pending", "confirmed", "processing", "completed", "cancelled"] as const).map((status) => {
          const cfg = statusConfig[status];
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                statusFilter === status
                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  : "bg-muted/30 hover:bg-muted/50 border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <cfg.icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase">{cfg.label}</p>
              </div>
              <p className="text-xl font-bold mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {paginated.map((order) => {
          const cfg = statusConfig[order.status];
          const StatusIcon = cfg.icon;
          const next = nextStatus[order.status];
          const nextCfg = next ? statusConfig[next] : null;
          return (
            <Card key={order.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-sm">{order.order_number}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                        <Badge variant="secondary" className="text-[10px] rounded-lg">{order.customer_document_type}: {order.customer_document_number}</Badge>
                      </div>
                      <p className="text-sm font-medium">{order.customer_name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</span>
                        {order.customer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{order.customer_email}</span>}
                        <span>{order.items.length} ítem{order.items.length !== 1 ? "s" : ""}</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold">{formatCents(order.total_cents)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => setViewOrder(order)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Ver detalle">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {next && nextCfg && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => handleStatusChange(order.id, next)} disabled={isFulfilling && next === "completed"}>
                          {isFulfilling && next === "completed" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <nextCfg.icon className="w-3 h-3 mr-1" />}{cfg.nextLabel}
                        </Button>
                      )}
                      {order.status !== "cancelled" && order.status !== "completed" && (
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setCancelOrderId(order.id)}>
                          <XCircle className="w-3 h-3 mr-1" />Anular
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PaginationControls pagination={pagination} totalItems={orders.length} itemLabel="pedidos" showPageNumbers />

      {orders.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay pedidos{statusFilter !== "all" ? ` con estado "${statusConfig[statusFilter as StoreOrderStatus]?.label}"` : ""}</p>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-xl flex items-center gap-3 flex-wrap">
                <span className="font-mono">{viewOrder?.order_number}</span>
                {viewOrder && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[viewOrder.status].color}`}>
                    {statusConfig[viewOrder.status].label}
                  </span>
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-5">
              {/* Customer Info */}
              <div className="p-4 bg-muted/40 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del Cliente</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{viewOrder.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Documento</p>
                      <p className="font-medium font-mono">{viewOrder.customer_document_type}: {viewOrder.customer_document_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{viewOrder.customer_phone}</p>
                    </div>
                  </div>
                  {viewOrder.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Correo</p>
                        <p className="font-medium">{viewOrder.customer_email}</p>
                      </div>
                    </div>
                  )}
                </div>
                {viewOrder.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Notas del cliente</p>
                    <p className="text-sm">{viewOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs">Producto</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs">Cant.</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs">Stock Almacén</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs">Afectación</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs">P. Unit.</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs">IGV</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((item, i) => {
                      const taxInfo = TAX_AFFECTATION_TYPES[item.tax_affectation || "gravado"];
                      const warehouseStock = getWarehouseStockForProduct(item.product_id);
                      const isInsufficient = warehouseStock < item.quantity;
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2.5 px-3">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.product_sku}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center">
                            {isInsufficient ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                                <AlertTriangle className="w-3 h-3" />{warehouseStock}
                              </span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-semibold">{warehouseStock}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {taxInfo && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${taxInfo.color}`}>
                                {taxInfo.label}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">{formatCents(item.unit_price_cents)}</td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {item.igv_cents > 0 ? formatCents(item.igv_cents) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium">{formatCents(item.line_total_cents)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-4 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl space-y-2">
                <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">Desglose</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCents(viewOrder.subtotal_cents)}</span>
                </div>
                {viewOrder.gravada_cents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600 dark:text-orange-400">Op. Gravadas</span>
                    <span className="font-medium">{formatCents(viewOrder.gravada_cents)}</span>
                  </div>
                )}
                {viewOrder.exonerada_cents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">Op. Exoneradas</span>
                    <span className="font-medium">{formatCents(viewOrder.exonerada_cents)}</span>
                  </div>
                )}
                {viewOrder.inafecta_cents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Op. Inafectas</span>
                    <span className="font-medium">{formatCents(viewOrder.inafecta_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IGV</span>
                  <span className="font-medium">{formatCents(viewOrder.igv_cents)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-orange-200 dark:border-orange-800">
                  <span>Total</span>
                  <span className="text-orange-700 dark:text-orange-400">{formatCents(viewOrder.total_cents)}</span>
                </div>
              </div>

              {/* Dates + Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground">
                  <p>Pedido: {formatDate(viewOrder.created_at)}</p>
                  {viewOrder.updated_at !== viewOrder.created_at && (
                    <p>Actualizado: {formatDate(viewOrder.updated_at)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {nextStatus[viewOrder.status] && (
                    <Button
                      size="sm"
                      className="rounded-xl bg-orange-600 hover:bg-orange-700"
                      disabled={isFulfilling && nextStatus[viewOrder.status] === "completed"}
                      onClick={() => handleStatusChange(viewOrder.id, nextStatus[viewOrder.status]!)}
                    >
                      {isFulfilling && nextStatus[viewOrder.status] === "completed" ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {statusConfig[viewOrder.status].nextLabel}
                    </Button>
                  )}
                  {viewOrder.status !== "cancelled" && viewOrder.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => { setCancelOrderId(viewOrder.id); }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />Anular
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelOrderId} onOpenChange={(open) => { if (!open) setCancelOrderId(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular pedido?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. El pedido será marcado como anulado permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelOrderId) handleStatusChange(cancelOrderId, "cancelled");
                setCancelOrderId(null);
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Anular Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}