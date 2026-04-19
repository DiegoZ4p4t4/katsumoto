import type { GeoDepartment, GeoProvince, GeoDistrict } from "./types";
import {
  getDistrictsForProvince as getDistrictsForProvinceRaw,
  getDistrict as getDistrictRaw,
  isDistrictSelva as isDistrictSelvaRaw,
  getDistrictStats,
} from "./geo-districts";

export interface DepartmentData {
  code: string;
  name: string;
  isAllSelva: boolean;
  provinces: ProvinceData[];
}

export interface ProvinceData {
  code: string;
  name: string;
  isSelva: boolean;
  isPartial?: boolean;
}

export const PERU_DEPARTMENTS: DepartmentData[] = [
  // ==================== TOTAL SELVA ====================
  {
    code: "01", name: "Amazonas", isAllSelva: true,
    provinces: [
      { code: "0101", name: "Chachapoyas", isSelva: true },
      { code: "0102", name: "Bagua", isSelva: true },
      { code: "0103", name: "Bongará", isSelva: true },
      { code: "0104", name: "Condorcanqui", isSelva: true },
      { code: "0105", name: "Luya", isSelva: true },
      { code: "0106", name: "Rodríguez de Mendoza", isSelva: true },
      { code: "0107", name: "Utcubamba", isSelva: true },
    ],
  },
  {
    code: "16", name: "Loreto", isAllSelva: true,
    provinces: [
      { code: "1601", name: "Maynas", isSelva: true },
      { code: "1602", name: "Alto Amazonas", isSelva: true },
      { code: "1603", name: "Datem del Marañón", isSelva: true },
      { code: "1604", name: "Loreto", isSelva: true },
      { code: "1605", name: "Mariscal Ramón Castilla", isSelva: true },
      { code: "1606", name: "Putumayo", isSelva: true },
      { code: "1607", name: "Requena", isSelva: true },
      { code: "1608", name: "Ucayali", isSelva: true },
    ],
  },
  {
    code: "17", name: "Madre de Dios", isAllSelva: true,
    provinces: [
      { code: "1701", name: "Tambopata", isSelva: true },
      { code: "1702", name: "Manu", isSelva: true },
      { code: "1703", name: "Tahuamanu", isSelva: true },
    ],
  },
  {
    code: "22", name: "San Martín", isAllSelva: true,
    provinces: [
      { code: "2201", name: "Moyobamba", isSelva: true },
      { code: "2202", name: "Bellavista", isSelva: true },
      { code: "2203", name: "El Dorado", isSelva: true },
      { code: "2204", name: "Huallaga", isSelva: true },
      { code: "2205", name: "Lamas", isSelva: true },
      { code: "2206", name: "Mariscal Cáceres", isSelva: true },
      { code: "2207", name: "Picota", isSelva: true },
      { code: "2208", name: "Rioja", isSelva: true },
      { code: "2209", name: "San Martín", isSelva: true },
      { code: "2210", name: "Tocache", isSelva: true },
    ],
  },
  {
    code: "25", name: "Ucayali", isAllSelva: true,
    provinces: [
      { code: "2501", name: "Coronel Portillo", isSelva: true },
      { code: "2502", name: "Atalaya", isSelva: true },
      { code: "2503", name: "Padre Abad", isSelva: true },
      { code: "2504", name: "Purús", isSelva: true },
    ],
  },

  // ==================== PARCIAL SELVA ====================
  {
    code: "02", name: "Áncash", isAllSelva: false,
    provinces: [
      { code: "0201", name: "Huaraz", isSelva: false },
      { code: "0202", name: "Aija", isSelva: false },
      { code: "0203", name: "Antonio Raymondi", isSelva: true, isPartial: true },
      { code: "0204", name: "Asunción", isSelva: true, isPartial: true },
      { code: "0205", name: "Bolognesi", isSelva: false },
      { code: "0206", name: "Carhuaz", isSelva: false },
      { code: "0207", name: "Carlos Fermín Fitzcarrald", isSelva: true, isPartial: true },
      { code: "0208", name: "Casma", isSelva: false },
      { code: "0209", name: "Corongo", isSelva: true, isPartial: true },
      { code: "0210", name: "Huari", isSelva: true, isPartial: true },
      { code: "0211", name: "Huarmey", isSelva: false },
      { code: "0212", name: "Huaylas", isSelva: false },
      { code: "0213", name: "Mariscal Luzuriaga", isSelva: true, isPartial: true },
      { code: "0214", name: "Ocros", isSelva: false },
      { code: "0215", name: "Pallasca", isSelva: true, isPartial: true },
      { code: "0216", name: "Pomabamba", isSelva: true, isPartial: true },
      { code: "0217", name: "Recuay", isSelva: false },
      { code: "0218", name: "Santa", isSelva: false },
      { code: "0219", name: "Sihuas", isSelva: true, isPartial: true },
      { code: "0220", name: "Yungay", isSelva: false },
    ],
  },
  {
    code: "03", name: "Apurímac", isAllSelva: false,
    provinces: [
      { code: "0301", name: "Abancay", isSelva: false },
      { code: "0302", name: "Andahuaylas", isSelva: true, isPartial: true },
      { code: "0303", name: "Antabamba", isSelva: false },
      { code: "0304", name: "Aymaraes", isSelva: false },
      { code: "0305", name: "Cotabambas", isSelva: false },
      { code: "0306", name: "Chincheros", isSelva: true, isPartial: true },
      { code: "0307", name: "Grau", isSelva: false },
    ],
  },
  {
    code: "05", name: "Ayacucho", isAllSelva: false,
    provinces: [
      { code: "0501", name: "Huamanga", isSelva: false },
      { code: "0502", name: "Cangallo", isSelva: true, isPartial: true },
      { code: "0503", name: "Huanca Sancos", isSelva: false },
      { code: "0504", name: "Huanta", isSelva: true, isPartial: true },
      { code: "0505", name: "La Mar", isSelva: true, isPartial: true },
      { code: "0506", name: "Lucanas", isSelva: false },
      { code: "0507", name: "Parinacochas", isSelva: false },
      { code: "0508", name: "Páucar del Sara Sara", isSelva: false },
      { code: "0509", name: "Sucre", isSelva: false },
      { code: "0510", name: "Víctor Fajardo", isSelva: false },
      { code: "0511", name: "Vilcas Huamán", isSelva: false },
    ],
  },
  {
    code: "06", name: "Cajamarca", isAllSelva: false,
    provinces: [
      { code: "0601", name: "Cajamarca", isSelva: false },
      { code: "0602", name: "Cajabamba", isSelva: false },
      { code: "0603", name: "Celendín", isSelva: false },
      { code: "0604", name: "Chota", isSelva: false },
      { code: "0605", name: "Contumazá", isSelva: false },
      { code: "0606", name: "Cutervo", isSelva: false },
      { code: "0607", name: "Hualgayoc", isSelva: false },
      { code: "0608", name: "Jaén", isSelva: true, isPartial: true },
      { code: "0609", name: "San Ignacio", isSelva: true, isPartial: true },
      { code: "0610", name: "San Marcos", isSelva: false },
      { code: "0611", name: "San Miguel", isSelva: false },
      { code: "0612", name: "San Pablo", isSelva: false },
      { code: "0613", name: "Santa Cruz", isSelva: false },
    ],
  },
  {
    code: "08", name: "Cusco", isAllSelva: false,
    provinces: [
      { code: "0801", name: "Cusco", isSelva: false },
      { code: "0802", name: "Acomayo", isSelva: false },
      { code: "0803", name: "Anta", isSelva: false },
      { code: "0804", name: "Calca", isSelva: true, isPartial: true },
      { code: "0805", name: "Canas", isSelva: false },
      { code: "0806", name: "Canchis", isSelva: false },
      { code: "0807", name: "Chumbivilcas", isSelva: false },
      { code: "0808", name: "Espinar", isSelva: false },
      { code: "0809", name: "La Convención", isSelva: true },
      { code: "0810", name: "Paruro", isSelva: false },
      { code: "0811", name: "Paucartambo", isSelva: true, isPartial: true },
      { code: "0812", name: "Quispicanchi", isSelva: true, isPartial: true },
      { code: "0813", name: "Urubamba", isSelva: true, isPartial: true },
    ],
  },
  {
    code: "09", name: "Huancavelica", isAllSelva: false,
    provinces: [
      { code: "0901", name: "Huancavelica", isSelva: false },
      { code: "0902", name: "Acobamba", isSelva: false },
      { code: "0903", name: "Angaraes", isSelva: false },
      { code: "0904", name: "Castrovirreyna", isSelva: false },
      { code: "0905", name: "Churcampa", isSelva: false },
      { code: "0906", name: "Huaytará", isSelva: false },
      { code: "0907", name: "Tayacaja", isSelva: true, isPartial: true },
    ],
  },
  {
    code: "10", name: "Huánuco", isAllSelva: false,
    provinces: [
      { code: "1001", name: "Huánuco", isSelva: true, isPartial: true },
      { code: "1002", name: "Ambo", isSelva: false },
      { code: "1003", name: "Dos de Mayo", isSelva: false },
      { code: "1004", name: "Huacaybamba", isSelva: true, isPartial: true },
      { code: "1005", name: "Huamalíes", isSelva: true, isPartial: true },
      { code: "1006", name: "Leoncio Prado", isSelva: true },
      { code: "1007", name: "Marañón", isSelva: true, isPartial: true },
      { code: "1008", name: "Pachitea", isSelva: true, isPartial: true },
      { code: "1009", name: "Puerto Inca", isSelva: true },
      { code: "1010", name: "Lauricocha", isSelva: true, isPartial: true },
      { code: "1011", name: "Yarowilca", isSelva: false },
    ],
  },
  {
    code: "12", name: "Junín", isAllSelva: false,
    provinces: [
      { code: "1201", name: "Huancayo", isSelva: false },
      { code: "1202", name: "Concepción", isSelva: true, isPartial: true },
      { code: "1203", name: "Chanchamayo", isSelva: true },
      { code: "1204", name: "Jauja", isSelva: false },
      { code: "1205", name: "Junín", isSelva: false },
      { code: "1206", name: "Satipo", isSelva: true },
      { code: "1207", name: "Tarma", isSelva: true, isPartial: true },
      { code: "1208", name: "Yauli", isSelva: false },
      { code: "1209", name: "Chupaca", isSelva: true, isPartial: true },
    ],
  },
  {
    code: "13", name: "La Libertad", isAllSelva: false,
    provinces: [
      { code: "1301", name: "Trujillo", isSelva: false },
      { code: "1302", name: "Ascope", isSelva: false },
      { code: "1303", name: "Bolívar", isSelva: true, isPartial: true },
      { code: "1304", name: "Chepén", isSelva: false },
      { code: "1305", name: "Gran Chimú", isSelva: false },
      { code: "1306", name: "Julcán", isSelva: false },
      { code: "1307", name: "Otuzco", isSelva: false },
      { code: "1308", name: "Pacasmayo", isSelva: false },
      { code: "1309", name: "Pataz", isSelva: false },
      { code: "1310", name: "Sánchez Carrión", isSelva: true, isPartial: true },
      { code: "1311", name: "Santiago de Chuco", isSelva: false },
      { code: "1312", name: "Virú", isSelva: false },
    ],
  },
  {
    code: "19", name: "Pasco", isAllSelva: false,
    provinces: [
      { code: "1901", name: "Pasco", isSelva: false },
      { code: "1902", name: "Daniel Alcides Carrión", isSelva: false },
      { code: "1903", name: "Oxapampa", isSelva: true },
    ],
  },
  {
    code: "20", name: "Piura", isAllSelva: false,
    provinces: [
      { code: "2001", name: "Piura", isSelva: false },
      { code: "2002", name: "Ayabaca", isSelva: true, isPartial: true },
      { code: "2003", name: "Huancabamba", isSelva: true, isPartial: true },
      { code: "2004", name: "Morropón", isSelva: true, isPartial: true },
      { code: "2005", name: "Paita", isSelva: false },
      { code: "2006", name: "Sullana", isSelva: false },
      { code: "2007", name: "Talara", isSelva: false },
      { code: "2008", name: "Sechura", isSelva: false },
    ],
  },
  {
    code: "21", name: "Puno", isAllSelva: false,
    provinces: [
      { code: "2101", name: "Puno", isSelva: false },
      { code: "2102", name: "Azángaro", isSelva: false },
      { code: "2103", name: "Carabaya", isSelva: true, isPartial: true },
      { code: "2104", name: "Chucuito", isSelva: false },
      { code: "2105", name: "El Collao", isSelva: false },
      { code: "2106", name: "Huancané", isSelva: false },
      { code: "2107", name: "Lampa", isSelva: false },
      { code: "2108", name: "Melgar", isSelva: false },
      { code: "2109", name: "Moho", isSelva: false },
      { code: "2110", name: "San Antonio de Putina", isSelva: false },
      { code: "2111", name: "San Román", isSelva: false },
      { code: "2112", name: "Sandia", isSelva: true, isPartial: true },
      { code: "2113", name: "Yunguyo", isSelva: false },
    ],
  },

  // ==================== SIN SELVA ====================
  {
    code: "04", name: "Arequipa", isAllSelva: false,
    provinces: [
      { code: "0401", name: "Arequipa", isSelva: false },
      { code: "0402", name: "Camaná", isSelva: false },
      { code: "0403", name: "Caravelí", isSelva: false },
      { code: "0404", name: "Castilla", isSelva: false },
      { code: "0405", name: "Caylloma", isSelva: false },
      { code: "0406", name: "Condesuyos", isSelva: false },
      { code: "0407", name: "Islay", isSelva: false },
      { code: "0408", name: "La Unión", isSelva: false },
    ],
  },
  {
    code: "07", name: "Callao", isAllSelva: false,
    provinces: [
      { code: "0701", name: "Callao", isSelva: false },
    ],
  },
  {
    code: "11", name: "Ica", isAllSelva: false,
    provinces: [
      { code: "1101", name: "Ica", isSelva: false },
      { code: "1102", name: "Chincha", isSelva: false },
      { code: "1103", name: "Nasca", isSelva: false },
      { code: "1104", name: "Palpa", isSelva: false },
      { code: "1105", name: "Pisco", isSelva: false },
    ],
  },
  {
    code: "14", name: "Lambayeque", isAllSelva: false,
    provinces: [
      { code: "1401", name: "Chiclayo", isSelva: false },
      { code: "1402", name: "Ferreñafe", isSelva: false },
      { code: "1403", name: "Lambayeque", isSelva: false },
    ],
  },
  {
    code: "15", name: "Lima", isAllSelva: false,
    provinces: [
      { code: "1501", name: "Lima", isSelva: false },
      { code: "1502", name: "Barranca", isSelva: false },
      { code: "1503", name: "Cajatambo", isSelva: false },
      { code: "1504", name: "Canta", isSelva: false },
      { code: "1505", name: "Cañete", isSelva: false },
      { code: "1506", name: "Huaral", isSelva: false },
      { code: "1507", name: "Huarochirí", isSelva: false },
      { code: "1508", name: "Huaura", isSelva: false },
      { code: "1509", name: "Oyón", isSelva: false },
      { code: "1510", name: "Yauyos", isSelva: false },
    ],
  },
  {
    code: "18", name: "Moquegua", isAllSelva: false,
    provinces: [
      { code: "1801", name: "Mariscal Nieto", isSelva: false },
      { code: "1802", name: "General Sánchez Cerro", isSelva: false },
      { code: "1803", name: "Ilo", isSelva: false },
    ],
  },
  {
    code: "23", name: "Tacna", isAllSelva: false,
    provinces: [
      { code: "2301", name: "Tacna", isSelva: false },
      { code: "2302", name: "Candarave", isSelva: false },
      { code: "2303", name: "Jorge Basadre", isSelva: false },
      { code: "2304", name: "Tarata", isSelva: false },
    ],
  },
  {
    code: "24", name: "Tumbes", isAllSelva: false,
    provinces: [
      { code: "2401", name: "Tumbes", isSelva: false },
      { code: "2402", name: "Contralmirante Villar", isSelva: false },
      { code: "2403", name: "Zarumilla", isSelva: false },
    ],
  },
];

