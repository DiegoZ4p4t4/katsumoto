# Prompt Reutilizable: Notas de Crédito y Devoluciones

## Como usar

Copia el siguiente prompt y pégalo en una nueva sesión de opencode:

---

**PROMPT:**

Implementar Notas de Crédito y Devoluciones para Katsumoto. Leer `PLAN_NOTAS_CREDITO.md` para el plan completo y `AGENTS.md` para contexto del proyecto.

**Stack:** React 19 + TypeScript + Vite 6 + shadcn/ui + TanStack Query + Supabase (PostgreSQL + Edge Functions/Deno).
**Supabase access token:** `sbp_7e348aa58530698fae06bf09d6172916d15a0469`
**Project ref:** `kdsjojrrspzmufdumywd`

**Resumen del plan (4 fases):**
1. **DB:** Agregar `reference_invoice_id`, `motivo_nota`, `descripcion_motivo` a `invoices`. Agregar `return` a `movement_type`. Crear RPC `create_credit_note` que crea NC + revierte stock.
2. **Backend EF:** En `sunat-billing/index.ts` handleSend, pasar `motivo_nota`, `descripcion_motivo`, datos de factura referenciada al transformer `buildNoteDocument`.
3. **Frontend:** Componente `CreateCreditNote.tsx` (dialog con items de factura original, selector motivo SUNAT 01-07, cálculo NC). Botón "Nota de Crédito" en InvoiceTable para facturas aceptadas. Servicio `createCreditNote`. Post-creación: NC a factura→sendBill, NC a boleta→sendSummary.
4. **UX:** Badge "NC emitida", link NC↔factura original en detalle.

**Ya funciona (reutilizar 100%):** Template XML NC (`note.ts`), transformer `buildNoteDocument`, firma XML, envío SOAP sendBill/sendSummary.

**SUNAT:** NC a factura (serie FC01) via sendBill síncrono. NC a boleta (serie BC01) via sendSummary asíncrono. Motivos: 01=anulación, 06=devolución por ítem, 07=devolución global.

Ejecutar tarea por tarea. Actualizar `PLAN_NOTAS_CREDITO.md` marcando progreso.

---

**Fin del prompt**
