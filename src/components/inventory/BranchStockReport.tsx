import { useMemo, useState } from "react";
import { useBranches } from "@/hooks/useBranches";
import { useProducts } from "@/hooks/useProducts";
import { getBranchStock, getTotalStock } from "@/lib/utils/stock";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, Store, Globe, Package, Search, Filter, type LucideIcon } from "lucide-react";

type FilterMode = "all" | "low_stock" | "out_of_stock" | "imbalance";

const branchTypeIcons: Record<string, LucideIcon> = { warehouse: Warehouse, pos: Store, online: Globe };

export function BranchStockReport() {
  const { branches, branchStocks } = useBranches();
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const activeBranches = useMemo(
    () => branches.filter((b) => b.is_active),
    [branches]
  );

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active),
    [products]
  );

  const reportData = useMemo(() => {
    return activeProducts
      .map((product) => {
        const branchData = activeBranches.map((branch) => {
          const stock = getBranchStock(branchStocks, branch.id, product.id);
          const bs = branchStocks.find(
            (b) => b.branch_id === branch.id && b.product_id === product.id
          );
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchType: branch.type,
            stock,
            minStock: bs?.min_stock ?? product.min_stock,
          };
        });
        const totalStock = getTotalStock(branchStocks, product.id);
        return {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          category: product.category,
          totalStock,
          branchData,
        };
      })
      .filter((item) => {
        const q = search.toLowerCase();
        if (q && !item.productName.toLowerCase().includes(q) && !item.productSku.toLowerCase().includes(q)) {
          return false;
        }
        if (filterMode === "out_of_stock") {
          return item.totalStock === 0;
        }
        if (filterMode === "low_stock") {
          return item.branchData.some(
            (bd) => bd.stock > 0 && bd.stock <= bd.minStock
          );
        }
        if (filterMode === "imbalance") {
          const stocks = item.branchData.map((bd) => bd.stock);
          const max = Math.max(...stocks);
          const zeroes = stocks.filter((s) => s === 0).length;
          return max > 0 && zeroes > 0;
        }
        return true;
      });
  }, [activeProducts, activeBranches, branchStocks, search, filterMode]);

  const branchSummary = useMemo(() => {
    return activeBranches.map((branch) => {
      const stocks = branchStocks.filter((bs) => bs.branch_id === branch.id);
      const totalProducts = stocks.filter((bs) => bs.stock > 0).length;
      const totalUnits = stocks.reduce((s, bs) => s + bs.stock, 0);
      const outOfStock = activeProducts.filter((p) => {
        const stock = getBranchStock(branchStocks, branch.id, p.id);
        return stock === 0;
      }).length;
      return { branch, totalProducts, totalUnits, outOfStock };
    });
  }, [activeBranches, branchStocks, activeProducts]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {branchSummary.map(({ branch, totalProducts, totalUnits, outOfStock }) => {
          const Icon = branchTypeIcons[branch.type] || Package;
          return (
            <Card key={branch.id} className="rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{branch.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{branch.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{totalProducts}</p>
                    <p className="text-[10px] text-muted-foreground">Con stock</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{totalUnits}</p>
                    <p className="text-[10px] text-muted-foreground">Uds. total</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{outOfStock}</p>
                    <p className="text-[10px] text-muted-foreground">Sin stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="rounded-xl w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="low_stock">Stock bajo</SelectItem>
              <SelectItem value="out_of_stock">Agotados</SelectItem>
              <SelectItem value="imbalance">Desbalance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Total</th>
                  {activeBranches.map((b) => (
                    <th key={b.id} className="text-center py-3 px-4 font-semibold text-muted-foreground">
                      {b.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((item) => (
                  <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.productSku}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${item.totalStock === 0 ? "text-red-600" : "text-foreground"}`}>
                        {item.totalStock}
                      </span>
                    </td>
                    {item.branchData.map((bd) => {
                      const isLow = bd.stock > 0 && bd.stock <= bd.minStock;
                      const isZero = bd.stock === 0;
                      return (
                        <td key={bd.branchId} className="py-3 px-4 text-center">
                          <span className={`font-bold ${isZero ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"}`}>
                            {bd.stock}
                          </span>
                          {isLow && !isZero && (
                            <p className="text-[10px] text-amber-600">mín. {bd.minStock}</p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={2 + activeBranches.length} className="text-center py-12 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                      <p>No se encontraron productos</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {reportData.length} productos · Filtrar por desbalance muestra productos con stock en una sede y agotados en otra
      </p>
    </div>
  );
}
