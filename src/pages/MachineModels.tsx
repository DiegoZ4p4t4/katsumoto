import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { useMachines } from "@/hooks/useMachines";
import { useMachineMutations } from "@/hooks/useMachineMutations";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import type { MachineModel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { MachineStats } from "@/components/machines/MachineStats";
import { MachineFilters } from "@/components/machines/MachineFilters";
import { MachineTable } from "@/components/machines/MachineTable";
import { MachineFormDialog } from "@/components/machines/MachineFormDialog";
import type { MachineFormValues } from "@/lib/schemas";

export default function MachineModels() {
  const { machineModels, getProductCount, usedBrands } = useMachines();
  const { saveMachineAsync, deleteMachine, isSaving: _isSaving } = useMachineMutations();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineModel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return machineModels.filter((m) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.model.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || m.category === categoryFilter;
      const matchBrand = brandFilter === "all" || m.brand === brandFilter;
      return matchSearch && matchCategory && matchBrand;
    });
  }, [machineModels, debouncedSearch, categoryFilter, brandFilter]);

  const machineComparators = useMemo(() => ({
    name: (a: MachineModel, b: MachineModel) => a.name.localeCompare(b.name),
    brand: (a: MachineModel, b: MachineModel) => a.brand.localeCompare(b.brand),
    model: (a: MachineModel, b: MachineModel) => a.model.localeCompare(b.model),
    category: (a: MachineModel, b: MachineModel) => a.category.localeCompare(b.category),
    year: (a: MachineModel, b: MachineModel) => (a.year || 0) - (b.year || 0),
  }), []);

  const { sort, toggleSort, sorted } = useTableSort(filtered, {
    comparators: machineComparators,
    defaultColumn: "name",
  });

  const pagination = usePagination({ totalItems: sorted.length });
  const paginated = useMemo(() => {
    return sorted.slice(pagination.startIndex, pagination.endIndex);
  }, [sorted, pagination.startIndex, pagination.endIndex]);

  const updateSearch = (v: string) => { setSearch(v); pagination.resetPage(); };
  const updateCategoryFilter = (v: string) => { setCategoryFilter(v); pagination.resetPage(); };
  const updateBrandFilter = (v: string) => { setBrandFilter(v); pagination.resetPage(); };

  const openNew = () => { setEditingMachine(null); setDialogOpen(true); };
  const openEdit = (machine: MachineModel) => { setEditingMachine(machine); setDialogOpen(true); };
  const openDelete = (id: string) => { setDeleteId(id); setDeleteOpen(true); };

  const handleSave = async (data: MachineFormValues) => {
    try {
      await saveMachineAsync(data, editingMachine);
      setDialogOpen(false);
    } catch {
      // handled by onError
    }
  };

  const confirmDelete = () => {
    if (deleteId) deleteMachine(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const { totalModels, modelsWithProducts, totalCompatibilities } = useMemo(() => ({
    totalModels: filtered.length,
    modelsWithProducts: filtered.filter(m => getProductCount(m.id) > 0).length,
    totalCompatibilities: filtered.reduce((sum, m) => sum + getProductCount(m.id), 0),
  }), [filtered, getProductCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Modelos de Máquina</h1>
          <HelpHint {...HELP_TEXTS.machines} />
        </div>
        <Button onClick={openNew} className="rounded-xl bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />Nuevo Modelo
        </Button>
      </div>

      <MachineFilters
        search={search}
        onSearchChange={updateSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={updateCategoryFilter}
        brandFilter={brandFilter}
        onBrandChange={updateBrandFilter}
        usedBrands={usedBrands}
      />

      <MachineStats
        totalModels={totalModels}
        modelsWithProducts={modelsWithProducts}
        totalCompatibilities={totalCompatibilities}
      />

      <MachineTable
        machines={paginated}
        sort={sort}
        toggleSort={toggleSort}
        pagination={pagination}
        totalItems={sorted.length}
        getProductCount={getProductCount}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <MachineFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editingMachine={editingMachine}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar modelo de máquina?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará el modelo y todas sus asociaciones con productos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
