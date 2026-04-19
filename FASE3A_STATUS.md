# FASE 3A - Guía de Remisión (09) — Estado y Plan

## Estado: IMPLEMENTADO con bloqueo en validación firma SUNAT

### Completado (funcional)

#### DB
- `despatches` (32 campos) + `despatch_items` con RLS — 2 migraciones aplicadas
- Guía de prueba T001-1 (`c6f5ea03-39da-437d-bb47-f566c504613e`) creada con 2 items

#### Backend (sunat-billing v40 deployado)
- **Template XML** (`sunat/xml/templates/despatch.ts`): DespatchAdvice UBL 2.1
- **Endpoint GRE** (`sunat/utils/endpoints.ts`): `getDespatchServiceEndpoint()` apunta a `ol-ti-itemision-guia-gem-beta`
- **Transformer** (`sunat/transformers.ts`): `buildDespatchDocument()`
- **DirectSunatClient** (`sunat/direct-client.ts`): `sendDespatch()` usa `sendBillToEndpoint()` con endpoint GRE
- **SOAP** (`sunat/soap/soap-client.ts`): `sendBillToEndpoint()` + `sendBillRaw()` para debug
- **Handler** (`index.ts`): `handleSendDespatch()` + `handleDebugDespatch()` (temporal)
- **Constants**: `DESPATCH_TYPE`, `MOTIVO_TRASLADO_MAP`, action `send-despatch`, `debug-despatch`

#### Frontend (build exitoso)
- Types, service, hooks, páginas (list + create), navegación — todo funcional

### Errores SUNAT encontrados y resueltos

| # | Error | Causa | Fix |
|---|-------|-------|-----|
| 1 | `0151` - ZIP filename incorrecto | Endpoint CPE no acepta tipo 09 | Crear endpoint GRE separado (`ol-ti-itemision-guia-gem-beta`) |
| 2 | `0306` - XML parsing: `AccountingSupplierParty` before `DespatchSupplierParty` | Orden incorrecto de elementos | Mover `DespatchSupplierParty` primero (requerido por UBL XSD) |
| 3 | `0306` - XML parsing: `DriverParty` not expected in `ShipmentStage` | `DriverParty` no existe en UBL 2.1 ShipmentStageType | Eliminar `AccountingSupplierParty`, mover conductor dentro de `CarrierParty/Person` |
| 4 | `2335` - Documento alterado: No signature in message | **C14N simplificado produce digest diferente** | **PENDIENTE** — requiere C14N completo |

### Bloqueo actual: Error 2335 — C14N (Canonicalización XML)

**Qué funciona:**
- XML pasa validación XSD de SUNAT GRE ✓
- Firma digital se genera e inyecta en `ext:ExtensionContent` ✓
- Estructura SOAP/ZIP correcta ✓
- Endpoint GRE correcto ✓

**El problema:**
`xml-signer.ts` usa un C14N simplificado (`canonicalizeXml`) que solo:
1. Remueve declaración XML
2. Normaliza saltos de línea (`\r\n` → `\n`)
3. Expande self-closing tags (`<tag/>` → `<tag></tag>`)

SUNAT usa C14N real (W3C Canonical XML 1.0) que además:
4. Normaliza atributos (ordena, expande namespaces)
5. Maneja namespace declarations heredadas
6. Procesa whitespace en elementos mixtos
7. Ordena declaraciones de namespace por prefijo

Para Invoice/CreditNote funciona porque esos XMLs fueron diseñados manualmente para ser "C14N-safe". DespatchAdvice tiene estructura diferente que causa divergencia.

**Verificación:** El digest SHA-256 que computamos NO coincide con el que SUNAT computa al validar.

---

## Plan: Fix C14N

### Opción A: Implementar C14N completo en Deno (RECOMENDADA)
Implementar W3C Canonical XML 1.0 (C14N) en TypeScript nativo para Deno. Esto es lo que SUNAT valida contra.

