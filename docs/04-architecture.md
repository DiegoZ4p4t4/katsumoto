# Arquitectura y Disaster Recovery

## Empresa

**SERVICIOS GENERALES UNITED E.I.R.L.** (RUC 20608183672)
Nombre comercial: **Katsumoto**
Repuestos agricolas, Pichanaqui, Junin, Peru

## Stack

| Capa | Tecnologia | Host |
|---|---|---|
| Desktop app | Tauri 2 (Rust + WebView) | Local |
| Frontend | React 19 + TypeScript + Vite 6 + shadcn/ui | Bundled en Tauri |
| Backend | Supabase (PostgreSQL 15 + Auth + Storage) | supabase.co |
| Billing SUNAT | Edge Functions (Deno/TypeScript) | supabase.co |
| Releases | GitHub Actions + GitHub Releases | github.com |

## Base de datos (25 tablas, todas con RLS)

| Tabla | Filas | Proposito |
|---|---|---|
| organizations | 2 | Multi-tenant |
| profiles | 2 | Perfiles de usuario |
| branches | 3 | Sucursales |
| products | 143 | Repuestos |
| customers | 2 | Clientes |
| invoices / invoice_items | 2 | Comprobantes |
| sunat_config | 1 | Config SUNAT |
| sunat_summary_log | 7 | Log resumenes/bajas |
| despatches / despatch_items | 1/4 | Guias de remision |
| tax_configurations | 1 | Impuestos (selva) |
| machine_models / product_machines | 48/115 | Maquinas y compatibilidad |
| branch_stock | 1 | Stock por sucursal |
| price_tiers | 40 | Precios por cantidad |
| cash_registers / register_transactions | 0/0 | Cajas |
| stock_movements | 2 | Movimientos stock |
| audit_log | 8 | Auditoria |
| store_orders / store_order_items | 0/0 | Tienda online |
| managed_category_* | 17/17/19 | Categorias |

## Edge Functions

### sunat-billing (v62)
Motor de facturacion electronica SUNAT. 100% TypeScript.

| Tipo documento | Transporte | Endpoint |
|---|---|---|
| Factura (01), Nota (07/08) | SOAP sendBill | e-factura.sunat.gob.pe |
| Boleta (03) | SOAP sendSummary | e-factura.sunat.gob.pe |
| Baja (RA) | SOAP sendSummary | e-factura.sunat.gob.pe |
| Guia Remision (09) | REST OAuth2 | api-cpe.sunat.gob.pe |

### sunat-credentials (v8)
CRUD de config SUNAT. Encripta `clave_sol` y `certificado_password` con AES-256-GCM.

### apis-peru-proxy (v4)
Proxy seguro para consultas RUC/DNI.

## Cuentas y accesos

| Servicio | Proposito |
|---|---|
| Supabase | Backend (DB + Auth + EFs + Storage) |
| GitHub (DiegoZ4p4t4) | Repo + releases + Actions |
| SUNAT Menú SOL | Facturacion electronica |
| apisperu.com | Consultas RUC/DNI |

## Disaster Recovery

### Escenario: Se pierde el repo de GitHub

```bash
# La app sigue funcionando (no depende del repo para ejecutarse)
# Solo se pierde la capacidad de publicar updates
# Solucion: git init + gh repo create + push desde backup local
```

### Escenario: Se pierde Supabase

- Sin backup: se pierde toda la data (productos, facturas, clientes)
- Mitigacion: hacer dump periodico
  ```bash
  pg_dump "postgresql://postgres:[password]@db.kdsjojrrspzmufdumywd.supabase.co:5432/postgres" > backup.sql
  ```
- Las Edge Functions estan en el repo (se puede re-deployar)

### Escenario: Se pierde la clave privada de firma

Ver `docs/01-signing-keys.md` → seccion "Regenerar claves"
Consecuencia: todos los usuarios reinstalan manualmente

### Escenario: Se pierde el certificado SUNAT

Los PEMs estan en Storage bucket `sunat-documents`.
Si se pierde Storage: re-subir desde el .p12 original (si existe) o solicitar nuevo a SUNAT.

### Escenario: Supabase secrets se borran

Re-configurar desde `.env` local y `docs/03-deployment.md`.
Los secrets NO tienen backup en Supabase, guardar valores en gestor de contrasenas.

## IDs importantes

| Recurso | ID |
|---|---|
| Supabase project ref | `kdsjojrrspzmufdumywd` |
| Organization ID | `7e80b22f-b06a-4025-937a-5f9d62d78733` |
| Admin user ID | `7a900ed7-3939-46aa-bdb2-2e8e3be5621a` |
| Storage bucket (certs) | `sunat-documents` |
