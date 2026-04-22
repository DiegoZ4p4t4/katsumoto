import { useSalesReport } from "@/hooks/useReports";
import { ReportExportButtons } from "./ReportExportButtons";
import { exportSalesCSV, exportSalesExcel } from "@/lib/report-export";
import { formatCents, toSoles } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Loader2, AlertCircle, BarChart3 } from "lucide-react";

export function SalesReport() {
  const report = useSalesReport();

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
      </div>
    );
  }

  const chartData = report.periods.map((p) => ({
    period: p.period,
    total: toSoles(p.total),
    gravada: toSoles(p.gravada),
    exonerada: toSoles(p.exonerada),
    igv: toSoles(p.igv),
  }));

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-2xl shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input
              type="date"
              value={report.dateFrom}
              onChange={(e) => report.setDateFrom(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input
              type="date"
              value={report.dateTo}
              onChange={(e) => report.setDateTo(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Agrupar por</Label>
            <Select
              value={report.groupBy}
              onValueChange={(v) => report.setGroupBy(v as any)}
            >
              <SelectTrigger className="rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo Doc.</Label>
            <Select
              value={report.invoiceType}
              onValueChange={report.setInvoiceType}
            >
              <SelectTrigger className="rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="factura">Factura</SelectItem>
                <SelectItem value="boleta">Boleta</SelectItem>
                <SelectItem value="nota_credito">Nota de Crédito</SelectItem>
                <SelectItem value="nota_debito">Nota de Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Comprobantes" value={String(report.totals.totalFacturas + report.totals.totalBoletas + report.totals.totalNotasCredito + report.totals.totalNotasDebito)} />
        <SummaryCard label="Total Ventas" value={formatCents(report.totals.total)} highlight />
        <SummaryCard label="Total IGV" value={formatCents(report.totals.igv)} />
        <SummaryCard label="Total Exonerada" value={formatCents(report.totals.exonerada)} />
      </div>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Ventas por Periodo</h3>
            <ChartContainer
              config={{
                total: { label: "Total", color: "#ea580c" },
                gravada: { label: "Gravada", color: "#3b82f6" },
                exonerada: { label: "Exonerada", color: "#22c55e" },
              }}
              className="h-[280px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="gravada" fill="var(--color-gravada)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exonerada" fill="var(--color-exonerada)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>

          <Card className="p-4 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Tendencia Total</h3>
            <ChartContainer
              config={{
                total: { label: "Total", color: "#ea580c" },
              }}
              className="h-[280px] w-full"
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <ReportExportButtons
          onExportCSV={() =>
            exportSalesCSV(report.periods, report.dateFrom, report.dateTo)
          }
          onExportExcel={() =>
            exportSalesExcel(report.periods, report.dateFrom, report.dateTo)
          }
          disabled={report.periods.length === 0}
        />
      </div>

      {report.periods.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay datos en el rango seleccionado
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b">
                <Th>Periodo</Th>
                <Th className="text-center">Facturas</Th>
                <Th className="text-center">Boletas</Th>
                <Th className="text-center">N. Crédito</Th>
                <Th className="text-center">N. Débito</Th>
                <Th className="text-right">Gravada</Th>
                <Th className="text-right">Exonerada</Th>
                <Th className="text-right">Inafecta</Th>
                <Th className="text-right">IGV</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {report.periods.map((p) => (
                <tr
                  key={p.period}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2.5 font-medium">{p.period}</td>
                  <td className="px-3 py-2.5 text-center">{p.totalFacturas}</td>
                  <td className="px-3 py-2.5 text-center">{p.totalBoletas}</td>
                  <td className="px-3 py-2.5 text-center">
                    {p.totalNotasCredito}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.totalNotasDebito}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {toSoles(p.gravada).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {toSoles(p.exonerada).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {toSoles(p.inafecta).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {toSoles(p.igv).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold">
                    {toSoles(p.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold text-xs">
                <td className="px-3 py-2.5">TOTAL</td>
                <td className="px-3 py-2.5 text-center">
                  {report.totals.totalFacturas}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {report.totals.totalBoletas}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {report.totals.totalNotasCredito}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {report.totals.totalNotasDebito}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {toSoles(report.totals.gravada).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {toSoles(report.totals.exonerada).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {toSoles(report.totals.inafecta).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {toSoles(report.totals.igv).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-orange-600">
                  {toSoles(report.totals.total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
