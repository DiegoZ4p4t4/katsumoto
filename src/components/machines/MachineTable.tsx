import { SortableHeader } from "@/components/data-table/SortableHeader";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import { MACHINE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cog, Package, Calendar, Building2, Pencil, Trash2 } from "lucide-react";
import type { MachineModel } from "@/lib/types";
import type { SortState } from "@/hooks/useTableSort";
import type { UsePaginationReturn } from "@/hooks/usePagination";

interface MachineTableProps {
  machines: MachineModel[];
  sort: SortState<"name" | "brand" | "model" | "category" | "year">;
  toggleSort: (column: string) => void;
  pagination: UsePaginationReturn;
  totalItems: number;
  getProductCount: (id: string) => number;
  onEdit: (machine: MachineModel) => void;
  onDelete: (id: string) => void;
}

export function MachineTable({ machines, sort, toggleSort, pagination, totalItems, getProductCount, onEdit, onDelete }: MachineTableProps) {
  return (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <SortableHeader column="name" label="Modelo" className="text-left" isActive={sort.column === "name"} direction={sort.direction} onSort={toggleSort} />
                  <SortableHeader column="brand" label="Marca" className="text-left" isActive={sort.column === "brand"} direction={sort.direction} onSort={toggleSort} />
                  <SortableHeader column="model" label="Código" className="text-left hidden md:table-cell" isActive={sort.column === "model"} direction={sort.direction} onSort={toggleSort} />
                  <SortableHeader column="category" label="Categoría" className="text-left hidden lg:table-cell" isActive={sort.column === "category"} direction={sort.direction} onSort={toggleSort} />
                  <SortableHeader column="year" label="Año" className="text-center hidden lg:table-cell" isActive={sort.column === "year"} direction={sort.direction} onSort={toggleSort} />
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Repuestos</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-[100px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => {
                  const catInfo = MACHINE_CATEGORIES[machine.category];
                  const productCount = getProductCount(machine.id);

                  return (
                    <tr key={machine.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${catInfo?.color || "bg-muted"}`}>
                            <Cog className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[240px]">{machine.name}</p>
                            {machine.description && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[220px] hidden xl:block">{machine.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{machine.brand}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm font-mono text-muted-foreground">{machine.model}</span>
                      </td>

                      <td className="py-3 px-4 hidden lg:table-cell">
                        <Badge variant="secondary" className={`text-[10px] rounded-lg ${catInfo?.color || "bg-muted"}`}>
                          {catInfo?.label || machine.category}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        {machine.year ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{machine.year}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {productCount === 0 ? (
                          <span className="text-xs text-muted-foreground/50">Sin asociar</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                              <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{productCount}</p>
                              <p className="text-[9px] text-muted-foreground leading-none">repuesto{productCount !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => onEdit(machine)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => onDelete(machine.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
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

          {machines.length === 0 && (
            <div className="text-center py-16">
              <Cog className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron modelos de máquina</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationControls
        pagination={pagination}
        totalItems={totalItems}
        itemLabel="modelos"
        showPageNumbers
      />
    </>
  );
}
