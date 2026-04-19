import type { TaxAffectation, TaxDetermination, ProductFamily } from "./types";
import { getProvince, getDepartment } from "./geo-peru";
import { isDistrictSelva as isDistrictSelvaRaw, getDistrict as getDistrictRaw } from "./geo-districts";
import { TAX_RATE_MAP } from "./constants";

// ============================================================
// Tipos
// ============================================================

export interface TaxDeterminationParams {
  sellerProvinceCode: string;
  sellerDistrictCode?: string;
  buyerLocationCode?: string;
  buyerLocationLevel?: "district" | "province" | "department";
  productFamily: ProductFamily | null;
  selvaLawEnabled: boolean;
}

export interface TaxRule {
  id: string;
  title: string;
  description: string;
  law: string;
  article: string;
  applicable: boolean;
  affectation: TaxAffectation;
  rate: number;
  conditions: string[];
}

export interface BranchLocation {
  department_code: string;
  province_code: string;
  district_code: string;
  is_selva_zone: boolean;
}

export interface CustomerLocation {
  department_code: string;
  province_code: string;
  district_code: string;
  is_selva_zone: boolean;
}

export interface ShippingLocation {
  address?: string;
  department_code: string;
  province_code: string;
  district_code: string;
}

export interface TransactionLocationInput {
  branch: BranchLocation;
  selvaLawEnabled: boolean;
  customer?: CustomerLocation | null;
  shipping?: ShippingLocation | null;
  isInPerson?: boolean;
}

export interface DestinationResult {
  code: string;
  level: "district" | "province" | "department";
  isSelva: boolean;
  confidence: "high" | "medium" | "low";
  source: "shipping" | "customer" | "none";
}

// ============================================================
// Funcion principal legacy: determina la afectacion tributaria
// ============================================================

export function determineTax(params: TaxDeterminationParams): TaxDetermination {
  const {
    sellerProvinceCode,
    sellerDistrictCode,
    buyerLocationCode,
    buyerLocationLevel,
    productFamily,
    selvaLawEnabled,
  } = params;

  if (!selvaLawEnabled) {
    return gravado("La exoneracion por Amazonia esta deshabilitada en la configuracion.");
  }

  const sellerIsSelva = isLocationSelva(sellerProvinceCode, sellerDistrictCode);
  if (!sellerIsSelva) {
    return gravado(
      "El vendedor no se ubica en zona de Amazonia segun la Ley 27037 y el D.S. 007-99-ITINCI."
    );
  }

  if (!buyerLocationCode) {
    return {
      ...gravado("No se ha especificado la ubicacion del comprador."),
      confidence: "low",
    };
  }

  const buyerIsSelva = resolveBuyerIsSelva(buyerLocationCode, buyerLocationLevel);
  if (!buyerIsSelva) {
    return gravado(
      "El comprador no se ubica en zona de Amazonia. La exoneracion solo aplica cuando el bien o servicio se consume dentro de la Amazonia (Art. 12 Ley 27037)."
    );
  }

  const reason =
    productFamily === "servicios"
      ? "Servicio prestado en Amazonia para consumo en Amazonia."
      : "Bien producido o comercializado en Amazonia para consumo en Amazonia.";

  return exoneradoSelva(reason, resolveConfidence(sellerDistrictCode, buyerLocationCode, buyerLocationLevel));
}

// ============================================================
// V2: Determinacion por transaccion multi-sede
// ============================================================

export function determineTaxForTransaction(input: TransactionLocationInput): TaxDetermination {
  if (!input.selvaLawEnabled) {
    return gravado("La exoneracion por Amazonia esta deshabilitada en la configuracion.");
  }

  const sellerIsSelva = input.branch.is_selva_zone;
  if (!sellerIsSelva) {
    return gravado(
      "El vendedor no se ubica en zona de Amazonia segun la Ley 27037 y el D.S. 007-99-ITINCI."
    );
  }

  let dest: DestinationResult;
  if (input.isInPerson) {
    const branchCode = input.branch.district_code || input.branch.province_code || input.branch.department_code;
    dest = {
      code: branchCode,
      level: input.branch.district_code ? "district" : input.branch.province_code ? "province" : "department",
      isSelva: true,
      confidence: input.branch.district_code ? "high" : "medium",
      source: "shipping",
    };
  } else {
    dest = resolveDestinationLocation(input.customer, input.shipping);
  }

  if (dest.source === "none") {
    return {
      ...gravado("No se ha especificado la ubicacion del comprador ni direccion de envio."),
      confidence: "low",
    };
  }

  if (!dest.isSelva) {
    return gravado(
      "El destino no se ubica en zona de Amazonia. La exoneracion solo aplica cuando el bien o servicio se consume dentro de la Amazonia (Art. 12 Ley 27037)."
    );
  }

  const confidence = resolveConfidence(
    input.branch.district_code || undefined,
    dest.code,
    dest.level as "district" | "province" | "department" | undefined,
  );

  return exoneradoSelva(
    "Bien producido o comercializado en Amazonia para consumo en Amazonia.",
    confidence,
  );
}