// ==========================================
// Helper Functions
// ==========================================

/** Get all provinces flat */
export function getAllProvinces(): GeoProvince[] {
  return PERU_DEPARTMENTS.flatMap((dept) =>
    dept.provinces.map((prov) => ({
      code: prov.code,
      departmentCode: dept.code,
      name: prov.name,
      isSelva: prov.isSelva,
    }))
  );
}

/** Get departments list */
export function getDepartments(): GeoDepartment[] {
  return PERU_DEPARTMENTS.map((dept) => ({
    code: dept.code,
    name: dept.name,
    isAllSelva: dept.isAllSelva,
  }));
}

/** Get provinces for a department */
export function getProvincesForDepartment(deptCode: string): GeoProvince[] {
  const dept = PERU_DEPARTMENTS.find((d) => d.code === deptCode);
  if (!dept) return [];
  return dept.provinces.map((p) => ({
    code: p.code,
    departmentCode: dept.code,
    name: p.name,
    isSelva: p.isSelva,
  }));
}

/** Get a specific province */
export function getProvince(provCode: string): GeoProvince | null {
  for (const dept of PERU_DEPARTMENTS) {
    const prov = dept.provinces.find((p) => p.code === provCode);
    if (prov) {
      return {
        code: prov.code,
        departmentCode: dept.code,
        name: prov.name,
        isSelva: prov.isSelva,
      };
    }
  }
  return null;
}

