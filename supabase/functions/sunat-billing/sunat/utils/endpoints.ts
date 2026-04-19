import type { SunatCredentials } from "../types.ts";

export function getBillServiceEndpoint(credentials: SunatCredentials): string {
  const isProduction = credentials.modo_produccion === true ||
    credentials.modo_produccion === "true";
  return isProduction
    ? "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService"
    : "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
}

export function getDespatchServiceEndpoint(credentials: SunatCredentials): string {
  const isProduction = credentials.modo_produccion === true ||
    credentials.modo_produccion === "true";
  return isProduction
    ? "https://e-guiaremision.sunat.gob.pe/ol-ti-itemision-guia-gem/billService"
    : "https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService";
}
