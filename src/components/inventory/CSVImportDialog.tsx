import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { stockService } from "@/services/stock.service";
import { toCents } from "@/lib/format";
import { showError, showSuccess } from "@/utils/toast";
import { queryKeys } from "@/lib/query-keys";
import { useBranches } from "@/hooks/useBranches";
import {
  parseCSVFile,
  autoDetectMapping,
  validateRows,
  IMPORT_COLUMNS,
  type ColumnMapping,
  type RowValidation,
} from "@/lib/import";
import type { Cents, ProductFormData } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Download,
} from "lucide-react";

type Step = "upload" | "mapping" | "preview" | "importing" | "results";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { branches } = useBranches();

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validations, setValidations] = useState<RowValidation[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setValidations([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const { headers, rows } = await parseCSVFile(file);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const detected = autoDetectMapping(headers);
      setMapping(detected);
      setStep("mapping");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al leer archivo");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleMappingChange = useCallback((csvHeader: string, fieldKey: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvHeader]: fieldKey === "__skip__" ? null : fieldKey,
    }));
  }, []);

  const handleValidate = useCallback(() => {
    const results = validateRows(csvRows, mapping);
    setValidations(results);
    setStep("preview");
  }, [csvRows, mapping]);

  const handleImport = useCallback(async () => {
    const validRows = validations.filter((v) => v.data !== null);
    if (validRows.length === 0) {
      showError("No hay filas válidas para importar");
      return;
    }

    setStep("importing");
    setImportProgress({ current: 0, total: validRows.length });

    const items: ProductFormData[] = validRows.map((v) => ({
      name: v.data!.name,
      sku: v.data!.sku,
      product_family: v.data!.product_family,
      category_group: v.data!.category_group,
      category: v.data!.category,
      description: v.data!.description || undefined,
      unit: v.data!.unit,
      price_cents: toCents(v.data!.price_soles) as Cents,
      cost_cents: toCents(v.data!.cost_soles) as Cents,
      min_stock: v.data!.min_stock,
      max_stock: v.data!.max_stock,
      supplier: v.data!.supplier || undefined,
      tax_affectation: v.data!.tax_affectation,
      image_url: v.data!.image_url || null,
      tags: v.data!.tags || [],
    }));

    const skuToStock = new Map<string, number>();
    validRows.forEach((v) => {
      const stock = v.data!.stock ?? 0;
      if (stock > 0) skuToStock.set(v.data!.sku, stock);
    });

    try {
      const result = await productService.batchCreate(items);
      setImportProgress({ current: validRows.length, total: validRows.length });

      let stockErrors = 0;
      if (result.createdProducts.length > 0 && skuToStock.size > 0) {
        const targetBranch = branches.find((b) => b.is_default) || branches.find((b) => b.type === "warehouse") || branches[0];
        if (targetBranch) {
          for (const product of result.createdProducts) {
            const stock = skuToStock.get(product.sku);
            if (stock && stock > 0) {
              try {
                await stockService.adjust(product.id, targetBranch.id, "in", stock, "Stock inicial (importación CSV)");
              } catch {
                stockErrors++;
              }
            }
          }
        }
      }

      const finalErrors = [...result.errors];
      if (stockErrors > 0) {
        finalErrors.push(`${stockErrors} productos importados sin stock inicial (error al registrar)`);
      }

      setImportResult({ success: result.success, errors: finalErrors });
      setStep("results");
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.allStock });
      queryClient.invalidateQueries({ queryKey: queryKeys.movements.all });
      if (result.success > 0) showSuccess(`${result.success} productos importados correctamente`);
    } catch (err) {
      showError("Error en la importación: " + (err instanceof Error ? err.message : "Error desconocido"));
      setStep("results");
      setImportResult({ success: 0, errors: [err instanceof Error ? err.message : "Error desconocido"] });
    }
  }, [validations, queryClient, branches]);

  const validCount = validations.filter((v) => v.data !== null).length;
  const invalidCount = validations.filter((v) => v.data === null).length;

  const downloadTemplate = () => {
    const headers = IMPORT_COLUMNS.map((c) => c.label).join(",");
    const example = ["SKU-001", "Filtro de Aire FA-150", "Filtro de Aire", "25.00", "15.00", "50", "5", "200", "productos", "repuestos", "Filtro universal", "Unidad", "gravado", "Proveedor SA", "filtro;universal"].join(",");
    const csv = "\uFEFF" + headers + "\n" + example + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_importacion_productos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
            Importar Productos desde CSV
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Sube un archivo CSV con los productos a importar."}
            {step === "mapping" && "Verifica el mapeo de columnas del CSV a los campos del producto."}
            {step === "preview" && `Validación: ${validCount} filas válidas, ${invalidCount} con errores.`}
            {step === "importing" && `Importando ${importProgress.current} de ${importProgress.total} productos...`}
            {step === "results" && "Importación completada."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {step === "upload" && (
            <div className="space-y-4 py-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Haz clic para seleccionar un archivo CSV
                </p>
                <p className="text-xs text-muted-foreground">
                  Máximo recomendado: 1000 productos por archivo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-xl gap-2">
                  <Download className="w-3.5 h-3.5" />
                  Descargar plantilla CSV
                </Button>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Campos requeridos:</p>
                <p>SKU, Nombre, Categoría, Precio Venta</p>
                <p className="font-medium text-foreground mt-2">Campos opcionales:</p>
                <p>Costo, Stock Actual, Stock Mín/Máx, Familia, Grupo, Descripción, Unidad, IGV, Proveedor, Tags</p>
              </div>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>{fileName} — {csvRows.length} filas</span>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Columna CSV</th>
                      <th className="text-left px-3 py-2 font-medium">Ejemplo</th>
                      <th className="text-left px-3 py-2 font-medium">Mapear a</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvHeaders.map((header) => (
                      <tr key={header} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{header}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[150px]">
                          {csvRows[0]?.[header] || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={mapping[header] || "__skip__"}
                            onValueChange={(val) => handleMappingChange(header, val)}
                          >
                            <SelectTrigger className="w-[240px] h-8 text-xs rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__skip__">— No importar —</SelectItem>
                              {IMPORT_COLUMNS.map((col) => (
                                <SelectItem key={col.key} value={col.key}>
                                  {col.label}
                                  {col.required && " *"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-3 py-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  {validCount} válidas
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {invalidCount} con errores
                  </div>
                )}
              </div>

              {validCount > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">#</th>
                        <th className="text-left px-3 py-2 font-medium">SKU</th>
                        <th className="text-left px-3 py-2 font-medium">Nombre</th>
                        <th className="text-left px-3 py-2 font-medium">Categoría</th>
                        <th className="text-right px-3 py-2 font-medium">Precio</th>
                        <th className="text-right px-3 py-2 font-medium">Costo</th>
                        <th className="text-right px-3 py-2 font-medium">Stock</th>
                        <th className="text-left px-3 py-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validations.slice(0, 100).map((v) => (
                        <tr key={v.rowIndex} className="border-t">
                          <td className="px-3 py-1.5 text-muted-foreground">{v.rowIndex + 1}</td>
                          <td className="px-3 py-1.5 font-mono">{v.data?.sku || v.row[csvHeaders[0]]}</td>
                          <td className="px-3 py-1.5 truncate max-w-[200px]">{v.data?.name || "—"}</td>
                          <td className="px-3 py-1.5">{v.data?.category || "—"}</td>
                          <td className="px-3 py-1.5 text-right">{v.data ? `S/. ${v.data.price_soles.toFixed(2)}` : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{v.data ? `S/. ${v.data.cost_soles.toFixed(2)}` : "—"}</td>
                          <td className="px-3 py-1.5 text-right">{v.data?.stock ?? "—"}</td>
                          <td className="px-3 py-1.5">
                            {v.data ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> OK
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validations.length > 100 && (
                    <div className="px-3 py-2 text-xs text-center text-muted-foreground border-t">
                      Mostrando 100 de {validations.length} filas
                    </div>
                  )}
                </div>
              )}

              {invalidCount > 0 && (
                <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-3 space-y-1 max-h-[200px] overflow-y-auto">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                    Filas con errores:
                  </p>
                  {validations
                    .filter((v) => !v.data)
                    .slice(0, 20)
                    .map((v) => (
                      <div key={v.rowIndex} className="text-xs">
                        <span className="font-mono text-muted-foreground">Fila {v.rowIndex + 1}:</span>{" "}
                        <span className="text-red-600 dark:text-red-400">{v.errors.join("; ")}</span>
                      </div>
                    ))}
                  {invalidCount > 20 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      ...y {invalidCount - 20} errores más
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <div className="text-sm text-center">
                <p className="font-medium">Importando productos...</p>
                <p className="text-muted-foreground">
                  {importProgress.current} de {importProgress.total}
                </p>
              </div>
              <div className="w-full max-w-xs bg-muted rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {step === "results" && importResult && (
            <div className="space-y-4 py-4">
              <div className="flex gap-4 justify-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center min-w-[140px]">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{importResult.success}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Importados</p>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center min-w-[140px]">
                    <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{importResult.errors.length}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Errores</p>
                  </div>
                )}
                {invalidCount > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center min-w-[140px]">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{invalidCount}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Omitidas</p>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs space-y-1">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-red-600 dark:text-red-400">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")} className="rounded-xl gap-1">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </Button>
              <Button onClick={handleValidate} className="rounded-xl gap-1 bg-orange-600 hover:bg-orange-700">
                Validar datos <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")} className="rounded-xl gap-1">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0}
                className="rounded-xl gap-1 bg-orange-600 hover:bg-orange-700"
              >
                Importar {validCount} productos <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === "results" && (
            <Button onClick={() => handleClose(false)} className="rounded-xl bg-orange-600 hover:bg-orange-700">
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
