import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, BarChart3 } from "lucide-react";
import { formatCents } from "@/lib/format";
import {
  exportSalesReportCSV,
  type SalesReportRow,
} from "@/lib/export";
import { showSuccess } from "@/utils/toast";
import type { Invoice } from "@/lib/types";

interface SalesReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function endOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}

export function SalesReportDialog({
  open,
  onOpenChange,
  invoices,
}: SalesReportDialogProps) {
  const [dateFrom, setDateFrom] = useState(startOfMonth());
  const [dateTo, setDateTo] = useState(endOfMonth());

  const reportRows = useMemo(() => {
    const filtered = invoices.filter((inv) => {
      const d = inv.issue_date.substring(0, 10);
      return d >= dateFrom && d <= dateTo && inv.status !== "cancelled" && inv.status !== "draft";
    });

    const byMonth: Record<
      string,
      {
        totalFacturas: number;
        totalBoletas: number;
        totalNotasCredito: number;
        totalNotasDebito: number;
        gravada: number;
        exonerada: number;
        inafecta: number;
        igv: number;
        total: number;
      }
    > = {};

    for (const inv of filtered) {
      const period = inv.issue_date.substring(0, 7);
      if (!byMonth[period]) {
        byMonth[period] = {
          totalFacturas: 0,
          totalBoletas: 0,
          totalNotasCredito: 0,
          totalNotasDebito: 0,
          gravada: 0,
          exonerada: 0,
          inafecta: 0,
          igv: 0,
          total: 0,
        };
      }
      const row = byMonth[period];
      if (inv.invoice_type === "factura") row.totalFacturas++;
      else if (inv.invoice_type === "boleta") row.totalBoletas++;
      else if (inv.invoice_type === "nota_credito") row.totalNotasCredito++;
      else if (inv.invoice_type === "nota_debito") row.totalNotasDebito++;

      row.gravada += inv.gravada_cents;
      row.exonerada += inv.exonerada_cents;
      row.inafecta += inv.inafecta_cents;
      row.igv += inv.igv_cents;
      row.total += inv.total_cents;
    }

    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));

    return sorted.map(
      ([period, data]): SalesReportRow => ({
        period,
        ...data,
      })
    );
  }, [invoices, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return reportRows.reduce(
      (acc, r) => ({
        totalFacturas: acc.totalFacturas + r.totalFacturas,
        totalBoletas: acc.totalBoletas + r.totalBoletas,
        totalNotasCredito: acc.totalNotasCredito + r.totalNotasCredito,
        totalNotasDebito: acc.totalNotasDebito + r.totalNotasDebito,
        gravada: acc.gravada + r.gravada,
        exonerada: acc.exonerada + r.exonerada,
        inafecta: acc.inafecta + r.inafecta,
        igv: acc.igv + r.igv,
        total: acc.total + r.total,
      }),
      {
        totalFacturas: 0,
        totalBoletas: 0,
        totalNotasCredito: 0,
        totalNotasDebito: 0,
        gravada: 0,
        exonerada: 0,
        inafecta: 0,
        igv: 0,
        total: 0,
      }
    );
  }, [reportRows]);

  const handleExport = () => {
    exportSalesReportCSV(reportRows, dateFrom, dateTo);
    showSuccess("Reporte de ventas exportado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Reporte de Ventas
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <Button variant="outline" onClick={handleExport} disabled={reportRows.length === 0} className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />Exportar CSV
          </Button>
        </div>

        {reportRows.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No hay ventas en el periodo seleccionado</p>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-center">Fact.</TableHead>
                  <TableHead className="text-center">Bol.</TableHead>
                  <TableHead className="text-center">N/C</TableHead>
                  <TableHead className="text-center">N/D</TableHead>
                  <TableHead className="text-right">Gravada</TableHead>
                  <TableHead className="text-right">Exonerada</TableHead>
                  <TableHead className="text-right">Inafecta</TableHead>
                  <TableHead className="text-right">IGV</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map((r) => (
                  <TableRow key={r.period}>
                    <TableCell className="font-medium">{r.period}</TableCell>
                    <TableCell className="text-center">{r.totalFacturas}</TableCell>
                    <TableCell className="text-center">{r.totalBoletas}</TableCell>
                    <TableCell className="text-center">{r.totalNotasCredito}</TableCell>
                    <TableCell className="text-center">{r.totalNotasDebito}</TableCell>
                    <TableCell className="text-right">{formatCents(r.gravada)}</TableCell>
                    <TableCell className="text-right">{formatCents(r.exonerada)}</TableCell>
                    <TableCell className="text-right">{formatCents(r.inafecta)}</TableCell>
                    <TableCell className="text-right">{formatCents(r.igv)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCents(r.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">{totals.totalFacturas}</TableCell>
                  <TableCell className="text-center">{totals.totalBoletas}</TableCell>
                  <TableCell className="text-center">{totals.totalNotasCredito}</TableCell>
                  <TableCell className="text-center">{totals.totalNotasDebito}</TableCell>
                  <TableCell className="text-right">{formatCents(totals.gravada)}</TableCell>
                  <TableCell className="text-right">{formatCents(totals.exonerada)}</TableCell>
                  <TableCell className="text-right">{formatCents(totals.inafecta)}</TableCell>
                  <TableCell className="text-right">{formatCents(totals.igv)}</TableCell>
                  <TableCell className="text-right">{formatCents(totals.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
