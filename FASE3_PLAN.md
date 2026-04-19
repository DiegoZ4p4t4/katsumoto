# KATSUMOTO - FASE 3: Plan de Nuevos Documentos SUNAT

## Resumen

Migrar 2 tipos de documento SUNAT restantes al motor nativo Deno, más mejora de UX en configuración de impuestos.

---

## Estado Actual (post-FASE 2)

| Componente | Estado |
|---|---|
| sunat-billing EF | v27 deployada, DirectSunatClient único |
| Documentos soportados | Factura (01), Boleta (03), Nota Crédito (07), Nota Débito (08) |
| Flujos SUNAT | sendBill (sync), sendSummary (async), sendVoided (async), getStatus |
| Certificado | PEM en Storage, firma XMLDSig SHA-256 + RSA |
| Edge Function | `sunat-billing` — 1 sola función con actions |
| SOAP | 3 operaciones: sendBill, sendSummary, getStatus |
| Frontend | 22 páginas, POS completo, Invoices, TaxConfiguration |

---

## SUB-FASE 3A: Guía de Remisión (09) — DespatchAdvice

### Por qué es importante
Documento obligatorio para el traslado de mercadería entre almacenes o hacia clientes. Empresa en Pichanaqui con 3 branches (almacén, sede POS, tienda virtual) lo necesita para transfers internos.

### Spec SUNAT
- **Código:** 09
- **Tipo XML:** `DespatchAdvice` (UBL 2.1)
- **Envío:** `sendBill` (síncrono, igual que factura) → CDR inmediato
- **Serie:** T001 (formato obligatorio, primera letra fija "T")
- **Namespace raíz:** `urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2`
- **CustomizationID:** 2.0

### Datos requeridos (según Catálogo SUNAT)
- **Remitente:** Datos del contribuyente (ya en sunat_config)
- **Destinatario:** Cliente o establecimiento destino
- **Transportista:** RUC, nombre, conductor (DNI/licencia), vehículo (placa)
- **Traslado:**
  - Motivo (Catálogo 20): venta, traslado entre establecimientos, importación, etc.
  - Fecha inicio traslado
  - Peso bruto total
  - N° bultos
  - Dirección partida (ubigeo + dirección)
  - Dirección llegada (ubigeo + dirección)
- **Items:** Cada item con código, descripción, cantidad, unidad

### Tareas

#### 3A.1 — Backend (Edge Function)

| # | Tarea | Archivo | Detalle |
|---|---|---|---|
| 1 | Agregar action `send-despatch` | `constants.ts` | Agregar a `VALID_ACTIONS` |
| 2 | Crear template XML | `xml/templates/despatch.ts` | `buildDespatchXml()` — nuevo archivo |
| 3 | Agregar namespaces UBL | `xml/namespaces.ts` | `UBL_DESPATCH_NAMESPACES` |
| 4 | Agregar transformer | `transformers.ts` | `buildDespatchDocument()` — convierte DB → formato Sunat |
| 5 | Agregar tipo de documento | `constants.ts` | `DESPATCH_TYPE = "09"` y mapeo de motivos de traslado (Catálogo 20) |
| 6 | Agregar método en DirectSunatClient | `direct-client.ts` | `sendDespatch()` — reutiliza `sendBill()` |
| 7 | Actualizar interfaz SunatClient | `types.ts` | Agregar `sendDespatch()` al interfaz |
| 8 | Agregar handler en index.ts | `index.ts` | `handleSendDespatch()` — orquesta el flujo |
| 9 | Guardar XML y CDR en Storage | `index.ts` | Mismo patrón que handleSend |

#### 3A.2 — Base de Datos

| # | Tarea | SQL |
|---|---|---|
| 1 | Crear tabla `despatches` | Ver campos abajo |
| 2 | Crear tabla `despatch_items` | Items de la guía |
| 3 | RLS policies |organization-scoped, CRUD estándar |

**Tabla `despatches`:**
```
id, organization_id, branch_id, serie (T001), correlativo,
status (draft/issued/accepted/cancelled),
issue_date, motivo_traslado (catálogo 20), descripcion_motivo,
fecha_inicio_traslado, peso_bruto_total, numero_bultos,
remitente_ubigeo, remitente_direccion,
destino_ubigeo, destino_direccion,
destinatario_tipo_doc, destinatario_documento, destinatario_nombre,
transportista_tipo_doc, transportista_documento, transportista_nombre,
conductor_tipo_doc, conductor_documento, conductor_nombre, conductor_licencia,
vehiculo_placa,
sunat_hash, sunat_xml_path, sunat_cdr_path, sunat_ticket,
sunat_error_code, sunat_error_message, sunat_sent_at, sunat_accepted_at,
created_by, created_at, updated_at
```

