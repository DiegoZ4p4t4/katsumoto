import type { UseFormRegister, UseFieldArrayRemove } from "react-hook-form";
import type { FieldArrayWithId } from "react-hook-form";
import type { CreateInvoiceFormValues } from "@/lib/schemas";
import type { InvoiceCalculation } from "@/lib/calculations";
import type { Product, BranchStock } from "@/lib/types";
import { formatCents, toCents } from "@/lib/format";
import { TAX_AFFECTATION_TYPES } from "@/lib/constants";
import { getBranchStock } from "@/lib/utils/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

interface InvoiceItemEditorProps {
  fields: FieldArrayWithId<CreateInvoiceFormValues, "items", "id">[];
  register: UseFormRegister<CreateInvoiceFormValues>;
  remove: UseFieldArrayRemove;
  watchedItems: { productId: string; productName: string; quantity: number; unitPriceSoles: number; discount: number }[];
  calc: InvoiceCalculation | null;
  products: Product[];
  branchStocks: BranchStock[];
  branchId: string;
  selectedProductId: string;
  onSelectedProductIdChange: (id: string) => void;
  onAddItem: () => void;
  itemsError?: string;
}

export function InvoiceItemEditor({
  fields,
  register,
  remove,
  watchedItems,
  calc,
  products,
  branchStocks,
  branchId,
  selectedProductId,
  onSelectedProductIdChange,
  onAddItem,
  itemsError,
}: InvoiceItemEditorProps) {
  const availableProducts = products
    .filter((p) => !watchedItems.find((i) => i.productId === p.id) && p.stock > 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <Label className="text-sm font-semibold">Productos</Label>
        <div className="flex gap-2">
          <Select value={selectedProductId} onValueChange={onSelectedProductIdChange}>
            <SelectTrigger className="w-56 sm:w-64 rounded-xl"><SelectValue placeholder="Buscar producto..." /></SelectTrigger>
            <SelectContent>
              {availableProducts.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} — {formatCents(p.price_cents)} (Stock: {p.stock})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAddItem} disabled={!selectedProductId} variant="outline" className="rounded-xl"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Agrega productos al comprobante</p>
          {itemsError && <p className="text-xs text-red-500 mt-2">{itemsError}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const calcItem = calc?.items[index];
            const product = products.find(p => p.id === field.productId);
            const taxInfo = product ? TAX_AFFECTATION_TYPES[product.tax_affectation || "gravado"] : null;
            const currentStock = product
              ? (branchId === "all" ? product.stock : getBranchStock(branchStocks, branchId, product.id))
              : 0;
            const watchedQty = watchedItems[index]?.quantity ?? 0;
            const isOverStock = watchedQty > currentStock;
            return (
              <div key={field.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl ${isOverStock ? "bg-red-50/80 dark:bg-red-900/10 border border-red-200 dark:border-red-800" : "bg-muted/40"}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{field.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{formatCents(toCents(field.unitPriceSoles))} c/u</p>
                    {taxInfo && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${taxInfo.color}`}>
                        {taxInfo.label} {taxInfo.rate}
                      </span>
                    )}
                  </div>
                  {isOverStock && (
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-1">
                      ⚠️ Stock insuficiente: {currentStock} disponible{currentStock !== 1 ? "s" : ""}, {watchedQty} solicitado{watchedQty !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Cant:</Label>
                    <Input type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-20 rounded-xl h-9 text-center" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Desc %:</Label>
                    <Input type="number" min={0} max={100} {...register(`items.${index}.discount`, { valueAsNumber: true })} className="w-20 rounded-xl h-9 text-center" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm min-w-[100px]">{calcItem ? formatCents(calcItem.line_total_cents) : "S/.—"}</p>
                    {calcItem && calcItem.igv_cents > 0 && (
                      <p className="text-[10px] text-muted-foreground">IGV: {formatCents(calcItem.igv_cents)}</p>
                    )}
                  </div>
                  <button onClick={() => remove(index)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400 dark:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
