import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MACHINE_CATEGORIES, MACHINE_BRANDS, MACHINE_CATEGORY_KEYS } from "@/lib/constants";
import { machineFormSchema, type MachineFormValues } from "@/lib/schemas";
import type { MachineModel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultValues: MachineFormValues = {
  name: "", brand: "", model: "", category: "otro", year: "", description: "",
};

interface MachineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MachineFormValues) => void;
  editingMachine: MachineModel | null;
}

export function MachineFormDialog({ open, onOpenChange, onSave, editingMachine }: MachineFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues,
  });
  const formCategory = watch("category");
  const formBrand = watch("brand");

  useEffect(() => {
    if (open) {
      if (editingMachine) {
        reset({
          name: editingMachine.name,
          brand: editingMachine.brand,
          model: editingMachine.model,
          category: editingMachine.category,
          year: editingMachine.year?.toString() || "",
          description: editingMachine.description || "",
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, editingMachine, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{editingMachine ? "Editar Modelo" : "Nuevo Modelo de Máquina"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...register("name")} className="rounded-xl" placeholder="Ej: Macheteadora ZAP-200" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca *</Label>
              <Select value={formBrand} onValueChange={(v) => setValue("brand", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {MACHINE_BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.brand && <p className="text-xs text-red-500">{errors.brand.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Modelo *</Label>
              <Input {...register("model")} className="rounded-xl" placeholder="Ej: ZAP-200" />
              {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={formCategory} onValueChange={(v) => setValue("category", v as MachineFormValues["category"])}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MACHINE_CATEGORY_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>{MACHINE_CATEGORIES[key]?.label || key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input type="number" {...register("year")} className="rounded-xl" placeholder="2024" min={1990} max={2030} />
              {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input {...register("description")} className="rounded-xl" placeholder="Notas sobre este modelo..." />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
            <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700">
              {editingMachine ? "Guardar Cambios" : "Registrar Modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
