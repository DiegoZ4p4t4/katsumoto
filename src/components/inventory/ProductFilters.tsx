import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryTreeFilter } from "@/components/CategoryTreeFilter";
import { TAX_AFFECTATION_TYPES } from "@/lib/constants";
import type { MachineModel } from "@/lib/types";
import { Search } from "lucide-react";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  taxFilter: string;
  onTaxFilterChange: (value: string) => void;
  machineFilter: string;
  onMachineFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  familyFilter: string;
  groupFilter: string;
  categoryFilter: string;
  onCategoryTreeChange: (family: string, group: string, category: string) => void;
  machineModels: MachineModel[];
  allTags: string[];
}

export function ProductFilters({
  search,
  onSearchChange,
  taxFilter,
  onTaxFilterChange,
  machineFilter,
  onMachineFilterChange,
  tagFilter,
  onTagFilterChange,
  familyFilter,
  groupFilter,
  categoryFilter,
  onCategoryTreeChange,
  machineModels,
  allTags,
}: ProductFiltersProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={taxFilter} onValueChange={onTaxFilterChange}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="Afectación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(TAX_AFFECTATION_TYPES).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                {info.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={machineFilter} onValueChange={onMachineFilterChange}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="Máquina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las máquinas</SelectItem>
            {machineModels
              .filter((m) => m.is_active)
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={onTagFilterChange}>
            <SelectTrigger className="w-full sm:w-40 rounded-xl">
              <SelectValue placeholder="Marca / Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <CategoryTreeFilter
          familyFilter={familyFilter}
          groupFilter={groupFilter}
          categoryFilter={categoryFilter}
          onChange={onCategoryTreeChange}
          showClear
        />
      </div>
    </>
  );
}
