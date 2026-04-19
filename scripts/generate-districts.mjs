import { readFileSync, writeFileSync } from "fs";

const rawData = JSON.parse(
  readFileSync(
    "/Users/master/.local/share/opencode/tool-output/tool_d73ff6e8b001QqogfLvsFLsP92",
    "utf-8"
  )
);

const districts = rawData.ubigeo_distritos;

const provincesAlreadyDone = new Set([
  "0203", "0204", "0207", "0209", "0210", "0213", "0215", "0216", "0219",
  "0302", "0306",
  "0502", "0504", "0505",
  "0608", "0609",
  "0804", "0811", "0812", "0813",
  "0907",
  "1001", "1004", "1005", "1007", "1008", "1010",
  "1202", "1207", "1209",
  "1303", "1310",
  "2002", "2003", "2004",
  "2103", "2112",
]);

const fullSelvaDepartments = new Set(["01", "16", "17", "22", "25"]);

const fullSelvaProvinces = new Set([
  "0809", "1006", "1009", "1203", "1206", "1903",
]);

const accentMap = {
  "amazonas": "Amazonas", "andahuaylas": "Andahuaylas",
  "asuncion": "Asunción", "canción": "Canción",
  "chiliquin": "Chiliquín", "copallin": "Copallín",
  "jazan": "Jazán", "maria": "María",
  "jerónimo": "Jerónimo", "jeronimo": "Jerónimo",
  "cristobal": "Cristóbal", "cristóbal": "Cristóbal",
  "tomas": "Tomás", "tomás": "Tomás",
  "leon": "León", "león": "León",
  "martir": "Mártir", "mártir": "Mártir",
  "coronel": "Coronel",
  "lagunas": "Lagunas",
  "simón": "Simón", "simon": "Simón",
  "ramón": "Ramón", "ramon": "Ramón",
  "cáceres": "Cáceres", "caceres": "Cáceres",
  "félix": "Félix", "felix": "Félix",
  "independencia": "Independencia",
  "belén": "Belén", "belen": "Belén",
  "cañete": "Cañete", "canta": "Canta",
  "jarpa": "Jarpa", "iscos": "Iscos",
  "cayrán": "Cayrán", "cayran": "Cayrán",
  "chaulán": "Chaulán", "chaulan": "Chaulán",
  "pichari": "Pichari",
  "oyón": "Oyón", "oyon": "Oyón",
  "nasca": "Nasca",
  "huarochirí": "Huarochirí", "huarochiri": "Huarochirí",
  "huánuco": "Huánuco", "huanuco": "Huánuco",
  "huancavelica": "Huancavelica",
  "españa": "España", "espana": "España",
  "paña": "Paña", "pana": "Pana",
  "muñoz": "Muñoz", "munoz": "Muñoz",
  "álvarez": "Álvarez", "alvarez": "Álvarez",
  "gómez": "Gómez", "gomez": "Gómez",
  "pérez": "Pérez", "perez": "Pérez",
  "rodríguez": "Rodríguez", "rodriguez": "Rodríguez",
  "fernández": "Fernández", "fernandez": "Fernández",
  "gonzález": "González", "gonzalez": "González",
  "hernández": "Hernández", "hernandez": "Hernández",
  "martínez": "Martínez", "martinez": "Martínez",
  "sánchez": "Sánchez", "sanchez": "Sánchez",
  "líder": "Líder",
  "micaela": "Micaela",
  "bastidas": "Bastidas",
  "josé": "José", "jose": "José",
  "andrés": "Andrés", "andres": "Andrés",
  "vicente": "Vicente",
  "fortunato": "Fortunato",
  "luis": "Luis",
  "san": "San", "santo": "Santo", "santa": "Santa",
  "lópez": "López", "lopez": "López",
  "romero": "Romero",
  "castilla": "Castilla",
  "delgado": "Delgado",
  "ayala": "Ayala",
};

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(/([ '-])/)
    .map((word, idx, arr) => {
      if (word === "" || /[- ']/.test(word)) return word;
      const isFirst = idx === 0 || (idx > 0 && arr.slice(0, idx).every((w) => w === "" || /[- ']/.test(w)));
      if (accentMap[word]) return accentMap[word];
      if (!isFirst && (word === "de" || word === "del" || word === "la" || word === "los" || word === "las" || word === "el" || word === "en" || word === "y" || word === "e")) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

const deptNames = {
  "01": "Amazonas",
  "02": "Áncash",
  "03": "Apurímac",
  "04": "Arequipa",
  "05": "Ayacucho",
  "06": "Cajamarca",
  "07": "Callao",
  "08": "Cusco",
  "09": "Huancavelica",
  "10": "Huánuco",
  "11": "Ica",
  "12": "Junín",
  "13": "La Libertad",
  "14": "Lambayeque",
  "15": "Lima",
  "16": "Loreto",
  "17": "Madre de Dios",
  "18": "Moquegua",
  "19": "Pasco",
  "20": "Piura",
  "21": "Puno",
  "22": "San Martín",
  "23": "Tacna",
  "24": "Tumbes",
  "25": "Ucayali",
};

const provNames = {
  "0101": "Chachapoyas", "0102": "Bagua", "0103": "Bongará", "0104": "Condorcanqui",
  "0105": "Luya", "0106": "Rodríguez de Mendoza", "0107": "Utcubamba",
  "0201": "Huaraz", "0202": "Aija", "0205": "Bolognesi", "0206": "Carhuaz",
  "0208": "Casma", "0211": "Huarmey", "0212": "Huaylas", "0214": "Ocros",
  "0217": "Recuay", "0218": "Santa", "0220": "Yungay",
  "0301": "Abancay", "0303": "Antabamba", "0304": "Aymaraes",
  "0305": "Cotabambas", "0307": "Grau",
  "0401": "Arequipa", "0402": "Camaná", "0403": "Caravelí", "0404": "Castilla",
  "0405": "Caylloma", "0406": "Condesuyos", "0407": "Islay", "0408": "La Unión",
  "0501": "Huamanga", "0503": "Huanca Sancos", "0506": "Lucanas",
  "0507": "Parinacochas", "0508": "Páucar del Sara Sara", "0509": "Sucre",
  "0510": "Víctor Fajardo", "0511": "Vilcas Huamán",
  "0601": "Cajamarca", "0602": "Cajabamba", "0603": "Celendín", "0604": "Chota",
  "0605": "Contumazá", "0606": "Cutervo", "0607": "Hualgayoc",
  "0610": "San Marcos", "0611": "San Miguel", "0612": "San Pablo", "0613": "Santa Cruz",
  "0701": "Callao",
  "0801": "Cusco", "0802": "Acomayo", "0803": "Anta", "0805": "Canas",
  "0806": "Canchis", "0807": "Chumbivilcas", "0808": "Espinar",
  "0809": "La Convención", "0810": "Paruro",
  "0901": "Huancavelica", "0902": "Acobamba", "0903": "Angaraes",
  "0904": "Castrovirreyna", "0905": "Churcampa", "0906": "Huaytará",
  "1002": "Ambo", "1003": "Dos de Mayo", "1006": "Leoncio Prado",
  "1009": "Puerto Inca", "1011": "Yarowilca",
  "1101": "Ica", "1102": "Chincha", "1103": "Nasca", "1104": "Palpa", "1105": "Pisco",
  "1201": "Huancayo", "1203": "Chanchamayo", "1204": "Jauja", "1205": "Junín",
  "1206": "Satipo", "1208": "Yauli",
  "1301": "Trujillo", "1302": "Ascope", "1304": "Chepén",
  "1305": "Gran Chimú", "1306": "Julcán", "1307": "Otuzco", "1308": "Pacasmayo",
  "1309": "Pataz", "1311": "Santiago de Chuco", "1312": "Virú",
  "1401": "Chiclayo", "1402": "Ferreñafe", "1403": "Lambayeque",
  "1501": "Lima", "1502": "Barranca", "1503": "Cajatambo", "1504": "Canta",
  "1505": "Cañete", "1506": "Huaral", "1507": "Huarochirí", "1508": "Huaura",
  "1509": "Oyón", "1510": "Yauyos",
  "1601": "Maynas", "1602": "Alto Amazonas", "1603": "Datem del Marañón",
  "1604": "Loreto", "1605": "Mariscal Ramón Castilla", "1606": "Putumayo",
  "1607": "Requena", "1608": "Ucayali",
  "1701": "Tambopata", "1702": "Manu", "1703": "Tahuamanu",
  "1801": "Mariscal Nieto", "1802": "General Sánchez Cerro", "1803": "Ilo",
  "1901": "Pasco", "1902": "Daniel Alcides Carrión", "1903": "Oxapampa",
  "2001": "Piura", "2005": "Paita", "2006": "Sullana", "2007": "Talara", "2008": "Sechura",
  "2101": "Puno", "2102": "Azángaro", "2104": "Chucuito", "2105": "El Collao",
  "2106": "Huancané", "2107": "Lampa", "2108": "Melgar", "2109": "Moho",
  "2110": "San Antonio de Putina", "2111": "San Román", "2113": "Yunguyo",
  "2201": "Moyobamba", "2202": "Bellavista", "2203": "El Dorado",
  "2204": "Huallaga", "2205": "Lamas", "2206": "Mariscal Cáceres",
  "2207": "Picota", "2208": "Rioja", "2209": "San Martín", "2210": "Toache",
  "2501": "Coronel Portillo", "2502": "Atalaya", "2503": "Padre Abad", "2504": "Purús",
  "2301": "Tacna", "2302": "Candarave", "2303": "Jorge Basadre", "2304": "Tarata",
  "2401": "Tumbes", "2402": "Contralmirante Villar", "2403": "Zarumilla",
};

const byProvince = {};
for (const d of districts) {
  const provCode = d.ubigeo.substring(0, 4);
  if (!byProvince[provCode]) byProvince[provCode] = [];
  byProvince[provCode].push(d);
}

const neededProvinceCodes = Object.keys(byProvince)
  .filter((code) => !provincesAlreadyDone.has(code))
  .sort();

function isProvinceAllSelva(provCode) {
  const deptCode = provCode.substring(0, 2);
  if (fullSelvaDepartments.has(deptCode)) return true;
  if (fullSelvaProvinces.has(provCode)) return true;
  return false;
}

function escapeName(name) {
  return name.replace(/'/g, "\\'");
}

let output = "";
output += "// ============================================================\n";
output += "// AUTO-GENERATED INEI UBIGEO DISTRICT DATA\n";
output += "// Source: Official INEI data (RitchieRD/ubigeos-peru-data, 2026)\n";
output += "// Total provinces: " + neededProvinceCodes.length + "\n";
output += "// ============================================================\n\n";

let currentDept = "";
let deptOrder = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25",
];

let totalCount = 0;
let provCount = 0;

for (const deptCode of deptOrder) {
  const provsInDept = neededProvinceCodes.filter((c) => c.startsWith(deptCode));
  if (provsInDept.length === 0) continue;

  const deptName = deptNames[deptCode] || `Dept ${deptCode}`;
  output += `  // ==========================================\n`;
  output += `  // ${deptName.toUpperCase()} (${deptCode})\n`;
  output += `  // ==========================================\n`;

  for (const provCode of provsInDept) {
    const provDistricts = byProvince[provCode];
    if (!provDistricts) continue;
    
    provDistricts.sort((a, b) => a.ubigeo.localeCompare(b.ubigeo));
    
    const allSelva = isProvinceAllSelva(provCode);
    const provName = provNames[provCode] || `Province ${provCode}`;
    
    output += `  // ${provName}\n`;
    output += `  "${provCode}": [\n`;
    
    for (const d of provDistricts) {
      const name = toTitleCase(d.distrito);
      const code = d.ubigeo;
      output += `    { name: "${escapeName(name)}", code: "${code}", isSelva: ${allSelva} },\n`;
      totalCount++;
    }
    
    output += `  ],\n\n`;
    provCount++;
  }
}

output += `// TOTAL: ${provCount} provinces, ${totalCount} districts\n`;

writeFileSync(
  "/Users/master/Documents/DATACODEV/10_KATSUMOTO/docs/new_districts_data.txt",
  output,
  "utf-8"
);

console.log(`Generated ${provCount} provinces with ${totalCount} districts`);
console.log(`Output written to docs/new_districts_data.txt`);

const missingFromSource = [];
const allNeeded = new Set(neededProvinceCodes);
for (const code of Object.keys(provNames)) {
  if (!provincesAlreadyDone.has(code) && !byProvince[code]) {
    missingFromSource.push(code + " (" + provNames[code] + ")");
  }
}
if (missingFromSource.length > 0) {
  console.log("\nWARNING: These provinces were expected but not found in source data:");
  missingFromSource.forEach((m) => console.log("  - " + m));
}

const extraInSource = neededProvinceCodes.filter((c) => !provNames[c]);
if (extraInSource.length > 0) {
  console.log("\nNOTE: These province codes found in source but not in our province list:");
  extraInSource.forEach((c) => console.log("  - " + c));
}
