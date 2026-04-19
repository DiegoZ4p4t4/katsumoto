import { formatCents } from "@/lib/format";
import { IGV_RATE } from "@/lib/constants";
import type { Invoice } from "@/lib/types";

interface InvoiceTotalsProps {
  invoice: Invoice;
}

export function InvoiceTotals({ invoice }: InvoiceTotalsProps) {
  return (
    <div className="bg-orange-50/80 dark:bg-orange-900/20 rounded-xl p-4 space-y-2">
      <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">Desglose Tributario SUNAT</p>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Base Imponible</span>
        <span>{formatCents(invoice.subtotal_cents)}</span>
      </div>
      {invoice.gravada_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-orange-600 dark:text-orange-400">Op. Gravadas</span>
          <span className="font-medium">{formatCents(invoice.gravada_cents)}</span>
        </div>
      )}
      {invoice.exonerada_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-blue-600 dark:text-blue-400">Op. Exoneradas</span>
          <span className="font-medium">{formatCents(invoice.exonerada_cents)}</span>
        </div>
      )}
      {invoice.inafecta_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-amber-600 dark:text-amber-400">Op. Inafectas</span>
          <span className="font-medium">{formatCents(invoice.inafecta_cents)}</span>
        </div>
      )}
      {invoice.exportacion_cents > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-purple-600 dark:text-purple-400">Op. Exportación</span>
          <span className="font-medium">{formatCents(invoice.exportacion_cents)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm pt-1 border-t">
        <span className="text-muted-foreground">IGV ({(IGV_RATE * 100).toFixed(0)}%)</span>
        <span className="font-medium">{formatCents(invoice.igv_cents)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>Total</span>
        <span>{formatCents(invoice.total_cents)}</span>
      </div>
    </div>
  );
}
