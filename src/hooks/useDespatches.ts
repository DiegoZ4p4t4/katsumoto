import { useQuery } from "@tanstack/react-query";
import { despatchService } from "@/services/despatch.service";
import { useBranchSelection } from "@/lib/branch-selection-context";
import { queryKeys } from "@/lib/query-keys";

export function useDespatches() {
  const { selectedBranchId } = useBranchSelection();

  const {
    data: despatches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: selectedBranchId === "all"
      ? queryKeys.despatches.all
      : [...queryKeys.despatches.all, "branch", selectedBranchId],
    queryFn: () => despatchService.getAll(),
    select: (data) => selectedBranchId === "all"
      ? data
      : data.filter((d) => d.branch_id === selectedBranchId),
    staleTime: 30 * 1000,
  });

  return {
    despatches,
    isLoading,
    error,
  };
}

export function useDespatchDetail(id: string | null) {
  const {
    data: despatch,
    isLoading,
    error,
  } = useQuery({
    queryKey: id ? queryKeys.despatches.detail(id) : ["despatches", "null"],
    queryFn: () => despatchService.getById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  return {
    despatch,
    isLoading,
    error,
  };
}
