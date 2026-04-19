// ── Branch Schemas (Zod) ──
// Validation schemas for branch forms

import { z } from "zod";

// ── Enums matching domain types ──
export const BranchTypeEnum = z.enum(["warehouse", "pos", "online"]);

// ── Branch Form ──
export const branchFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100, "Maximo 100 caracteres"),
  code: z.string().min(1, "Codigo requerido").max(10, "Maximo 10 caracteres"),
  type: BranchTypeEnum,
  address: z.string().max(200, "Maximo 200 caracteres").default(""),
  phone: z.string().max(20, "Maximo 20 caracteres").default(""),
  department_code: z.string().regex(/^\d{2}$|^$/, "Codigo dept. inválido (2 digitos)").default(""),
  province_code: z.string().regex(/^\d{4}$|^$/, "Codigo prov. inválido (4 digitos)").default(""),
  district_code: z.string().regex(/^\d{6}$|^$/, "Codigo dist. inválido (6 digitos)").default(""),
});
export type BranchFormValues = z.infer<typeof branchFormSchema>;
