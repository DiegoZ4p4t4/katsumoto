# Diagnostico: Pantalla Blanca Post-Update

## Estado: INVESTIGANDO
## Prioridad: ALTA
## Version: desde v2.0.2

## Sintoma

Despues de que la app se actualiza a si misma (descarga .tar.gz desde GitHub, reemplaza .app, reinicia):
- La ventana aparece pero completamente blanca
- No hay errores visibles
- La unica solucion es cerrar y reinstalar manualmente

## Que funciona

- Build local → copiar a /Applications → funciona perfecto
- CI build descargado manualmente → extraer → funciona perfecto
- Binarios local y CI son casi identicos (diferencia 2.4KB por rutas de build)

## Que NO funciona

- Auto-update: descarga → reemplaza .app → reinicia → pantalla blanca

## Diagnostico

### Comparativa de binarios (v2.1.0)

| Metrica | Local | CI (GitHub) |
|---|---|---|
| Tamano | 15,369,808 bytes | 15,372,304 bytes |
| Estructura | Info.plist + binary + icon | Idéntico |
| Frontend embebido | Si (index-35krJIh6.js) | Si (index-35krJIh6.js) |
| Codesignado | No | No |

### Causas probables (en orden)

1. **macOS WebView cache (MAS PROBABLE)**
   - Al reemplazar el .app en caliente, macOS cachea el contenido WebView anterior
   - El nuevo binary carga pero el WebView usa contenido cacheado del binario viejo
   - El contenido cacheado no coincide con los nuevos chunks JS → pantalla blanca
   - Evidencia: funciona al reinstalar manualmente (cache limpio)

2. **Gatekeeper/Quarantine**
   - macOS marca archivos descargados de internet con atributo `com.apple.quarantine`
   - El updater descarga de github.com → el .app reemplazo tiene quarantine flag
   - Puede bloquear la carga del WebView sin mostrar error
   - Fix: `xattr -cr "/Applications/Katsumoto POS.app"` despues del update

3. **Falta de codesignado**
   - App sin firma → macOS la trata como "unidentified developer"
   - Despues de reemplazo, macOS puede invalidar permisos existentes
   - Fix: Apple Developer account + codesigning

4. **Race condition en reemplazo**
   - Tauri updater reemplaza .app mientras proceso viejo aun corre
   - macOS puede mantener file locks → reemplazo parcial
   - Fix: parchear flujo de update en Rust

## Plan de solucion

### Solucion A: Clear WebView cache en reinicio (rapido)

Agregar en `src-tauri/src/lib.rs` antes de `run()`:
```rust
// Limpiar WebView cache al iniciar
let cache_dir = dirs::cache_dir()
    .unwrap_or_default()
    .join("com.katsumoto.pos");
if cache_dir.exists() {
    let _ = std::fs::remove_dir_all(&cache_dir);
}
```

**Problema:** Borra cache en CADA inicio, no solo post-update.

### Solucion B: Flag post-update + clear cache condicional (mejor)

1. El updater escribe un flag file (ej: `/tmp/katsumoto-updated`) antes de reiniciar
2. Al iniciar, la app verifica si el flag existe
3. Si existe → clear WebView cache → eliminar flag → continuar normalmente

### Solucion C: Download-only update (sin reemplazo automatico)

En vez de `update.downloadAndInstall()`, usar `update.download()`:
1. Descargar el .tar.gz a un directorio temporal
2. Al reiniciar, un script externo reemplaza el .app
3. Mas robusto pero mas complejo

### Solucion D: Codesignado (definitivo)

1. Apple Developer account ($99/ano)
2. Firmar el .app con `codesign`
3. Notarizar con `notarytool`
4. Los updates firmados no tienen problemas de Gatekeeper

### Solucion E: Download DMG + manual install (alternativa)

La pagina Sistema descarga el .dmg en vez de usar Tauri updater:
1. Click "Descargar" → abre browser con link al .dmg del release
2. Usuario monta el .dmg → arrastra .app a /Applications
3. Sin reemplazo en caliente → sin pantalla blanca

## Recomendacion inmediata

**Solucion B** (flag + clear cache) como fix rapido.
**Solucion E** como alternativa si B no funciona.
**Solucion D** a largo plazo cuando se necesite distribucion masiva.

## Como probar

1. Implementar Solucion B
2. Build local
3. Instalar version vieja (v2.0.x)
4. Publicar nueva version
5. Desde Sistema → Buscar → Descargar → Instalar
6. Verificar que la app reinicia sin pantalla blanca
