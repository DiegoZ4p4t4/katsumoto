import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getBranchStock } from "@/lib/utils/stock";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useBranches } from "@/hooks/useBranches";
import { useProducts } from "@/hooks/useProducts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockService } from "@/services/stock.service";
import { formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import { queryKeys } from "@/lib/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeftRight, Plus, Package, Warehouse, Store, Globe, Lightbulb, Loader2, AlertCircle, RefreshCw, type LucideIcon } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface TransferSuggestion {
  productId: string; productName: string; productSku: string;
  warehouseStock: number; posStock: number; minStock: number;
  posBranchId: string; posBranchName: string; suggestedQty: number;
}

const branchIcons: Record<string, LucideIcon> = { warehouse: Warehouse, pos: Store, online: Globe };

export default function Transfers() {
  const location = useLocation();
  const { movements, isLoading: movementsLoading, error: movementsError } = useStockMovements();
  const { branches, branchStocks, isLoading: branchesLoading, error: branchesError } = useBranches();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    mutationFn: ({
      fromBranchId,
      toBranchId,
      productId,
      quantity,
      notes,
    }: {
      fromBranchId: string;
      toBranchId: string;
      productId: string;
      quantity: number;
      notes: string;
    }) => stockService.transfer(productId, fromBranchId, toBranchId, quantity, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movements.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.allStock });
    },
    onError: (err) => {
      showError("Error en transferencia: " + err.message);
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const prefillFromState = useCallback((state: Record<string, unknown>) => {
    if (state?.productId && state?.fromBranchId && state?.toBranchId) {
      setFromBranchId(state.fromBranchId as string);
      setToBranchId(state.toBranchId as string);
      setProductId(state.productId as string);
      setQuantity((state.quantity as number) || 1);
      setDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    if (location.state) {
      prefillFromState(location.state as Record<string, unknown>);
      window.history.replaceState({}, "");
    }
  }, [location.state, prefillFromState]);

  const transfers = useMemo(() => movements.filter(m => m.movement_type === "transfer"), [movements]);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const getProductName = useCallback((id: string) => productMap.get(id)?.name || "—", [productMap]);
  const getProductSku = useCallback((id: string) => productMap.get(id)?.sku || "", [productMap]);
  const getBranchName = useCallback((id: string) => branchMap.get(id)?.name || "—", [branchMap]);

  const branchStatsMap = useMemo(() => {
    const map = new Map<string, { totalItems: number; totalStock: number }>();
    for (const branch of branches) {
      if (!branch.is_active) continue;
      const stks = branchStocks.filter(bs => bs.branch_id === branch.id);
      map.set(branch.id, {
        totalItems: stks.filter(bs => bs.stock > 0).length,
        totalStock: stks.reduce((s, bs) => s + bs.stock, 0),
      });
    }
    return map;
  }, [branches, branchStocks]);

  const pagination = usePagination({ totalItems: transfers.length });
  const paginated = useMemo(
    () => transfers.slice(pagination.startIndex, pagination.endIndex),
    [transfers, pagination.startIndex, pagination.endIndex]
  );

  const availableStock = fromBranchId && productId ? getBranchStock(branchStocks, fromBranchId, productId) : 0;

  const suggestions = useMemo(() => {
    const wh = branches.find((b) => b.type === "warehouse" && b.is_active);
    const pos = branches.filter((b) => b.type === "pos" && b.is_active);
    if (!wh || pos.length === 0) return [];

    const active = products.filter((p) => p.is_active);
    const items: TransferSuggestion[] = [];
    for (const product of active) {
      const whStock = getBranchStock(branchStocks, wh.id, product.id);
      if (whStock <= 0) continue;
      for (const p of pos) {
        const posStock = getBranchStock(branchStocks, p.id, product.id);
        const posBs = branchStocks.find((bs) => bs.branch_id === p.id && bs.product_id === product.id);
        const minStock = posBs?.min_stock ?? product.min_stock;
        if (posStock < minStock) {
          items.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseStock: whStock,
            posStock,
            minStock,
            posBranchId: p.id,
            posBranchName: p.name,
            suggestedQty: Math.min(minStock - posStock, whStock),
          });
        }
      }
    }
    return items;
  }, [branches, branchStocks, products]);

  if (movementsLoading || branchesLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const queryError = movementsError || branchesError || productsError;
  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground text-center">Error al cargar las transferencias</p>
        <p className="text-xs text-muted-foreground">{queryError.message}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />Reintentar
        </Button>
      </div>
    );
  }

  const applySuggestion = (s: typeof suggestions[number]) => {
    const wh = branches.find((b) => b.type === "warehouse" && b.is_active);
    if (!wh) return;
    setFromBranchId(wh.id);
    setToBranchId(s.posBranchId);
    setProductId(s.productId);
    setQuantity(s.suggestedQty);
    setNotes(`Reposición sugerida — ${s.productName}`);
    setDialogOpen(true);
  };

  const handleTransfer = () => {
    if (!fromBranchId || !toBranchId || !productId || quantity <= 0 || fromBranchId === toBranchId) return;
    if (quantity > availableStock) { showError("Stock insuficiente en la sede de origen"); return; }
    const fromName = getBranchName(fromBranchId);
    const toName = getBranchName(toBranchId);
    transferMutation.mutate(
      { fromBranchId, toBranchId, productId, quantity, notes },
      {
        onSuccess: () => {
          showSuccess(`${quantity} uds. transferidas de ${fromName} a ${toName}`);
          setDialogOpen(false);
          setFromBranchId(""); setToBranchId(""); setProductId(""); setQuantity(1); setNotes("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Transferencias entre Sedes</h1>
          <HelpHint {...HELP_TEXTS.transfers} />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Transferencia
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {branches.filter(b => b.is_active).map((branch) => {
          const Icon = branchIcons[branch.type] || Package;
          const stats = branchStatsMap.get(branch.id);
          return (
            <Card key={branch.id} className="rounded-2xl shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{branch.name}</p>
                  <p className="text-xs text-muted-foreground">{stats?.totalItems ?? 0} productos · {stats?.totalStock ?? 0} uds. total</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <Card className="rounded-2xl shadow-sm border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-sm">Sugerencias de Transferencia</h3>
              <span className="text-xs text-muted-foreground">({suggestions.length} productos necesitan reabastecimiento)</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suggestions.slice(0, 10).map((s) => (
                <div key={`${s.productId}-${s.posBranchId}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.productSku} · {s.posBranchName}: <span className="text-red-600 font-bold">{s.posStock}</span> / mín. {s.minStock}
                      · Almacén: <span className="text-green-600 font-bold">{s.warehouseStock}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(s)}
                    className="rounded-lg bg-orange-600 hover:bg-orange-700 text-xs px-3"
                  >
                    <ArrowLeftRight className="w-3 h-3 mr-1" />
                    Transferir {s.suggestedQty} uds.
                  </Button>
                </div>
              ))}
              {suggestions.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  y {suggestions.length - 10} sugerencias más...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Cantidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Origen</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Destino</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Notas</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">{formatDate(t.created_at)}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{getProductName(t.product_id)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{getProductSku(t.product_id)}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-orange-600 dark:text-orange-400">{t.quantity}</td>
                    <td className="py-3 px-4 text-sm">{getBranchName(t.branch_id)}</td>
                    <td className="py-3 px-4 text-sm">{getBranchName(t.transfer_to_branch_id || "")}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate hidden md:table-cell">{t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transfers.length === 0 && (
            <div className="text-center py-16">
              <ArrowLeftRight className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay transferencias registradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationControls pagination={pagination} totalItems={transfers.length} itemLabel="transferencias" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Nueva Transferencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sede Origen *</Label>
                <Select value={fromBranchId} onValueChange={(v) => { setFromBranchId(v); setProductId(""); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active).map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sede Destino *</Label>
                <Select value={toBranchId} onValueChange={setToBranchId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active && b.id !== fromBranchId).map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>
                  {fromBranchId && products
                    .filter(p => getBranchStock(branchStocks, fromBranchId, p.id) > 0)
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — Stock: {getBranchStock(branchStocks, fromBranchId, p.id)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {productId && fromBranchId && (
              <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-3">
                <Package className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{products.find(p => p.id === productId)?.name}</p>
                  <p className="text-xs text-muted-foreground">Stock disponible en origen: <span className="font-bold text-foreground">{availableStock}</span> uds.</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad *</Label>
                <Input type="number" min={1} max={availableStock} value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" placeholder="Ej: Reposición semanal" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button
              onClick={handleTransfer}
              disabled={!fromBranchId || !toBranchId || !productId || quantity <= 0 || quantity > availableStock || fromBranchId === toBranchId}
              className="rounded-xl bg-orange-600 hover:bg-orange-700"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Transferir {quantity > 0 ? `${quantity} uds.` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}