import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customer.service";
import { queryKeys } from "@/lib/query-keys";

export function useClients() {
  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => customerService.getAll(),
    staleTime: 30 * 60 * 1000,
  });

  const { data: invoiceCounts = {} } = useQuery({
    queryKey: [queryKeys.clients.all, "invoice-counts"],
    queryFn: () => customerService.getInvoiceCounts(),
    staleTime: 5 * 60 * 1000,
  });

  const getInvoiceCount = useCallback(
    (clientId: string) => invoiceCounts[clientId] ?? 0,
    [invoiceCounts]
  );

  const usedCities = useMemo(() => {
    const cities = new Set(clients.map((c) => c.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [clients]);

  return {
    clients,
    getInvoiceCount,
    usedCities,
    isLoading,
    error,
  };
}