// ============================================================
// V2: Resolver ubicacion de destino
// ============================================================

export function resolveDestinationLocation(
  customer?: CustomerLocation | null,
  shipping?: ShippingLocation | null,
): DestinationResult {
  if (shipping && (shipping.district_code || shipping.province_code || shipping.department_code)) {
    const code = shipping.district_code || shipping.province_code || shipping.department_code;
    const level = shipping.district_code
      ? "district" as const
      : shipping.province_code
        ? "province" as const
        : "department" as const;
    return {
      code,
      level,
      isSelva: resolveBuyerIsSelva(code, level),
      confidence: level === "district" ? "high" : level === "province" ? "medium" : "low",
      source: "shipping",
    };
  }

  if (customer && (customer.district_code || customer.province_code || customer.department_code)) {
    const code = customer.district_code || customer.province_code || customer.department_code;
    const level = customer.district_code
      ? "district" as const
      : customer.province_code
        ? "province" as const
        : "department" as const;
    return {
      code,
      level,
      isSelva: resolveBuyerIsSelva(code, level),
      confidence: level === "district" ? "high" : level === "province" ? "medium" : "low",
      source: "customer",
    };
  }

  return {
    code: "",
    level: "department",
    isSelva: false,
    confidence: "low",
    source: "none",
  };
}

// ============================================================
// Determinacion por producto (override individual)
// ============================================================

export function determineProductTax(
  overallDetermination: TaxDetermination,
  productTaxAffectation: TaxAffectation | undefined
): TaxDetermination {
  if (productTaxAffectation === "exportacion") return exportacion();
  if (productTaxAffectation === "inafecto") return inafecto();

  if (overallDetermination.affectation === "exonerado") {
    return overallDetermination;
  }

  if (productTaxAffectation === "exonerado") {
    return exoneradoProducto();
  }

  return gravado();
}

// ============================================================
// Logica de ubicacion selva
// ============================================================

function isLocationSelva(provinceCode: string, districtCode?: string): boolean {
  if (districtCode) {
    const d = getDistrictRaw(districtCode);
    if (d) return d.isSelva;
  }

  const province = getProvince(provinceCode);
  return province?.isSelva ?? false;
}

export function isUbigeoSelva(
  departmentCode: string,
  provinceCode: string,
  districtCode?: string,
): boolean {
  if (districtCode) {
    const d = getDistrictRaw(districtCode);
    if (d) return d.isSelva;
  }
  if (provinceCode) {
    const prov = getProvince(provinceCode);
    if (prov) return prov.isSelva;
  }
  if (departmentCode) {
    const dept = getDepartment(departmentCode);
    if (dept?.isAllSelva) return true;
  }
  return false;
}

function resolveBuyerIsSelva(
  locationCode: string,
  level?: "district" | "province" | "department"
): boolean {
  if (level === "district" || (!level && locationCode.length >= 6)) {
    return isDistrictSelvaRaw(locationCode);
  }

  if (level === "province" || (!level && locationCode.length === 4)) {
    const prov = getProvince(locationCode);
    return prov?.isSelva ?? false;
  }

  const dept = getDepartment(locationCode);
  if (!dept) return false;
  if (dept.isAllSelva) return true;

  return false;
}

function resolveConfidence(
  sellerDistrictCode?: string,
  buyerLocationCode?: string,
  buyerLocationLevel?: string
): "high" | "medium" | "low" {
  const sellerGranular = !!sellerDistrictCode;
  const buyerGranular =
    !!buyerLocationCode &&
    (buyerLocationLevel === "district" ||
      (!buyerLocationLevel && buyerLocationCode.length >= 6));

  if (sellerGranular && buyerGranular) return "high";
  if (sellerGranular || buyerGranular) return "medium";
  return "low";
}

// ============================================================
// Constructores de resultado
// ============================================================

function gravado(notes?: string): TaxDetermination {
  return {
    affectation: "gravado",
    sunatCode: "10",
    rate: TAX_RATE_MAP.gravado,
    label: "Gravado — IGV 18%",
    justification:
      notes ||
      "Operacion gravada con IGV segun norma general (IGV 18%, Art. 1 Ley 821).",
    law: "Ley del IGV — D. Leg. 821, Art. 1",
    confidence: "high",
  };
}

function exoneradoSelva(
  reason: string,
  confidence: "high" | "medium" | "low"
): TaxDetermination {
  return {
    affectation: "exonerado",
    sunatCode: "20",
    rate: 0,
    label: "Exonerado — Amazonia (IGV 0%)",
    justification: reason,
    law: "Ley 27037, Art. 12 — Vigencia prorrogada por D.S. 059-2023-EF hasta el 31/12/2028.",
    confidence,
  };
}

function exoneradoProducto(): TaxDetermination {
  return {
    affectation: "exonerado",
    sunatCode: "20",
    rate: 0,
    label: "Exonerado — Producto (IGV 0%)",
    justification:
      "Producto clasificado como exonerado segun normativa especifica.",
    law: "Apéndice I — Ley del IGV, D. Leg. 821",
    confidence: "medium",
  };
}

