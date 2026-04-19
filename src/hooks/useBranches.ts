import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranchSelection } from "@/lib/branch-selection-context";
import { branchService } from "@/services/branch.service";
import { getBranchStock, getTotalStock } from "@/lib/utils/stock";
import { queryKeys } from "@/lib/query-keys";

export function useBranches() {
  const { selectedBranchId, setSelectedBranchId } = useBranchSelection();

  const {
    data: branches = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useQuery({
    queryKey: queryKeys.branches.all,
    queryFn: () => branchService.getAll(),
    staleTime: 30 * 60 * 1000,
  });

  const {
    data: branchStocks = [],
    isLoading: stockLoading,
    error: stockError,
  } = useQuery({
    queryKey: queryKeys.branches.allStock,
    queryFn: () => branchService.getAllStock(),
    staleTime: 2 * 60 * 1000,
  });

  const getBranchName = useCallback(
    (id: string) => branches.find((b) => b.id === id)?.name || "\u2014",
    [branches]
  );

  const findBranch = useCallback(
    (id: string) => branches.find((b) => b.id === id) || null,
    [branches]
  );

  const getStockForProduct = useCallback(
    (branchId: string, productId: string) =>
      getBranchStock(branchStocks, branchId, productId),
    [branchStocks]
  );

  const getTotalStockForProduct = useCallback(
    (productId: string) => getTotalStock(branchStocks, productId),
    [branchStocks]
  );

  const getBranchStocks = useCallback(
    (branchId: string) =>
      branchStocks.filter((bs) => bs.branch_id === branchId),
    [branchStocks]
  );

  return {
    branches,
    branchStocks,
    selectedBranchId,
    setSelectedBranchId,
    getBranchName,
    findBranch,
    getStockForProduct,
    getTotalStockForProduct,
    getBranchStocks,
    isLoading: branchesLoading || stockLoading,
    error: branchesError || stockError,
  };
}
