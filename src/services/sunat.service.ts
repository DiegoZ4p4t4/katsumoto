import { supabase, getCurrentOrgId } from "@/lib/supabase";
import { auditService } from "@/services/audit.service";
import type { SunatConfig, SunatConfigFormData } from "@/lib/types";

async function invokeEF(name: string, body: Record<string, unknown>) {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.expires_at) {
    const expiresAt = session.session.expires_at * 1000;
    if (Date.now() >= expiresAt - 60_000) {
      await supabase.auth.refreshSession();
    }
  }
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message || "Error desconocido";
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx) {
        const parsed = await ctx.json();
        message = parsed.error || parsed.error_message || message;
      }
    } catch {}
    throw new Error(message);
  }
  return data;
}

export interface SunatSendResult {
  success: boolean;
  hash?: string | null;
  ticket?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  xml_path?: string | null;
  cdr_path?: string | null;
}

export interface SunatSummaryLog {
  id: string;
  organization_id: string;
  tipo: "resumen_diario" | "comunicacion_baja";
  ticket: string | null;
  fecha_referencia: string;
  status: "pending" | "processing" | "accepted" | "rejected";
  cdr_path: string | null;
  error_code: string | null;
  error_message: string | null;
  xml_path: string | null;
  created_at: string;
}

export const sunatService = {
  async getConfig(): Promise<SunatConfig | null> {
    return invokeEF("sunat-credentials", { action: "get" });
  },

  async saveConfig(formData: SunatConfigFormData): Promise<SunatConfig> {
    const data = await invokeEF("sunat-credentials", { action: "save", formData });
    auditService.log("sunat_config.save", "sunat_config", undefined, undefined, {
      ruc: formData.ruc,
    });
    return data;
  },

  async testConnection(): Promise<{ success: boolean; error_message?: string }> {
    return invokeEF("sunat-billing", { action: "test" });
  },

  async sendInvoice(invoiceId: string): Promise<SunatSendResult> {
    return invokeEF("sunat-billing", { action: "send", invoice_id: invoiceId });
  },

  async checkTicket(ticket: string): Promise<{ success: boolean; error_message?: string }> {
    return invokeEF("sunat-billing", { action: "check-ticket", ticket });
  },

  async sendSummary(fecha: string): Promise<SunatSendResult & { boletas_count?: number; log_id?: string }> {
    return invokeEF("sunat-billing", { action: "send-summary", fecha });
  },

  async sendVoided(invoiceId: string, motivo?: string): Promise<SunatSendResult & { log_id?: string }> {
    return invokeEF("sunat-billing", { action: "send-voided", invoice_id: invoiceId, motivo });
  },

  async sendDespatch(despatchId: string): Promise<SunatSendResult> {
    return invokeEF("sunat-billing", { action: "send-despatch", despatch_id: despatchId });
  },

  async checkSummaryTicket(ticket: string, summaryLogId?: string): Promise<{ success: boolean; error_message?: string }> {
    return invokeEF("sunat-billing", { action: "check-summary-ticket", ticket, summary_log_id: summaryLogId });
  },

  async getSummaryLogs(): Promise<SunatSummaryLog[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("sunat_summary_log")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async getXmlUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from("sunat-documents").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  async getCdrUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from("sunat-documents").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  async uploadCertificate(file: File): Promise<string> {
    const ALLOWED_EXTENSIONS = ["pem", "p12", "pfx"];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Extensión no permitida. Use: ${ALLOWED_EXTENSIONS.join(", ")}`);
    }
    if (file.size === 0) {
      throw new Error("El archivo está vacío.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("El archivo excede el tamaño máximo de 5MB.");
    }

    const orgId = await getCurrentOrgId();
    const path = `${orgId}/certificates/cert.${ext}`;

    const { data: existingFiles } = await supabase.storage
      .from("sunat-documents")
      .list(`${orgId}/certificates`);

    const currentFileName = existingFiles?.find(
      (f) => f.name.startsWith("cert.") && f.name !== `cert.${ext}`
    );
    if (currentFileName) {
      await supabase.storage
        .from("sunat-documents")
        .remove([`${orgId}/certificates/${currentFileName.name}`]);
    }

    const { error } = await supabase.storage
      .from("sunat-documents")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    auditService.log("certificate.upload", "sunat_config", undefined, undefined, {
      path, size_bytes: file.size, extension: ext,
    });
    return path;
  },

  async deleteCertificate(currentPath: string | null): Promise<void> {
    if (!currentPath) return;
    const { error } = await supabase.storage
      .from("sunat-documents")
      .remove([currentPath]);
    if (error) throw error;
    auditService.log("certificate.delete", "sunat_config", undefined, { path: currentPath });
  },
};
