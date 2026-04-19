import { useQuery } from "@tanstack/react-query";
import { useBranches } from "@/hooks/useBranches";
import { invoiceService } from "@/services/invoice.service";
import { queryKeys } from "@/lib/query-keys";

export function useInvoices() {
  const { selectedBranchId, getBranchName } = useBranches();

  const queryKey = selectedBranchId === "all"
    ? queryKeys.invoices.all
    : queryKeys.invoices.branch(selectedBranchId);

  const queryFn = selectedBranchId === "all"
    ? () => invoiceService.getAll()
    : () => invoiceService.getByBranch(selectedBranchId);

  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn,
    staleTime: 30 * 1000,
  });

  return {
    invoices,
    branchInvoices: invoices,
    getBranchName,
    selectedBranchId,
    isLoading,
    error,
  };
}
