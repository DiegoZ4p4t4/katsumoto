import { useMemo } from "react";
import { useAccountingReport } from "@/hooks/useReports";
import { AccountingReportFilters } from "./AccountingReportFilters";
import { ReportExportButtons } from "./ReportExportButtons";
import { exportAccountingCSV, exportAccountingExcel } from "@/lib/report-export";
import { formatCents, toSoles, formatDate } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/types";
import {
  getInvoiceTypeLabel,
  getStatusLabel,
} from "@/services/report.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import { Loader2, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function AccountingReport() {
  const report = useAccountingReport();
  const queryClient = useQueryClient();
  const pagination = usePagination({ totalItems: report.rows.length });

  const paginated = useMemo(
    () =>
      report.rows.slice(pagination.startIndex, pagination.endIndex),
    [report.rows, pagination.startIndex, pagination.endIndex]
  );

  if (report.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (report.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground">Error al cargar el reporte</p>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries()}
          className="rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AccountingReportFilters
        dateFrom={report.dateFrom}
        dateTo={report.dateTo}
        onDateFromChange={report.setDateFrom}
        onDateToChange={report.setDateTo}
        invoiceType={report.invoiceType}
        onInvoiceTypeChange={report.setInvoiceType}
        status={report.status}
        onStatusChange={report.setStatus}
        sunatStatus={report.sunatStatus}
        onSunatStatusChange={report.setSunatStatus}
      />

      {report.rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <SummaryCard
            label="Comprobantes"
            value={String(report.summary.count)}
          />
          <SummaryCard
            label="Facturas"
            value={String(report.summary.facturas)}
          />
          <SummaryCard
            label="Boletas"
            value={String(report.summary.boletas)}
          />
          <SummaryCard
            label="Gravada"
            value={formatCents(report.summary.totalGravada)}
          />
          <SummaryCard
            label="Exonerada"
            value={formatCents(report.summary.totalExonerada)}
          />
          <SummaryCard
            label="Total"
            value={formatCents(report.summary.totalTotal)}
            highlight
          />
        </div>
      )}

      <div className="flex justify-end">
        <ReportExportButtons
          onExportCSV={() => exportAccountingCSV(report.rows)}
          onExportExcel={() => exportAccountingExcel(report.rows)}
          disabled={report.rows.length === 0}
        />
      </div>

      {report.rows.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay comprobantes en el rango seleccionado
          </p>
          <p className="text-sm text-muted-foreground">
            Ajusta los filtros de fecha para ver resultados.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <Th>N°</Th>
                  <Th>F. Emisión</Th>
                  <Th>Tipo Doc.</Th>
                  <Th>Serie</Th>
                  <Th>Correlativo</Th>
                  <Th className="min-w-[180px]">Recep. Razón Social</Th>
                  <Th>N° Doc.</Th>
                  <Th>Moneda</Th>
                  <Th className="text-right">Sub Total</Th>
                  <Th className="text-right">IGV</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Gravadas</Th>
                  <Th className="text-right">Exoneradas</Th>
                  <Th className="text-right">Inafectas</Th>
                  <Th>Estado</Th>
                  <Th>Estado SUNAT</Th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center">{row.rowNumber}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatDate(row.issueDate)}
                    </td>
                    <td className="px-3 py-2.5">
                      {getInvoiceTypeLabel(row.invoiceType)}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{row.serie}</td>
                    <td className="px-3 py-2.5 font-mono">
                      {String(row.correlativo).padStart(8, "0")}
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate">
                      {row.customerName}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {row.customerDocument}
                    </td>
                    <td className="px-3 py-2.5">{row.currency}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(row.subtotal).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(row.igv).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">
                      {toSoles(row.total).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(row.gravada).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(row.exonerada).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(row.inafecta).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <SunatBadge status={row.sunatStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
              {report.rows.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/50 font-semibold text-xs">
                    <td colSpan={8} className="px-3 py-2.5 text-right">
                      TOTALES
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(
                        report.rows.reduce((s, r) => s + r.subtotal, 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(
                        report.rows.reduce((s, r) => s + r.igv, 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(
                        report.rows.reduce((s, r) => s + r.total, 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(
                        report.rows.reduce((s, r) => s + r.gravada, 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(
                        report.rows.reduce((s, r) => s + r.exonerada, 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {toSoles(
                        report.rows.reduce((s, r) => s + r.inafecta, 0)
                      ).toFixed(2)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <PaginationControls
            pagination={pagination}
            totalItems={report.rows.length}
            itemLabel="comprobantes"
            showPageNumbers
          />
        </>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className="p-3 rounded-xl shadow-sm">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`text-sm font-bold ${
          highlight ? "text-orange-600 dark:text-orange-400" : ""
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    BORRADOR: "bg-slate-100 text-slate-700",
    EMITIDO: "bg-blue-100 text-blue-700",
    ACEPTADO: "bg-emerald-100 text-emerald-700",
    PAGADO: "bg-green-100 text-green-700",
    ANULADO: "bg-red-100 text-red-700",
  };
  return (
    <Badge
      variant="secondary"
      className={`text-[10px] px-1.5 py-0 ${variants[getStatusLabel(status as InvoiceStatus)] || "bg-gray-100 text-gray-700"}`}
    >
      {getStatusLabel(status as InvoiceStatus)}
    </Badge>
  );
}

function SunatBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ACEPTADA: "bg-emerald-100 text-emerald-700",
    ENVIADA: "bg-blue-100 text-blue-700",
    "EN PROCESO": "bg-amber-100 text-amber-700",
    RECHAZADA: "bg-red-100 text-red-700",
    ANULADA: "bg-slate-100 text-slate-700",
    PENDIENTE: "bg-orange-100 text-orange-700",
  };
  return (
    <Badge
      variant="secondary"
      className={`text-[10px] px-1.5 py-0 ${variants[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </Badge>
  );
}
