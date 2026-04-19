import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoice.service";
import { showSuccess, showError } from "@/utils/toast";
import { queryKeys } from "@/lib/query-keys";
import type { InvoiceStatus } from "@/lib/types";

export function useInvoiceMutations() {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      invoiceService.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      const labels: Record<InvoiceStatus, string> = {
        paid: "marcado como pagado",
        issued: "marcado como emitido",
        accepted: "marcado como aceptado",
        draft: "marcado como borrador",
        cancelled: "anulado",
      };
      showSuccess(`Comprobante ${labels[status]}`);
    },
    onError: (err: Error) => showError(`Error al actualizar estado: ${err.message}`),
  });

  const updateStatus = (id: string, status: InvoiceStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return {
    updateStatus,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