**Tabla `despatch_items`:**
```
id, despatch_id, product_id, product_name, product_sku,
quantity, unit, created_at
```

#### 3A.3 — Frontend

| # | Tarea | Archivo | Detalle |
|---|---|---|---|
| 1 | Servicio CRUD | `services/despatch.service.ts` | Nuevo archivo |
| 2 | Página de guías | `pages/Despatches.tsx` | Listado + filtros + acciones |
| 3 | Página crear guía | `pages/CreateDespatch.tsx` | Formulario completo |
| 4 | Hook de mutaciones | `hooks/useDespatchMutations.ts` | TanStack Query |
| 5 | Tipo TypeScript | `lib/types/despatch.ts` | Interfaces |
| 6 | Navegación | Layout principal | Agregar link a "Guías" |
| 7 | Enviar a SUNAT | Botón en listado/detalle | Invoca `sunat-billing` action `send-despatch` |

#### 3A.4 — Validación
- Crear guía de remisión en beta
- Enviar via `sendBill` → verificar ACEPTADA + CDR
- Verificar XML contra schema UBL DespatchAdvice

---

## SUB-FASE 3B: Retención (20) — Retention

### Por qué es importante
Necesario cuando la empresa actúa como agente de retención. Aplica para compras > S/ 700 con comprobantes de proveedores no domiciliados o en ciertas operaciones.

### Spec SUNAT
- **Código:** 20
- **Tipo XML:** `Retention` (UBL 2.1)
- **Envío:** `sendSummary` (asíncrono, igual que boleta) → ticket → consultar
- **Serie:** R001 (formato obligatorio, primera letra "R")
- **Regímenes de retención:** Catálogo 22 (tasa 3%, 6%, etc.)

### Datos requeridos
- **Agente de retención:** Datos del contribuyente
- **Proveedor:** RUC, razón social
- **Regimen de retención** (Catálogo 22)
- **Tasa de retención** (3% por defecto)
- **Fechas:** emisión, período
- **Items (comprobantes retenidos):**
  - Tipo y serie del comprobante original (factura, nota, etc.)
  - Número, fecha de emisión
  - Moneda, importe total
  - Moneda de retención, importe retenido
  - Fecha de pago
  - Número de pago

### Tareas

#### 3B.1 — Backend (Edge Function)

| # | Tarea | Archivo | Detalle |
|---|---|---|---|
| 1 | Agregar action `send-retention` | `constants.ts` | Agregar a `VALID_ACTIONS` |
| 2 | Crear template XML | `xml/templates/retention.ts` | `buildRetentionXml()` — nuevo archivo |
| 3 | Agregar namespaces UBL | `xml/namespaces.ts` | `UBL_RETENTION_NAMESPACES` |
| 4 | Agregar transformer | `transformers.ts` | `buildRetentionDocument()` |
| 5 | Agregar constante | `constants.ts` | `RETENTION_TYPE = "20"`, regímenes Catálogo 22 |
| 6 | Agregar método en DirectSunatClient | `direct-client.ts` | `sendRetention()` — reutiliza `sendSummary()` |
| 7 | Actualizar interfaz SunatClient | `types.ts` | Agregar `sendRetention()` |
| 8 | Agregar handler en index.ts | `index.ts` | `handleSendRetention()` |

#### 3B.2 — Base de Datos

| # | Tarea | SQL |
|---|---|---|
| 1 | Crear tabla `retentions` | Ver campos abajo |
| 2 | Crear tabla `retention_items` | Comprobantes retenidos |
| 3 | RLS policies | organization-scoped |

**Tabla `retentions`:**
```
id, organization_id, branch_id, serie (R001), correlativo,
status (draft/issued/accepted/cancelled),
issue_date, regimen_retencion (catálogo 22), tasa_retencion (default 3.00),
proveedor_tipo_doc, proveedor_documento, proveedor_razon_social,
total_comprobantes, total_retencion, total_a_pagar,
moneda,
sunat_hash, sunat_xml_path, sunat_cdr_path, sunat_ticket,
sunat_error_code, sunat_error_message, sunat_sent_at, sunat_accepted_at,
created_by, created_at, updated_at
```

**Tabla `retention_items`:**
```
id, retention_id,
tipo_comprobante, serie_comprobante, numero_comprobante,
fecha_comprobante, moneda_comprobante,
importe_total, importe_retenido,
moneda_retenido, fecha_pago, numero_pago,
created_at
```

#### 3B.3 — Frontend

