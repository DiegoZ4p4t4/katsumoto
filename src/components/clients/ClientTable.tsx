import { SortableHeader } from "@/components/data-table/SortableHeader";
import type { Customer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Pencil, Trash2, Phone, Mail, MapPin,
  Building2, User, FileText,
} from "lucide-react";
import type { SortState } from "@/hooks/useTableSort";

interface ClientTableProps {
  paginated: Customer[];
  sort: SortState<"name" | "document_type" | "document_number" | "city" | "invoices">;
  toggleSort: (column: "name" | "document_type" | "document_number" | "city" | "invoices") => void;
  filtered: Customer[];
  getInvoiceCount: (clientId: string) => number;
  onEdit: (client: Customer) => void;
  onDelete: (clientId: string) => void;
}

export function ClientTable({
  paginated,
  sort,
  toggleSort,
  filtered,
  getInvoiceCount,
  onEdit,
  onDelete,
}: ClientTableProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <SortableHeader column="name" label="Cliente" className="text-left" isActive={sort.column === "name"} direction={sort.direction} onSort={toggleSort} />
                <SortableHeader column="document_type" label="Tipo Doc." className="text-center" isActive={sort.column === "document_type"} direction={sort.direction} onSort={toggleSort} />
                <SortableHeader column="document_number" label="Documento" className="text-left" isActive={sort.column === "document_number"} direction={sort.direction} onSort={toggleSort} />
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Contacto</th>
                <SortableHeader column="city" label="Ciudad" className="text-left hidden lg:table-cell" isActive={sort.column === "city"} direction={sort.direction} onSort={toggleSort} />
                <SortableHeader column="invoices" label="Comprobantes" className="text-center" isActive={sort.column === "invoices"} direction={sort.direction} onSort={toggleSort} />
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-[100px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((client) => {
                const isCompany = client.document_type === "RUC";
                const invoiceCount = getInvoiceCount(client.id);

                return (
                  <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompany ? "bg-orange-50 dark:bg-orange-900/30" : "bg-blue-50 dark:bg-blue-900/30"}`}>
                          {isCompany ? (
                            <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[240px]">{client.name}</p>
                          {client.address && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[220px] hidden xl:block">{client.address}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isCompany
                          ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                      }`}>
                        {client.document_type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-muted-foreground">{client.document_number}</span>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="space-y-1">
                        {client.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{client.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">{"\u2014"}</span>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden lg:table-cell">
                      {client.city ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{client.city}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">{"\u2014"}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {invoiceCount > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{invoiceCount}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">{"\u2014"}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => onEdit(client)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => onDelete(client.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5 text-red-400 dark:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No se encontraron clientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