/** Get a specific department */
export function getDepartment(deptCode: string): GeoDepartment | null {
  const dept = PERU_DEPARTMENTS.find((d) => d.code === deptCode);
  if (!dept) return null;
  return { code: dept.code, name: dept.name, isAllSelva: dept.isAllSelva };
}

/** Get department name */
export function getDepartmentName(deptCode: string): string {
  return getDepartment(deptCode)?.name ?? "—";
}

/** Get province name */
export function getProvinceName(provCode: string): string {
  return getProvince(provCode)?.name ?? "—";
}

/** Check if a province is in the selva zone */
export function isProvinceSelva(provCode: string): boolean {
  return getProvince(provCode)?.isSelva ?? false;
}

/** Get all selva provinces */
export function getSelvaProvinces(): GeoProvince[] {
  return getAllProvinces().filter((p) => p.isSelva);
}

/** Get districts for a province (delegates to geo-districts) */
export function getDistrictsForProvince(provinceCode: string): GeoDistrict[] {
  return getDistrictsForProvinceRaw(provinceCode);
}

/** Get a specific district by UBIGEO code */
export function getDistrict(code: string): GeoDistrict | null {
  return getDistrictRaw(code);
}

/** Check if a specific district is in the selva zone */
export function isDistrictSelva(code: string): boolean {
  return isDistrictSelvaRaw(code);
}

/** Get statistics */
export function getGeoStats() {
  const allProvs = getAllProvinces();
  const selvaProvs = allProvs.filter((p) => p.isSelva);
  const totalSelvaDepts = PERU_DEPARTMENTS.filter((d) => d.isAllSelva).length;
  const partialSelvaDepts = PERU_DEPARTMENTS.filter(
    (d) => !d.isAllSelva && d.provinces.some((p) => p.isSelva)
  ).length;
  const districtStats = getDistrictStats();
  return {
    totalDepartments: PERU_DEPARTMENTS.length,
    totalProvinces: allProvs.length,
    selvaProvinces: selvaProvs.length,
    selvaProvincesPercentage: Math.round((selvaProvs.length / allProvs.length) * 100),
    totalSelvaDepartments: totalSelvaDepts,
    partialSelvaDepartments: partialSelvaDepts,
    nonSelvaDepartments: PERU_DEPARTMENTS.length - totalSelvaDepts - partialSelvaDepts,
    totalDistricts: districtStats.totalDistricts,
    selvaDistricts: districtStats.selvaDistricts,
    districtCoveragePercent: districtStats.coveragePercent,
  };
}