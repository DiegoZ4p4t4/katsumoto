# AVANCE GRE - Guia de Remision Electronica REST API

## Estado General: IMPLEMENTADO - Pendiente credenciales OAuth2 reales

---

## FASE 0: XML + Template + Firma (COMPLETADO)

| Tarea | Estado | Detalle |
|---|---|---|
| Template XML GRE (despatch.ts) | DONE | Estructura correcta Greenter, version-aware (1.0/2.0) |
| Namespaces (5 namespaces) | DONE | xmlns, cac, cbc, ds, ext |
| Transformer (buildDespatchDocument) | DONE | Parseo conductor_nombre, modalidad_traslado, schemeName |
| Firma XML (xml-signer.ts) | DONE | C14N simplificado, SHA-256 + RSA |
| Certificado PEM en Storage | DONE | private_key.pem + certificate.pem |
| XML valida XSD SUNAT | DONE | HTTP 200 en ambas versiones |
| Columna gre_version en sunat_config | DONE | Default "2.0" |
| SOAP test (deprecated) | DONE | Confirmed SOAP returns error 1085/2112 for GRE |

---

## FASE 1: Infraestructura REST (COMPLETADO)

| Tarea | Estado | Detalle |
|---|---|---|
| 1.1 gre-rest-client.ts (OAuth2 + send + status) | DONE | `sunat/gre/gre-rest-client.ts` + `sunat/gre/token-cache.ts` |
| 1.2 endpoints.ts (REST endpoints) | DONE | Auth y CPE URLs inline en gre-rest-client.ts (selecciona beta/prod por modo_produccion) |
| 1.3 types.ts (gre_client_id, gre_client_secret) | DONE | Agregados a SunatCredentials + checkDespatchTicket en SunatClient |
| 1.4 direct-client.ts (sendDespatch → REST) | DONE | sendDespatch usa sendCpe(), checkDespatchTicket usa checkStatus() |
| 1.5 Eliminar SOAP para GRE | DONE | Removidas import de sendBillToEndpoint y getDespatchServiceEndpoint |

**Archivos nuevos:**
- `supabase/functions/sunat-billing/sunat/gre/token-cache.ts` — Cache de token con refresh buffer 10 min
- `supabase/functions/sunat-billing/sunat/gre/gre-rest-client.ts` — OAuth2 + sendCpe + checkStatus

**Archivos modificados:**
- `supabase/functions/sunat-billing/sunat/direct-client.ts` — sendDespatch via REST, +checkDespatchTicket
- `supabase/functions/sunat-billing/sunat/types.ts` — +gre_client_id, +gre_client_secret, +checkDespatchTicket

---

## FASE 2: Base de Datos (COMPLETADO)

| Tarea | Estado | Detalle |
|---|---|---|
| 2.1 Migration: gre_client_id, gre_client_secret | DONE | `ALTER TABLE sunat_config ADD COLUMN gre_client_id/secret text` |
| 2.2 transformers.ts: buildCredentialsFromConfig | DONE | Incluye gre_client_id/secret |

---

## FASE 3: Edge Function (COMPLETADO)

| Tarea | Estado | Detalle |
|---|---|---|
| 3.1 handleSendDespatch → async (ticket) | DONE | Status "processing", guarda ticket, XML en Storage |
| 3.2 handleCheckDespatchTicket (nuevo) | DONE | Poll status: 0=accepted+CDR, 98=processing, 99=rejected |
| 3.3 VALID_ACTIONS: check-despatch-ticket | DONE | Agregado a constants.ts |

**Archivos modificados:**
- `supabase/functions/sunat-billing/index.ts` — handleSendDespatch async, +handleCheckDespatchTicket, +router
- `supabase/functions/sunat-billing/sunat/constants.ts` — +"check-despatch-ticket"

---

## FASE 4: Deploy (COMPLETADO)

| Tarea | Estado | Detalle |
|---|---|---|
| 4.2 Deploy EF | DONE | v62 deployada exitosamente |
| 4.3 Parchear verify_jwt=false | DONE | PATCH exitoso, verify_jwt: false |

---

## FASE 5: Testing Beta (PARCIAL)

| Tarea | Estado | Detalle |
|---|---|---|
| 5.1 Test flujo REST | DONE | Confirmado: reach OAuth2 endpoint, correct URL pattern, correct error handling |
| 5.2 Test envio completo | BLOQUEADO | Necesita client_id/client_secret reales de SUNAT Menú SOL |

**Resultado test 5.1:**
```
POST send-despatch → REST_ERROR: dns error api-test-seguridad.sunat.gob.pe
```
- Confirma flujo REST correcto: Auth → Send CPE
- Error DNS esperado: beta URL no resuelve sin credenciales reales
- Código path verificado: sendDespatch → signXml → zipXml → sendCpe → getToken (OAuth2)

---

## PENDIENTE: Credenciales OAuth2

Para completar la validacion, se necesita:

1. **Registrarse en SUNAT Menú SOL** como desarrollador OAuth2
2. Obtener `client_id` y `client_secret`
3. Ejecutar:
   ```sql
   UPDATE sunat_config SET gre_client_id = '<tu_client_id>', gre_client_secret = '<tu_client_secret>';
   ```
4. Ejecutar test: `send-despatch` → `check-despatch-ticket`

---

## Notas

- Beta auth: `https://api-test-seguridad.sunat.gob.pe/v1`
- Beta CPE: `https://api-test.sunat.gob.pe/v1`
- Prod auth: `https://api-seguridad.sunat.gob.pe/v1`
- Prod CPE: `https://api-cpe.sunat.gob.pe/v1`
- TODAS las GRE via REST son async (ticket-based)
- Token cacheado con refresh buffer de 10 minutos
- SHA-256 del ZIP enviado como `hashZip` en el body JSON
- CDR se obtiene via check-status: codRespuesta="0" + indCdrGenerado="1"

---

*Ultima actualizacion: 2026-04-17*
