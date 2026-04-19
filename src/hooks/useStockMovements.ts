import { useQuery } from "@tanstack/react-query";
import { useBranches } from "@/hooks/useBranches";
import { stockService } from "@/services/stock.service";
import { queryKeys } from "@/lib/query-keys";

export function useStockMovements() {
  const { selectedBranchId, getBranchName } = useBranches();

  const queryKey = selectedBranchId === "all"
    ? queryKeys.movements.all
    : queryKeys.movements.branch(selectedBranchId);

  const queryFn = selectedBranchId === "all"
    ? () => stockService.getAllMovements()
    : () => stockService.getMovementsByBranch(selectedBranchId);

  const {
    data: movements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn,
    staleTime: 30 * 1000,
  });

  return {
    movements,
    branchMovements: movements,
    selectedBranchId,
    getBranchName,
    isLoading,
    error,
  };
}
