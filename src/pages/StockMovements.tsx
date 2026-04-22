import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useProducts } from "@/hooks/useProducts";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import { formatDateTime } from "@/lib/format";
import { exportMovementsCSV } from "@/lib/export";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import type { MovementType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, ArrowLeftRight, Search, Download, Clock, Loader2, AlertCircle, RefreshCw, Calendar, type LucideIcon } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const movementConfig: Record<MovementType, { label: string; color: string; icon: LucideIcon }> = {
  in: { label: "Entrada", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: ArrowDown },
  out: { label: "Salida", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: ArrowUp },
  adjustment: { label: "Ajuste", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", icon: ArrowLeftRight },
  transfer: { label: "Transferencia", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", icon: ArrowLeftRight },
  transfer_out: { label: "Transferencia", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", icon: ArrowLeftRight },
  transfer_in: { label: "Transferencia", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", icon: ArrowLeftRight },
  return: { label: "Devolución", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400", icon: ArrowDown },
};

const refTypeLabels: Record<string, string> = {
  invoice: "Comprobante", purchase: "Compra", manual: "Manual",
};

export default function StockMovements() {
  const { branchMovements, selectedBranchId: branchId, getBranchName, isLoading: movementsLoading, error: movementsError } = useStockMovements();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const getProductName = useCallback((id: string) => productMap.get(id)?.name || "Producto eliminado", [productMap]);
  const getProductSku = useCallback((id: string) => productMap.get(id)?.sku || "", [productMap]);

  const filtered = useMemo(() => branchMovements.filter(m => {
    const productName = getProductName(m.product_id).toLowerCase();
    const matchSearch = productName.includes(debouncedSearch.toLowerCase()) || m.notes?.toLowerCase().includes(debouncedSearch.toLowerCase()) || getProductSku(m.product_id).toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchType = typeFilter === "all" || m.movement_type === typeFilter
      || (typeFilter === "transfer" && (m.movement_type === "transfer_out" || m.movement_type === "transfer_in"));
    const matchProduct = productFilter === "all" || m.product_id === productFilter;
    const mDate = m.created_at.split("T")[0];
    const matchDateFrom = !dateFrom || mDate >= dateFrom;
    const matchDateTo = !dateTo || mDate <= dateTo;
    return matchSearch && matchType && matchProduct && matchDateFrom && matchDateTo;
  }), [branchMovements, debouncedSearch, typeFilter, productFilter, dateFrom, dateTo, getProductName, getProductSku]);

  const { totalIn, totalOut, totalAdj, totalTransfer } = useMemo(() => ({
    totalIn: filtered.filter(m => m.movement_type === "in").reduce((s, m) => s + m.quantity, 0),
    totalOut: filtered.filter(m => m.movement_type === "out").reduce((s, m) => s + m.quantity, 0),
    totalAdj: filtered.filter(m => m.movement_type === "adjustment").reduce((s, m) => s + m.quantity, 0),
    totalTransfer: filtered.filter(m => m.movement_type === "transfer" || m.movement_type === "transfer_out" || m.movement_type === "transfer_in").reduce((s, m) => s + m.quantity, 0),
  }), [filtered]);

  const pagination = usePagination({ totalItems: filtered.length });
  const paginated = useMemo(
    () => filtered.slice(pagination.startIndex, pagination.endIndex),
    [filtered, pagination.startIndex, pagination.endIndex]
  );

  if (movementsLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const queryError = movementsError || productsError;
  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground text-center">Error al cargar los movimientos</p>
        <p className="text-xs text-muted-foreground">{queryError.message}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />Reintentar
        </Button>
      </div>
    );
  }

  const handleExportCSV = () => {
    const rows = filtered.map(m => ({
      date: m.created_at,
      productName: getProductName(m.product_id),
      productSku: getProductSku(m.product_id),
      movementType: movementConfig[m.movement_type]?.label || m.movement_type,
      quantity: m.quantity,
      branchName: getBranchName(m.branch_id),
      transferToBranch: m.transfer_to_branch_id ? getBranchName(m.transfer_to_branch_id) : null,
      referenceType: refTypeLabels[m.reference_type || ""] || m.reference_type || null,
      notes: m.notes,
    }));
    exportMovementsCSV(rows);
    showSuccess(`Exportados ${filtered.length} movimientos a CSV`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Historial de Movimientos</h1>
          <HelpHint {...HELP_TEXTS.stockMovements} />
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={filtered.length === 0} className="rounded-xl">
          <Download className="w-4 h-4 mr-2" />Exportar CSV
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Registro completo de entradas, salidas, ajustes y transferencias
        {branchId !== "all" ? ` · ${getBranchName(branchId)}` : " · Todas las sedes"}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm border-green-200 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center"><ArrowDown className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
            <div><p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">Entradas</p><p className="text-xl font-bold text-green-700 dark:text-green-300">{totalIn} uds.</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-red-200 dark:border-red-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center"><ArrowUp className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
            <div><p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase">Salidas</p><p className="text-xl font-bold text-red-700 dark:text-red-300">{totalOut} uds.</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center"><ArrowLeftRight className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
            <div><p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase">Ajustes</p><p className="text-xl font-bold text-amber-700 dark:text-amber-300">{totalAdj} uds.</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center"><ArrowLeftRight className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
            <div><p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase">Transferencias</p><p className="text-xl font-bold text-orange-700 dark:text-orange-300">{totalTransfer} uds.</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por producto, nota..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl w-[145px]" placeholder="Desde" />
          <span className="text-muted-foreground text-sm">—</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl w-[145px]" placeholder="Hasta" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="in">Entradas</SelectItem>
            <SelectItem value="out">Salidas</SelectItem>
            <SelectItem value="adjustment">Ajustes</SelectItem>
            <SelectItem value="transfer">Transferencias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-full sm:w-56 rounded-xl"><SelectValue placeholder="Producto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Cantidad</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Sede</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Referencia</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Notas</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(m => {
                  const cfg = movementConfig[m.movement_type] || movementConfig.adjustment;
                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(m.created_at)}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm truncate max-w-[200px]">{getProductName(m.product_id)}</p>
                        <p className="text-xs text-muted-foreground font-mono">{getProductSku(m.product_id)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${m.movement_type === "out" || m.movement_type === "transfer_out" ? "text-red-600 dark:text-red-400" : m.movement_type === "in" || m.movement_type === "transfer_in" || m.movement_type === "return" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {m.movement_type === "out" || m.movement_type === "transfer_out" ? "-" : "+"}{m.quantity}
                      </td>
                      <td className="py-3 px-4 text-center text-xs">
                        {m.transfer_to_branch_id && m.movement_type === "transfer_in" ? (
                          <>
                            <span className="text-muted-foreground">{getBranchName(m.transfer_to_branch_id)}</span>
                            <span className="text-orange-600 dark:text-orange-400"> → {getBranchName(m.branch_id)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground">{getBranchName(m.branch_id)}</span>
                            {m.transfer_to_branch_id && (
                              <span className="text-orange-600 dark:text-orange-400"> → {getBranchName(m.transfer_to_branch_id)}</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{refTypeLabels[m.reference_type || ""] || "—"}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-[250px] truncate hidden md:table-cell">{m.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron movimientos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationControls pagination={pagination} totalItems={filtered.length} itemLabel="movimientos" />
    </div>
  );
}