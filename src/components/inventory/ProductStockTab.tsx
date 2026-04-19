import type { Product, Branch } from "@/lib/types";
import { Warehouse } from "lucide-react";

interface BranchStockInfo {
  branch: Branch;
  stock: number;
  minStock: number;
}

interface ProductStockTabProps {
  product: Product;
  branchStocks: BranchStockInfo[];
  activeBranches: Branch[];
}

export function ProductStockTab({ product, branchStocks, activeBranches }: ProductStockTabProps) {
  return (
    <div className="p-6 mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Distribución en {activeBranches.length} sede{activeBranches.length !== 1 ? "s" : ""}
        </p>
        <p className="text-sm font-bold">Total: <span className="text-emerald-600 dark:text-emerald-400">{product.stock}</span> {product.unit}</p>
      </div>
      <div className="space-y-3">
        {branchStocks.map(({ branch, stock, minStock }) => {
          const maxStock = product.max_stock > 0 ? Math.ceil(product.max_stock / activeBranches.length) : stock;
          const percent = maxStock > 0 ? Math.min(100, (stock / maxStock) * 100) : 0;
          const isBranchOut = stock === 0;
          const isBranchLow = stock > 0 && stock <= minStock;
          const barColor = isBranchOut ? "bg-red-400" : isBranchLow ? "bg-amber-400" : "bg-emerald-400";
          return (
            <div key={branch.id} className="p-4 bg-muted/30 rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center"><Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <div>
                    <p className="text-sm font-semibold">{branch.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{branch.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isBranchOut ? "text-red-600 dark:text-red-400" : isBranchLow ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{stock}</p>
                  <p className="text-[10px] text-muted-foreground">de {maxStock} {product.unit}</p>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Mín: {minStock}</span>
                {isBranchOut && <span className="text-red-500 dark:text-red-400 font-medium">Agotado</span>}
                {isBranchLow && !isBranchOut && <span className="text-amber-500 dark:text-amber-400 font-medium">Stock bajo</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
