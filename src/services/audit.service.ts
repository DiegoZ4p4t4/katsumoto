import { supabase } from "@/lib/supabase";

type AuditAction =
  | "invoice.create"
  | "invoice.status_change"
  | "invoice.cancel"
  | "credit_note.create"
  | "order.create"
  | "order.status_change"
  | "order.cancel"
  | "register.open"
  | "register.close"
  | "sunat_config.save"
  | "certificate.upload"
  | "certificate.delete"
  | "role.change"
  | "user.invite";

export const auditService = {
  async log(
    action: AuditAction,
    entity: string,
    entityId?: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase.rpc("insert_audit_entry", {
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId ?? null,
      p_old_value: oldValue ?? null,
      p_new_value: newValue ?? null,
    });
    if (error) {
      console.error("[audit] Failed to log:", action, error.message);
    }
  },
};