function inafecto(): TaxDetermination {
  return {
    affectation: "inafecto",
    sunatCode: "30",
    rate: 0,
    label: "Inafecto — No gravado (IGV 0%)",
    justification: "Operacion no afecta al IGV por disposicion legal.",
    law: "Art. 2 — D. Leg. 821, Inafectaciones",
    confidence: "high",
  };
}

function exportacion(): TaxDetermination {
  return {
    affectation: "exportacion",
    sunatCode: "40",
    rate: 0,
    label: "Exportacion (IGV 0%)",
    justification: "Exportacion de bienes o servicios.",
    law: "Art. 33 — D. Leg. 821",
    confidence: "high",
  };
}

// ============================================================
// Reglas fiscales aplicables (para UI)
// ============================================================

export function getApplicableTaxRules(
  sellerProvinceCode: string,
  sellerDistrictCode: string,
  selvaLawEnabled: boolean
): TaxRule[] {
  const sellerProvince = getProvince(sellerProvinceCode);
  const sellerDept = sellerProvince
    ? getDepartment(sellerProvince.departmentCode)
    : null;
  const sellerIsSelva = isLocationSelva(sellerProvinceCode, sellerDistrictCode || undefined);
  const sellerLocation = sellerDistrictCode
    ? getDistrictRaw(sellerDistrictCode)?.name ?? sellerProvince?.name
    : sellerProvince?.name;

  return [
    {
      id: "igv-general",
      title: "IGV General",
      description:
        "Impuesto General a las Ventas del 18% aplicable a todas las operaciones gravadas.",
      law: "D. Leg. 821",
      article: "Art. 1, 10 y 17",
      applicable: true,
      affectation: "gravado",
      rate: 0.18,
      conditions: [
        "Operacion de venta de bienes muebles",
        "Prestacion de servicios",
        "Contratos de construccion",
      ],
    },
    {
      id: "selva-exoneration",
      title: "Exoneracion Amazonia (Ley 27037)",
      description:
        "Exoneracion del IGV para bienes producidos o comercializados en la Amazonia, destinados al consumo dentro de la Amazonia.",
      law: "Ley 27037",
      article: "Art. 12, Inc. b)",
      applicable: selvaLawEnabled && sellerIsSelva,
      affectation: "exonerado",
      rate: 0,
      conditions: [
        `Vendedor en zona Amazonia: ${sellerIsSelva ? `Si ${sellerLocation ?? "—"} (${sellerDept?.name ?? "—"})` : "No aplica"}`,
        "Comprador ubicado en zona de Amazonia",
        "Bien o servicio destinado al consumo dentro de la Amazonia",
        `Ley habilitada en sistema: ${selvaLawEnabled ? "Si" : "No"}`,
      ],
    },
    {
      id: "agrarian-promotion",
      title: "Promocion Agraria",
      description:
        "Beneficios tributarios para actividades agricolas y agroindustriales.",
      law: "D. Leg. 1057",
      article: "Art. 3 y 5",
      applicable: false,
      affectation: "gravado",
      rate: 0.18,
      conditions: [
        "Productores agrarios inscritos en el Registro Nacional",
        "Insumos y maquinaria agricola pueden tener beneficios especificos",
        "Requiere registro especial ante SUNAT",
      ],
    },
  ];
}

// ============================================================
// Texto legal para comprobantes
// ============================================================

export function getLegalBasisText(
  determination: TaxDetermination,
  sellerProvinceCode: string,
  sellerDistrictCode?: string
): string | null {
  if (determination.affectation !== "exonerado") return null;

  const province = getProvince(sellerProvinceCode);
  const dept = province ? getDepartment(province.departmentCode) : null;
  const districtName = sellerDistrictCode
    ? getDistrictRaw(sellerDistrictCode)?.name
    : null;
  const location = [districtName, province?.name, dept?.name]
    .filter(Boolean)
    .join(", ");

  return (
    `Exonerado del IGV conforme al Art. 12 de la Ley N. 27037 ` +
    `y su modificatoria D.S. 059-2023-EF. ` +
    `Vendedor: ${location || "—"} (Zona de Amazonia). ` +
    `Vigencia hasta el 31/12/2028.`
  );
}

// ============================================================
// Validacion de configuracion
// ============================================================

export interface TaxConfigValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateTaxConfig(config: {
  sellerDepartmentCode: string;
  sellerProvinceCode: string;
  sellerDistrictCode?: string;
  sellerIsSelva: boolean;
  selvaLawEnabled: boolean;
}): TaxConfigValidation {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!config.sellerDepartmentCode) {
    errors.push("No se ha seleccionado un departamento.");
  }
  if (!config.sellerProvinceCode) {
    errors.push("No se ha seleccionado una provincia.");
  }

  if (config.sellerIsSelva && !config.sellerDistrictCode) {
    warnings.push(
      "La ubicacion es zona de selva pero no se ha seleccionado un distrito. La determinacion puede ser menos precisa."
    );
  }

  if (config.sellerIsSelva && !config.selvaLawEnabled) {
    warnings.push(
      "El vendedor esta en zona de Amazonia pero la exoneracion esta deshabilitada. Verifique con su contador."
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
