import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { MACHINE_CATEGORIES, MACHINE_CATEGORY_KEYS } from "@/lib/constants";

interface MachineFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  brandFilter: string;
  onBrandChange: (value: string) => void;
  usedBrands: string[];
}

export function MachineFilters({ search, onSearchChange, categoryFilter, onCategoryChange, brandFilter, onBrandChange, usedBrands }: MachineFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, marca o modelo..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48 rounded-xl">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {MACHINE_CATEGORY_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {MACHINE_CATEGORIES[key]?.label || key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={brandFilter} onValueChange={onBrandChange}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl">
          <SelectValue placeholder="Marca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las marcas</SelectItem>
          {usedBrands.map((b) => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
