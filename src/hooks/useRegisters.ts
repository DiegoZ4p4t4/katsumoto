import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranches } from "@/hooks/useBranches";
import { registerService } from "@/services/register.service";
import { queryKeys } from "@/lib/query-keys";

export function useRegisters() {
  const { branches, selectedBranchId } = useBranches();

  const registersQueryKey = selectedBranchId === "all"
    ? queryKeys.registers.all
    : queryKeys.registers.branch(selectedBranchId);

  const registersQueryFn = selectedBranchId === "all"
    ? () => registerService.getAll()
    : () => registerService.getByBranch(selectedBranchId);

  const {
    data: registers = [],
    isLoading: registersLoading,
    error: registersError,
  } = useQuery({
    queryKey: registersQueryKey,
    queryFn: registersQueryFn,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: registerTransactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: queryKeys.registers.branch("all-transactions"),
    queryFn: () => registerService.getAllTransactions(),
    staleTime: 30 * 1000,
  });

  const activeRegister = useMemo(() => {
    if (selectedBranchId === "all") return null;
    const branch = branches.find((b) => b.id === selectedBranchId);
    if (!branch || branch.type === "warehouse") return null;
    return (
      registers.find(
        (r) => r.branch_id === selectedBranchId && r.status === "open"
      ) || null
    );
  }, [registers, branches, selectedBranchId]);

  const eligibleBranches = useMemo(
    () =>
      branches.filter(
        (b) =>
          b.is_active &&
          b.type !== "warehouse" &&
          !registers.some(
            (r) => r.branch_id === b.id && r.status === "open"
          )
      ),
    [branches, registers]
  );

  const getTransactions = useMemo(
    () => (regId: string) =>
      registerTransactions.filter((t) => t.register_id === regId),
    [registerTransactions]
  );

  return {
    registers,
    branchRegisters: registers,
    registerTransactions,
    activeRegister,
    eligibleBranches,
    getTransactions,
    selectedBranchId,
    isLoading: registersLoading || transactionsLoading,
    error: registersError || transactionsError,
  };
}
