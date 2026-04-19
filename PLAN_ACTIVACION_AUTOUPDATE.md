# PLAN: Activación Auto-Update en Producción

## Estado: PENDIENTE
## Fecha: 18/04/2026
## Prerequisitos: Fases 6-9 de PLAN_AUTOUPDATE_FIXES.md implementadas y build OK

---

## Resumen

Las fases 6-9 están codificadas y compilan. Ahora hay que activar el auto-update en producción: generar claves, configurar secrets, probar el flujo completo end-to-end, y hacer el primer release real.

---

## FASE A: Generar Claves de Firma (5 min, local)

### A.1 — Generar par de claves

```bash
pnpm tauri signer generate -w ~/.tauri/katsumoto.key
```

Esto genera:
- `~/.tauri/katsumoto.key` — Clave privada (NUNCA al repo)
- Stdout: Clave pública (va en tauri.conf.json)

### A.2 — Colocar pubkey en tauri.conf.json

Reemplazar `"REPLACE_WITH_PUBLIC_KEY"` con la clave pública generada.

Archivo: `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`

### A.3 — Guardar secrets en GitHub

Ir a https://github.com/anomalyco/katsumoto/settings/secrets/actions

- `TAURI_SIGNING_PRIVATE_KEY` = contenido de `~/.tauri/katsumoto.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` = password elegido en A.1

---

## FASE B: Verificar Flujo Local (10 min)

### B.1 — Build local firmado

```bash
TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/katsumoto.key) \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="tu_password" \
pnpm tauri build
```

Verificar que genera:
- `src-tauri/target/release/bundle/macos/Katsumoto POS.app.tar.gz`
- `src-tauri/target/release/bundle/macos/Katsumoto POS.app.tar.gz.sig`

### B.2 — Test del endpoint Vercel local

```bash
curl http://localhost:8551/api/updates/darwin-aarch64/aarch64/1.0.0
```

Debe retornar 204 (no hay releases todavía) sin error.

### B.3 — Test del hook useAutoUpdate

1. Abrir la app en modo Tauri (`pnpm tauri:dev`)
2. Esperar 10s → verificar en consola que se ejecuta el check
3. Sin releases publicados, no debe mostrar banner

---

## FASE C: Primer Release Real (15 min)

### C.1 — Commit y tag

```bash
git add -A
git commit -m "feat: auto-update system + security hardening (fases 6-9)"
git tag v2.0.0
git push origin main --tags
```

### C.2 — Monitorear GitHub Actions

Ir a https://github.com/anomalyco/katsumoto/actions

Verificar:
- Build en 4 plataformas (Windows, macOS ARM, macOS Intel, Linux)
- Assets firmados (.tar.gz + .tar.gz.sig)
- Draft release creado con todos los assets

### C.3 — Publicar release

Editar draft en GitHub → Publicar release

### C.4 — Verificar endpoint Vercel

```bash
curl https://katsumoto.vercel.app/api/updates/darwin-aarch64/aarch64/1.0.0
```

Debe retornar JSON con version 2.0.0, platforms con URLs firmadas.

---

## FASE D: Test End-to-End (10 min)

### D.1 — Instalar versión antigua

1. Descargar e instalar el .dmg de la versión 2.0.0
2. Abrir la app → esperar 10s → debe mostrar banner "Nueva versión X.X.X disponible"

### D.2 — Simular update

1. Hacer un pequeño cambio (ej: cambiar versión a 2.0.1 en tauri.conf.json y package.json)
2. Commit + tag v2.0.1 + push
3. Esperar build + publicar release
4. Abrir app instalada (2.0.0) → debe detectar 2.0.1
5. Click "Actualizar" → descarga → reinicio → versión 2.0.1

### D.3 — Verificar firma

Si el .sig no existe o está corrupto, la app NO debe actualizar (verificación ed25519).

---

## FASE E: Limpieza Post-Release (5 min)

### E.1 — Eliminar archivos legacy

```bash
rm -rf OTROS/sunat-billing-api/
rm -rf OTROS/migration-sql/
rm -f OTROS/certificado_sunat_20608183672.p12
```

### E.2 — Commit

```bash
git add -A
git commit -m "chore: eliminar legacy PHP y archivos obsoletos"
```

---

## Checklist Rápido

- [ ] A.1 — Claves generadas
- [ ] A.2 — Pubkey en tauri.conf.json
- [ ] A.3 — GitHub Secrets configurados
- [ ] B.1 — Build local genera .tar.gz.sig
- [ ] C.1 — Tag v2.0.0 pusheado
- [ ] C.2 — GitHub Actions OK en 4 plataformas
- [ ] C.3 — Release publicado
- [ ] D.1 — Banner aparece en app instalada
- [ ] D.2 — Update completo funciona (2.0.0 → 2.0.1)
- [ ] E.1 — Legacy eliminado

---

## Flujo de Release Futuro (1 comando)

```bash
# Cambiar versión en src-tauri/tauri.conf.json + src-tauri/Cargo.toml
git commit -am "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main --tags
# → GitHub Actions hace todo: build 4 platforms + firma + release draft
# → Publicar draft → todas las apps se actualizan solas
```

## No Cambia

- Supabase (backend sin cambios)
- SUNAT billing (edge functions sin cambios)
- ESC/POS builder (thermal/ sin cambios)
- Web deploy en Vercel (katsumoto.vercel.app sin cambios)
