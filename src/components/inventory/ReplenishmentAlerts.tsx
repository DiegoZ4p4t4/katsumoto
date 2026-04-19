import { useMemo } from "react";
import { useBranches } from "@/hooks/useBranches";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, PackageX, ArrowRightLeft } from "lucide-react";

interface AlertItem {
  productId: string;
  productName: string;
  productSku: string;
  warehouseStock: number;
  posStock: number;
  minStock: number;
  type: "low_pos" | "low_warehouse" | "transfer_candidate";
  branchId?: string;
}

interface ReplenishmentAlertsProps {
  onTransferSuggest?: (productId: string, fromBranchId: string, toBranchId: string, quantity: number) => void;
}

export function ReplenishmentAlerts({ onTransferSuggest }: ReplenishmentAlertsProps) {
  const { branches, branchStocks } = useBranches();
  const { products } = useProducts();

  const { warehouseBranch, posBranches } = useMemo(() => {
    const wh = branches.find((b) => b.type === "warehouse" && b.is_active);
    const pos = branches.filter((b) => b.type === "pos" && b.is_active);
    return { warehouseBranch: wh, posBranches: pos };
  }, [branches]);

  const alerts = useMemo(() => {
    if (!warehouseBranch) return [];

    const items: AlertItem[] = [];
    const activeProducts = products.filter((p) => p.is_active);
    const seen = new Set<string>();

    for (const product of activeProducts) {
      const whStock = branchStocks.find(
        (bs) => bs.branch_id === warehouseBranch.id && bs.product_id === product.id
      );
      const warehouseStock = whStock?.stock ?? 0;
      const minStock = whStock?.min_stock ?? product.min_stock;

      for (const posBranch of posBranches) {
        const posBs = branchStocks.find(
          (bs) => bs.branch_id === posBranch.id && bs.product_id === product.id
        );
        const posStock = posBs?.stock ?? 0;
        const posMinStock = posBs?.min_stock ?? product.min_stock;

        const key = `${product.id}-${posBranch.id}`;

        if (posStock <= 0 && warehouseStock > 0 && !seen.has(key)) {
          seen.add(key);
          items.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseStock,
            posStock,
            minStock: posMinStock,
            type: "transfer_candidate",
            branchId: posBranch.id,
          });
        } else if (posStock > 0 && posStock <= posMinStock && !seen.has(key)) {
          seen.add(key);
          items.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseStock,
            posStock,
            minStock: posMinStock,
            type: "low_pos",
            branchId: posBranch.id,
          });
        }
      }

      if (warehouseStock > 0 && warehouseStock <= minStock) {
        const key = `${product.id}-wh`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseStock,
            posStock: 0,
            minStock,
            type: "low_warehouse",
          });
        }
      }
    }

    return items.sort((a, b) => {
      const priority = { transfer_candidate: 0, low_pos: 1, low_warehouse: 2 };
      return priority[a.type] - priority[b.type];
    });
  }, [products, branchStocks, warehouseBranch, posBranches]);

  const summary = useMemo(() => ({
    total: alerts.length,
    transferCandidates: alerts.filter((a) => a.type === "transfer_candidate").length,
    lowPos: alerts.filter((a) => a.type === "low_pos").length,
    lowWarehouse: alerts.filter((a) => a.type === "low_warehouse").length,
  }), [alerts]);

  if (alerts.length === 0) {
    return (
      <Card className="rounded-2xl shadow-sm border-green-200 dark:border-green-800">
        <CardContent className="p-8 text-center">
          <PackageX className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">Todo en orden</p>
          <p className="text-sm text-muted-foreground">No hay alertas de reabastecimiento</p>
        </CardContent>
      </Card>
    );
  }

  const typeConfig = {
    transfer_candidate: {
      label: "Transferir",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
      icon: ArrowRightLeft,
      description: "Agotado en POS, disponible en almacén",
    },
    low_pos: {
      label: "Stock bajo POS",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
      icon: TrendingDown,
      description: "Stock en POS por debajo del mínimo",
    },
    low_warehouse: {
      label: "Stock bajo almacén",
      color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
      icon: AlertTriangle,
      description: "Stock en almacén por debajo del mínimo",
    },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-xl border-orange-200 dark:border-orange-800">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por transferir</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{summary.transferCandidates}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200 dark:border-amber-800">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stock bajo POS</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{summary.lowPos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-red-200 dark:border-red-800">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stock bajo almacén</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{summary.lowWarehouse}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const cfg = typeConfig[alert.type];
          const Icon = cfg.icon;
          return (
            <div
              key={`${alert.productId}-${alert.type}-${alert.branchId || ""}`}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.productName}</p>
                <p className="text-xs text-muted-foreground font-mono">{alert.productSku}</p>
              </div>
              <div className="flex items-center gap-4 text-xs flex-shrink-0">
                <div className="text-center">
                  <p className="text-muted-foreground">Almacén</p>
                  <p className={`font-bold ${alert.warehouseStock <= 0 ? "text-red-600" : "text-green-600"}`}>{alert.warehouseStock}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">POS</p>
                  <p className={`font-bold ${alert.posStock <= 0 ? "text-red-600" : alert.posStock <= alert.minStock ? "text-amber-600" : "text-green-600"}`}>{alert.posStock}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Mín.</p>
                  <p className="font-bold">{alert.minStock}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                  {cfg.label}
                </span>
                {alert.type === "transfer_candidate" && warehouseBranch && posBranches[0] && onTransferSuggest && (
                  <button
                    onClick={() => onTransferSuggest(
                      alert.productId,
                      warehouseBranch.id,
                      posBranches[0].id,
                      Math.max(alert.minStock - alert.posStock, 1)
                    )}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors"
                  >
                    Transferir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
