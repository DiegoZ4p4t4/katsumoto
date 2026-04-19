# PLAN: Auto-Update + Fixes Post-Implementación Tauri

## Estado: PENDIENTE
## Fecha: 18/04/2026
## Prerequisitos: Fases 0-5 de PLAN_IMPRESION_TERMICA_TAURI.md completadas

---

## Resumen

Implementar auto-update nativo en la app desktop Tauri, corregir los gaps detectados en la implementación inicial, y dejar el sistema listo para distribución en producción. El auto-update permite que al publicar un nuevo release (tag `v*`), todas las desktop apps instaladas detecten, descarguen e instalen la actualización automáticamente.

---

## Problemas Detectados (Post-Review)

### CRÍTICOS

1. **Auto-update sin configurar** — Plugin registrado pero sin pubkey, endpoints, ni código frontend
2. **Iconos .icns/.ico faltantes** — `tauri build` falla en macOS y Windows
3. **`WebPrinterAdapter.printReceipt()` roto** — Pasa `{}` como Invoice, genera PDF vacío

### MEDIOS

4. **CSP deshabilitado** — `"csp": null` en tauri.conf.json
5. **Sin entitlements macOS** — Falta `.entitlements` para acceso serial
6. **Popup blocker en web** — `window.open()` bloqueado en callbacks async
7. **`usePrinter` sin errores** — Sin reintento, sin feedback, cache stalé

### MENORES

8. **Versión hardcodeada** — `"Katsumoto v2.0"` en Sidebar
9. **`check_printer_status` ingenuo** — Solo abre puerto, no consulta estado ESC/POS
10. **`tokio full` overkill** — Los comandos async de Tauri ya manejan el runtime
11. **`$schema` URL 404** — Apunta a fork incorrecto

---

## Fases de Implementación

### FASE 6: Auto-Update Tauri (~2 horas)

#### 6.1 — Generar claves de firma

```bash
pnpm tauri signer generate -w ~/.tauri/katsumoto.key
```

Esto genera:
- `~/.tauri/katsumoto.key` — Clave privada (para CI, NUNCA al repo)
- Output stdout: Clave pública (va en tauri.conf.json)

**Guardar en GitHub Secrets:**
- `TAURI_SIGNING_PRIVATE_KEY` — Contenido del archivo .key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — Password elegido

#### 6.2 — Configurar tauri.conf.json

Agregar sección `plugins.updater` y `bundle.createUpdaterArtifacts`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "<CLAVE_PUBLICA_GENERADA>",
      "endpoints": [
        "https://katsumoto.vercel.app/api/updates/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  },
  "bundle": {
    "createUpdaterArtifacts": "v2Compatible"
  }
}
```

#### 6.3 — Instalar plugin updater JS

```bash
pnpm add @tauri-apps/plugin-updater
```

#### 6.4 — Hook useAutoUpdate

**Archivo nuevo: `src/hooks/useAutoUpdate.ts`**

```typescript
import { useState, useEffect, useCallback } from "react";
import { usePlatform } from "@/lib/platform";

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

export interface UseAutoUpdateReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  progress: number;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  lastChecked: Date | null;
}

