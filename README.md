# Katsumoto POS

Sistema POS / Inventario / ERP para **SERVICIOS GENERALES UNITED E.I.R.L.** (RUC 20608183672). Repuestos agrícolas en Pichanaqui, Junin, Peru.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 6 + shadcn/ui + Tailwind CSS + TanStack Query
- **Backend:** Supabase (PostgreSQL 15 + Auth + Edge Functions / Deno)
- **Desktop:** Tauri 2 (macOS, Windows, Linux) con auto-update firmado
- **Deploy:** GitHub Releases (desktop) + Supabase (backend)

## Modulos

- **POS** — Punto de venta con búsqueda rápida
- **Inventario** — Productos, stock por sede, movimientos, transferencias
- **Facturación SUNAT** — Facturas, boletas, notas, guías de remisión (XML UBL + SOAP/REST)
- **Clientes** — Búsqueda RUC/DNI via SUNAT
- **Tienda online** — Catálogo público con pedidos
- **Reportes** — Ventas, stock, KPIs con exportación CSV/PDF

## Comandos

```bash
pnpm dev          # Dev server (port 8551)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Estructura

```
src/
  components/     # ui/, pos/, invoices/, inventory/, clients/, store/
  pages/          # 20 páginas (POS, Inventory, Invoices, etc.)
  services/       # Capa de consultas Supabase
  hooks/          # Custom hooks
  lib/            # types, constants, schemas (Zod), printing (PDF)
supabase/functions/
  sunat-billing/      # Motor de facturación electrónica SUNAT
  sunat-credentials/  # CRUD credenciales SUNAT (AES-256-GCM)
  apis-peru-proxy/    # Proxy RUC/DNI
```

## Docker (web)

```bash
docker compose up -d --build   # http://localhost:8551
```

## Licencia

Privado — SERVICIOS GENERALES UNITED E.I.R.L.
