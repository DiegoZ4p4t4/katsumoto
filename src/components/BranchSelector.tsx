import { useBranches } from "@/hooks/useBranches";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Warehouse, Store, Globe, LayoutGrid, type LucideIcon } from "lucide-react";

const branchIcons: Record<string, LucideIcon> = {
  warehouse: Warehouse,
  pos: Store,
  online: Globe,
};

export function BranchSelector() {
  const { branches, selectedBranchId, setSelectedBranchId } = useBranches();

  return (
    <Select
      value={selectedBranchId}
      onValueChange={setSelectedBranchId}
    >
      <SelectTrigger className="w-[200px] rounded-xl h-9 text-xs gap-2 border-border/60 bg-muted/30">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
            Todas las Sedes
          </span>
        </SelectItem>
        {branches.filter(b => b.is_active).map((branch) => {
          const Icon = branchIcons[branch.type] || Building2;
          return (
            <SelectItem key={branch.id} value={branch.id}>
              <span className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {branch.name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
