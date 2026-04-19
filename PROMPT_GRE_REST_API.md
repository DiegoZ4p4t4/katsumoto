# Prompt Reutilizable: GRE REST API

## Como usar

Copia el siguiente prompt y pegalo en una nueva sesion de opencode:

---

**PROMPT:**

Implementar GRE REST API para Katsumoto. Leer `PLAN_GRE_REST_API.md` y `AVANCE_GRE.md` para contexto completo. SUNAT deprecó SOAP para GRE, usar REST con OAuth2.

**Stack:** Deno Edge Function, Supabase, TypeScript.
**Archivos:** `supabase/functions/sunat-billing/`
**Ref Greenter:** `thegreenter/gre-api` (GreSender, ApiFactory, CpeApi).
**Supabase access token:** `sbp_7e348aa58530698fae06bf09d6172916d15a0469`
**Project ref:** `kdsjojrrspzmufdumywd`
**verify_jwt:** false (parchear post-deploy)

**Flujo REST:**
1. OAuth2: `POST {authUrl}/clientessol/{clientId}/oauth2/token/` → Bearer token
2. Send: `POST {cpeUrl}/contribuyente/gem/comprobantes/{filename}` → JSON con `{ archivo: { nomArchivo, arcGreZip(base64), hashZip(sha256hex) } }` → ticket
3. Status: `GET {cpeUrl}/contribuyente/gem/comprobantes/envios/{ticket}` → codRespuesta 0=aceptado, 98=pendiente, 99=rechazado

**Reutilizar 100%:** despatch.ts, xml-signer.ts, certificate.ts, zip.ts, transformers.ts.
**Nuevo:** `gre-rest-client.ts` (OAuth2 + send + status). Modificar: `direct-client.ts`, `endpoints.ts`, `index.ts`.
**DB:** Agregar `gre_client_id`, `gre_client_secret` a `sunat_config`.

Ejecutar tarea por tarea del plan. Actualizar `AVANCE_GRE.md` al completar cada una.

---

**Fin del prompt**
