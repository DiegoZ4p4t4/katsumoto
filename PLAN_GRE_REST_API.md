# Plan: GRE REST API - Guia de Remision Electronica via REST

## Contexto

SUNAT ha deprecado el endpoint SOAP para GRE. El SOAP devuelve error 1085 ("use el nuevo sistema") o 2112 ("version incorrecta"). El nuevo sistema usa **REST API con OAuth2**.

## Arquitectura Actual vs Nueva

| Aspecto | SOAP (Actual, deprecado) | REST (Nuevo) |
|---|---|---|
| Protocolo | SOAP/XML | REST/JSON |
| Auth | WS-Security (RUC+Usuario:Password) | OAuth2 Password Grant |
| Send | `sendBill` con base64 ZIP en envelope SOAP | POST JSON con base64 ZIP en body |
| Response | CDR inmediato (sincrono) | Ticket UUID (siempre async) |
| Status | `getStatus` SOAP | GET REST `/envios/{ticket}` |
| CDR | Base64 en SOAP response | Base64 en JSON `arcCdr` |
| Credenciales | RUC+SOL user+password | `client_id`+`client_secret` (OAuth2) |

## Endpoints REST SUNAT

### Auth (OAuth2)
- **Produccion:** `https://api-seguridad.sunat.gob.pe/v1`
- **Beta:** `https://api-test-seguridad.sunat.gob.pe/v1`

### CPE (Enviar/Consultar)
- **Produccion:** `https://api-cpe.sunat.gob.pe/v1`
- **Beta:** `https://api-test.sunat.gob.pe/v1`

---

## Tareas

### FASE 1: Infraestructura REST (5 tareas)

#### 1.1 - Nuevo archivo: `sunat/gre/gre-rest-client.ts`
Crear cliente REST para GRE con 3 operaciones:

```typescript
// OAuth2 Token
POST {authUrl}/clientessol/{clientId}/oauth2/token/
Content-Type: application/x-www-form-urlencoded
Body: grant_type=password&scope=https://api-cpe.sunat.gob.pe&client_id={id}&client_secret={secret}&username={ruc}{user}&password={pass}

Response: { access_token, token_type, expires_in }
```

```typescript
// Send CPE
POST {cpeUrl}/contribuyente/gem/comprobantes/{filename}
Authorization: Bearer {token}
Content-Type: application/json
Body: { archivo: { nomArchivo, arcGreZip: base64(zip), hashZip: sha256hex(zip) } }

Response: { numTicket, fecRecepcion }
```

```typescript
// Check Status
GET {cpeUrl}/contribuyente/gem/comprobantes/envios/{numTicket}
Authorization: Bearer {token}

Response: { codRespuesta: "0"|"98"|"99", error: { numError, desError }, arcCdr: base64, indCdrGenerado: "1"|"0" }
```

**Token caching:** Guardar token + expiry en variable module-level. Refrescar cuando queden < 10 min.

**SHA-256:** Usar `crypto.subtle.digest("SHA-256", zipBytes)` → hex string.

#### 1.2 - Actualizar: `sunat/utils/endpoints.ts`
Agregar funciones:

```typescript
export function getGreAuthEndpoint(credentials: SunatCredentials): string
export function getGreCpeEndpoint(credentials: SunatCredentials): string
```

Retornan beta o produccion segun `modo_produccion`.

#### 1.3 - Actualizar: `sunat/types.ts`
Agregar a `SunatCredentials`:
```typescript
gre_client_id?: unknown;
gre_client_secret?: unknown;
```

Agregar a `SunatClient`:
```typescript
checkDespatchTicket(
  credentials: SunatCredentials,
  ticket: string,
): Promise<SunatResult>;
```

#### 1.4 - Actualizar: `sunat/direct-client.ts`
Modificar `sendDespatch()` para usar REST en vez de SOAP:
- Obtener token OAuth2
- ZIP el signed XML → base64 + sha256
- POST JSON al endpoint CPE
- Retornar ticket (siempre async)

Agregar `checkDespatchTicket()`:
- GET status con Bearer token
- Parsear respuesta: "98" = pendiente, "0" = aceptado, "99" = rechazado
- Decodificar CDR de `arcCdr` si `indCdrGenerado === "1"`

#### 1.5 - Eliminar: SOAP para GRE
- Remover `sendBillToEndpoint` de `sendDespatch` en direct-client.ts
- Remover `getDespatchServiceEndpoint` de endpoints.ts (o marcar como deprecated)
- El SOAP para facturas/boletas/notas se mantiene intacto

---

### FASE 2: Base de Datos (2 tareas)

#### 2.1 - Migracion: Agregar columnas OAuth2 a sunat_config
```sql
ALTER TABLE sunat_config
  ADD COLUMN gre_client_id text,
  ADD COLUMN gre_client_secret text;
```

Estos campos almacenaran el `client_id` y `client_secret` obtenidos del Menú SOL de SUNAT.

#### 2.2 - Actualizar: `sunat/transformers.ts`
En `buildCredentialsFromConfig`, agregar:
```typescript
gre_client_id: config.gre_client_id || null,
gre_client_secret: config.gre_client_secret || null,
```

---

### FASE 3: Edge Function index.ts (3 tareas)

#### 3.1 - Actualizar handleSendDespatch
Cambiar flujo para modelo async (ticket):
- `sendDespatch` ahora devuelve ticket (no CDR)
- Guardar ticket en `despatches.sunat_ticket`
- Status cambia a "processing" (no "accepted") hasta verificar CDR

