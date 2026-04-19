import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductsWithBranchStock } from "@/lib/utils/stock";
import { useBranches } from "@/hooks/useBranches";
import { useMachines } from "@/hooks/useMachines";
import { productService } from "@/services/product.service";
import { queryKeys } from "@/lib/query-keys";

export function useProducts() {
  const { selectedBranchId, branchStocks } = useBranches();
  const { productMachines, machineModels } = useMachines();

  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => productService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: priceTiers = [],
    isLoading: tiersLoading,
    error: tiersError,
  } = useQuery({
    queryKey: queryKeys.products.allTiers,
    queryFn: () => productService.getAllPriceTiers(),
    staleTime: 5 * 60 * 1000,
  });

  const branchProducts = useMemo(
    () => getProductsWithBranchStock(products, branchStocks, selectedBranchId),
    [products, branchStocks, selectedBranchId]
  );

  const activeBranchProducts = useMemo(
    () => branchProducts.filter((p) => p.is_active),
    [branchProducts]
  );

  return {
    products,
    branchProducts,
    activeBranchProducts,
    priceTiers,
    productMachines,
    machineModels,
    selectedBranchId,
    isLoading: productsLoading || tiersLoading,
    error: productsError || tiersError,
  };
}

export function useProductsWithMachines() {
  const { products, productMachines, machineModels } = useProducts();

  return useMemo(() => {
    return products.map((p) => ({
      product: p,
      machines: productMachines
        .filter((pm) => pm.product_id === p.id)
        .map((pm) => machineModels.find((m) => m.id === pm.machine_model_id))
        .filter(Boolean) as MachineModel[],
    }));
  }, [products, productMachines, machineModels]);
}
