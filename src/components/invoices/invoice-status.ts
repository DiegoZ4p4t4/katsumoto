import { CheckCircle, CircleDot, Clock, XCircle, ShieldCheck } from "lucide-react";
import type { InvoiceStatus } from "@/lib/types";

export const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: "Pagado", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: CheckCircle },
  accepted: { label: "Aceptado SUNAT", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", icon: ShieldCheck },
  issued: { label: "Emitido", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: CircleDot },
  draft: { label: "Borrador", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: Clock },
  cancelled: { label: "Anulado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: XCircle },
};
