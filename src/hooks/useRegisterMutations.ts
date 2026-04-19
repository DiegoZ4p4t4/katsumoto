import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerService } from "@/services/register.service";
import { showSuccess, showError } from "@/utils/toast";
import { queryKeys } from "@/lib/query-keys";
import { sunatService } from "@/services/sunat.service";

export function useRegisterMutations() {
  const queryClient = useQueryClient();

  const sendAutoSummary = async () => {
    try {
      const config = await sunatService.getConfig();
      if (!config?.is_configured) return;
      const today = new Date().toISOString().split("T")[0];
      await sunatService.sendSummary(today);
      showSuccess("Resumen diario enviado a SUNAT automáticamente");
    } catch {
      // no bloqueamos el cierre de caja si falla el resumen
    }
  };

  const openRegisterMutation = useMutation({
    mutationFn: ({
      branchId,
      openingAmountCents,
    }: {
      branchId: string;
      openingAmountCents: number;
    }) => registerService.open(branchId, openingAmountCents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registers.all });
      showSuccess("Caja abierta");
    },
    onError: (error) => {
      showError(error.message || "Error al abrir caja");
    },
  });

  const closeRegisterMutation = useMutation({
    mutationFn: ({
      registerId,
      closingAmountCents,
      expectedClosingCents,
    }: {
      registerId: string;
      closingAmountCents: number;
      expectedClosingCents: number;
    }) =>
      registerService.close(registerId, closingAmountCents, expectedClosingCents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      showSuccess("Caja cerrada correctamente");
      void sendAutoSummary();
    },
    onError: (error) => {
      showError(error.message || "Error al cerrar caja");
    },
  });

  const openRegister = useCallback((branchId: string, openingAmountCents: number) =>
    openRegisterMutation.mutate({ branchId, openingAmountCents }), [openRegisterMutation]);

  const closeRegister = useCallback((
    registerId: string,
    closingAmountCents: number,
    expectedClosingCents: number
  ) =>
    closeRegisterMutation.mutate({
      registerId,
      closingAmountCents,
      expectedClosingCents,
    }), [closeRegisterMutation]);

  return {
    openRegister,
    closeRegister,
    isOpening: openRegisterMutation.isPending,
    isClosing: closeRegisterMutation.isPending,
  };
}
