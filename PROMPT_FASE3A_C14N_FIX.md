## Instrucciones para nueva sesión — Continuar FASE 3A: Fix C14N

### Contexto
LEE estos archivos en orden:
1. `AGENTS.md` — contexto general del proyecto
2. `FASE3_PLAN.md` — plan de FASE 3
3. `FASE3A_STATUS.md` — estado actual, errores encontrados, estructura XML validada, plan de fix

### Situación actual
FASE 3A (Guía de Remisión 09) está **implementada al 90%** pero bloqueada por error SUNAT **2335** ("documento alterado - No signature in message").

Todo funciona excepto la validación de firma digital. El XML pasa XSD validation. La firma se genera e inyecta correctamente. Pero el digest SHA-256 no coincide con lo que SUNAT calcula porque nuestro C14N (`canonicalizeXml` en `xml-signer.ts`) es simplificado.

### Tu tarea: Fix C14N en `xml-signer.ts`

**Archivo clave:** `supabase/functions/sunat-billing/sunat/crypto/xml-signer.ts`
- La función `canonicalizeXml()` es simplificada (solo 3 transformaciones)
- Requiere implementación completa de W3C Canonical XML 1.0 (C14N)
- Especificación: https://www.w3.org/TR/2001/REC-xml-c14n-20010315

**Qué debe hacer el C14N completo:**
1. Remover declaración XML
2. Normalizar saltos de línea (`\r\n`, `\r` → `\n`)
3. Expandir self-closing tags (`<tag/>` → `<tag></tag>`)
4. Normalizar namespace declarations (heredar namespaces del padre, ordenar por prefijo)
5. Ordenar atributos por namespace URI + local name
6. Preservar CDATA como texto (no hay CDATA en nuestros XMLs)
7. Remover XML comments (no hay comments en nuestros XMLs)

**Restricciones:**
- Deno Edge Runtime (no hay DOM parser nativo)
- No usar librerías pesadas
- Buscar primero en JSR o npm si existe una librería C14N compatible con Deno
- Si no hay librería, implementar manualmente

**Validación:**
- El fix NO debe romper la firma de Invoice/CreditNote/DebitNote existentes
- Probar con `action: "debug-despatch"` contra SUNAT beta
- Luego probar con `action: "send-despatch"` para obtener CDR

### Comandos

```bash
# Deploy
SUPABASE_ACCESS_TOKEN=sbp_7e348aa58530698fae06bf09d6172916d15a0469 npx supabase functions deploy sunat-billing --project-ref kdsjojrrspzmufdumywd
# Parchear verify_jwt (SIEMPRE después de deploy)
curl -s -X PATCH -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" -H "Content-Type: application/json" -d '{"verify_jwt": false}' "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/functions/sunat-billing"
# Test JWT
JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTkwMGVkNy0zOTM5LTQ2YWEtYmRiMi0yZThlM2JlNTYyMWEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQifQ.fake
# Test conexión (valida certificado/firma)
curl -s -X POST "https://kdsjojrrspzmufdumywd.supabase.co/functions/v1/sunat-billing" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d '{"action":"test"}'
# Debug despatch (envía a SUNAT GRE y devuelve respuesta raw)
curl -s -X POST "https://kdsjojrrspzmufdumywd.supabase.co/functions/v1/sunat-billing" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d '{"action":"debug-despatch","despatch_id":"c6f5ea03-39da-437d-bb47-f566c504613e"}'
# Send despatch (flujo normal)
curl -s -X POST "https://kdsjojrrspzmufdumywd.supabase.co/functions/v1/sunat-billing" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d '{"action":"send-despatch","despatch_id":"c6f5ea03-39da-437d-bb47-f566c504613e"}'
# Build frontend
pnpm build
```

### Post-fix C14N (limpieza)
- Eliminar `handleDebugDespatch` de `index.ts`
- Eliminar `debug-despatch` de `VALID_ACTIONS` en `constants.ts`
- Eliminar `sendBillRaw` de `soap-client.ts`
- Evaluar si `buildFileBasename` debe quedar exportado
