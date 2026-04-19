import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvoiceFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
}

export function InvoiceFilters({ statusFilter, onStatusChange, typeFilter, onTypeChange }: InvoiceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="draft">Borrador</SelectItem>
          <SelectItem value="issued">Emitido</SelectItem>
          <SelectItem value="accepted">Aceptado SUNAT</SelectItem>
          <SelectItem value="paid">Pagado</SelectItem>
          <SelectItem value="cancelled">Anulado</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="factura">Factura</SelectItem>
          <SelectItem value="boleta">Boleta de Venta</SelectItem>
          <SelectItem value="nota_credito">Nota de Crédito</SelectItem>
          <SelectItem value="nota_debito">Nota de Débito</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
