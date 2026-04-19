# Signing Keys - Auto-Update

> **CRITICO**: Si se pierde la clave privada o el password, el auto-update queda roto permanentemente.
> Todos los usuarios tendrian que reinstalar manualmente con un nuevo par de claves.

## Archivos

| Archivo | Ubicacion | Proposito |
|---|---|---|
| Clave privada | `~/.tauri/katsumoto.key` | Firmar updates (NUNCA al repo) |
| Clave publica | `~/.tauri/katsumoto.key.pub` | Verificar firmas (esta en tauri.conf.json) |

## GitHub Secrets

| Secret | Valor |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Contenido de `~/.tauri/katsumoto.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password elegido al generar |

## Flujo de firma

1. GitHub Actions lee `TAURI_SIGNING_PRIVATE_KEY` + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
2. `tauri-action` firma el `.tar.gz` → genera `.tar.gz.sig` (firma ed25519)
3. La app descarga el `.tar.gz` + `.sig`, verifica con la pubkey embebida en `tauri.conf.json`
4. Si la firma no coincide → la app NO actualiza

## Regenerar claves (solo emergencia)

Si se pierden las claves:

```bash
# 1. Generar nuevo par
pnpm tauri signer generate -w ~/.tauri/katsumoto.key

# 2. Actualizar pubkey en src-tauri/tauri.conf.json → plugins.updater.pubkey

# 3. Actualizar GitHub Secrets con nueva clave privada + password

# 4. Publicar nueva version (todos los .sig seran firmados con la nueva clave)

# 5. TODOS los usuarios deben reinstalar manualmente (la pubkey vieja ya no funciona)
```

## Backup recomendado

- Clave privada: copiar a un lugar seguro (pendrive encriptado, 1Password, etc.)
- Password: guardar en gestor de contrasenas
- GitHub Secrets: no tienen backup, si se pierden hay que regenerar las claves

## Build local firmado

```bash
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/katsumoto.key)
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<password>"
pnpm tauri build
```

Genera: `.app.tar.gz` + `.app.tar.gz.sig` en `src-tauri/target/release/bundle/macos/`
