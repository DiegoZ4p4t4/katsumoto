# Katsumoto - AGENTS.md

## Proyecto

Sistema POS/Inventario/ERP para **SERVICIOS GENERALES UNITED E.I.R.L.** (RUC 20608183672), nombre comercial **Katsumoto**. Repuestos agricolas en Pichanaqui, Junin, Peru.

## Documentacion critica

Ver `docs/` para documentacion operacional:
- `01-signing-keys.md` — Claves de firma ed25519 (CRITICO)
- `02-release.md` — Flujo de versiones y auto-update
- `03-deployment.md` — Deploy EFs, secrets, verify_jwt
- `04-architecture.md` — Arquitectura y disaster recovery

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 6 (SWC) + shadcn/ui + Tailwind CSS + TanStack Query
- **Backend:** Supabase (PostgreSQL 15 + Auth + Edge Functions/Deno)
- **Deploy:** GitHub Releases (desktop app + auto-update) + Supabase (backend)
- **Package Manager:** pnpm

## Comandos

```bash
pnpm dev          # Dev server (port 8551)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm sunat:smoke  # SUNAT smoke test
```

## Estructura

```
src/
  components/     # ui/ (shadcn), pos/, invoices/, inventory/, clients/, store/, machines/
  pages/          # 20 paginas (Index, POS, Inventory, Invoices, SunatConfig, etc.)
  services/       # 15 archivos - capa de consultas Supabase
  hooks/          # 25 custom hooks
  lib/            # types/, constants/, schemas/ (Zod), printing/ (PDF), utils/
supabase/functions/
  sunat-billing/      # v62 - Motor de facturacion electronica SUNAT (REST + SOAP)
  sunat-credentials/  # v8  - CRUD de credenciales SUNAT (encriptado AES-256-GCM)
  apis-peru-proxy/    # v4  - Proxy RUC/DNI via apisperu.com
OTROS/
  sunat-billing-api/  # API PHP legacy (Greenter) - MARCADO PARA ELIMINAR
  migration-sql/      # SQL de migracion inicial (productos, stock, etc.)
  certificado_sunat_20608183672.p12  # Certificado original (PEMs ya en Storage)
```

## Base de Datos (25 tablas, todas con RLS)

| Tabla | Filas | Proposito |
|---|---|---|
| organizations | 2 | Multi-tenant |
| profiles | 2 | Perfiles de usuario |
| branches | 3 | Almacen central, Sede Pichanaqui, Tienda Virtual |
| products | 143 | Repuestos |
| customers | 2 | Clientes de prueba (RUC + DNI) |
| invoices / invoice_items | 2 | Factura F001-1 (cancelada) + Boleta B001-1 (emitida) |
| sunat_config | 1 | Config SUNAT (RUC 20608183672, modo beta) |
| sunat_summary_log | 7 | Log de resumenes/bajas (2 aceptados, 5 rejected de iteracion) |
| despatches / despatch_items | 1 / 4 | Guia de remision T001-1 (pendiente envio REST) |
| tax_configurations | 1 | Config impuestos (selva law habilitada) |
| machine_models / product_machines | 48 / 115 | Modelos de maquinas y compatibilidad |
| branch_stock | 1 | Stock por sucursal |
| price_tiers | 40 | Precios por cantidad |
| managed_category_families/groups/categories | 17/17/19 | Categorias gestionadas |
| store_orders / store_order_items | 0 / 0 | Tienda online (sin pedidos) |
| cash_registers / register_transactions | 0 / 0 | Cajas registradoras |
| stock_movements | 2 | Movimientos de stock |
| audit_log | 8 | Log de auditoria |

## Edge Functions

### sunat-billing (v62, verify_jwt=false)
Motor de facturacion electronica nativo en Deno. 100% TypeScript, sin PHP.

**Actions:**
| Action | Transporte | Descripcion |
|---|---|---|
| `test` | - | Test conexion + firma digital |
| `send` | SOAP sendBill | Enviar factura/nota (sincrono, CDR inmediato) |
| `send-summary` | SOAP sendSummary | Enviar resumen diario de boletas (async, ticket) |
| `send-voided` | SOAP sendSummary | Enviar comunicacion de baja (async, ticket) |
| `check-ticket` | SOAP getStatus | Consultar ticket de baja |
| `check-summary-ticket` | SOAP getStatus | Consultar ticket de resumen |
| `send-despatch` | **REST** sendCpe | Enviar guia de remision via REST API (async, ticket) |
| `check-despatch-ticket` | **REST** checkStatus | Consultar ticket de guia (0=aceptado, 98=proceso, 99=rechazado) |
| `debug-despatch` | SOAP raw | Debug: envia GRE via SOAP y retorna response crudo |

**Arquitectura por tipo de documento:**

| Documento | Transporte | Auth | Endpoint |
|---|---|---|---|
| Factura (01), Nota (07/08) | SOAP sendBill | WS-Security | e-factura.sunat.gob.pe |
| Boleta (03) | SOAP sendSummary | WS-Security | e-factura.sunat.gob.pe |
| Baja (RA) | SOAP sendSummary | WS-Security | e-factura.sunat.gob.pe |
| Guia Remision (09) | **REST** | **OAuth2** | api-cpe.sunat.gob.pe |

