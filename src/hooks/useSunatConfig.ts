import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sunatService } from "@/services/sunat.service";
import type { SunatConfigFormData } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { showSuccess, showError } from "@/utils/toast";

export function useSunatConfig() {
  const { data: config, isLoading, error } = useQuery({
    queryKey: queryKeys.sunat.config,
    queryFn: () => sunatService.getConfig(),
    staleTime: 30 * 60 * 1000,
  });

  return { config: config ?? null, isLoading, error };
}

export function useSunatSummaryLogs() {
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.sunat.summaryLogs,
    queryFn: () => sunatService.getSummaryLogs(),
    staleTime: 30 * 1000,
  });
  return { logs: data, isLoading };
}

export function useSunatMutations() {
  const queryClient = useQueryClient();

  const invalidateSunat = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sunat.config });
    queryClient.invalidateQueries({ queryKey: queryKeys.sunat.summaryLogs });
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
  };

  const saveConfig = useMutation({
    mutationFn: (formData: SunatConfigFormData) => sunatService.saveConfig(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sunat.config });
      showSuccess("Configuración SUNAT guardada");
    },
    onError: (err: Error) => showError(err.message),
  });

  const testConnection = useMutation({
    mutationFn: () => sunatService.testConnection(),
    onSuccess: (data) => {
      if (data.success) showSuccess("Conexión exitosa con SUNAT");
    },
    onError: (err: Error) => showError(err.message),
  });

  const sendInvoice = useMutation({
    mutationFn: (invoiceId: string) => sunatService.sendInvoice(invoiceId),
    onSuccess: () => invalidateSunat(),
    onError: (err: Error) => showError(err.message),
  });

  const checkTicket = useMutation({
    mutationFn: (ticket: string) => sunatService.checkTicket(ticket),
    onError: (err: Error) => showError(err.message),
  });

  const uploadCertificate = useMutation({
    mutationFn: (file: File) => sunatService.uploadCertificate(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sunat.config });
      showSuccess("Certificado subido correctamente");
    },
    onError: (err: Error) => showError(err.message),
  });

  const sendSummary = useMutation({
    mutationFn: (fecha: string) => sunatService.sendSummary(fecha),
    onSuccess: (res) => {
      invalidateSunat();
      if (res.success) showSuccess(`Resumen enviado: ${res.boletas_count} boletas`);
      else showError(res.error_message || "Error enviando resumen");
    },
    onError: (err: Error) => showError(err.message),
  });

  const sendVoided = useMutation({
    mutationFn: ({ invoiceId, motivo }: { invoiceId: string; motivo?: string }) =>
      sunatService.sendVoided(invoiceId, motivo),
    onSuccess: (res) => {
      invalidateSunat();
      if (res.success) showSuccess("Comunicación de baja enviada");
      else showError(res.error_message || "Error enviando baja");
    },
    onError: (err: Error) => showError(err.message),
  });

  const checkSummaryTicket = useMutation({
    mutationFn: ({ ticket, logId }: { ticket: string; logId?: string }) =>
      sunatService.checkSummaryTicket(ticket, logId),
    onSuccess: () => invalidateSunat(),
    onError: (err: Error) => showError(err.message),
  });

  return {
    saveConfig: saveConfig.mutate, isSaving: saveConfig.isPending,
    testConnection: testConnection.mutate, isTesting: testConnection.isPending, testResult: testConnection.data,
    sendInvoice: sendInvoice.mutate, isSending: sendInvoice.isPending, sendResult: sendInvoice.data,
    checkTicket: checkTicket.mutate, isChecking: checkTicket.isPending, checkResult: checkTicket.data,
    uploadCertificate: uploadCertificate.mutateAsync, isUploading: uploadCertificate.isPending,
    sendSummary: sendSummary.mutate, isSendingSummary: sendSummary.isPending,
    sendVoided: sendVoided.mutate, isSendingVoided: sendVoided.isPending,
    checkSummaryTicket: checkSummaryTicket.mutate, isCheckingSummary: checkSummaryTicket.isPending,
  };
}
