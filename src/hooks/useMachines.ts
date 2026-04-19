import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { machineService } from "@/services/machine.service";
import { queryKeys } from "@/lib/query-keys";

export function useMachines() {
  const {
    data: machineModels = [],
    isLoading: machinesLoading,
    error: machinesError,
  } = useQuery({
    queryKey: queryKeys.machines.all,
    queryFn: () => machineService.getAll(),
    staleTime: 30 * 60 * 1000,
  });

  const {
    data: productMachines = [],
    isLoading: pmLoading,
    error: pmError,
  } = useQuery({
    queryKey: queryKeys.machines.productMachines,
    queryFn: () => machineService.getAllProductMachines(),
    staleTime: 30 * 60 * 1000,
  });

  const getProductCount = useCallback(
    (machineId: string) =>
      productMachines.filter((pm) => pm.machine_model_id === machineId).length,
    [productMachines]
  );

  const usedBrands = useMemo(() => {
    const brands = new Set(machineModels.map((m) => m.brand));
    return Array.from(brands).sort();
  }, [machineModels]);

  return {
    machineModels,
    productMachines,
    getProductCount,
    usedBrands,
    isLoading: machinesLoading || pmLoading,
    error: machinesError || pmError,
  };
}