export function useAutoUpdate(): UseAutoUpdateReturn {
  const { isTauri } = usePlatform();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!isTauri) return;
    setError(null);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        setUpdateInfo({
          version: update.version,
          date: update.date ?? "",
          body: update.body ?? "",
        });
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
      }
      setLastChecked(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error verificando actualizaciones");
    }
  }, [isTauri]);

  const downloadAndInstall = useCallback(async () => {
    if (!isTauri || !updateAvailable) return;
    setDownloading(true);
    setProgress(0);
    setError(null);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { relaunch } = await import("@tauri-apps/plugin-process");

      const update = await check();
      if (!update) {
        setDownloading(false);
        return;
      }

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          // Download started
        } else if (event.event === "Progress") {
          setProgress((prev) => {
            // Incremental progress
            return Math.min(prev + 2, 98);
          });
        } else if (event.event === "Finished") {
          setProgress(100);
        }
      });

      await relaunch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error instalando actualización");
      setDownloading(false);
    }
  }, [isTauri, updateAvailable]);

  // Auto-check on mount (silently)
  useEffect(() => {
    if (isTauri) {
      // Delay 10s after mount to not slow startup
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isTauri, checkForUpdates]);

  return {
    updateAvailable,
    updateInfo,
    downloading,
    progress,
    error,
    checkForUpdates,
    downloadAndInstall,
    lastChecked,
  };
}
```

#### 6.5 — Componente UpdateNotification

**Archivo nuevo: `src/components/shared/UpdateNotification.tsx`**

Banner no intrusivo que aparece cuando hay update disponible. Se muestra en la barra superior o como toast.

```typescript
// Banner que aparece en la parte inferior de la pantalla
// "Nueva versión X.X.X disponible — [Actualizar ahora] [Despues]"
// Al hacer click en actualizar:
//   1. Muestra progreso de descarga
//   2. Al terminar, reinicia la app automáticamente
// Se puede descartar pero vuelve a aparecer al reiniciar
```

**Ubicación:** Se integra dentro de `Layout.tsx` para que aparezca en todas las páginas.

#### 6.6 — Endpoint de updates en Vercel

**Archivo nuevo: `api/updates/[target]/[arch]/[current_version].ts`**

Serverless function que sirve el JSON de update:

```typescript
// GET /api/updates/{{target}}/{{arch}}/{{current_version}}
// 1. Consulta GitHub releases API: GET /repos/{owner}/{repo}/releases/latest
// 2. Busca el asset que matchee target+arch (ej: katsumoto-pos_x64.app.tar.gz)
// 3. Si versión remota > current_version, retorna JSON:
//    {
//      "version": "2.1.0",
//      "date": "2026-04-20T12:00:00Z",
//      "body": "Bug fixes and improvements",
//      "platforms": {
//        "darwin-aarch64": {
//          "signature": "<firma del .tar.gz.sig>",
//          "url": "https://github.com/owner/repo/releases/download/v2.1.0/katsumoto-pos_aarch64.app.tar.gz"
//        },
//        ...otros targets
//      }
//    }
// 4. Si no hay update, retorna 204 No Content
```

**Nota:** Los archivos `.tar.gz.sig` los genera automáticamente `tauri build` con `createUpdaterArtifacts: "v2Compatible"`. El CI los sube como assets del GitHub Release.

#### 6.7 — Actualizar GitHub Actions

Modificar `.github/workflows/release.yml` para:
- Agregar env vars `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Usar `tauri-apps/tauri-action@v0` que ya genera los artifacts firmados
- Subir `.tar.gz` + `.tar.gz.sig` como release assets

```yaml
- uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

---

### FASE 7: Fixes Críticos (~1 hora)

#### 7.1 — Generar iconos reales

```bash
# Requiere un PNG fuente de 1024x1024 o SVG
pnpm tauri icon public/logo.png -o src-tauri/icons
```

Esto genera: `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico`, `icon.png`

**Si no hay logo real:** Crear uno placeholder con el ícono de naranja/trigo de Katsumoto sobre fondo naranja.

#### 7.2 — Corregir WebPrinterAdapter.printReceipt()

**Archivo:** `src/lib/platform/adapters/web-printer.ts`

El problema: `printReceipt(escpos: Uint8Array)` recibe bytes ESC/POS pero el web adapter no puede enviarlos a impresora. Necesita recibir la Invoice original.

**Solución:** El adapter web NO debe implementar `printReceipt(escpos)` directamente. En su lugar:

- `printReceipt()` debe lanzar un error explicativo
- Se agrega un método `printInvoice(invoice, sellerInfo, options)` que sí genera el PDF
- O mejor: `usePrinter` ya maneja la bifurcación correctamente (Tauri → escpos, web → thermal-ticket), así que arreglar el adapter para que al menos no mute un objeto vacío:

```typescript
async printReceipt(_escpos: Uint8Array): Promise<void> {
  throw new Error(
    "La impresión ESC/POS directa no está disponible en modo web. " +
    "Use printInvoice() o instale la versión desktop."
  );
}
```

#### 7.3 — Corregir $schema URL

```json
"$schema": "https://schema.tauri.app/config/2"
```

---

### FASE 8: Fixes de Seguridad y Plataforma (~1 hora)

#### 8.1 — Configurar CSP en tauri.conf.json

```json
"security": {
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://api-cpe.sunat.gob.pe https://api-test.sunat.gob.pe https://api-seguridad.sunat.gob.pe https://api-test-seguridad.sunat.gob.pe https://katsumoto.vercel.app"
}
```

Adaptar según las URLs que la app necesite (Supabase, SUNAT, APIs).

#### 8.2 — Crear macOS entitlements

**Archivo nuevo: `src-tauri/entitlements/macOS.plist`** (o `.entitlements`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.device.serial</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-only</key>
    <true/>
</dict>
</plist>
```

Referenciar en `tauri.conf.json`:
```json
"bundle": {
  "macOS": {
    "entitlements": "entitlements/macOS.plist"
  }
}
```

#### 8.3 — Eliminar `tokio` de Cargo.toml

Los comandos `#[command]` async de Tauri ya se ejecutan en el runtime de Tauri. `tokio` no se usa directamente.

