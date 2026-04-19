import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { showSuccess, showError } from "@/utils/toast";
import { queryKeys } from "@/lib/query-keys";
import type { StoreOrder, StoreOrderStatus } from "@/lib/types";

export function useOrders() {
  const queryClient = useQueryClient();
  const ordersKey = queryKeys.orders.all;

  const optimisticStatusUpdate = (id: string, newStatus: string) => {
    const previous = queryClient.getQueryData<StoreOrder[]>(ordersKey);
    queryClient.setQueryData<StoreOrder[]>(ordersKey, (old = []) =>
      old.map((o) => (o.id === id ? { ...o, status: newStatus as StoreOrderStatus } : o))
    );
    return previous;
  };

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ordersKey,
    queryFn: () => orderService.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ordersKey });
      return { previous: optimisticStatusUpdate(id, status) };
    },
    onSuccess: (_, { status }) => showSuccess(`Pedido actualizado a: ${status}`),
    onError: (err: Error, { id: _id }, context) => {
      if (context?.previous) queryClient.setQueryData(ordersKey, context.previous);
      showError(`Error al actualizar: ${err.message}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersKey }),
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => orderService.fulfillOrder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ordersKey });
      return { previous: optimisticStatusUpdate(id, "completed") };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.allStock });
      queryClient.invalidateQueries({ queryKey: queryKeys.movements.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      showSuccess("Pedido completado. Factura generada y stock descontado.");
    },
    onError: (err: Error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ordersKey, context.previous);
      showError(`Error al completar: ${err.message}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersKey }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ordersKey });
      return { previous: optimisticStatusUpdate(id, "cancelled") };
    },
    onSuccess: () => showSuccess("Pedido anulado"),
    onError: (err: Error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ordersKey, context.previous);
      showError(`Error al anular: ${err.message}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersKey }),
  });

  const updateOrderStatus = useCallback((id: string, status: StoreOrderStatus) => {
    updateStatusMutation.mutate({ id, status });
  }, [updateStatusMutation]);

  const fulfillOrder = useCallback((id: string) => {
    fulfillMutation.mutate(id);
  }, [fulfillMutation]);

  const cancelOrder = useCallback((id: string) => {
    cancelMutation.mutate(id);
  }, [cancelMutation]);

  return {
    orders,
    updateOrderStatus,
    fulfillOrder,
    cancelOrder,
    isFulfilling: fulfillMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isLoading,
    error,
  };
}