**Modulos clave:**
```
sunat-billing/sunat/
  auth.ts              # JWT decode + profile lookup
  client.ts            # Factory: DirectSunatClient
  constants.ts         # Maps (tipo doc, afectacion, errores) + VALID_ACTIONS
  direct-client.ts     # Orquestador: SOAP para CPE, REST para GRE
  http.ts              # Helpers CORS, JSON, error
  storage.ts           # Verificar archivos en Storage
  transformers.ts      # DB records → documentos SUNAT (factura, nota, resumen, baja, guia)
  types.ts             # SunatCredentials, SunatClient, SunatResult
  crypto/
    certificate.ts     # Carga PEMs de Storage
    credentials.ts     # AES-256-GCM decrypt
    xml-signer.ts      # XMLDSig (SHA-256 + RSA + C14N simplificado)
  gre/                 # ★ NUEVO - GRE REST API
    gre-rest-client.ts # OAuth2 token + sendCpe (POST JSON) + checkStatus (GET)
    token-cache.ts     # Cache token con refresh buffer 10 min
  soap/
    soap-client.ts     # SOAP HTTP calls (sendBill, sendSummary, getStatus)
    soap-envelope.ts   # SOAP envelope builders
    soap-parser.ts     # SOAP response parsers
  utils/
    endpoints.ts       # SOAP endpoints (beta/prod)
    zip.ts             # zipXml, unzipFirstFile (fflate)
    number-to-words.ts # Numero a letras en espanol
  xml/
    helpers.ts         # escapeXml, formatAmount, ensureArray
    namespaces.ts      # UBL namespaces (invoice, despatch)
    templates/
      invoice.ts       # UBL 2.1 Factura/Boleta
      note.ts          # UBL 2.1 Nota Credito/Debito
      summary.ts       # UBL 2.0 Resumen Diario
      voided.ts        # UBL 2.0 Comunicacion de Baja
      despatch.ts      # UBL 2.1 Guia de Remision (version-aware 1.0/2.0)
```

### sunat-credentials (v8, verify_jwt=false)
CRUD de config SUNAT. Encripta `clave_sol` y `certificado_password` con AES-256-GCM.

### apis-peru-proxy (v4, verify_jwt=false)
Proxy seguro para consultas RUC/DNI. Lee `APIS_PERU_TOKEN` de secrets.

## Supabase Secrets (ya configurados)

`SUNAT_DIRECT_ENABLED=true`, `APIS_PERU_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`

## Certificado Digital

PEMs en Storage bucket `sunat-documents`:
- `{orgId}/certificates/private_key.pem`
- `{orgId}/certificates/certificate.pem`

Org ID: `7e80b22f-b06a-4025-937a-5f9d62d78733`
User ID (admin): `7a900ed7-3939-46aa-bdb2-2e8e3be5621a`
Supabase access token: `sbp_7e348aa58530698fae06bf09d6172916d15a0469`
Project ref: `kdsjojrrspzmufdumywd`

## Deploy (Supabase CLI)

```bash
# Ya autenticado con access token
SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 npx supabase functions deploy sunat-billing --project-ref kdsjojrrspzmufdumywd
SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 npx supabase functions deploy sunat-credentials --project-ref kdsjojrrspzmufdumywd
SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 npx supabase functions deploy apis-peru-proxy --project-ref kdsjojrrspzmufdumywd
```

Nota: Edge Runtime no soporta JWTs ES256. Todas las EFs tienen `verify_jwt=false` y hacen su propia validacion JWT (decode sub + lookup profile). Cada deploy resetea `verify_jwt` a true → parchear con:
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/functions/sunat-billing" \
  -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" \
  -H "Content-Type: application/json" -d '{"verify_jwt": false}'
