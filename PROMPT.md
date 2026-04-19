# Prompt de Continuacion - Katsumoto v2

Copia y pega este prompt en una nueva sesion de opencode para continuar el proyecto.

---

## Punto de Partida

Estamos en **Katsumoto**, un sistema POS/Inventario/ERP para UNITED PARTS GROUP S.A.C. (RUC 20608183672). El contexto completo esta en `AGENTS.md`. Lee ese archivo primero.

## Estado Actual

**v1.0 completo (62/62 tareas).** La facturacion electronica SUNAT esta migrandose de PHP (Greenter) a nativo Deno (Edge Functions). Este es el estado:

### Lo que YA funciona
- sunat-billing v11 deployado con `DirectSunatClient` (crypto/XML/SOAP nativo en Deno)
- Test de conexion exitoso (`action: "test"`) - firma XML OK, certificado PEM cargado desde Storage
- `SUNAT_DIRECT_ENABLED=true` activo, `verify_jwt=false` en todas las EFs (Edge Runtime no soporta ES256)
- 3 Edge Functions activas: sunat-billing (v11), sunat-credentials (v8), apis-peru-proxy (v4)
- Supabase CLI autenticado con token `sbp_7e348aa58530698fae06bf09d6172916d15a0469`
- Deploy con `npx supabase functions deploy <nombre>` funciona correctamente

### Lo que falta (en orden de prioridad)

#### FASE 1 - Validacion (1-2 sesiones)
1. **Enviar factura real a SUNAT beta** (`action: "send"`) - crear una factura de prueba en la tabla `invoices` y enviarla
2. **Enviar resumen diario** (`action: "send-summary"`) - probar con boletas
3. **Verificar CDR** - confirmar que la respuesta de SUNAT se parsea y almacena en Storage correctamente
4. **Probar comunicacion de baja** (`action: "send-voided"`) - anular un documento

#### FASE 2 - Limpieza (1 sesion)
5. **Eliminar PhpSunatClient** - borrar `supabase/functions/sunat-billing/sunat/php-gateway.ts` y simplificar `client.ts` (solo DirectSunatClient, sin factory)
6. **Eliminar OTROS/sunat-billing-api/** - API PHP legacy (~4.4MB), ya no se necesita
7. **Eliminar OTROS/migration-sql/** - SQL inicial ya ejecutado
8. **Eliminar OTROS/certificado_sunat_20608183672.p12** - PEMs ya en Storage

#### FASE 3 - v2 Features (2-3 sesiones)
9. **Guia de Remision (09)** - Portear `DespatchBuilder` de `OTROS/sunat-billing-api/src/Document/DespatchBuilder.php` a TypeScript en `supabase/functions/sunat-billing/sunat/xml/templates/despatch.ts`
10. **Retencion (20)** - Portear `RetentionBuilder` de `OTROS/sunat-billing-api/src/Document/RetentionBuilder.php` a TypeScript
11. **Configuracion de impuestos** - La tabla `tax_configurations` esta vacia, falta la UI y logica de IGV/exoneraciones

## Datos clave para testing

- **Supabase Project:** kdsjojrrspzmufdumywd (URL: https://kdsjojrrspzmufdumywd.supabase.co)
- **Org ID:** 7e80b22f-b06a-4025-937a-5f9d62d78733
- **User ID (admin):** 7a900ed7-3939-46aa-bdb2-2e8e3be5621a
- **Email:** juan.zapata@datacodev.com
- **RUC:** 20608183672 (modo beta SUNAT)
- **Tabla invoices:** 0 registros (hay que crear facturas de prueba)
- **Tabla customers:** 2 clientes de prueba (RUC + DNI)

## Para generar un JWT de usuario para testing

```bash
# 1. Generar magic link
SERVICE_ROLE_KEY=$(curl -s -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/api-keys" | python3 -c "import sys,json; [print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
ANON_KEY=$(curl -s -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/api-keys" | python3 -c "import sys,json; [print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='anon']")

# 2. Obtener token_hash
TOKEN_HASH=$(curl -s -X POST "https://kdsjojrrspzmufdumywd.supabase.co/auth/v1/admin/generate_link" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"magiclink","email":"juan.zapata@datacodev.com"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['hashed_token'])")

# 3. Verificar y obtener access_token
ACCESS_TOKEN=$(curl -s -X POST "https://kdsjojrrspzmufdumywd.supabase.co/auth/v1/verify" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"type\":\"magiclink\",\"token_hash\":\"$TOKEN_HASH\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 4. Llamar edge function
curl -s -X POST "https://kdsjojrrspzmufdumywd.supabase.co/functions/v1/sunat-billing" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

## Instrucciones para la sesion

1. Lee `AGENTS.md` primero para contexto completo
2. Trabaja en orden de fases (1 -> 2 -> 3)
3. No avances a la siguiente fase sin validar la anterior
4. Deploya EFs con `npx supabase functions deploy <nombre>` (ya autenticado)
5. Para la FASE 1, necesitaras crear facturas de prueba en la DB usando `supabase_execute_sql` o desde el frontend
6. El PHP legacy en `OTROS/sunat-billing-api/` sirve como referencia para portear features a Deno - NO eliminar hasta terminar la FASE 2
7. No agregues comentarios salvo solicitud explicita
8. TypeScript strict mode