```diff
- tokio = { version = "1", features = ["full"] }
```

Si en el futuro se necesita spawn de tareas, se puede agregar `tokio` con features específicas.

---

### FASE 9: Fixes de usePrinter y UX (~1 hora)

#### 9.1 — Invalidar cache de sellerInfo

```typescript
// Agregar parámetro maxAge o invalidar cuando cambia la config
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const _getSellerInfo = useCallback(async () => {
  const now = Date.now();
  if (sellerInfoRef.current && now - sellerInfoTimestamp.current < CACHE_TTL) {
    return sellerInfoRef.current;
  }
  sellerInfoRef.current = await getSellerInfo();
  sellerInfoTimestamp.current = now;
  return sellerInfoRef.current;
}, []);
```

#### 9.2 — Agregar retry a impresión

```typescript
const printReceipt = useCallback(async (invoice, opts, retries = 1) => {
  setIsPrinting(true);
  try {
    // ... lógica actual
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return printReceipt(invoice, opts, retries - 1);
    }
    throw err;
  } finally {
    setIsPrinting(false);
  }
}, [...]);
```

#### 9.3 — Fix popup blocker en web

En vez de `window.open()` + `print()`, usar un `<iframe>` oculto o `navigator.print()` (API nueva), o abrir el PDF como blob URL dentro de un dialogo modal con botón "Imprimir":

```typescript
// Opción: Generar blob y abrir en misma ventana
const blob = doc.output("blob");
const url = URL.createObjectURL(blob);
window.location.href = url; // No es popup, no se bloquea
```

#### 9.4 — Versión dinámica en Sidebar

```typescript
// Leer versión de un constant o de tauri
const APP_VERSION = "__APP_VERSION__"; // Inyectado por Vite define()

// En vite.config.ts:
// define: { "__APP_VERSION__": JSON.stringify(process.env.npm_package_version || "2.0.0") }
```

---

## Estructura Final de Archivos Nuevos/Modificados

```
NUEVOS:
  src/hooks/useAutoUpdate.ts                    # Hook auto-update
  src/components/shared/UpdateNotification.tsx   # Banner de update
  api/updates/[target]/[arch]/[current_version].ts  # Endpoint Vercel
  src-tauri/entitlements/macOS.plist             # macOS entitlements

MODIFICADOS:
  src-tauri/tauri.conf.json                     # updater config + CSP + entitlements
  src-tauri/Cargo.toml                          # quitar tokio
  src-tauri/icons/*                             # iconos reales
  src/lib/platform/adapters/web-printer.ts      # fix printReceipt
  src/hooks/usePrinter.ts                       # cache TTL + retry + errores
  src/lib/printing/formats/thermal-ticket.ts    # fix popup blocker
  src/components/Sidebar.tsx                    # versión dinámica
  src/components/Layout.tsx                     # integrar UpdateNotification
  .github/workflows/release.yml                # signing + updater artifacts
  package.json                                  # +@tauri-apps/plugin-updater
  vite.config.ts                                # define __APP_VERSION__
```

---

## Orden de Ejecución

1. **Fase 6** primero — Auto-update (lo más importante, sistema completo)
2. **Fase 7** — Fixes críticos (iconos, web adapter, schema)
3. **Fase 8** — Seguridad (CSP, entitlements, quitar tokio)
4. **Fase 9** — UX (cache, retry, popup, versión)

Cada fase verifica con `pnpm build`.

---

## Flujo de Auto-Update Completo

```
Desarrollo:
  1. git tag v2.1.0 && git push origin v2.1.0
  2. GitHub Actions se dispara
  3. Build en 4 plataformas (Win/Mac ARM/Mac Intel/Linux)
  4. Firma cada artifact con la clave privada
  5. Crea GitHub Release con .msi, .dmg, .AppImage, .deb
  6. Sube .tar.gz + .tar.gz.sig como assets

Producción (app instalada):
  1. App arranca → 10s después → check silencioso
  2. GET /api/updates/darwin-aarch64/aarch64/2.0.0
  3. Serverless consulta GitHub API → latest release
  4. Si hay nueva versión → retorna JSON con URLs firmadas
  5. App muestra banner "Nueva versión 2.1.0 disponible"
  6. Usuario hace click en "Actualizar"
  7. Descarga .tar.gz, verifica firma ed25519
  8. Instala y reinicia automáticamente
  9. App actualizada en ~5 segundos
```

---

## No Cambia

- Supabase (backend sin cambios)
- SUNAT billing (edge functions sin cambios)
- ESC/POS builder (thermal/ sin cambios)
- PDF generation (printing/ sin cambios)
- Web deploy en Vercel (katsumoto.vercel.app sin cambios)
