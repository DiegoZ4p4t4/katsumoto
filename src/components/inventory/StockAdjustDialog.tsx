import { UseFormReturn } from "react-hook-form";
import type { Product } from "@/lib/types";
import type { StockAdjustValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustProduct: Product | null;
  form: UseFormReturn<StockAdjustValues>;
  onSave: (data: StockAdjustValues) => void;
  targetBranchName?: string;
}

export function StockAdjustDialog({
  open,
  onOpenChange,
  adjustProduct,
  form,
  onSave,
  targetBranchName,
}: StockAdjustDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const adjustMovementType = watch("movementType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Ajustar Stock {"\u2014"} {adjustProduct?.name}
          </DialogTitle>
        </DialogHeader>
        {adjustProduct && (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-xl flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock Actual</span>
              <span className="text-lg font-bold">
                {adjustProduct.stock} {adjustProduct.unit}
              </span>
            </div>
            {targetBranchName && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sucursal destino</span>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  {targetBranchName}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select
                value={adjustMovementType}
                onValueChange={(v) => setValue("movementType", v as "in" | "out" | "transfer")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Salida</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
              {errors.movementType && (
                <p className="text-xs text-red-500">{errors.movementType.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                className="rounded-xl"
                min={1}
              />
              {errors.quantity && (
                <p className="text-xs text-red-500">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                {...register("notes")}
                className="rounded-xl"
                placeholder="Motivo del ajuste"
              />
              {errors.notes && (
                <p className="text-xs text-red-500">{errors.notes.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-orange-600 hover:bg-orange-700"
              >
                Registrar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
