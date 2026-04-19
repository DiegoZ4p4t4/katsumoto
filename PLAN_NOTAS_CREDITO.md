# Plan: Notas de Crédito y Devoluciones

## Contexto

El sistema ya emite facturas/boletas y las envía a SUNAT correctamente. Falta implementar el flujo de devoluciones mediante Notas de Crédito (NC). SUNAT requiere que toda devolución se comunique via NC (tipo 07), nunca eliminando el comprobante original.

## Reglas SUNAT para Notas de Crédito

| Regla | Detalle |
|---|---|
| NC a Factura | Serie `FC01`, se envía via `sendBill` (síncrono, CDR inmediato) |
| NC a Boleta | Serie `BC01`, se envía via `sendSummary` (asíncrono, ticket) |
| Motivo obligatorio | Código SUNAT (01-07) + descripción |
| Referencia obligatoria | Tipo + serie-correlativo del comprobante afectado |
| Solo clientes RUC | NC solo aplica a facturas (boletas también pueden tener NC pero con serie `BC01`) |

### Códigos de Motivo SUNAT

| Código | Descripción | Uso |
|---|---|---|
| 01 | Anulación de la operación | Cancelación total |
| 02 | Anulación por error en el RUC | RUC incorrecto |
| 03 | Corrección por error en la descripción | Error en detalle |
| 04 | Descuento global | Descuento no aplicado |
| 05 | Descuento por ítem | Descuento por producto |
| 06 | Devolución por ítem | Devolución parcial de productos |
| 07 | Devolución global | Devolución total de la venta |

---

## Arquitectura

```
Usuario selecciona factura/boleta → "Crear Nota de Crédito"
  → Dialog con items de la factura original
  → Selecciona items a devolver + cantidades
  → Selecciona motivo SUNAT
  → Calcula totales NC
  → RPC create_credit_note:
      → Crea invoice (tipo nota_credito) con reference_invoice_id
      → Crea invoice_items con los items devueltos
      → Revierte stock (movement_type: "return")
      → Auditoría
  → Envío SUNAT automático (sendBill para FC, sendSummary para BC)
```

---

## Tareas

### FASE 1: Base de Datos (3 tareas) -- COMPLETADO

#### 1.1 - Agregar columnas a invoices -- HECHO
```sql
ALTER TABLE invoices
  ADD COLUMN reference_invoice_id uuid REFERENCES invoices(id),
  ADD COLUMN motivo_nota text,
  ADD COLUMN descripcion_motivo text;
```

#### 1.2 - Agregar tipo de movimiento "return" -- HECHO
```sql
ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_movement_type_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_movement_type_check
  CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return'));
```
- Actualizado `adjust_stock` para soportar 'return' (suma stock como 'in')

#### 1.3 - RPC: create_credit_note -- HECHO
Nueva función RPC que:
- Recibe: org_id, parent_invoice_id, items[], motivo, descripcion, branch_id, created_by
- Valida: factura padre existe, está aceptada, items pertencen a la factura
- Crea: invoice con tipo `nota_credito`, serie según tipo padre (FC01/BC01)
- Crea: invoice_items con los items devueltos
- Revierte: stock via branch_stock + stock_movements con movement_type `return`
- Registra: auditoría en audit_log
- Retorna: invoice_id, serie, correlativo

### FASE 2: Backend Edge Function (1 tarea) -- COMPLETADO

#### 2.1 - Actualizar handleSend para pasar datos de nota -- HECHO
- `handleSend` ahora lee `reference_invoice_id`, `motivo_nota`, `descripcion_motivo` del invoice record
- Busca la factura padre para obtener `tipo_doc_afectado` y `num_doc_afectado`
- NC a factura: envía via sendBill (síncrono)
- NC a boleta: retorna error USE_SEND_SUMMARY (debe enviarse via send-summary)
- `handleSummary` actualizado para incluir NC a boletas (serie BC01) en el resumen diario
- `buildSummaryDocument` actualizado para soportar detalles NC con `BillingReference`
- Template `summary.ts` actualizado con `BillingReference` para líneas NC
- **Deployado como v63**, verify_jwt parcheado a false

