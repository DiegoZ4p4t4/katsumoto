import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useBranches } from "@/hooks/useBranches";
import { useBranchMutations } from "@/hooks/useBranchMutations";
import { useProducts } from "@/hooks/useProducts";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCents } from "@/lib/format";
import { BRANCH_TYPES } from "@/lib/constants";
import { branchFormSchema, type BranchFormValues } from "@/lib/schemas";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import { isUbigeoSelva } from "@/lib/tax-engine";
import { getDepartments as getGeoDepartments, getProvincesForDepartment as getGeoProvinces, getDistrictsForProvince as getGeoDistricts } from "@/lib/geo-peru";
import type { Branch } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Warehouse, Store, Globe, Plus, Pencil, Trash2, MapPin, Phone, TreePine, Loader2, AlertCircle, RefreshCw, type LucideIcon } from "lucide-react";


const branchIcons: Record<string, LucideIcon> = { warehouse: Warehouse, pos: Store, online: Globe };

const defaultValues: BranchFormValues = { name: "", code: "", type: "pos", address: "", phone: "", department_code: "", province_code: "", district_code: "" };

export default function Branches() {
  const { branches, branchStocks, isLoading: branchesLoading, error: branchesError } = useBranches();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  const { branchInvoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices();
  const { saveBranchAsync, deleteBranch } = useBranchMutations();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues,
  });

  const formType = watch("type");
  const formDeptCode = watch("department_code");
  const formProvCode = watch("province_code");
  const formDistCode = watch("district_code");

  const departments = useMemo(() => getGeoDepartments(), []);
  const provinces = useMemo(() => formDeptCode ? getGeoProvinces(formDeptCode) : [], [formDeptCode]);
  const districts = useMemo(() => formProvCode ? getGeoDistricts(formProvCode) : [], [formProvCode]);

  const isSelvaZone = useMemo(
    () => isUbigeoSelva(formDeptCode || "", formProvCode || "", formDistCode || undefined),
    [formDeptCode, formProvCode, formDistCode],
  );

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const branchStatsMap = useMemo(() => {
    const map = new Map<string, { totalItems: number; totalValue: number; lowStockCount: number; invoiceCount: number }>();
    for (const branch of branches) {
      const branchStks = branchStocks.filter(bs => bs.branch_id === branch.id);
      const totalItems = branchStks.filter(bs => bs.stock > 0).length;
      const totalValue = branchStks.reduce((sum, bs) => {
        const product = productMap.get(bs.product_id);
        return sum + (product ? product.price_cents * bs.stock : 0);
      }, 0);
      const lowStockCount = branchStks.filter(bs => bs.stock > 0 && bs.stock <= bs.min_stock).length;
      const invoiceCount = branchInvoices.filter(i => i.branch_id === branch.id).length;
      map.set(branch.id, { totalItems, totalValue, lowStockCount, invoiceCount });
    }
    return map;
  }, [branches, branchStocks, productMap, branchInvoices]);

  if (branchesLoading || productsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const queryError = branchesError || productsError || invoicesError;
  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground text-center">Error al cargar las sedes</p>
        <p className="text-xs text-muted-foreground">{queryError.message}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />Reintentar
        </Button>
      </div>
    );
  }

  const openNew = () => {
    setEditingBranch(null);
    reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    reset({
      name: branch.name,
      code: branch.code,
      type: branch.type,
      address: branch.address || "",
      phone: branch.phone || "",
      department_code: branch.department_code || "",
      province_code: branch.province_code || "",
      district_code: branch.district_code || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (data: BranchFormValues) => {
    try {
      await saveBranchAsync(data, editingBranch);
      setDialogOpen(false);
    } catch {
      // handled by onError
    }
  };

  const confirmDelete = () => {
    if (deleteId) deleteBranch(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Sedes</h1>
          <HelpHint {...HELP_TEXTS.branches} />
        </div>
        <Button onClick={openNew} className="rounded-xl bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sede
        </Button>
      </div>

      <p className="text-sm text-muted-foreground -mt-4">
        {branches.length} sedes registradas · Almacen, Punto de Venta, Tienda Virtual
      </p>

      {branches.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground mb-1">No hay sedes registradas</p>
          <p className="text-sm text-muted-foreground mb-4">Crea tu primera sede para gestionar inventario por ubicación.</p>
          <Button onClick={openNew} className="rounded-xl bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />Crear Primera Sede
          </Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map((branch) => {
          const Icon = branchIcons[branch.type] || Building2;
          const typeInfo = BRANCH_TYPES[branch.type];
          const stats = branchStatsMap.get(branch.id);
          const totalItems = stats?.totalItems ?? 0;
          const totalValue = stats?.totalValue ?? 0;
          const lowStockCount = stats?.lowStockCount ?? 0;
          const invoiceCount = stats?.invoiceCount ?? 0;

          return (
            <Card key={branch.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${typeInfo?.color || "bg-muted"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    {branch.is_selva_zone && (
                      <Badge variant="secondary" className="text-[10px] rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 gap-1">
                        <TreePine className="w-3 h-3" />Selva
                      </Badge>
                    )}
                    {branch.is_default && <Badge variant="secondary" className="text-[10px] rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">Principal</Badge>}
                    <button onClick={() => openEdit(branch)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {!branch.is_default && (
                      <button onClick={() => { setDeleteId(branch.id); setDeleteOpen(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400 dark:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{branch.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mb-3">{branch.code} · {typeInfo?.label}</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {branch.address && (
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{branch.address}</span></div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><span>{branch.phone}</span></div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{totalItems}</p>
                    <p className="text-[10px] text-muted-foreground">Productos</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatCents(totalValue)}</p>
                    <p className="text-[10px] text-muted-foreground">Valor stock</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{invoiceCount}</p>
                    <p className="text-[10px] text-muted-foreground">Comprobantes</p>
                  </div>
                </div>
                {lowStockCount > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">⚠ {lowStockCount} producto{lowStockCount !== 1 ? "s" : ""} con stock bajo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingBranch ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...register("name")} className="rounded-xl" placeholder="Ej: Almacen Central" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Codigo *</Label>
                <Input {...register("code")} className="rounded-xl" placeholder="Ej: ALM" maxLength={5} />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={formType} onValueChange={(v) => setValue("type", v as BranchFormValues["type"])}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BRANCH_TYPES).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Direccion</Label>
              <Input {...register("address")} className="rounded-xl" placeholder="Direccion de la sede" />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input {...register("phone")} className="rounded-xl" placeholder="044-123456" />
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">Ubicacion Geografica</Label>
                {isSelvaZone && (
                  <Badge variant="secondary" className="text-[10px] rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 gap-1">
                    <TreePine className="w-3 h-3" />Zona Selva
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Departamento</Label>
                  <Select
                    value={formDeptCode || "__none__"}
                    onValueChange={(v) => {
                      setValue("department_code", v === "__none__" ? "" : v);
                      setValue("province_code", "");
                      setValue("district_code", "");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Depto." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Provincia</Label>
                  <Select
                    value={formProvCode || "__none__"}
                    onValueChange={(v) => {
                      setValue("province_code", v === "__none__" ? "" : v);
                      setValue("district_code", "");
                    }}
                    disabled={!formDeptCode}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Prov." />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distrito</Label>
                  <Select
                    value={formDistCode || "__none__"}
                    onValueChange={(v) => setValue("district_code", v === "__none__" ? "" : v)}
                    disabled={!formProvCode}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Dist." />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{BRANCH_TYPES[formType]?.description}</p>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700">
                {editingBranch ? "Guardar Cambios" : "Crear Sede"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sede?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminara la sede y todo su stock asociado. Los comprobantes emitidos se conservaran.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
