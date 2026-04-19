import { useMutation, useQueryClient } from "@tanstack/react-query";
import { despatchService } from "@/services/despatch.service";
import { sunatService } from "@/services/sunat.service";
import { showSuccess, showError } from "@/utils/toast";
import { queryKeys } from "@/lib/query-keys";
import type { DespatchFormData, DespatchStatus } from "@/lib/types/despatch";

export function useDespatchMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (formData: DespatchFormData) => despatchService.create(formData),
    onSuccess: (_, formData) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.despatches.all });
      showSuccess(`Guia T001 creada`);
    },
    onError: (err: Error) => showError(`Error al crear guia: ${err.message}`),
  });

  const sendToSunatMutation = useMutation({
    mutationFn: (despatchId: string) => sunatService.sendDespatch(despatchId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.despatches.all });
      if (result.success) {
        showSuccess("Guia aceptada por SUNAT");
      } else {
        showError(`SUNAT: ${result.error_message || "Error desconocido"}`);
      }
    },
    onError: (err: Error) => showError(`Error al enviar a SUNAT: ${err.message}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DespatchStatus }) =>
      despatchService.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.despatches.all });
      const labels: Record<DespatchStatus, string> = {
        draft: "marcada como borrador",
        issued: "marcada como emitida",
        accepted: "marcada como aceptada",
        cancelled: "anulada",
      };
      showSuccess(`Guia ${labels[status]}`);
    },
    onError: (err: Error) => showError(`Error: ${err.message}`),
  });

  return {
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    sendToSunat: sendToSunatMutation.mutate,
    isSendingToSunat: sendToSunatMutation.isPending,
    updateStatus: (id: string, status: DespatchStatus) =>
      updateStatusMutation.mutate({ id, status }),
  };
}
