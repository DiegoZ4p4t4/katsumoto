import { useMemo } from "react";
import { CATEGORY_TREE } from "@/lib/constants";
import type { ProductFamily } from "@/lib/types";
import type { ManagedCategoryFamily, ManagedCategoryGroup, ManagedCategory } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Briefcase, Wrench, Cog, Truck, Settings2, Layers, Folder, FolderOpen, Tag, FilterX, type LucideIcon } from "lucide-react";

const iconLookup: Record<string, LucideIcon> = {
  Package, Briefcase, Wrench, Cog, Truck, Settings2, Layers, Folder, FolderOpen, Tag,
};

export interface ManagedFilterData {
  families: ManagedCategoryFamily[];
  groups: ManagedCategoryGroup[];
  categories: ManagedCategory[];
}

interface CategoryTreeFilterProps {
  familyFilter: string;
  groupFilter: string;
  categoryFilter: string;
  onChange: (family: string, group: string, category: string) => void;
  compact?: boolean;
  showClear?: boolean;
  managedData?: ManagedFilterData;
}

interface FamilyOption {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  activeColor: string;
}

interface GroupOption {
  key: string;
  label: string;
  color: string;
}

export function CategoryTreeFilter({
  familyFilter,
  groupFilter,
  categoryFilter,
  onChange,
  compact = false,
  showClear = false,
  managedData,
}: CategoryTreeFilterProps) {
  const hasActiveFilter = familyFilter !== "all" || groupFilter !== "all" || categoryFilter !== "all";

  // Build family options from managed data or static constants
  const familyOptions: FamilyOption[] = useMemo(() => {
    if (managedData) {
      return [
        { key: "all", label: "Todos", icon: null, color: "text-muted-foreground", activeColor: "bg-foreground text-background" },
        ...managedData.families
          .sort((a, b) => a.order - b.order)
          .map((f) => ({
            key: f.key,
            label: f.label,
            icon: iconLookup[f.icon] || Package,
            color: f.color,
            activeColor: f.activeColor,
          })),
      ];
    }
    return [
      { key: "all", label: "Todos", icon: null, color: "text-muted-foreground", activeColor: "bg-foreground text-background" },
      { key: "productos", label: "Productos", icon: Package, color: "text-orange-600 dark:text-orange-400", activeColor: "bg-orange-600 text-white" },
      { key: "servicios", label: "Servicios", icon: Briefcase, color: "text-blue-600 dark:text-blue-400", activeColor: "bg-blue-600 text-white" },
    ];
  }, [managedData]);

  // Build group options for selected family
  const availableGroups: GroupOption[] = useMemo(() => {
    if (familyFilter === "all") {
      if (managedData) {
        return managedData.groups
          .sort((a, b) => a.order - b.order)
          .map((g) => ({ key: g.key, label: g.label, color: g.color }));
      }
      return Object.entries(CATEGORY_TREE).flatMap(([, fVal]) =>
        Object.entries(fVal.groups).map(([gKey, gVal]) => ({ key: gKey, label: gVal.label, color: gVal.color }))
      );
    }

    if (managedData) {
      const family = managedData.families.find((f) => f.key === familyFilter);
      if (!family) return [];
      return managedData.groups
        .filter((g) => g.familyId === family.id)
        .sort((a, b) => a.order - b.order)
        .map((g) => ({ key: g.key, label: g.label, color: g.color }));
    }

    const fam = CATEGORY_TREE[familyFilter as ProductFamily];
    if (!fam) return [];
    return Object.entries(fam.groups).map(([key, val]) => ({ key, label: val.label, color: val.color }));
  }, [familyFilter, managedData]);

  // Build category options for selected group
  const availableCategories: string[] = useMemo(() => {
    if (!groupFilter || groupFilter === "all") {
      if (managedData) {
        return managedData.categories.sort((a, b) => a.order - b.order).map((c) => c.name);
      }
      if (familyFilter === "all") return getAllCategories();
      const fam = CATEGORY_TREE[familyFilter as ProductFamily];
      if (!fam) return [];
      return Object.values(fam.groups).flatMap((g) => [...g.categories]);
    }

    if (managedData) {
      const group = managedData.groups.find((g) => g.key === groupFilter);
      if (!group) return [];
      return managedData.categories
        .filter((c) => c.groupId === group.id)
        .sort((a, b) => a.order - b.order)
        .map((c) => c.name);
    }

    const fam = CATEGORY_TREE[familyFilter as ProductFamily];
    if (!fam) return [];
    const grp = fam.groups[groupFilter];
    if (!grp) return [];
    return [...grp.categories];
  }, [familyFilter, groupFilter, managedData]);

  const handleFamilyChange = (v: string) => {
    onChange(v, "all", "all");
  };

  const handleGroupChange = (v: string) => {
    onChange(familyFilter, v, "all");
  };

  const handleCategoryChange = (v: string) => {
    onChange(familyFilter, groupFilter, v);
  };

  const handleClear = () => {
    onChange("all", "all", "all");
  };

  const triggerClass = compact
    ? "w-full sm:w-36 h-8 rounded-lg text-[11px] border-0 bg-muted/30 border border-border/40"
    : "w-full sm:w-44 rounded-xl";

  return (
    <>
      <div className="flex gap-1">
        {familyOptions.map((opt) => {
          const isActive = familyFilter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleFamilyChange(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? opt.activeColor + " shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.icon && <opt.icon className="w-3 h-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>

      <Select value={groupFilter} onValueChange={handleGroupChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los grupos</SelectItem>
          {availableGroups.map((g) => (
            <SelectItem key={g.key} value={g.key}>
              {g.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {availableCategories.length > 0 && (
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className={triggerClass}>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {compact ? "Todas" : "Todas las categorías"}
            </SelectItem>
            {availableCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showClear && hasActiveFilter && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-medium whitespace-nowrap"
        >
          <FilterX className="w-3 h-3" />
          Limpiar
        </button>
      )}
    </>
  );
}

export function getGroupInfo(groupKey: string, managedGroups?: ManagedCategoryGroup[]): { label: string; color: string } | null {
  if (managedGroups) {
    const grp = managedGroups.find((g) => g.key === groupKey);
    if (grp) return { label: grp.label, color: grp.color };
  }
  for (const fam of Object.values(CATEGORY_TREE)) {
    if (groupKey in fam.groups) {
      const grp = fam.groups[groupKey];
      return { label: grp.label, color: grp.color };
    }
  }
  return null;
}

export function getFamilyInfo(familyKey: string): { label: string; color: string; activeColor: string } | null {
  const fam = CATEGORY_TREE[familyKey as ProductFamily];
  if (!fam) return null;
  return { label: fam.label, color: fam.color, activeColor: fam.activeColor };
}

function getAllCategories(): string[] {
  return Object.values(CATEGORY_TREE).flatMap((f) =>
    Object.values(f.groups).flatMap((g) => [...g.categories])
  );
}