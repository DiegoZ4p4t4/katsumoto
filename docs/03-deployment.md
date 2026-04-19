# Deployment

## Proyecto

- **Repo:** https://github.com/DiegoZ4p4t4/katsumoto
- **Frontend:** Tauri 2 (desktop app, auto-update via GitHub Releases)
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Project ref:** `kdsjojrrspzmufdumywd`

## Edge Functions (Supabase)

### Deploy

```bash
SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 \
  npx supabase functions deploy sunat-billing --project-ref kdsjojrrspzmufdumywd

SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 \
  npx supabase functions deploy sunat-credentials --project-ref kdsjojrrspzmufdumywd

SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 \
  npx supabase functions deploy apis-peru-proxy --project-ref kdsjojrrspzmufdumywd
```

### CRITICO: Parchear verify_jwt despues de cada deploy

Cada `supabase functions deploy` resetea `verify_jwt` a `true`.
Las 3 EFs usan autenticacion JWT propia (decode + profile lookup), no la de Supabase.
Sin este parche, las EFs rechazan todas las peticiones con 401.

```bash
for fn in sunat-billing sunat-credentials apis-peru-proxy; do
  curl -X PATCH "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/functions/$fn" \
    -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" \
    -H "Content-Type: application/json" \
    -d '{"verify_jwt": false}'
done
```

Verificar:
```bash
for fn in sunat-billing sunat-credentials apis-peru-proxy; do
  echo -n "$fn: "
  curl -s "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/functions/$fn" \
    -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verify_jwt', 'N/A'))"
done
```

Debe mostrar `false` para las 3.

## Supabase Secrets

Configurados en el proyecto:

| Secret | Proposito |
|---|---|
| `SUNAT_DIRECT_ENABLED` | Flag para facturacion directa (true) |
| `APIS_PERU_TOKEN` | Token para consultas RUC/DNI via apisperu.com |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Anon key del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypass RLS) |
| `SUPABASE_DB_URL` | Connection string PostgreSQL |

## Frontend (.env)

```env
VITE_SUPABASE_URL=https://kdsjojrrspzmufdumywd.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

## Certificado Digital SUNAT

Archivos PEM almacenados en Supabase Storage bucket `sunat-documents`:

| Archivo | Path en Storage |
|---|---|
| Clave privada | `{orgId}/certificates/private_key.pem` |
| Certificado | `{orgId}/certificates/certificate.pem` |

Org ID: `7e80b22f-b06a-4025-937a-5f9d62d78733`

## GitHub Secrets

| Secret | Proposito |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Clave privada para firmar updates |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password de la clave privada |
| `GITHUB_TOKEN` | Automatico, usado por Actions |

## Build local

```bash
# Dev server (puerto 8551)
pnpm dev

# Tauri dev (hot reload)
pnpm tauri:dev

# Build firmado para distribucion
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/katsumoto.key)
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<password>"
pnpm tauri build

# Output: src-tauri/target/release/bundle/
#   macos/Katsumoto POS.app
#   macos/Katsumoto POS.app.tar.gz + .sig  (updater)
#   dmg/Katsumoto POS_X.Y.Z_aarch64.dmg
```
