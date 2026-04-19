// ── Machine Schemas (Zod) ──
// Validation schemas for machine model forms

import { z } from "zod";

// ── Enums matching domain types ──
export const MachineCategoryEnum = z.enum([
  "macheteadora", "fumigadora", "cosechadora", "tractor", "motosierra",
  "bomba", "generador", "pulverizadora", "sembradora", "otro",
]);

// ── Machine Model Form ──
export const machineFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(150, "Máximo 150 caracteres"),
  brand: z.string().min(1, "Marca requerida").max(80, "Máximo 80 caracteres"),
  model: z.string().min(1, "Modelo requerido").max(80, "Máximo 80 caracteres"),
  category: MachineCategoryEnum,
  year: z.string()
    .refine(
      (val) => val === "" || (/^\d{4}$/.test(val) && parseInt(val) >= 1900 && parseInt(val) <= new Date().getFullYear() + 1),
      "Año inválido (1900-" + (new Date().getFullYear() + 1) + ")"
    )
    .default(""),
  description: z.string().max(500, "Máximo 500 caracteres").default(""),
});
export type MachineFormValues = z.infer<typeof machineFormSchema>;