#### 3.2 - Nuevo handler: handleCheckDespatchTicket
```typescript
if (action === "check-despatch-ticket") {
  return handleCheckDespatchTicket(supabase, orgId, credentials, body);
}
```
- Llama `client.checkDespatchTicket(credentials, ticket)`
- Si `codRespuesta === "0"`: actualizar despatch status a "accepted", guardar CDR
- Si `codRespuesta === "99"`: actualizar status a "rejected", guardar error
- Si `codRespuesta === "98"`: retornar "processing"

#### 3.3 - Actualizar VALID_ACTIONS
Agregar `"check-despatch-ticket"` a `sunat/constants.ts`.

---

### FASE 4: Secrets y Deploy (3 tareas)

#### 4.1 - Configurar Supabase Secrets
```bash
npx supabase secrets set SUNAT_GRE_CLIENT_ID=<client_id_del_menu_sol>
npx supabase secrets set SUNAT_GRE_CLIENT_SECRET=<client_secret_del_menu_sol>
```

NOTA: Se necesita que el contribuyente registre su aplicacion OAuth2 en el Menú SOL de SUNAT. Beta test client_id conocido: `85e5b0ae-255c-4891-a595-0b98c65c9854` (solo para testing).

#### 4.2 - Deploy Edge Function
```bash
npx supabase functions deploy sunat-billing
```

#### 4.3 - Parchear verify_jwt=false
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/kdsjojrrspzmufdumywd/functions/sunat-billing" \
  -H "Authorization: Bearer sbp_7e348aa58530698fae06bf09d6172916d15a0469" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt": false}'
```

---

### FASE 5: Testing Beta (2 tareas)

#### 5.1 - Test de autenticacion OAuth2
```json
{
  "action": "debug-despatch",
  "despatch_id": "c6f5ea03-39da-437d-bb47-f566c504613e",
  "gre_version": "2.0",
  "test_auth_only": true
}
```
Verificar que el token OAuth2 se obtiene correctamente.

#### 5.2 - Test de envio completo
```json
{
  "action": "send-despatch",
  "despatch_id": "c6f5ea03-39da-437d-bb47-f566c504613e"
}
```
Luego verificar ticket:
```json
{
  "action": "check-despatch-ticket",
  "despatch_id": "c6f5ea03-39da-437d-bb47-f566c504613e",
  "ticket": "<numTicket devuelto>"
}
```

---

## Codigo 100% Reutilizable (sin cambios)

| Archivo | Uso |
|---|---|
| `sunat/xml/templates/despatch.ts` | Template XML UBL 2.1 para GRE (version-aware) |
| `sunat/crypto/xml-signer.ts` | Firma XMLDSig (SHA-256 + RSA + C14N) |
| `sunat/crypto/certificate.ts` | Carga PEMs de Storage |
| `sunat/utils/zip.ts` | `zipXml()` - comprime XML a ZIP |
| `sunat/transformers.ts` | `buildDespatchDocument()` - transforma DB record a documento GRE |
| `sunat/xml/namespaces.ts` | 5 namespaces para GRE |
| `sunat/xml/helpers.ts` | `escapeXml`, `formatAmount`, `ensureArray` |

## Codigo Nuevo

| Archivo | Descripcion |
|---|---|
| `sunat/gre/gre-rest-client.ts` | Cliente REST: OAuth2 token, send CPE, check status |
| `sunat/gre/token-cache.ts` | Cache de token con expiry (module-level) |

## Codigo Modificado

| Archivo | Cambio |
|---|---|
| `sunat/direct-client.ts` | `sendDespatch` usa REST, agrega `checkDespatchTicket` |
| `sunat/types.ts` | Agregar `gre_client_id`, `gre_client_secret`, `checkDespatchTicket` |
| `sunat/utils/endpoints.ts` | Agregar `getGreAuthEndpoint`, `getGreCpeEndpoint` |
| `sunat/transformers.ts` | `buildCredentialsFromConfig` incluye gre_client_id/secret |
| `sunat/constants.ts` | Agregar `"check-despatch-ticket"` a VALID_ACTIONS |
| `index.ts` | `handleSendDespatch` async, nuevo `handleCheckDespatchTicket` |

## Referencia: Greenter PHP

- `thegreenter/gre-api` - Paquete oficial REST para GRE
- `GreSender.php` - Sender REST: send(filename, xml) → ticket, status(ticket) → CDR
- `ApiFactory.php` - Factory: AuthApi (token) + CpeApi (send/status)
- `CpeApi.php` - Implementacion REST: POST send, GET status
- `ApiToken.php` - Modelo de token con access_token + expires_in
- Beta test: `client_id = 85e5b0ae-255c-4891-a595-0b98c65c9854`

## Diagrama de Flujo

```
Frontend → POST /sunat-billing { action: "send-despatch" }
  → buildDespatchDocument() [reutiliza 100%]
  → buildDespatchXml() [reutiliza 100%]
  → signXml() [reutiliza 100%]
  → zipXml() [reutiliza 100%]
  → gre-rest-client.sendCpe() [NUEVO]
      → getToken() [OAuth2, cacheado]
      → POST /contribuyente/gem/comprobantes/{filename} [REST JSON]
      → return { numTicket }
  → Guardar ticket en DB, status="processing"

Frontend → POST /sunat-billing { action: "check-despatch-ticket", ticket }
  → gre-rest-client.checkStatus(ticket) [NUEVO]
      → getToken() [cacheado o refrescar]
      → GET /contribuyente/gem/comprobantes/envios/{ticket} [REST JSON]
      → codRespuesta="0" → Aceptado, guardar CDR
      → codRespuesta="98" → Pendiente
      → codRespuesta="99" → Rechazado, guardar error
```
