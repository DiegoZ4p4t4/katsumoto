import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { getDepartments } from "@/lib/geo-peru";
import { queryRuc, queryDni } from "@/services/apisPeru";
import type { Customer } from "@/lib/types";
import type { ClientFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: Customer | null;
  form: UseFormReturn<ClientFormValues>;
  onSave: (data: ClientFormValues) => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  editingClient,
  form,
  onSave,
}: ClientFormDialogProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const formDocType = watch("document_type");
  const formDocNumber = watch("document_number");
  const formCity = watch("city");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const lastLookupRef = useRef("");

  useEffect(() => {
    const digits = formDocNumber.replace(/\D/g, "");
    if (digits === lastLookupRef.current) return;

    if (formDocType === "RUC" && digits.length === 11) {
      lastLookupRef.current = digits;
      setLookupLoading(true);
      setLookupSuccess(false);
      queryRuc(digits)
        .then((data) => {
          if (data.razonSocial) setValue("name", data.razonSocial);
          if (data.direccion) setValue("address", data.direccion);
          if (data.departamento) setValue("city", data.departamento);
          if (data.telefonos?.[0]) setValue("phone", data.telefonos[0]);
          setLookupSuccess(true);
        })
        .catch(() => {})
        .finally(() => setLookupLoading(false));
    } else if (formDocType === "DNI" && digits.length === 8) {
      lastLookupRef.current = digits;
      setLookupLoading(true);
      setLookupSuccess(false);
      queryDni(digits)
        .then((data) => {
          setValue("name", `${data.apellidoPaterno} ${data.apellidoMaterno}, ${data.nombres}`);
          setLookupSuccess(true);
        })
        .catch(() => {})
        .finally(() => setLookupLoading(false));
    } else {
      setLookupLoading(false);
      setLookupSuccess(false);
    }
  }, [formDocNumber, formDocType, setValue]);

  const docLabel = formDocType === "RUC" ? "RUC (11 dígitos)" : formDocType === "DNI" ? "DNI (8 dígitos)" : formDocType;
  const docMaxLength = formDocType === "RUC" ? 11 : formDocType === "DNI" ? 8 : 15;
  const docPlaceholder = formDocType === "RUC" ? "20123456781" : formDocType === "DNI" ? "45678901" : "Número de documento";

  const handleDocTypeChange = (v: string) => {
    setValue("document_type", v as ClientFormValues["document_type"]);
    setValue("document_number", "");
    lastLookupRef.current = "";
    setLookupSuccess(false);
    setLookupLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo Doc.</Label>
              <Select value={formDocType} onValueChange={handleDocTypeChange}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{DOCUMENT_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>{docLabel} *</Label>
              <div className="relative">
                <Input
                  {...register("document_number")}
                  className="rounded-xl pr-8"
                  maxLength={docMaxLength}
                  placeholder={docPlaceholder}
                />
                {lookupLoading && (
                  <Loader2 className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-orange-500" />
                )}
                {lookupSuccess && !lookupLoading && (
                  <CheckCircle className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
              {errors.document_number && <p className="text-xs text-red-500">{errors.document_number.message}</p>}
              {lookupSuccess && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {"\u2713"} Datos autocompletados desde {formDocType === "RUC" ? "SUNAT" : "RENIEC"}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Razón Social / Nombre *</Label>
            <Input {...register("name")} className="rounded-xl" placeholder="Nombre de la empresa o persona" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register("phone")} className="rounded-xl" placeholder="945678901" />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={formCity} onValueChange={(v) => setValue("city", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {getDepartments().map((d) => <SelectItem key={d.code} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Correo Electrónico</Label>
            <Input type="email" {...register("email")} className="rounded-xl" placeholder="contacto@empresa.pe" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input {...register("address")} className="rounded-xl" placeholder="Dirección completa" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
            <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700">
              {editingClient ? "Guardar Cambios" : "Registrar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
