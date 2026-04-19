import type { BranchStock, Branch, Product } from "@/lib/types";

export function getBranchStock(branchStocks: BranchStock[], branchId: string, productId: string): number {
  return branchStocks.find((bs) => bs.branch_id === branchId && bs.product_id === productId)?.stock ?? 0;
}

export function getTotalStock(branchStocks: BranchStock[], productId: string): number {
  return branchStocks.filter((bs) => bs.product_id === productId).reduce((sum, bs) => sum + bs.stock, 0);
}

export function getProductsWithBranchStock(
  products: Product[],
  branchStocks: BranchStock[],
  branchId: string
): Product[] {
  if (branchId === "all") {
    return products.map((p) => {
      const allBs = branchStocks.filter((s) => s.product_id === p.id);
      const totalStock = allBs.reduce((sum, s) => sum + s.stock, 0);
      return { ...p, stock: totalStock };
    });
  }
  return products.map((p) => {
    const bs = branchStocks.find((s) => s.branch_id === branchId && s.product_id === p.id);
    return { ...p, stock: bs?.stock ?? 0, min_stock: bs?.min_stock ?? p.min_stock };
  });
}

export function getDisplayStock(stock: number, threshold = 20): string | number {
  if (stock <= 0) return "Agotado";
  if (stock <= threshold) return String(stock);
  return `>${threshold}`;
}

export function getWarehouseBranchId(branches: Branch[]): string | null {
  return branches.find((b) => b.type === "warehouse" && b.is_active)?.id ?? null;
}
