import { formatCents } from "@/lib/format";
import { IGV_RATE } from "@/lib/constants";
import type { InvoiceCalculation } from "@/lib/calculations";

interface InvoiceCalcTotalsProps {
  calc: InvoiceCalculation;
}

export function InvoiceCalcTotals({ calc }: InvoiceCalcTotalsProps) {
  return (
    <div className="mt-6 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl p-5 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Base Imponible</span>
        <span className="font-medium">{formatCents(calc.subtotal_cents)}</span>
      </div>
      {calc.gravada_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-orange-600 dark:text-orange-400">Op. Gravadas</span>
          <span className="font-medium">{formatCents(calc.gravada_cents)}</span>
        </div>
      )}
      {calc.exonerada_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-blue-600 dark:text-blue-400">Op. Exoneradas</span>
          <span className="font-medium">{formatCents(calc.exonerada_cents)}</span>
        </div>
      )}
      {calc.inafecta_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-amber-600 dark:text-amber-400">Op. Inafectas</span>
          <span className="font-medium">{formatCents(calc.inafecta_cents)}</span>
        </div>
      )}
      {calc.exportacion_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-purple-600 dark:text-purple-400">Op. Exportación</span>
          <span className="font-medium">{formatCents(calc.exportacion_cents)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">IGV ({(IGV_RATE * 100).toFixed(0)}%)</span>
        <span className="font-medium">{formatCents(calc.igv_cents)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold pt-3 border-t border-orange-200 dark:border-orange-800">
        <span>Total</span>
        <span className="text-orange-700 dark:text-orange-400">{formatCents(calc.total_cents)}</span>
      </div>
    </div>
  );
}
