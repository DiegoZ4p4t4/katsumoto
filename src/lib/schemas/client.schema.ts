// ── Client Schemas (Zod) ──
// Validation schemas for client/customer forms

import { z } from "zod";
import { DOCUMENT_LENGTHS } from "@/lib/constants";

// ── Enums matching domain types ──
export const DocumentTypeEnum = z.enum(["RUC", "DNI", "Pasaporte", "CE", "Otros"]);

// ── Client Form ──
export const clientFormSchema = z.object({
  name: z.string().min(1, "Nombre/Razon social requerido").max(200, "Maximo 200 caracteres"),
  document_type: DocumentTypeEnum,
  document_number: z.string()
    .min(1, "Numero de documento requerido")
    .refine(
      (val, ctx) => {
        const digits = val.replace(/\D/g, "");
        const limits = DOCUMENT_LENGTHS[ctx.parent.document_type];
        if (!limits) return digits.length >= 1;
        return digits.length >= limits.min && digits.length <= limits.max;
      },
      (ctx) => {
        const limits = DOCUMENT_LENGTHS[ctx.parent.document_type];
        const label = ctx.parent.document_type;
        if (limits) return `Debe tener ${limits.min === limits.max ? limits.min : `${limits.min}-${limits.max}`} digitos para ${label}`;
        return "Numero invalido";
      }
    ),
  phone: z.string().max(20, "Maximo 20 caracteres").default(""),
  email: z.string().email("Email invalido").or(z.literal("")).default(""),
  address: z.string().max(200, "Maximo 200 caracteres").default(""),
  city: z.string().max(100, "Maximo 100 caracteres").default(""),
  department_code: z.string().regex(/^\d{2}$|^$/, "Codigo dept. inválido").default(""),
  province_code: z.string().regex(/^\d{4}$|^$/, "Codigo prov. inválido").default(""),
  district_code: z.string().regex(/^\d{6}$|^$/, "Codigo dist. inválido").default(""),
});
export type ClientFormValues = z.infer<typeof clientFormSchema>;
