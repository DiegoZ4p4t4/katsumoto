# Release y Versionado

## Version actual: 2.1.0

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

### 4. Publicar el release

```bash
gh release edit vX.Y.Z --draft=false
```

O desde https://github.com/DiegoZ4p4t4/katsumoto/releases

### 5. Auto-update se activa

Las apps instaladas detectan la nueva version en ~10 segundos despues de iniciar sesion.
El usuario ve un banner con boton "Actualizar" → descarga → reinicio → nueva version.

## Auto-update - Como funciona (desde v2.1.0)

El auto-check automatico fue removido. Las actualizaciones se gestionan desde la pagina **Sistema** (`/sistema`):

```
Usuario abre Sistema (sidebar → Admin → Sistema)
  → Click "Buscar actualizaciones"
  → Si hay nueva version:
      → Muestra changelog + boton "Descargar vX.Y.Z"
      → Click "Descargar" → barra de progreso
      → Descarga completa → boton "Instalar y reiniciar"
      → Click "Instalar" → reinicio → nueva version
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
  → Usuario descarga → update.download() con progreso
  → Usuario instala → relaunch()
  → Tauri reemplaza .app bundle y reinicia
```

## Convencion de versiones

- **Major (X.0.0)**: Cambios que rompen compatibilidad
- **Minor (2.X.0)**: Nuevas funcionalidades
- **Patch (2.0.X)**: Bug fixes, fixes criticos

## Rollback

Si una version tiene bugs:

```bash
# NO se puede revertir el auto-update automaticamente
# Solucion: publicar una nueva version (X.Y.Z+1) con el fix
# Los usuarios que ya actualizaron reciben el fix via auto-update
# Los que no actualizaron nunca ven la version con bugs
```

## Releases existentes

| Version | Fecha | Notas |
|---|---|---|
| v2.0.0 | 19/04/2026 | Release inicial, 4 plataformas |
| v2.0.1 | 19/04/2026 | Fix endpoint GitHub |
| v2.0.2 | 19/04/2026 | Fix CSP wss:// Supabase Realtime |
| v2.0.3 | 19/04/2026 | Nombre empresa corregido + docs/ creados |
| v2.0.4 | 19/04/2026 | Version dinamica en sidebar + boton manual update |
| v2.0.5 | 19/04/2026 | Build de prueba |
| v2.1.0 | 19/04/2026 | Pagina Sistema con updates manuales, banner automatico eliminado |
