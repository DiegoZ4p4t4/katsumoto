import { useMemo, memo } from "react";
import type { Product, PriceTier } from "@/lib/types";

interface ProductStatsProps {
  filtered: Product[];
  priceTiers: PriceTier[];
}

export const ProductStats = memo(function ProductStats({ filtered, priceTiers }: ProductStatsProps) {
  const stats = useMemo(() => {
    const productsWithTiers = new Set(priceTiers.map((t) => t.product_id));
    let outOfStock = 0;
    let lowStock = 0;
    let overMax = 0;
    let withTiers = 0;
    for (const p of filtered) {
      if (p.stock === 0) outOfStock++;
      else if (p.stock > 0 && p.stock <= p.min_stock) lowStock++;
      if (p.stock > p.max_stock) overMax++;
      if (productsWithTiers.has(p.id)) withTiers++;
    }
    return { total: filtered.length, outOfStock, lowStock, overMax, withTiers };
  }, [filtered, priceTiers]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800">
        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Total</p>
        <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
          {stats.total}
        </p>
      </div>
      <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Agotados</p>
        <p className="text-xl font-bold text-red-700 dark:text-red-300">
          {stats.outOfStock}
        </p>
      </div>
      <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Stock Bajo</p>
        <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
          {stats.lowStock}
        </p>
      </div>
      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Excedidos</p>
        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
          {stats.overMax}
        </p>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Con Escalas</p>
        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
          {stats.withTiers}
        </p>
      </div>
    </div>
  );
});
