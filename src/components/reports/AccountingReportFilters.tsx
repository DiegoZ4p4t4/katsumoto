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

interface AccountingReportFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  invoiceType: string;
  onInvoiceTypeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  sunatStatus: string;
  onSunatStatusChange: (v: string) => void;
}

export function AccountingReportFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  invoiceType,
  onInvoiceTypeChange,
  status,
  onStatusChange,
  sunatStatus,
  onSunatStatusChange,
}: AccountingReportFiltersProps) {
  return (
    <Card className="p-4 rounded-2xl shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-xl text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded-xl text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo Doc.</Label>
          <Select value={invoiceType} onValueChange={onInvoiceTypeChange}>
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
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="issued">Emitido</SelectItem>
              <SelectItem value="accepted">Aceptado SUNAT</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="cancelled">Anulado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado SUNAT</Label>
          <Select value={sunatStatus} onValueChange={onSunatStatusChange}>
            <SelectTrigger className="rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ACEPTADA">Aceptada</SelectItem>
              <SelectItem value="ENVIADA">Enviada</SelectItem>
              <SelectItem value="EN PROCESO">En Proceso</SelectItem>
              <SelectItem value="RECHAZADA">Rechazada</SelectItem>
              <SelectItem value="ANULADA">Anulada</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
