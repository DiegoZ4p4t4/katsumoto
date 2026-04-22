import { useState, useMemo } from "react";
import { useBranches } from "@/hooks/useBranches";
import { useStockMovements } from "@/hooks/useStockMovements";
import { formatCents, formatDate, formatDateTime } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";

// ==========================================
// Kardex Entry — Fila del registro
// ==========================================
interface KardexEntry {
  date: string;
  concept: string;
  type: "in" | "out" | "adjustment" | "transfer";
  entryQty: number;
  entryCost: number;
  entryTotal: number;
  exitQty: number;
  exitCost: number;
  exitTotal: number;
  balanceQty: number;
  balanceCost: number;
  balanceTotal: number;
  branchName: string;
}

interface ProductKardexProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductKardex({ product, open, onClose }: ProductKardexProps) {
  const { branches, getBranchName: _getBranchNameFromHook } = useBranches();
  const { movements } = useStockMovements();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  // Reset filters when product changes
  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setBranchFilter("all");
  };

  const handleClose = () => {
    resetFilters();
    onClose();
  };

  const getBranchName = (id: string) =>
    branches.find(b => b.id === id)?.name || "—";

  // ==========================================
  // Build Kardex using Weighted Average Cost
  // ==========================================
  const { entries, initialBalance } = useMemo(() => {
    if (!product) return { entries: [] as KardexEntry[], initialBalance: null };

    const filteredMovements = movements
      .filter(m => m.product_id === product.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Determine which movements are before the date filter
    // to calculate the initial balance
    const filterStartDate = dateFrom ? new Date(dateFrom) : null;
    const filterEndDate = dateTo ? new Date(dateTo + "T23:59:59.999") : null;

    // Calculate running totals from ALL movements first
    let runningQty = 0;
    let runningTotalCost = 0;
    let runningAvgCost = product.cost_cents; // initial cost as baseline

    interface RunningEntry {
      date: string;
      concept: string;
      type: "in" | "out" | "adjustment" | "transfer" | "transfer_out" | "transfer_in" | "return";
      entryQty: number;
      entryCost: number;
      entryTotal: number;
      exitQty: number;
      exitCost: number;
      exitTotal: number;
      balanceQty: number;
      balanceCost: number;
      balanceTotal: number;
      branchName: string;
      created_at: string;
    }

    const allEntries: RunningEntry[] = [];

    for (const m of filteredMovements) {
      // Apply branch filter
      if (branchFilter !== "all" && m.branch_id !== branchFilter) continue;

      const branchName = getBranchName(m.branch_id);
      const isEntry = m.movement_type === "in" || m.movement_type === "return" || m.movement_type === "transfer_in" || (m.movement_type === "adjustment" && m.quantity > 0);
      const isExit = m.movement_type === "out" || m.movement_type === "transfer_out" || (m.movement_type === "adjustment" && m.quantity < 0);
      const isTransfer = m.movement_type === "transfer" || m.movement_type === "transfer_out" || m.movement_type === "transfer_in";

      let entryQty = 0, entryCost = 0, entryTotal = 0;
      let exitQty = 0, exitCost = 0, exitTotal = 0;

      if (isEntry) {
        const qty = Math.abs(m.quantity);
        entryQty = qty;
        // Use product cost_cents as the entry unit cost
        // In a real system this would come from the purchase order
        entryCost = product.cost_cents;
        entryTotal = qty * entryCost;

        runningQty += qty;
        runningTotalCost += entryTotal;
        runningAvgCost = runningQty > 0 ? runningTotalCost / runningQty : 0;
      } else if (isExit) {
        const qty = Math.abs(m.quantity);
        exitQty = qty;
        exitCost = runningAvgCost;
        exitTotal = qty * exitCost;

        runningQty -= qty;
        runningTotalCost -= exitTotal;
        if (runningQty < 0) runningQty = 0;
        if (runningTotalCost < 0) runningTotalCost = 0;
        runningAvgCost = runningQty > 0 ? runningTotalCost / runningQty : runningAvgCost;
      } else if (isTransfer) {
        const qty = Math.abs(m.quantity);
        exitQty = qty;
        exitCost = runningAvgCost;
        exitTotal = qty * exitCost;

        runningQty -= qty;
        runningTotalCost -= exitTotal;
        if (runningQty < 0) runningQty = 0;
        if (runningTotalCost < 0) runningTotalCost = 0;
        runningAvgCost = runningQty > 0 ? runningTotalCost / runningQty : runningAvgCost;
      }

      const concept = getConceptLabel(m);

      allEntries.push({
        date: m.created_at,
        concept,
        type: m.movement_type,
        entryQty, entryCost, entryTotal,
        exitQty, exitCost, exitTotal,
        balanceQty: runningQty,
        balanceCost: runningAvgCost,
        balanceTotal: runningQty * runningAvgCost,
        branchName,
        created_at: m.created_at,
      });
    }

    // Apply date filter for display
    let displayEntries = allEntries;
    if (filterStartDate) {
      displayEntries = displayEntries.filter(e => new Date(e.created_at) >= filterStartDate!);
    }
    if (filterEndDate) {
      displayEntries = displayEntries.filter(e => new Date(e.created_at) <= filterEndDate!);
    }

    // Calculate initial balance (sum of all entries before the filter start date)
    let initQty = 0;
    let initTotalCost = 0;
    if (filterStartDate) {
      const beforeEntries = allEntries.filter(e => new Date(e.created_at) < filterStartDate!);
      for (const e of beforeEntries) {
        initQty = e.balanceQty;
        initTotalCost = e.balanceTotal;
      }
    }

    return {
      entries: displayEntries,
      initialBalance: filterStartDate ? {
        qty: initQty,
        avgCost: initQty > 0 ? initTotalCost / initQty : 0,
        total: initTotalCost,
      } : null,
    };
  }, [product, movements, dateFrom, dateTo, branchFilter, getBranchName]);

  // ==========================================
  // CSV Export for Kardex
  // ==========================================
  const handleExportCSV = () => {
    if (!product) return;

    const headers = [
      "Fecha", "Concepto", "Tipo",
      "Entrada Cantidad", "Entrada Costo Unit.", "Entrada Total",
      "Salida Cantidad", "Salida Costo Unit.", "Salida Total",
      "Saldo Cantidad", "Saldo Costo Unit.", "Saldo Total",
      "Sede",
    ];

    const csvEscape = (v: string | number) => {
      const str = String(v);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const fmtC = (v: number) => formatCents(v);

    const rows: string[][] = [];

    // Initial balance row if filtered
    if (initialBalance) {
      rows.push([
        csvEscape(formatDate(dateFrom)),
        csvEscape("Saldo Inicial"),
        "—",
        "0", "0", "0",
        "0", "0", "0",
        csvEscape(String(initialBalance.qty)),
        csvEscape(fmtC(initialBalance.avgCost)),
        csvEscape(fmtC(initialBalance.total)),
        "—",
      ]);
    }

    for (const e of entries) {
      rows.push([
        csvEscape(formatDate(e.date)),
        csvEscape(e.concept),
        csvEscape(typeLabel(e.type)),
        csvEscape(String(e.entryQty)),
        csvEscape(e.entryQty > 0 ? fmtC(e.entryCost) : "—"),
        csvEscape(e.entryQty > 0 ? fmtC(e.entryTotal) : "—"),
        csvEscape(String(e.exitQty)),
        csvEscape(e.exitQty > 0 ? fmtC(e.exitCost) : "—"),
        csvEscape(e.exitQty > 0 ? fmtC(e.exitTotal) : "—"),
        csvEscape(String(e.balanceQty)),
        csvEscape(fmtC(e.balanceCost)),
        csvEscape(fmtC(e.balanceTotal)),
        csvEscape(e.branchName),
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kardex_${product.sku}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!product) return null;

  // Latest balance
  const latestBalance = entries.length > 0
    ? entries[entries.length - 1]
    : null;

  const currentQty = initialBalance
    ? (latestBalance?.balanceQty ?? initialBalance.qty)
    : (latestBalance?.balanceQty ?? 0);
  const currentCost = initialBalance
    ? (latestBalance?.balanceCost ?? initialBalance.avgCost)
    : (latestBalance?.balanceCost ?? 0);
  const currentTotal = initialBalance
    ? (latestBalance?.balanceTotal ?? initialBalance.total)
    : (latestBalance?.balanceTotal ?? 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Kardex — {product.name}
            </DialogTitle>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={handleExportCSV} disabled={entries.length === 0}>
              <Download className="w-4 h-4" />CSV
            </Button>
          </div>
        </DialogHeader>

        {/* Product Info Bar */}
        <div className="flex flex-wrap gap-3 px-1 text-sm">
          <Badge variant="secondary" className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">{product.sku}</Badge>
          <Badge variant="secondary" className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{product.category}</Badge>
          <Badge variant="secondary" className="rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{product.unit}</Badge>
          <Badge variant="secondary" className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Precio: {formatCents(product.price_cents)}</Badge>
          <Badge variant="secondary" className="rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Stock actual: {product.stock}</Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 px-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Desde:</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl h-9 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Hasta:</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl h-9 text-sm" />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl h-9 text-sm">
              <SelectValue placeholder="Sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sedes</SelectItem>
              {branches.filter(b => b.is_active).map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="rounded-xl text-xs h-9" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 px-1">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase">Saldo Cantidad</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{currentQty} <span className="text-xs font-normal">{product.unit}</span></p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">Costo Promedio</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCents(currentCost)}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium uppercase">Valor en Stock</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{formatCents(currentTotal)}</p>
          </div>
        </div>

        {/* Kardex Table */}
        <div className="flex-1 overflow-auto border rounded-2xl">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/90 backdrop-blur-sm border-b">
                <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground" rowSpan={2}>Fecha</th>
                <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground" rowSpan={2}>Concepto</th>
                <th className="py-1 px-3 text-center font-semibold text-green-700 dark:text-green-400 bg-green-50/80 dark:bg-green-900/30 border-b" colSpan={3}>
                  <div className="flex items-center justify-center gap-1">
                    <ArrowDown className="w-3 h-3" /> ENTRADA
                  </div>
                </th>
                <th className="py-1 px-3 text-center font-semibold text-red-700 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 border-b" colSpan={3}>
                  <div className="flex items-center justify-center gap-1">
                    <ArrowUp className="w-3 h-3" /> SALIDA
                  </div>
                </th>
                <th className="py-1 px-3 text-center font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 border-b" colSpan={3}>
                  <div className="flex items-center justify-center gap-1">
                    <ArrowLeftRight className="w-3 h-3" /> SALDO
                  </div>
                </th>
                <th className="py-2.5 px-3 text-left font-semibold text-muted-foreground" rowSpan={2}>Sede</th>
              </tr>
              <tr className="bg-muted/90 border-b">
                <th className="py-1.5 px-2 text-right font-medium text-green-600 dark:text-green-400 bg-green-50/40 dark:bg-green-900/20">Cant.</th>
                <th className="py-1.5 px-2 text-right font-medium text-green-600 dark:text-green-400 bg-green-50/40 dark:bg-green-900/20">C. Unit.</th>
                <th className="py-1.5 px-2 text-right font-medium text-green-600 dark:text-green-400 bg-green-50/40 dark:bg-green-900/20">Total</th>
                <th className="py-1.5 px-2 text-right font-medium text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-900/20">Cant.</th>
                <th className="py-1.5 px-2 text-right font-medium text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-900/20">C. Unit.</th>
                <th className="py-1.5 px-2 text-right font-medium text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-900/20">Total</th>
                <th className="py-1.5 px-2 text-right font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/20">Cant.</th>
                <th className="py-1.5 px-2 text-right font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/20">C. Unit.</th>
                <th className="py-1.5 px-2 text-right font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/20">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Initial Balance Row */}
              {initialBalance && (
                <tr className="border-b bg-muted/30 font-medium">
                  <td className="py-2 px-3 text-muted-foreground">{formatDate(dateFrom)}</td>
                  <td className="py-2 px-3 text-foreground">Saldo Inicial</td>
                  <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">—</td>
                  <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">—</td>
                  <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">—</td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">—</td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">—</td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">—</td>
                  <td className="py-2 px-2 text-right font-bold text-blue-700 dark:text-blue-400">{initialBalance.qty}</td>
                  <td className="py-2 px-2 text-right font-bold text-blue-700 dark:text-blue-400">{formatCents(initialBalance.avgCost)}</td>
                  <td className="py-2 px-2 text-right font-bold text-blue-700 dark:text-blue-400">{formatCents(initialBalance.total)}</td>
                  <td className="py-2 px-3 text-muted-foreground">—</td>
                </tr>
              )}

              {entries.map((entry, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{formatDateTime(entry.date)}</td>
                  <td className="py-2 px-3 max-w-[200px] truncate" title={entry.concept}>{entry.concept}</td>
                  {/* Entry */}
                  <td className="py-2 px-2 text-right text-green-700 dark:text-green-400 font-medium">{entry.entryQty > 0 ? entry.entryQty : ""}</td>
                  <td className="py-2 px-2 text-right text-green-700 dark:text-green-400">{entry.entryQty > 0 ? formatCents(entry.entryCost) : ""}</td>
                  <td className="py-2 px-2 text-right text-green-700 dark:text-green-400 font-medium">{entry.entryQty > 0 ? formatCents(entry.entryTotal) : ""}</td>
                  {/* Exit */}
                  <td className="py-2 px-2 text-right text-red-700 dark:text-red-400 font-medium">{entry.exitQty > 0 ? entry.exitQty : ""}</td>
                  <td className="py-2 px-2 text-right text-red-700 dark:text-red-400">{entry.exitQty > 0 ? formatCents(entry.exitCost) : ""}</td>
                  <td className="py-2 px-2 text-right text-red-700 dark:text-red-400 font-medium">{entry.exitQty > 0 ? formatCents(entry.exitTotal) : ""}</td>
                  {/* Balance */}
                  <td className="py-2 px-2 text-right font-bold text-blue-700 dark:text-blue-400">{entry.balanceQty}</td>
                  <td className="py-2 px-2 text-right text-blue-700 dark:text-blue-400">{formatCents(entry.balanceCost)}</td>
                  <td className="py-2 px-2 text-right font-bold text-blue-700 dark:text-blue-400">{formatCents(entry.balanceTotal)}</td>
                  {/* Branch */}
                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{entry.branchName}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {entries.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay movimientos para este período</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Intenta cambiar los filtros de fecha o sede</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground pt-1">
          Método: Promedio Ponderado · Moneda: PEN (Soles) · IGV: 18%
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Helper functions
// ==========================================

function getConceptLabel(m: { movement_type: string; notes: string | null; reference_type: string | null }): string {
  if (m.notes) return m.notes;
  switch (m.movement_type) {
    case "in": return "Entrada por compra";
    case "out": return m.reference_type === "invoice" ? "Salida por venta" : "Salida";
    case "adjustment": return "Ajuste de inventario";
    case "transfer": return "Transferencia entre sedes";
    case "transfer_out": return "Salida por transferencia";
    case "transfer_in": return "Entrada por transferencia";
    case "return": return "Devolución";
    default: return "Movimiento";
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "in": return "Entrada";
    case "out": return "Salida";
    case "adjustment": return "Ajuste";
    case "transfer": return "Transferencia";
    case "transfer_out": return "Transf. salida";
    case "transfer_in": return "Transf. entrada";
    case "return": return "Devolución";
    default: return type;
  }
}