### FASE 3: Frontend (5 tareas) -- COMPLETADO

#### 3.1 - Tipos y constantes -- HECHO
- `Invoice` type: +reference_invoice_id, +motivo_nota, +descripcion_motivo
- `MovementType`: +"return"
- `CREDIT_NOTE_REASONS` constant (códigos SUNAT 01-07)
- `NC_SERIES_BY_PARENT` constant (factura→FC01, boleta→BC01)

#### 3.2 - Componente: CreateCreditNote.tsx -- HECHO
- Dialog con items de factura original (checkboxes + cantidad editable)
- Selector de motivo SUNAT (dropdown 01-07, auto-rellena descripción)
- Cálculo de totales NC en tiempo real (ratio proporcional)
- Validación: al menos 1 item, cantidad ≤ original
- Post-creación: envío automático a SUNAT via sendBill (solo NC a factura)

#### 3.3 - Integración en InvoiceTable e InvoiceDetail -- HECHO
- Botón "NC" en facturas accepted con sunat_hash (naranja, icono FileMinus2)
- Solo visible si NO tiene NC asociada y NO es nota_credito/nota_debito
- Carga items completos antes de abrir diálogo (via invoiceService.getById)

#### 3.4 - Servicio: invoice.service.ts -- HECHO
- `createCreditNote()`: llama RPC create_credit_note
- `getLinkedCreditNotes()`: obtiene NCs de una factura
- AuditAction: +"credit_note.create"

#### 3.5 - Flujo post-creación -- HECHO
- NC a factura (FC01): envío automático a SUNAT via sendBill en CreateCreditNote
- NC a boleta (BC01): se incluirá en próximo resumen diario via send-summary

### FASE 4: Visualización (2 tareas) -- COMPLETADO

#### 4.1 - Indicadores en InvoiceTable -- HECHO
- Badge "NC emitida" (naranja) en facturas que tienen NC asociada
- Badge "NC" (azul) en comprobantes que son nota de crédito

#### 4.2 - Detalle de nota de crédito -- HECHO
- Sección azul "Nota de Crédito" con motivo SUNAT (código + label + descripción)
- Sección gris "Comprobante referenciado" con reference_invoice_id

---

## Archivos Nuevos

| Archivo | Descripción |
|---|---|
| `src/components/invoices/CreateCreditNote.tsx` | Dialog para crear NC |

## Archivos Modificados

| Archivo | Cambio |
|---|---|
| DB migration | +reference_invoice_id, +motivo_nota, +descripcion_motivo, +return movement |
| `src/lib/types/invoice.ts` | +reference_invoice_id, +motivo_nota, +descripcion_motivo |
| `src/lib/types/stock.ts` | +return en MovementType |
| `src/lib/constants/invoices.ts` | +CREDIT_NOTE_REASONS, fix series BC01/FC01 |
| `src/services/invoice.service.ts` | +createCreditNote method |
| `src/components/invoices/InvoiceTable.tsx` | +botón "Nota de Crédito" |
| `src/components/invoices/InvoiceDetail.tsx` | +mostrar referencia a factura original |
| `supabase/functions/sunat-billing/index.ts` | Pasar datos de nota desde factura al transformer |

## Lo que ya funciona (no tocar)

- Template XML de NC (`note.ts`) — completo con BillingReference + DiscrepancyResponse
- Transformer `buildNoteDocument` — completo
- Envío SOAP via `sendBill` — funciona para facturas
- Envío SOAP via `sendSummary` — funciona para boletas
- Firma XML + certificado — funciona

## No incluye (futuro)

- Notas de Débito (08) — mismo patrón que NC, pero para incrementar valor
- Devoluciones parciales sin NC (cambio de producto)
- Modo devolución en POS (requiere UX dedicada)