**Tareas:**
1. Crear `sunat/crypto/c14n.ts` con implementación C14N 1.0:
   - Parse XML a DOM-like tree (o usar `DOMParser` de Deno)
   - Normalizar namespace declarations (heredar, ordenar por prefijo)
   - Ordenar atributos por namespace URI + local name
   - Expandir self-closing tags
   - Normalizar whitespace
   - Preservar comentarios? (no para SUNAT)
2. Reemplazar `canonicalizeXml()` en `xml-signer.ts` con la nueva implementación
3. Test: verificar que Invoice existente sigue funcionando (digest no debe cambiar)
4. Test: verificar que DespatchAdvice ahora pasa SUNAT validation

**Complejidad:** Media-alta. C14N es un algoritmo específico pero no extremadamente complejo. La parte tricky es el manejo de namespaces heredados.

**Referencia W3C:** https://www.w3.org/TR/2001/REC-xml-c14n-20010315

### Opción B: Buscar librería Deno/JS para C14N
Buscar en JSR o npm una librería que implemente C14N en JS/TS puro.

**Riesgo:** Puede no existir o no ser compatible con Deno Edge Runtime.

### Opción C: XML canónigo manual (workaround)
Reescribir el template `despatch.ts` para que el XML generado sea idéntico a su forma C14N (como se hizo con Invoice). Esto es frágil pero rápido.

---

## Estructura XML DespatchAdvice validada por SUNAT

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="..." xmlns:cac="..." ...>
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>  <!-- firma se inyecta aquí -->
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>T001-1</cbc:ID>
  <cbc:IssueDate>2026-04-17</cbc:IssueDate>
  <cbc:IssueTime>00:00:00</cbc:IssueTime>
  <cbc:DespatchAdviceTypeCode listID="SUNAT:Identificador de Tipo de Guia">09</cbc:DespatchAdviceTypeCode>
  <cac:Signature>...</cac:Signature>
  <cac:DespatchSupplierParty>  <!-- PRIMERO, antes que DeliveryCustomerParty -->
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="6">RUC</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>...</cbc:RegistrationName>
        <cac:RegistrationAddress>...</cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DespatchSupplierParty>
  <!-- NO hay AccountingSupplierParty en DespatchAdvice -->
  <cac:DeliveryCustomerParty>...</cac:DeliveryCustomerParty>
  <cac:Shipment>
    <cac:ShipmentStage>
      <cbc:TransportModeCode>01</cbc:TransportModeCode>
      <cac:TransportMeans>
        <cac:RoadTransport>
          <cbc:LicensePlateID>ABC-123</cbc:LicensePlateID>
        </cac:RoadTransport>
      </cac:TransportMeans>
      <cac:CarrierParty>  <!-- ÚLTIMO en ShipmentStage -->
        <cac:PartyIdentification>...</cac:PartyIdentification>
        <cac:PartyName>...</cac:PartyName>
        <cac:Person>  <!-- Conductor DENTRO de CarrierParty -->
          <cac:ID schemeID="1">DNI</cbc:ID>
          <cbc:FirstName>NOMBRE</cbc:FirstName>
          <cac:IdentityDocumentReference>
            <cbc:ID>LICENCIA</cbc:ID>
          </cac:IdentityDocumentReference>
        </cac:Person>
      </cac:CarrierParty>
      <!-- NO hay DriverParty en ShipmentStage -->
    </cac:ShipmentStage>
    <cac:Delivery>
      <cbc:EstimatedDeliveryDate>...</cbc:EstimatedDeliveryDate>
      <cac:DeliveryAddress>...</cac:DeliveryAddress>
    </cac:Delivery>
    <cac:OriginAddress>...</cac:OriginAddress>
  </cac:Shipment>
  <cac:DespatchLine>...</cac:DespatchLine>
</DespatchAdvice>
```

## Limpieza pendiente post-fix
- [ ] Eliminar `handleDebugDespatch` de `index.ts`
- [ ] Eliminar `debug-despatch` de `VALID_ACTIONS`
- [ ] Eliminar `sendBillRaw` de `soap-client.ts`
- [ ] Eliminar export temporal de `buildFileBasename` si no se necesita
