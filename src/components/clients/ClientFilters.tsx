import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Search } from "lucide-react";

interface ClientFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  docFilter: string;
  onDocFilterChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  usedCities: string[];
}

export function ClientFilters({
  search,
  onSearchChange,
  docFilter,
  onDocFilterChange,
  cityFilter,
  onCityFilterChange,
  usedCities,
}: ClientFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, documento o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>
      <Select value={docFilter} onValueChange={onDocFilterChange}>
        <SelectTrigger className="w-full sm:w-40 rounded-xl">
          <SelectValue placeholder="Tipo Doc." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {DOCUMENT_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={cityFilter} onValueChange={onCityFilterChange}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {usedCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
