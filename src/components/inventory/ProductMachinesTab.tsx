import type { MachineModel } from "@/lib/types";
import { MACHINE_CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Cog } from "lucide-react";

interface ProductMachinesTabProps {
  machines: MachineModel[];
}

export function ProductMachinesTab({ machines }: ProductMachinesTabProps) {
  if (machines.length === 0) {
    return (
      <div className="p-6 mt-0">
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Cog className="w-7 h-7 text-muted-foreground/40" /></div>
          <p className="text-sm font-medium text-muted-foreground">Sin máquinas compatibles</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Edita el producto para asignar modelos de máquina</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mt-0">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{machines.length} modelo{machines.length !== 1 ? "s" : ""} compatible{machines.length !== 1 ? "s" : ""}</p>
        <div className="space-y-2">
          {machines.map(machine => {
            const catInfo = MACHINE_CATEGORIES[machine.category];
            return (
              <div key={machine.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catInfo?.color || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}><Cog className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{machine.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{machine.brand}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-xs font-mono text-muted-foreground">{machine.model}</span>
                    {machine.year && (<><span className="text-[10px] text-muted-foreground">·</span><span className="text-xs text-muted-foreground">{machine.year}</span></>)}
                  </div>
                </div>
                {catInfo && <Badge variant="outline" className={`text-[9px] rounded-lg flex-shrink-0 ${catInfo.color} border`}>{catInfo.label.split(" ")[0]}</Badge>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