| # | Tarea | Archivo | Detalle |
|---|---|---|---|
| 1 | Servicio CRUD | `services/retention.service.ts` | Nuevo archivo |
| 2 | Página retenciones | `pages/Retentions.tsx` | Listado + acciones |
| 3 | Página crear retención | `pages/CreateRetention.tsx` | Formulario |
| 4 | Hook de mutaciones | `hooks/useRetentionMutations.ts` | TanStack Query |
| 5 | Tipo TypeScript | `lib/types/retention.ts` | Interfaces |
| 6 | Navegación | Layout principal | Agregar link |
| 7 | Enviar a SUNAT | Botón en UI | Invoca `send-retention` + check-ticket |

#### 3B.4 — Validación
- Crear retención en beta
- Enviar via `sendSummary` → ticket → consultar getStatus → verificar ACEPTADA + CDR

---

## SUB-FASE 3C: Configuración de Impuestos por Branch (mejora UX)

### Estado actual
- `tax_configurations` ya soporta `branch_id` (nullable)
- El service ya tiene `upsertForBranch()`
- El contexto ya carga branch configs
- **Falta:** UI para configurar por branch desde TaxConfiguration.tsx

### Tareas

| # | Tarea | Detalle |
|---|---|---|
| 1 | Agregar tabs/secciones en TaxConfiguration.tsx | Tab "General" (org) + tab por cada branch |
| 2 | Cada branch hereda del general por defecto | Checkbox "Usar config general" por defecto true |
| 3 | Si desmarca, muestra formulario editable | Mismos campos que el general |
| 4 | Indicador visual en Branches.tsx | Mostrar si la branch tiene config propia |

---

## Orden de ejecución recomendado

```
3A (Guía de Remisión)
  ├── 3A.1 Backend (templates, transformer, handler)
  ├── 3A.2 DB (tablas + RLS)
  ├── 3A.3 Frontend (páginas, service, hook)
  └── 3A.4 Validación SUNAT beta

3B (Retención) — mismo patrón que 3A
  ├── 3B.1 Backend
  ├── 3B.2 DB
  ├── 3B.3 Frontend
  └── 3B.4 Validación SUNAT beta

3C (Tax config por branch) — rápido, sin backend nuevo
  └── Solo cambios en TaxConfiguration.tsx + Branches.tsx
```

**Justificación del orden:**
1. Guía de Remisión primero — más urgente (transfers internos entre 3 branches)
2. Retención segundo — menos frecuente, pero completa la suite de documentos
3. Tax config por branch — mejora UX, sin bloquear nada

---

## Dependencias y Riesgos

| Riesgo | Mitigación |
|---|---|
| Specs UBL de Guía/Retención complejas | Referenciar Greenter (PHP, open-source) para estructura XML |
| SUNAT beta rechaza XML nuevo | Probar primero en beta, iterar con mensajes de error |
| Frontend crece mucho | Lazy loading ya implementado con React.lazy |
| Nuevo endpoint SOAP? | No — Guía usa sendBill existente, Retención usa sendSummary existente |

---

## Archivos a crear/modificar (resumen)

### Nuevos (Edge Function)
- `supabase/functions/sunat-billing/sunat/xml/templates/despatch.ts`
- `supabase/functions/sunat-billing/sunat/xml/templates/retention.ts`

### Nuevos (Frontend)
- `src/services/despatch.service.ts`
- `src/services/retention.service.ts`
- `src/pages/Despatches.tsx`
- `src/pages/CreateDespatch.tsx`
- `src/pages/Retentions.tsx`
- `src/pages/CreateRetention.tsx`
- `src/hooks/useDespatchMutations.ts`
- `src/hooks/useRetentionMutations.ts`
- `src/lib/types/despatch.ts`
- `src/lib/types/retention.ts`

### Modificar (Edge Function)
- `sunat-billing/sunat/constants.ts` — actions + mapeos
- `sunat-billing/sunat/types.ts` — interfaz SunatClient
- `sunat-billing/sunat/direct-client.ts` — nuevos métodos
- `sunat-billing/sunat/transformers.ts` — nuevos transformers
- `sunat-billing/sunat/xml/namespaces.ts` — nuevos namespaces
- `sunat-billing/index.ts` — nuevos handlers

### Modificar (Frontend)
- Layout de navegación — agregar links
- `src/pages/TaxConfiguration.tsx` — tabs por branch
- `src/pages/Branches.tsx` — indicador de config propia

### Base de Datos (migraciones)
- `create_despatches_table`
- `create_despatch_items_table`
- `create_retentions_table`
- `create_retention_items_table`

---

## Estimación

| Sub-fase | Backend | DB | Frontend | Validación | Total |
|---|---|---|---|---|---|
| 3A - Guía | 2h | 0.5h | 2h | 0.5h | ~5h |
| 3B - Retención | 1.5h | 0.5h | 1.5h | 0.5h | ~4h |
| 3C - Tax config | — | — | 1h | — | ~1h |
| **Total** | | | | | **~10h** |
