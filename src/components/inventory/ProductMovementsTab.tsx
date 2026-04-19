import type { StockMovement } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  ArrowDown, ArrowUp, ArrowLeftRight, Activity,
  type LucideIcon,
} from "lucide-react";

const movementIcons: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  in: { icon: ArrowDown, color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  out: { icon: ArrowUp, color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  adjustment: { icon: ArrowLeftRight, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
};

interface ProductMovementsTabProps {
  movements: StockMovement[];
  getBranchName: (id: string) => string;
}

export function ProductMovementsTab({ movements, getBranchName }: ProductMovementsTabProps) {
  if (movements.length === 0) {
    return (
      <div className="p-6 mt-0">
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Activity className="w-7 h-7 text-muted-foreground/40" /></div>
          <p className="text-sm font-medium text-muted-foreground">Sin movimientos registrados</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Los movimientos aparecerán aquí al ajustar stock o emitir comprobantes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mt-0">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{movements.length} movimiento{movements.length !== 1 ? "s" : ""}</p>
        {movements.map(m => {
          const cfg = movementIcons[m.movement_type] || movementIcons.adjustment;
          const Icon = cfg.icon;
          const typeLabel = m.movement_type === "in" ? "Entrada" : m.movement_type === "out" ? "Salida" : m.movement_type === "transfer" ? "Transferencia" : "Ajuste";
          return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}><Icon className={`w-4 h-4 ${cfg.color}`} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{typeLabel}</p>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{getBranchName(m.branch_id)}</span>
                  {m.transfer_to_branch_id && (<><span className="text-[10px] text-muted-foreground">→</span><span className="text-[10px] text-blue-600 dark:text-blue-400">{getBranchName(m.transfer_to_branch_id)}</span></>)}
                </div>
                {m.notes && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{m.notes}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(m.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${m.movement_type === "out" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>{m.movement_type === "out" ? "−" : "+"}{m.quantity}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
