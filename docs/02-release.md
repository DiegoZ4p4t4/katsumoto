# Release y Versionado

## Version actual: 2.1.6

## Como publicar una nueva version

### 1. Cambiar version en 2 archivos

- `src-tauri/tauri.conf.json` → `"version": "X.Y.Z"`
- `src-tauri/Cargo.toml` → `version = "X.Y.Z"`

### 2. Commit + tag + push

```bash
git add -A
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

### 3. GitHub Actions se ejecuta automaticamente

- Build en 4 plataformas: macOS ARM, macOS Intel, Windows, Linux
- Firma todos los assets con ed25519
- Crea un **draft release** con todos los instaladores
- Job `merge-latest-json` une los `latest.json` de cada plataforma

### 4. Publicar el release

```bash
gh release edit vX.Y.Z --draft=false
```

O desde https://github.com/DiegoZ4p4t4/katsumoto/releases

### 5. Actualizar version web (Docker)

La version web corre en Docker y **NO se actualiza automaticamente** con el push. Se debe rebuild:

```bash
docker compose build --no-cache && docker compose up -d
```

Ver `docs/03-deployment.md` para detalles completos del flujo web vs desktop.

## Como actualizar la app

Las actualizaciones se gestionan desde la pagina **Sistema** (`/sistema`):

```
Usuario abre Sistema (sidebar → Admin → Sistema)
  → Click "Buscar actualizaciones"
  → Si hay nueva version:
      → Muestra boton "Descargar vX.Y.Z"
      → Click → abre navegador en GitHub Releases
      → Descarga .dmg → abrir → arrastrar a Aplicaciones
  → Si no hay:
      → Badge verde "Estas en la ultima version"
```

Flujo interno:
```
App → useAutoUpdate hook
  → check() de @tauri-apps/plugin-updater
  → GET https://github.com/DiegoZ4p4t4/katsumoto/releases/latest/download/latest.json
  → Compara version local vs remota
  → Si remota > local → updateAvailable = true
  → Click "Descargar" → shell.open() abre navegador
  → Usuario descarga .dmg e instala manualmente
```

## Importante: No usar auto-update en caliente

El auto-update interno de Tauri (reemplazo del .app en caliente) causa
pantalla blanca en macOS. La app usa descarga manual via navegador.

Ver `docs/05-white-screen-fix.md` para detalles.

## Convencion de versiones

- **Major (X.0.0)**: Cambios que rompen compatibilidad
- **Minor (2.X.0)**: Nuevas funcionalidades
- **Patch (2.0.X)**: Bug fixes, fixes criticos

## Rollback

Si una version tiene bugs:

```bash
# Solucion: publicar una nueva version (X.Y.Z+1) con el fix
# Los usuarios descargan e instalan manualmente desde Sistema
```

## Releases existentes

| Version | Fecha | Notas |
|---|---|---|
| v2.0.0 | 19/04/2026 | Release inicial, 4 plataformas |
| v2.0.1 | 19/04/2026 | Fix endpoint GitHub |
| v2.0.2 | 19/04/2026 | Fix CSP wss:// Supabase Realtime |
| v2.0.3 | 19/04/2026 | Nombre empresa corregido + docs/ creados |
| v2.0.4 | 19/04/2026 | Version dinamica en sidebar |
| v2.0.5 | 19/04/2026 | Build de prueba |
| v2.1.0 | 19/04/2026 | Pagina Sistema, banner automatico eliminado |
| v2.1.1 | 19/04/2026 | WebView cache clear post-update |
| v2.1.2 | 19/04/2026 | Rust command para flag post-update |
| v2.1.3 | 19/04/2026 | Fix merge latest.json multi-platform |
| v2.1.4 | 19/04/2026 | Fix platform keys (darwin-aarch64) |
| v2.1.5 | 19/04/2026 | Descarga manual via navegador (solucion definitiva) |
| v2.1.6 | 20/04/2026 | Version actual |