```

## Estado Actual y Roadmap

### COMPLETADO

- [x] v1.0 completo (62/62 tareas, 12 fases)
- [x] sunat-billing v62 deployado (100% nativo Deno, sin PHP)
- [x] Certificado PEM en Storage (no mas .p12)
- [x] Test de conexion SUNAT exitoso (firma XML OK)
- [x] **FASE 1 - Validacion SUNAT beta completa (SOAP):**
  - [x] Factura F001-1 enviada via sendBill → ACEPTADA + CDR
  - [x] Boleta B001-1 enviada via sendSummary (resumen diario) → ACEPTADA + CDR
  - [x] Baja de factura via sendVoided (comunicacion de baja) → ACEPTADA + CDR
  - [x] check-ticket / check-summary-ticket verificados con CDR
- [x] XML UBL 2.1 correcto: AccountingSupplierParty con PartyIdentification/schemeID="6"
- [x] XML UBL 2.0 (summary/voided): namespaces en una sola linea (requerido por C14N simplificado)
- [x] **FASE GRE - Guia de Remision Electronica (parcial):**
  - [x] Template XML GRE (despatch.ts) - estructura correcta Greenter, version-aware
  - [x] Tabla `despatches` + `despatch_items` creadas
  - [x] Transformer `buildDespatchDocument` completo
  - [x] Cliente REST implementado (`gre/gre-rest-client.ts` + `gre/token-cache.ts`)
  - [x] OAuth2 flow: token caching, send CPE (POST JSON), check status (GET)
  - [x] `send-despatch` action via REST (async, ticket-based)
  - [x] `check-despatch-ticket` action (poll: 0=aceptado, 98=proceso, 99=rechazado)
  - [x] Columnas `gre_client_id`, `gre_client_secret` en `sunat_config`
  - [x] Flujo REST verificado: reach OAuth2 endpoint correctamente

### PENDIENTE - GRE (ver `PLAN_GRE_REST_API.md` y `AVANCE_GRE.md`)
- [ ] **Credenciales OAuth2 reales** - Registrar empresa en SUNAT Menú SOL para obtener `client_id` + `client_secret`
- [ ] **Test envio GRE completo** - send-despatch + check-despatch-ticket con credenciales reales

### PENDIENTE - Consolidacion (FASE 2)
- [ ] **Eliminar OTROS/sunat-billing-api/** - API PHP legacy (~4.4MB), ya no se necesita
- [ ] **Limpiar OTROS/migration-sql/** - SQL inicial ya ejecutado
- [ ] **Eliminar OTROS/certificado_sunat_20608183672.p12** - PEMs ya en Storage
- [ ] **Limpiar debug-despatch** - Remover handleDebugDespatch de index.ts (era para testing SOAP)

### PENDIENTE - v2 Features (FASE 3)
- [ ] **Retencion (20)** - Portear RetentionBuilder del PHP a Deno
- [ ] **Configuracion de impuestos** - Tabla tax_configurations con 1 fila, integrar con flujo de facturacion
- [ ] **Fix note.ts AccountingSupplierParty** - Actualizar a formato PartyIdentification/schemeID="6" (igual que invoice.ts)

## Lecciones Aprendidas - SUNAT XML/Signing

### C14N Simplificado (xml-signer.ts)
- `canonicalizeXml` es una version simplificada de C14N: solo remueve XML declaration, normaliza line endings, expande self-closing tags
- **CRITICO:** Los namespaces del elemento raiz deben estar en UNA SOLA LINEA separados por espacios. Si estan en multiples lineas, el digest no coincide con la C14N real de SUNAT.
- `extractRootNamespaces` extrae y ordena namespaces del root para `SignedInfo` (esto SI funciona con multilinea)
- Invoice/note templates usan `buildNamespaces()` que ya produce single-line. Summary/voided tambien ahora.

### Estructura XML UBL
- **Invoice (UBL 2.1):** AccountingSupplierParty usa `cac:Party/cac:PartyIdentification/cbc:ID schemeID="6"` + RegistrationAddress con AddressTypeCode
- **Summary/Voided (UBL 2.0):** AccountingSupplierParty usa `cbc:CustomerAssignedAccountID` + `cbc:AdditionalAccountID` (formato diferente)
- **Summary TaxTotal:** Requiere `<cbc:Percent>18.00</cbc:Percent>` dentro de `cac:TaxCategory` (error 2992 si falta)
- **Invoice TaxSubtotals:** Siempre incluir IGV (1000) + EXO (9997) si hay exoneradas + INA (9998) si hay inafectas
- `mto_base_igv` siempre es `valorVentaItem`, no solo para gravados
- NO usar `<![CDATA[...]]>` en el XML
- Usar `new TextEncoder().encode(xml)` para el ZIP (no strToU8 de fflate)

### GRE REST API (nuevo)
- SOAP para GRE esta **deprecado** por SUNAT. Error 1085 = "use el nuevo sistema", 2112 = "version incorrecta"
- **REST endpoints:**
  - Auth: `https://api-test-seguridad.sunat.gob.pe/v1` (beta) / `https://api-seguridad.sunat.gob.pe/v1` (prod)
  - CPE: `https://api-test.sunat.gob.pe/v1` (beta) / `https://api-cpe.sunat.gob.pe/v1` (prod)
- **OAuth2:** Password grant con `client_id` + `client_secret` (obtener de SUNAT Menú SOL)
- **Send:** POST JSON `{ archivo: { nomArchivo, arcGreZip(base64), hashZip(sha256hex) } }`
- **Siempre async:** TODAS las GRE via REST retornan ticket (no CDR inmediato)
- **Status codes:** 0=aceptado+CDR, 98=en proceso, 99=rechazado

### Reglas SUNAT
- Boletas se envian via resumen diario (sendSummary), NO via sendBill
- Boletas se dan de baja via resumen diario (no via comunicacion de baja RA)
- Facturas/notas se envian via sendBill y se dan de baja via sendVoided (RA)
- Guias de remision se envian via REST API (NO SOAP, deprecado)
- Cada deploy resetea `verify_jwt` a true → siempre parchear via Management API despues

## Convenciones

- TypeScript strict mode
- No agregar comentarios salvo solicitud explicita
- Seguir patrones existentes en servicios y componentes
- Usar Supabase MCP tools para operaciones de DB/Edge Functions
- Deployar EFs con `npx supabase functions deploy` (CLI ya autenticado)
