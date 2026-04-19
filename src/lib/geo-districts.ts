import type { GeoDistrict } from "./types";

interface DistrictData {
  name: string;
  code: string;
  isSelva: boolean;
}

const PARTIAL_DISTRICTS: Record<string, DistrictData[]> = {
  // ==========================================
  // AMAZONAS (01)
  // ==========================================
  "0101": [
      { name: "Chachapoyas", code: "010101", isSelva: true },
      { name: "Asunción", code: "010102", isSelva: true },
      { name: "Balsas", code: "010103", isSelva: true },
      { name: "Cheto", code: "010104", isSelva: true },
      { name: "Chiliquín", code: "010105", isSelva: true },
      { name: "Chuquibamba", code: "010106", isSelva: true },
      { name: "Granada", code: "010107", isSelva: true },
      { name: "Huancas", code: "010108", isSelva: true },
      { name: "La Jalca", code: "010109", isSelva: true },
      { name: "Leimebamba", code: "010110", isSelva: true },
      { name: "Levanto", code: "010111", isSelva: true },
      { name: "Magdalena", code: "010112", isSelva: true },
      { name: "Mariscal Castilla", code: "010113", isSelva: true },
      { name: "Molinopampa", code: "010114", isSelva: true },
      { name: "Montevideo", code: "010115", isSelva: true },
      { name: "Olleros", code: "010116", isSelva: true },
      { name: "Quinjalca", code: "010117", isSelva: true },
      { name: "San Francisco de Daguas", code: "010118", isSelva: true },
      { name: "San Isidro de Maino", code: "010119", isSelva: true },
      { name: "Soloco", code: "010120", isSelva: true },
      { name: "Sonche", code: "010121", isSelva: true },
    ],

  "0102": [
      { name: "Bagua", code: "010201", isSelva: true },
      { name: "Aramango", code: "010202", isSelva: true },
      { name: "Copallín", code: "010203", isSelva: true },
      { name: "El Parco", code: "010204", isSelva: true },
      { name: "Imaza", code: "010205", isSelva: true },
      { name: "La Peca", code: "010206", isSelva: true },
    ],

  "0103": [
      { name: "Jumbilla", code: "010301", isSelva: true },
      { name: "Chisquilla", code: "010302", isSelva: true },
      { name: "Churuja", code: "010303", isSelva: true },
      { name: "Corosha", code: "010304", isSelva: true },
      { name: "Cuispes", code: "010305", isSelva: true },
      { name: "Florida", code: "010306", isSelva: true },
      { name: "Jazán", code: "010307", isSelva: true },
      { name: "Recta", code: "010308", isSelva: true },
      { name: "San Carlos", code: "010309", isSelva: true },
      { name: "Shipasbamba", code: "010310", isSelva: true },
      { name: "Valera", code: "010311", isSelva: true },
      { name: "Yambrasbamba", code: "010312", isSelva: true },
    ],

  "0104": [
      { name: "Nieva", code: "010401", isSelva: true },
      { name: "El Cenepa", code: "010402", isSelva: true },
      { name: "Rio Santiago", code: "010403", isSelva: true },
    ],

  "0105": [
      { name: "Lamud", code: "010501", isSelva: true },
      { name: "Camporredondo", code: "010502", isSelva: true },
      { name: "Cocabamba", code: "010503", isSelva: true },
      { name: "Colcamar", code: "010504", isSelva: true },
      { name: "Conila", code: "010505", isSelva: true },
      { name: "Inguilpata", code: "010506", isSelva: true },
      { name: "Longuita", code: "010507", isSelva: true },
      { name: "Lonya Chico", code: "010508", isSelva: true },
      { name: "Luya", code: "010509", isSelva: true },
      { name: "Luya Viejo", code: "010510", isSelva: true },
      { name: "María", code: "010511", isSelva: true },
      { name: "Ocalli", code: "010512", isSelva: true },
      { name: "Ocumal", code: "010513", isSelva: true },
      { name: "Pisuquia", code: "010514", isSelva: true },
      { name: "Providencia", code: "010515", isSelva: true },
      { name: "San Cristóbal", code: "010516", isSelva: true },
      { name: "San Francisco del Yeso", code: "010517", isSelva: true },
      { name: "San Jerónimo", code: "010518", isSelva: true },
      { name: "San Juan de Lopecancha", code: "010519", isSelva: true },
      { name: "Santa Catalina", code: "010520", isSelva: true },
      { name: "Santo Tomás", code: "010521", isSelva: true },
      { name: "Tingo", code: "010522", isSelva: true },
      { name: "Trita", code: "010523", isSelva: true },
    ],

  "0106": [
      { name: "San Nicolas", code: "010601", isSelva: true },
      { name: "Chirimoto", code: "010602", isSelva: true },
      { name: "Cochamal", code: "010603", isSelva: true },
      { name: "Huambo", code: "010604", isSelva: true },
      { name: "Limabamba", code: "010605", isSelva: true },
      { name: "Longar", code: "010606", isSelva: true },
      { name: "Mariscal Benavides", code: "010607", isSelva: true },
      { name: "Milpuc", code: "010608", isSelva: true },
      { name: "Omia", code: "010609", isSelva: true },
      { name: "Santa Rosa", code: "010610", isSelva: true },
      { name: "Totora", code: "010611", isSelva: true },
      { name: "Vista Alegre", code: "010612", isSelva: true },
    ],

  "0107": [
      { name: "Bagua Grande", code: "010701", isSelva: true },
      { name: "Cajaruro", code: "010702", isSelva: true },
      { name: "Cumba", code: "010703", isSelva: true },
      { name: "El Milagro", code: "010704", isSelva: true },
      { name: "Jamalca", code: "010705", isSelva: true },
      { name: "Lonya Grande", code: "010706", isSelva: true },
      { name: "Yamon", code: "010707", isSelva: true },
    ],


  // ==========================================
  // ÁNCASH (02)
  // ==========================================
  "0201": [
      { name: "Huaraz", code: "020101", isSelva: false },
      { name: "Cochabamba", code: "020102", isSelva: false },
      { name: "Colcabamba", code: "020103", isSelva: false },
      { name: "Huanchay", code: "020104", isSelva: false },
      { name: "Independencia", code: "020105", isSelva: false },
      { name: "Jangas", code: "020106", isSelva: false },
      { name: "La Libertad", code: "020107", isSelva: false },
      { name: "Olleros", code: "020108", isSelva: false },
      { name: "Pampas", code: "020109", isSelva: false },
      { name: "Pariacoto", code: "020110", isSelva: false },
      { name: "Pira", code: "020111", isSelva: false },
      { name: "Tarica", code: "020112", isSelva: false },
    ],

  "0202": [
      { name: "Aija", code: "020201", isSelva: false },
      { name: "Coris", code: "020202", isSelva: false },
      { name: "Huacllan", code: "020203", isSelva: false },
      { name: "La Merced", code: "020204", isSelva: false },
      { name: "Succha", code: "020205", isSelva: false },
    ],

  "0203": [
    { name: "Llamellín", code: "020301", isSelva: false },
    { name: "Aczo", code: "020302", isSelva: false },
    { name: "Chaccho", code: "020303", isSelva: false },
    { name: "Chiquián", code: "020304", isSelva: false },
    { name: "La Primavera", code: "020305", isSelva: true },
    { name: "Mirgas", code: "020306", isSelva: false },
    { name: "San Juan de Rontoy", code: "020307", isSelva: false }
  ],

  "0204": [
    { name: "Chacas", code: "020401", isSelva: true },
    { name: "Acochaca", code: "020402", isSelva: true }
  ],

  "0205": [
      { name: "Chiquian", code: "020501", isSelva: false },
      { name: "Abelardo Pardo Lezameta", code: "020502", isSelva: false },
      { name: "Antonio Raymondi", code: "020503", isSelva: false },
      { name: "Aquia", code: "020504", isSelva: false },
      { name: "Cajacay", code: "020505", isSelva: false },
      { name: "Canis", code: "020506", isSelva: false },
      { name: "Colquioc", code: "020507", isSelva: false },
      { name: "Huallanca", code: "020508", isSelva: false },
      { name: "Huasta", code: "020509", isSelva: false },
      { name: "Huayllacayan", code: "020510", isSelva: false },
      { name: "La Primavera", code: "020511", isSelva: false },
      { name: "Mangas", code: "020512", isSelva: false },
      { name: "Pacllon", code: "020513", isSelva: false },
      { name: "San Miguel de Corpanqui", code: "020514", isSelva: false },
      { name: "Ticllos", code: "020515", isSelva: false },
    ],

  "0206": [
      { name: "Carhuaz", code: "020601", isSelva: false },
      { name: "Acopampa", code: "020602", isSelva: false },
      { name: "Amashca", code: "020603", isSelva: false },
      { name: "Anta", code: "020604", isSelva: false },
      { name: "Ataquero", code: "020605", isSelva: false },
      { name: "Marcara", code: "020606", isSelva: false },
      { name: "Pariahuanca", code: "020607", isSelva: false },
      { name: "San Miguel de Aco", code: "020608", isSelva: false },
      { name: "Shilla", code: "020609", isSelva: false },
      { name: "Tinco", code: "020610", isSelva: false },
      { name: "Yungar", code: "020611", isSelva: false },
    ],

  "0207": [
    { name: "San Luis", code: "020701", isSelva: true },
    { name: "San Nicolás", code: "020702", isSelva: true },
    { name: "Yauya", code: "020703", isSelva: true }
  ],

  "0208": [
      { name: "Casma", code: "020801", isSelva: false },
      { name: "Buena Vista Alta", code: "020802", isSelva: false },
      { name: "Comandante Noel", code: "020803", isSelva: false },
      { name: "Yautan", code: "020804", isSelva: false },
    ],

  "0209": [
    { name: "Corongo", code: "020901", isSelva: true },
    { name: "Aco", code: "020902", isSelva: true },
    { name: "Bambas", code: "020903", isSelva: true },
    { name: "Cusca", code: "020904", isSelva: true },
    { name: "La Pampa", code: "020905", isSelva: true },
    { name: "San Pedro", code: "020906", isSelva: true },
    { name: "Yánac", code: "020907", isSelva: true }
  ],

  "0210": [
    { name: "Huari", code: "021001", isSelva: false },
    { name: "Anra", code: "021002", isSelva: false },
    { name: "Cajay", code: "021003", isSelva: false },
    { name: "Chavín de Huantar", code: "021004", isSelva: false },
    { name: "Huacchis", code: "021005", isSelva: false },
    { name: "Huacatinaco", code: "021006", isSelva: false },
    { name: "Huantar", code: "021007", isSelva: false },
    { name: "Masín", code: "021008", isSelva: false },
    { name: "Pontó", code: "021009", isSelva: false },
    { name: "Rahuapampa", code: "021010", isSelva: false },
    { name: "Rapayán", code: "021011", isSelva: false },
    { name: "San Marcos", code: "021012", isSelva: false },
    { name: "San Pedro de Chana", code: "021013", isSelva: false },
    { name: "Uco", code: "021014", isSelva: false },
    { name: "Huachis", code: "021015", isSelva: false },
    { name: "Cajas", code: "021016", isSelva: true }
  ],

  "0211": [
      { name: "Huarmey", code: "021101", isSelva: false },
      { name: "Cochapeti", code: "021102", isSelva: false },
      { name: "Culebras", code: "021103", isSelva: false },
      { name: "Huayan", code: "021104", isSelva: false },
      { name: "Malvas", code: "021105", isSelva: false },
    ],

  "0212": [
      { name: "Caraz", code: "021201", isSelva: false },
      { name: "Huallanca", code: "021202", isSelva: false },
      { name: "Huata", code: "021203", isSelva: false },
      { name: "Huaylas", code: "021204", isSelva: false },
      { name: "Mato", code: "021205", isSelva: false },
      { name: "Pamparomas", code: "021206", isSelva: false },
      { name: "Pueblo Libre", code: "021207", isSelva: false },
      { name: "Santa Cruz", code: "021208", isSelva: false },
      { name: "Santo Toribio", code: "021209", isSelva: false },
      { name: "Yuracmarca", code: "021210", isSelva: false },
    ],

  "0213": [
    { name: "Piscobamba", code: "021301", isSelva: true },
    { name: "Casca", code: "021302", isSelva: true },
    { name: "Eleazar Guzmán Barrón", code: "021303", isSelva: true },
    { name: "Fidel Olivas Escudero", code: "021304", isSelva: true },
    { name: "Llama", code: "021305", isSelva: true },
    { name: "Lluclla", code: "021306", isSelva: true },
    { name: "Lucma", code: "021307", isSelva: true },
    { name: "Musga", code: "021308", isSelva: true }
  ],

  "0214": [
      { name: "Ocros", code: "021401", isSelva: false },
      { name: "Acas", code: "021402", isSelva: false },
      { name: "Cajamarquilla", code: "021403", isSelva: false },
      { name: "Carhuapampa", code: "021404", isSelva: false },
      { name: "Cochas", code: "021405", isSelva: false },
      { name: "Congas", code: "021406", isSelva: false },
      { name: "Llipa", code: "021407", isSelva: false },
      { name: "San Cristóbal de Rajan", code: "021408", isSelva: false },
      { name: "San Pedro", code: "021409", isSelva: false },
      { name: "Santiago de Chilcas", code: "021410", isSelva: false },
    ],

  "0215": [
    { name: "Cabana", code: "021501", isSelva: true },
    { name: "Bolognesi", code: "021502", isSelva: true },
    { name: "Conchucos", code: "021503", isSelva: true },
    { name: "Huacaschuque", code: "021504", isSelva: true },
    { name: "Huandoval", code: "021505", isSelva: true },
    { name: "Lacabamba", code: "021506", isSelva: true },
    { name: "Llapo", code: "021507", isSelva: true },
    { name: "Pallasca", code: "021508", isSelva: true },
    { name: "Santa Rosa", code: "021509", isSelva: true },
    { name: "Tauca", code: "021510", isSelva: true }
  ],

  "0216": [
    { name: "Pomabamba", code: "021601", isSelva: true },
    { name: "Huayllán", code: "021602", isSelva: true },
    { name: "Parobamba", code: "021603", isSelva: true },
    { name: "Quinuabamba", code: "021604", isSelva: true }
  ],

  "0217": [
      { name: "Recuay", code: "021701", isSelva: false },
      { name: "Catac", code: "021702", isSelva: false },
      { name: "Cotaparaco", code: "021703", isSelva: false },
      { name: "Huayllapampa", code: "021704", isSelva: false },
      { name: "Llacllin", code: "021705", isSelva: false },
      { name: "Marca", code: "021706", isSelva: false },
      { name: "Pampas Chico", code: "021707", isSelva: false },
      { name: "Pararin", code: "021708", isSelva: false },
      { name: "Tapacocha", code: "021709", isSelva: false },
      { name: "Ticapampa", code: "021710", isSelva: false },
    ],

  "0218": [
      { name: "Chimbote", code: "021801", isSelva: false },
      { name: "Cáceres del Peru", code: "021802", isSelva: false },
      { name: "Coishco", code: "021803", isSelva: false },
      { name: "Macate", code: "021804", isSelva: false },
      { name: "Moro", code: "021805", isSelva: false },
      { name: "Nepeña", code: "021806", isSelva: false },
      { name: "Samanco", code: "021807", isSelva: false },
      { name: "Santa", code: "021808", isSelva: false },
      { name: "Nuevo Chimbote", code: "021809", isSelva: false },
    ],

  "0219": [
    { name: "Sihuas", code: "021901", isSelva: true },
    { name: "Acobamba", code: "021902", isSelva: true },
    { name: "Alfonso Ugarte", code: "021903", isSelva: true },
    { name: "Cashapampa", code: "021904", isSelva: true },
    { name: "Chingalpo", code: "021905", isSelva: true },
    { name: "Huayllabamba", code: "021906", isSelva: true },
    { name: "Quiches", code: "021907", isSelva: true },
    { name: "Ragash", code: "021908", isSelva: true },
    { name: "San Juan", code: "021909", isSelva: true },
    { name: "Yacsac", code: "021910", isSelva: true }
  ],

  "0220": [
      { name: "Yungay", code: "022001", isSelva: false },
      { name: "Cascapara", code: "022002", isSelva: false },
      { name: "Mancos", code: "022003", isSelva: false },
      { name: "Matacoto", code: "022004", isSelva: false },
      { name: "Quillo", code: "022005", isSelva: false },
      { name: "Ranrahirca", code: "022006", isSelva: false },
      { name: "Shupluy", code: "022007", isSelva: false },
      { name: "Yanama", code: "022008", isSelva: false },
    ],


  // ==========================================
  // APURÍMAC (03)
  // ==========================================
  "0301": [
      { name: "Abancay", code: "030101", isSelva: false },
      { name: "Chacoche", code: "030102", isSelva: false },
      { name: "Circa", code: "030103", isSelva: false },
      { name: "Curahuasi", code: "030104", isSelva: false },
      { name: "Huanipaca", code: "030105", isSelva: false },
      { name: "Lambrama", code: "030106", isSelva: false },
      { name: "Pichirhua", code: "030107", isSelva: false },
      { name: "San Pedro de Cachora", code: "030108", isSelva: false },
      { name: "Tamburco", code: "030109", isSelva: false },
    ],

  "0302": [
    { name: "Andahuaylas", code: "030201", isSelva: true },
    { name: "Andarapa", code: "030202", isSelva: true },
    { name: "Chiara", code: "030203", isSelva: true },
    { name: "Huancarama", code: "030204", isSelva: true },
    { name: "Huancaray", code: "030205", isSelva: true },
    { name: "Huayana", code: "030206", isSelva: true },
    { name: "Kishuara", code: "030207", isSelva: true },
    { name: "Pacobamba", code: "030208", isSelva: true },
    { name: "Pampachiri", code: "030209", isSelva: true },
    { name: "Pomacocha", code: "030210", isSelva: true },
    { name: "San Antonio de Cachi", code: "030211", isSelva: true },
    { name: "San Jerónimo", code: "030212", isSelva: true },
    { name: "San José de Ushpa", code: "030213", isSelva: true },
    { name: "San Miguel de Achchi", code: "030214", isSelva: true },
    { name: "Santa María de Chicmo", code: "030215", isSelva: true },
    { name: "Talavera", code: "030216", isSelva: true },
    { name: "Tumay Huaraca", code: "030217", isSelva: true },
    { name: "Turpo", code: "030218", isSelva: true },
    { name: "Kaquiabamba", code: "030219", isSelva: true }
  ],

  "0303": [
      { name: "Antabamba", code: "030301", isSelva: false },
      { name: "El Oro", code: "030302", isSelva: false },
      { name: "Huaquirca", code: "030303", isSelva: false },
      { name: "Juan Espinoza Medrano", code: "030304", isSelva: false },
      { name: "Oropesa", code: "030305", isSelva: false },
      { name: "Pachaconas", code: "030306", isSelva: false },
      { name: "Sabaino", code: "030307", isSelva: false },
    ],

  "0304": [
      { name: "Chalhuanca", code: "030401", isSelva: false },
      { name: "Capaya", code: "030402", isSelva: false },
      { name: "Caraybamba", code: "030403", isSelva: false },
      { name: "Chapimarca", code: "030404", isSelva: false },
      { name: "Colcabamba", code: "030405", isSelva: false },
      { name: "Cotaruse", code: "030406", isSelva: false },
      { name: "Huayllo", code: "030407", isSelva: false },
      { name: "Justo Apu Sahuaraura", code: "030408", isSelva: false },
      { name: "Lucre", code: "030409", isSelva: false },
      { name: "Pocohuanca", code: "030410", isSelva: false },
      { name: "San Juan de Chacña", code: "030411", isSelva: false },
      { name: "Sañayca", code: "030412", isSelva: false },
      { name: "Soraya", code: "030413", isSelva: false },
      { name: "Tapairihua", code: "030414", isSelva: false },
      { name: "Tintay", code: "030415", isSelva: false },
      { name: "Toraya", code: "030416", isSelva: false },
      { name: "Yanaca", code: "030417", isSelva: false },
    ],

  "0305": [
      { name: "Tambobamba", code: "030501", isSelva: false },
      { name: "Cotabambas", code: "030502", isSelva: false },
      { name: "Coyllurqui", code: "030503", isSelva: false },
      { name: "Haquira", code: "030504", isSelva: false },
      { name: "Mara", code: "030505", isSelva: false },
      { name: "Challhuahuacho", code: "030506", isSelva: false },
    ],

  "0306": [
    { name: "Chincheros", code: "030601", isSelva: true },
    { name: "Anco-Huallo", code: "030602", isSelva: true },
    { name: "Cocharcas", code: "030603", isSelva: true },
    { name: "Huaccana", code: "030604", isSelva: true },
    { name: "Ocobamba", code: "030605", isSelva: true },
    { name: "Ongoy", code: "030606", isSelva: true },
    { name: "San Juan de Rontoy", code: "030607", isSelva: true },
    { name: "Uranmarca", code: "030608", isSelva: true },
    { name: "Ranracancha", code: "030609", isSelva: true }
  ],

  "0307": [
      { name: "Chuquibambilla", code: "030701", isSelva: false },
      { name: "Curpahuasi", code: "030702", isSelva: false },
      { name: "Gamarra", code: "030703", isSelva: false },
      { name: "Huayllati", code: "030704", isSelva: false },
      { name: "Mamara", code: "030705", isSelva: false },
      { name: "Micaela Bastidas", code: "030706", isSelva: false },
      { name: "Pataypampa", code: "030707", isSelva: false },
      { name: "Progreso", code: "030708", isSelva: false },
      { name: "San Antonio", code: "030709", isSelva: false },
      { name: "Santa Rosa", code: "030710", isSelva: false },
      { name: "Turpay", code: "030711", isSelva: false },
      { name: "Vilcabamba", code: "030712", isSelva: false },
      { name: "Virundo", code: "030713", isSelva: false },
      { name: "Curasco", code: "030714", isSelva: false },
    ],


  // ==========================================
  // AREQUIPA (04)
  // ==========================================
  "0401": [
      { name: "Arequipa", code: "040101", isSelva: false },
      { name: "Alto Selva Alegre", code: "040102", isSelva: false },
      { name: "Cayma", code: "040103", isSelva: false },
      { name: "Cerro Colorado", code: "040104", isSelva: false },
      { name: "Characato", code: "040105", isSelva: false },
      { name: "Chiguata", code: "040106", isSelva: false },
      { name: "Jacobo Hunter", code: "040107", isSelva: false },
      { name: "La Joya", code: "040108", isSelva: false },
      { name: "Mariano Melgar", code: "040109", isSelva: false },
      { name: "Miraflores", code: "040110", isSelva: false },
      { name: "Mollebaya", code: "040111", isSelva: false },
      { name: "Paucarpata", code: "040112", isSelva: false },
      { name: "Pocsi", code: "040113", isSelva: false },
      { name: "Polobaya", code: "040114", isSelva: false },
      { name: "Quequeña", code: "040115", isSelva: false },
      { name: "Sabandia", code: "040116", isSelva: false },
      { name: "Sachaca", code: "040117", isSelva: false },
      { name: "San Juan de Siguas", code: "040118", isSelva: false },
      { name: "San Juan de Tarucani", code: "040119", isSelva: false },
      { name: "Santa Isabel de Siguas", code: "040120", isSelva: false },
      { name: "Santa Rita de Siguas", code: "040121", isSelva: false },
      { name: "Socabaya", code: "040122", isSelva: false },
      { name: "Tiabaya", code: "040123", isSelva: false },
      { name: "Uchumayo", code: "040124", isSelva: false },
      { name: "Vitor", code: "040125", isSelva: false },
      { name: "Yanahuara", code: "040126", isSelva: false },
      { name: "Yarabamba", code: "040127", isSelva: false },
      { name: "Yura", code: "040128", isSelva: false },
      { name: "José Luis Bustamante y Rivero", code: "040129", isSelva: false },
    ],

  "0402": [
      { name: "Camana", code: "040201", isSelva: false },
      { name: "José María Quimper", code: "040202", isSelva: false },
      { name: "Mariano Nicolas Valcarcel", code: "040203", isSelva: false },
      { name: "Mariscal Cáceres", code: "040204", isSelva: false },
      { name: "Nicolas de Pierola", code: "040205", isSelva: false },
      { name: "Ocoña", code: "040206", isSelva: false },
      { name: "Quilca", code: "040207", isSelva: false },
      { name: "Samuel Pastor", code: "040208", isSelva: false },
    ],

  "0403": [
      { name: "Caraveli", code: "040301", isSelva: false },
      { name: "Acari", code: "040302", isSelva: false },
      { name: "Atico", code: "040303", isSelva: false },
      { name: "Atiquipa", code: "040304", isSelva: false },
      { name: "Bella Union", code: "040305", isSelva: false },
      { name: "Cahuacho", code: "040306", isSelva: false },
      { name: "Chala", code: "040307", isSelva: false },
      { name: "Chaparra", code: "040308", isSelva: false },
      { name: "Huanuhuanu", code: "040309", isSelva: false },
      { name: "Jaqui", code: "040310", isSelva: false },
      { name: "Lomas", code: "040311", isSelva: false },
      { name: "Quicacha", code: "040312", isSelva: false },
      { name: "Yauca", code: "040313", isSelva: false },
    ],

  "0404": [
      { name: "Aplao", code: "040401", isSelva: false },
      { name: "Andagua", code: "040402", isSelva: false },
      { name: "Ayo", code: "040403", isSelva: false },
      { name: "Chachas", code: "040404", isSelva: false },
      { name: "Chilcaymarca", code: "040405", isSelva: false },
      { name: "Choco", code: "040406", isSelva: false },
      { name: "Huancarqui", code: "040407", isSelva: false },
      { name: "Machaguay", code: "040408", isSelva: false },
      { name: "Orcopampa", code: "040409", isSelva: false },
      { name: "Pampacolca", code: "040410", isSelva: false },
      { name: "Tipan", code: "040411", isSelva: false },
      { name: "Uñon", code: "040412", isSelva: false },
      { name: "Uraca", code: "040413", isSelva: false },
      { name: "Viraco", code: "040414", isSelva: false },
    ],

  "0405": [
      { name: "Chivay", code: "040501", isSelva: false },
      { name: "Achoma", code: "040502", isSelva: false },
      { name: "Cabanaconde", code: "040503", isSelva: false },
      { name: "Callalli", code: "040504", isSelva: false },
      { name: "Caylloma", code: "040505", isSelva: false },
      { name: "Coporaque", code: "040506", isSelva: false },
      { name: "Huambo", code: "040507", isSelva: false },
      { name: "Huanca", code: "040508", isSelva: false },
      { name: "Ichupampa", code: "040509", isSelva: false },
      { name: "Lari", code: "040510", isSelva: false },
      { name: "Lluta", code: "040511", isSelva: false },
      { name: "Maca", code: "040512", isSelva: false },
      { name: "Madrigal", code: "040513", isSelva: false },
      { name: "San Antonio de Chuca", code: "040514", isSelva: false },
      { name: "Sibayo", code: "040515", isSelva: false },
      { name: "Tapay", code: "040516", isSelva: false },
      { name: "Tisco", code: "040517", isSelva: false },
      { name: "Tuti", code: "040518", isSelva: false },
      { name: "Yanque", code: "040519", isSelva: false },
      { name: "Majes", code: "040520", isSelva: false },
    ],

  "0406": [
      { name: "Chuquibamba", code: "040601", isSelva: false },
      { name: "Andaray", code: "040602", isSelva: false },
      { name: "Cayarani", code: "040603", isSelva: false },
      { name: "Chichas", code: "040604", isSelva: false },
      { name: "Iray", code: "040605", isSelva: false },
      { name: "Rio Grande", code: "040606", isSelva: false },
      { name: "Salamanca", code: "040607", isSelva: false },
      { name: "Yanaquihua", code: "040608", isSelva: false },
    ],

  "0407": [
      { name: "Mollendo", code: "040701", isSelva: false },
      { name: "Cocachacra", code: "040702", isSelva: false },
      { name: "Dean Valdivia", code: "040703", isSelva: false },
      { name: "Islay", code: "040704", isSelva: false },
      { name: "Mejia", code: "040705", isSelva: false },
      { name: "Punta de Bombon", code: "040706", isSelva: false },
    ],

  "0408": [
      { name: "Cotahuasi", code: "040801", isSelva: false },
      { name: "Alca", code: "040802", isSelva: false },
      { name: "Charcana", code: "040803", isSelva: false },
      { name: "Huaynacotas", code: "040804", isSelva: false },
      { name: "Pampamarca", code: "040805", isSelva: false },
      { name: "Puyca", code: "040806", isSelva: false },
      { name: "Quechualla", code: "040807", isSelva: false },
      { name: "Sayla", code: "040808", isSelva: false },
      { name: "Tauria", code: "040809", isSelva: false },
      { name: "Tomepampa", code: "040810", isSelva: false },
      { name: "Toro", code: "040811", isSelva: false },
    ],


  // ==========================================
  // AYACUCHO (05)
  // ==========================================
  "0501": [
      { name: "Ayacucho", code: "050101", isSelva: false },
      { name: "Acocro", code: "050102", isSelva: false },
      { name: "Acos Vinchos", code: "050103", isSelva: false },
      { name: "Carmen Alto", code: "050104", isSelva: false },
      { name: "Chiara", code: "050105", isSelva: false },
      { name: "Ocros", code: "050106", isSelva: false },
      { name: "Pacaycasa", code: "050107", isSelva: false },
      { name: "Quinua", code: "050108", isSelva: false },
      { name: "San José de Ticllas", code: "050109", isSelva: false },
      { name: "San Juan Bautista", code: "050110", isSelva: false },
      { name: "Santiago de Pischa", code: "050111", isSelva: false },
      { name: "Socos", code: "050112", isSelva: false },
      { name: "Tambillo", code: "050113", isSelva: false },
      { name: "Vinchos", code: "050114", isSelva: false },
      { name: "Jesus Nazareno", code: "050115", isSelva: false },
      { name: "Andrés Avelino Cáceres Dorregaray", code: "050116", isSelva: false },
    ],

  "0502": [
    { name: "Cangallo", code: "050201", isSelva: true },
    { name: "Chuschi", code: "050202", isSelva: true },
    { name: "Coronel Castañeda", code: "050203", isSelva: true },
    { name: "Huaccana", code: "050204", isSelva: true },
    { name: "Huaya", code: "050205", isSelva: true },
    { name: "Los Morochucos", code: "050206", isSelva: true },
    { name: "María Parado de Bellido", code: "050207", isSelva: true },
    { name: "Paras", code: "050208", isSelva: true },
    { name: "Totos", code: "050209", isSelva: true }
  ],

  "0503": [
      { name: "Sancos", code: "050301", isSelva: false },
      { name: "Carapo", code: "050302", isSelva: false },
      { name: "Sacsamarca", code: "050303", isSelva: false },
      { name: "Santiago de Lucanamarca", code: "050304", isSelva: false },
    ],

  "0504": [
    { name: "Huanta", code: "050401", isSelva: false },
    { name: "Ayahuanco", code: "050402", isSelva: false },
    { name: "Huamanguilla", code: "050403", isSelva: false },
    { name: "Iguaín", code: "050404", isSelva: false },
    { name: "Luricocha", code: "050405", isSelva: true },
    { name: "Llamas", code: "050406", isSelva: false },
    { name: "Canayre", code: "050407", isSelva: true },
    { name: "Pucacolpa", code: "050408", isSelva: true },
    { name: "Putis", code: "050409", isSelva: false }
  ],

  "0505": [
    { name: "San Miguel", code: "050501", isSelva: false },
    { name: "Anco", code: "050502", isSelva: true },
    { name: "Ayna", code: "050503", isSelva: true },
    { name: "Chilcas", code: "050504", isSelva: false },
    { name: "Chungui", code: "050505", isSelva: true },
    { name: "Louis de Sousa", code: "050506", isSelva: true },
    { name: "Santa Rosa", code: "050507", isSelva: true },
    { name: "Tambo", code: "050508", isSelva: true },
    { name: "Pichari", code: "050509", isSelva: true }
  ],

  "0506": [
      { name: "Puquio", code: "050601", isSelva: false },
      { name: "Aucara", code: "050602", isSelva: false },
      { name: "Cabana", code: "050603", isSelva: false },
      { name: "Carmen Salcedo", code: "050604", isSelva: false },
      { name: "Chaviña", code: "050605", isSelva: false },
      { name: "Chipao", code: "050606", isSelva: false },
      { name: "Huac-Huas", code: "050607", isSelva: false },
      { name: "Laramate", code: "050608", isSelva: false },
      { name: "Leoncio Prado", code: "050609", isSelva: false },
      { name: "Llauta", code: "050610", isSelva: false },
      { name: "Lucanas", code: "050611", isSelva: false },
      { name: "Ocaña", code: "050612", isSelva: false },
      { name: "Otoca", code: "050613", isSelva: false },
      { name: "Saisa", code: "050614", isSelva: false },
      { name: "San Cristóbal", code: "050615", isSelva: false },
      { name: "San Juan", code: "050616", isSelva: false },
      { name: "San Pedro", code: "050617", isSelva: false },
      { name: "San Pedro de Palco", code: "050618", isSelva: false },
      { name: "Sancos", code: "050619", isSelva: false },
      { name: "Santa Ana de Huaycahuacho", code: "050620", isSelva: false },
      { name: "Santa Lucia", code: "050621", isSelva: false },
    ],

  "0507": [
      { name: "Coracora", code: "050701", isSelva: false },
      { name: "Chumpi", code: "050702", isSelva: false },
      { name: "Coronel Castañeda", code: "050703", isSelva: false },
      { name: "Pacapausa", code: "050704", isSelva: false },
      { name: "Pullo", code: "050705", isSelva: false },
      { name: "Puyusca", code: "050706", isSelva: false },
      { name: "San Francisco de Ravacayco", code: "050707", isSelva: false },
      { name: "Upahuacho", code: "050708", isSelva: false },
    ],

  "0508": [
      { name: "Pausa", code: "050801", isSelva: false },
      { name: "Colta", code: "050802", isSelva: false },
      { name: "Corculla", code: "050803", isSelva: false },
      { name: "Lampa", code: "050804", isSelva: false },
      { name: "Marcabamba", code: "050805", isSelva: false },
      { name: "Oyolo", code: "050806", isSelva: false },
      { name: "Pararca", code: "050807", isSelva: false },
      { name: "San Javier de Alpabamba", code: "050808", isSelva: false },
      { name: "San José de Ushua", code: "050809", isSelva: false },
      { name: "Sara Sara", code: "050810", isSelva: false },
    ],

  "0509": [
      { name: "Querobamba", code: "050901", isSelva: false },
      { name: "Belén", code: "050902", isSelva: false },
      { name: "Chalcos", code: "050903", isSelva: false },
      { name: "Chilcayoc", code: "050904", isSelva: false },
      { name: "Huacaña", code: "050905", isSelva: false },
      { name: "Morcolla", code: "050906", isSelva: false },
      { name: "Paico", code: "050907", isSelva: false },
      { name: "San Pedro de Larcay", code: "050908", isSelva: false },
      { name: "San Salvador de Quije", code: "050909", isSelva: false },
      { name: "Santiago de Paucaray", code: "050910", isSelva: false },
      { name: "Soras", code: "050911", isSelva: false },
    ],

  "0510": [
      { name: "Huancapi", code: "051001", isSelva: false },
      { name: "Alcamenca", code: "051002", isSelva: false },
      { name: "Apongo", code: "051003", isSelva: false },
      { name: "Asquipata", code: "051004", isSelva: false },
      { name: "Canaria", code: "051005", isSelva: false },
      { name: "Cayara", code: "051006", isSelva: false },
      { name: "Colca", code: "051007", isSelva: false },
      { name: "Huamanquiquia", code: "051008", isSelva: false },
      { name: "Huancaraylla", code: "051009", isSelva: false },
      { name: "Huaya", code: "051010", isSelva: false },
      { name: "Sarhua", code: "051011", isSelva: false },
      { name: "Vilcanchos", code: "051012", isSelva: false },
    ],

  "0511": [
      { name: "Vilcas Huaman", code: "051101", isSelva: false },
      { name: "Accomarca", code: "051102", isSelva: false },
      { name: "Carhuanca", code: "051103", isSelva: false },
      { name: "Concepcion", code: "051104", isSelva: false },
      { name: "Huambalpa", code: "051105", isSelva: false },
      { name: "Independencia", code: "051106", isSelva: false },
      { name: "Saurama", code: "051107", isSelva: false },
      { name: "Vischongo", code: "051108", isSelva: false },
    ],


  // ==========================================
  // CAJAMARCA (06)
  // ==========================================
  "0601": [
      { name: "Cajamarca", code: "060101", isSelva: false },
      { name: "Asunción", code: "060102", isSelva: false },
      { name: "Chetilla", code: "060103", isSelva: false },
      { name: "Cospan", code: "060104", isSelva: false },
      { name: "Encañada", code: "060105", isSelva: false },
      { name: "Jesus", code: "060106", isSelva: false },
      { name: "Llacanora", code: "060107", isSelva: false },
      { name: "Los Baños del Inca", code: "060108", isSelva: false },
      { name: "Magdalena", code: "060109", isSelva: false },
      { name: "Matara", code: "060110", isSelva: false },
      { name: "Namora", code: "060111", isSelva: false },
      { name: "San Juan", code: "060112", isSelva: false },
    ],

  "0602": [
      { name: "Cajabamba", code: "060201", isSelva: false },
      { name: "Cachachi", code: "060202", isSelva: false },
      { name: "Condebamba", code: "060203", isSelva: false },
      { name: "Sitacocha", code: "060204", isSelva: false },
    ],

  "0603": [
      { name: "Celendin", code: "060301", isSelva: false },
      { name: "Chumuch", code: "060302", isSelva: false },
      { name: "Cortegana", code: "060303", isSelva: false },
      { name: "Huasmin", code: "060304", isSelva: false },
      { name: "Jorge Chavez", code: "060305", isSelva: false },
      { name: "José Galvez", code: "060306", isSelva: false },
      { name: "Miguel Iglesias", code: "060307", isSelva: false },
      { name: "Oxamarca", code: "060308", isSelva: false },
      { name: "Sorochuco", code: "060309", isSelva: false },
      { name: "Sucre", code: "060310", isSelva: false },
      { name: "Utco", code: "060311", isSelva: false },
      { name: "La Libertad de Pallan", code: "060312", isSelva: false },
    ],

  "0604": [
      { name: "Chota", code: "060401", isSelva: false },
      { name: "Anguia", code: "060402", isSelva: false },
      { name: "Chadin", code: "060403", isSelva: false },
      { name: "Chiguirip", code: "060404", isSelva: false },
      { name: "Chimban", code: "060405", isSelva: false },
      { name: "Choropampa", code: "060406", isSelva: false },
      { name: "Cochabamba", code: "060407", isSelva: false },
      { name: "Conchan", code: "060408", isSelva: false },
      { name: "Huambos", code: "060409", isSelva: false },
      { name: "Lajas", code: "060410", isSelva: false },
      { name: "Llama", code: "060411", isSelva: false },
      { name: "Miracosta", code: "060412", isSelva: false },
      { name: "Paccha", code: "060413", isSelva: false },
      { name: "Pion", code: "060414", isSelva: false },
      { name: "Querocoto", code: "060415", isSelva: false },
      { name: "San Juan de Licupis", code: "060416", isSelva: false },
      { name: "Tacabamba", code: "060417", isSelva: false },
      { name: "Tocmoche", code: "060418", isSelva: false },
      { name: "Chalamarca", code: "060419", isSelva: false },
    ],

  "0605": [
      { name: "Contumaza", code: "060501", isSelva: false },
      { name: "Chilete", code: "060502", isSelva: false },
      { name: "Cupisnique", code: "060503", isSelva: false },
      { name: "Guzmango", code: "060504", isSelva: false },
      { name: "San Benito", code: "060505", isSelva: false },
      { name: "Santa Cruz de Toledo", code: "060506", isSelva: false },
      { name: "Tantarica", code: "060507", isSelva: false },
      { name: "Yonan", code: "060508", isSelva: false },
    ],

  "0606": [
      { name: "Cutervo", code: "060601", isSelva: false },
      { name: "Callayuc", code: "060602", isSelva: false },
      { name: "Choros", code: "060603", isSelva: false },
      { name: "Cujillo", code: "060604", isSelva: false },
      { name: "La Ramada", code: "060605", isSelva: false },
      { name: "Pimpingos", code: "060606", isSelva: false },
      { name: "Querocotillo", code: "060607", isSelva: false },
      { name: "San Andrés de Cutervo", code: "060608", isSelva: false },
      { name: "San Juan de Cutervo", code: "060609", isSelva: false },
      { name: "San Luis de Lucma", code: "060610", isSelva: false },
      { name: "Santa Cruz", code: "060611", isSelva: false },
      { name: "Santo Domingo de la Capilla", code: "060612", isSelva: false },
      { name: "Santo Tomás", code: "060613", isSelva: false },
      { name: "Socota", code: "060614", isSelva: false },
      { name: "Toribio Casanova", code: "060615", isSelva: false },
    ],

  "0607": [
      { name: "Bambamarca", code: "060701", isSelva: false },
      { name: "Chugur", code: "060702", isSelva: false },
      { name: "Hualgayoc", code: "060703", isSelva: false },
    ],

  "0608": [
    { name: "Jaén", code: "060801", isSelva: false },
    { name: "Bellavista", code: "060802", isSelva: true },
    { name: "Chontalí", code: "060803", isSelva: true },
    { name: "Colasay", code: "060804", isSelva: true },
    { name: "Huabal", code: "060805", isSelva: false },
    { name: "Las Pirias", code: "060806", isSelva: true },
    { name: "Pomahuaca", code: "060807", isSelva: true },
    { name: "Pucará", code: "060808", isSelva: true },
    { name: "Sallique", code: "060809", isSelva: false },
    { name: "San Felipe", code: "060810", isSelva: true },
    { name: "San José del Alto", code: "060811", isSelva: true },
    { name: "Santa Rosa", code: "060812", isSelva: true }
  ],

  "0609": [
    { name: "San Ignacio de la Frontera", code: "060901", isSelva: true },
    { name: "Chirinos", code: "060902", isSelva: true },
    { name: "Huarango", code: "060903", isSelva: true },
    { name: "La Coipa", code: "060904", isSelva: true },
    { name: "Namballe", code: "060905", isSelva: true },
    { name: "El Limo", code: "060906", isSelva: false },
    { name: "San José de Lourdes", code: "060907", isSelva: true },
    { name: "Tabaconas", code: "060908", isSelva: false },
    { name: "El Eje", code: "060909", isSelva: false }
  ],

  "0610": [
      { name: "Pedro Galvez", code: "061001", isSelva: false },
      { name: "Chancay", code: "061002", isSelva: false },
      { name: "Eduardo Villanueva", code: "061003", isSelva: false },
      { name: "Gregorio Pita", code: "061004", isSelva: false },
      { name: "Ichocan", code: "061005", isSelva: false },
      { name: "José Manuel Quiroz", code: "061006", isSelva: false },
      { name: "José Sabogal", code: "061007", isSelva: false },
    ],

  "0611": [
      { name: "San Miguel", code: "061101", isSelva: false },
      { name: "Bolivar", code: "061102", isSelva: false },
      { name: "Calquis", code: "061103", isSelva: false },
      { name: "Catilluc", code: "061104", isSelva: false },
      { name: "El Prado", code: "061105", isSelva: false },
      { name: "La Florida", code: "061106", isSelva: false },
      { name: "Llapa", code: "061107", isSelva: false },
      { name: "Nanchoc", code: "061108", isSelva: false },
      { name: "Niepos", code: "061109", isSelva: false },
      { name: "San Gregorio", code: "061110", isSelva: false },
      { name: "San Silvestre de Cochan", code: "061111", isSelva: false },
      { name: "Tongod", code: "061112", isSelva: false },
      { name: "Union Agua Blanca", code: "061113", isSelva: false },
    ],

  "0612": [
      { name: "San Pablo", code: "061201", isSelva: false },
      { name: "San Bernardino", code: "061202", isSelva: false },
      { name: "San Luis", code: "061203", isSelva: false },
      { name: "Tumbaden", code: "061204", isSelva: false },
    ],

  "0613": [
      { name: "Santa Cruz", code: "061301", isSelva: false },
      { name: "Andabamba", code: "061302", isSelva: false },
      { name: "Catache", code: "061303", isSelva: false },
      { name: "Chancaybaños", code: "061304", isSelva: false },
      { name: "La Esperanza", code: "061305", isSelva: false },
      { name: "Ninabamba", code: "061306", isSelva: false },
      { name: "Pulan", code: "061307", isSelva: false },
      { name: "Saucepampa", code: "061308", isSelva: false },
      { name: "Sexi", code: "061309", isSelva: false },
      { name: "Uticyacu", code: "061310", isSelva: false },
      { name: "Yauyucan", code: "061311", isSelva: false },
    ],


  // ==========================================
  // CALLAO (07)
  // ==========================================
  "0701": [
      { name: "Callao", code: "070101", isSelva: false },
      { name: "Bellavista", code: "070102", isSelva: false },
      { name: "Carmen de la Legua Reynoso", code: "070103", isSelva: false },
      { name: "La Perla", code: "070104", isSelva: false },
      { name: "La Punta", code: "070105", isSelva: false },
      { name: "Ventanilla", code: "070106", isSelva: false },
      { name: "Mi Peru", code: "070107", isSelva: false },
    ],


  // ==========================================
  // CUSCO (08)
  // ==========================================
  "0801": [
      { name: "Cusco", code: "080101", isSelva: false },
      { name: "Ccorca", code: "080102", isSelva: false },
      { name: "Poroy", code: "080103", isSelva: false },
      { name: "San Jerónimo", code: "080104", isSelva: false },
      { name: "San Sebastian", code: "080105", isSelva: false },
      { name: "Santiago", code: "080106", isSelva: false },
      { name: "Saylla", code: "080107", isSelva: false },
      { name: "Wanchaq", code: "080108", isSelva: false },
    ],

  "0802": [
      { name: "Acomayo", code: "080201", isSelva: false },
      { name: "Acopia", code: "080202", isSelva: false },
      { name: "Acos", code: "080203", isSelva: false },
      { name: "Mosoc Llacta", code: "080204", isSelva: false },
      { name: "Pomacanchi", code: "080205", isSelva: false },
      { name: "Rondocan", code: "080206", isSelva: false },
      { name: "Sangarara", code: "080207", isSelva: false },
    ],

  "0803": [
      { name: "Anta", code: "080301", isSelva: false },
      { name: "Ancahuasi", code: "080302", isSelva: false },
      { name: "Cachimayo", code: "080303", isSelva: false },
      { name: "Chinchaypujio", code: "080304", isSelva: false },
      { name: "Huarocondo", code: "080305", isSelva: false },
      { name: "Limatambo", code: "080306", isSelva: false },
      { name: "Mollepata", code: "080307", isSelva: false },
      { name: "Pucyura", code: "080308", isSelva: false },
      { name: "Zurite", code: "080309", isSelva: false },
    ],

  "0804": [
    { name: "Calca", code: "080401", isSelva: false },
    { name: "Coya", code: "080402", isSelva: true },
    { name: "Lamay", code: "080403", isSelva: false },
    { name: "Lares", code: "080404", isSelva: true },
    { name: "Pisac", code: "080405", isSelva: false },
    { name: "San Salvador", code: "080406", isSelva: false },
    { name: "Taray", code: "080407", isSelva: false },
    { name: "Huarán", code: "080408", isSelva: true }
  ],

  "0805": [
      { name: "Yanaoca", code: "080501", isSelva: false },
      { name: "Checca", code: "080502", isSelva: false },
      { name: "Kunturkanki", code: "080503", isSelva: false },
      { name: "Langui", code: "080504", isSelva: false },
      { name: "Layo", code: "080505", isSelva: false },
      { name: "Pampamarca", code: "080506", isSelva: false },
      { name: "Quehue", code: "080507", isSelva: false },
      { name: "Tupac Amaru", code: "080508", isSelva: false },
    ],

  "0806": [
      { name: "Sicuani", code: "080601", isSelva: false },
      { name: "Checacupe", code: "080602", isSelva: false },
      { name: "Combapata", code: "080603", isSelva: false },
      { name: "Marangani", code: "080604", isSelva: false },
      { name: "Pitumarca", code: "080605", isSelva: false },
      { name: "San Pablo", code: "080606", isSelva: false },
      { name: "San Pedro", code: "080607", isSelva: false },
      { name: "Tinta", code: "080608", isSelva: false },
    ],

  "0807": [
      { name: "Santo Tomás", code: "080701", isSelva: false },
      { name: "Capacmarca", code: "080702", isSelva: false },
      { name: "Chamaca", code: "080703", isSelva: false },
      { name: "Colquemarca", code: "080704", isSelva: false },
      { name: "Livitaca", code: "080705", isSelva: false },
      { name: "Llusco", code: "080706", isSelva: false },
      { name: "Quiñota", code: "080707", isSelva: false },
      { name: "Velille", code: "080708", isSelva: false },
    ],

  "0808": [
      { name: "Espinar", code: "080801", isSelva: false },
      { name: "Condoroma", code: "080802", isSelva: false },
      { name: "Coporaque", code: "080803", isSelva: false },
      { name: "Ocoruro", code: "080804", isSelva: false },
      { name: "Pallpata", code: "080805", isSelva: false },
      { name: "Pichigua", code: "080806", isSelva: false },
      { name: "Suyckutambo", code: "080807", isSelva: false },
      { name: "Alto Pichigua", code: "080808", isSelva: false },
    ],

  "0809": [
      { name: "Santa Ana", code: "080901", isSelva: true },
      { name: "Echarate", code: "080902", isSelva: true },
      { name: "Huayopata", code: "080903", isSelva: true },
      { name: "Maranura", code: "080904", isSelva: true },
      { name: "Ocobamba", code: "080905", isSelva: true },
      { name: "Quellouno", code: "080906", isSelva: true },
      { name: "Quimbiri", code: "080907", isSelva: true },
      { name: "Santa Teresa", code: "080908", isSelva: true },
      { name: "Vilcabamba", code: "080909", isSelva: true },
      { name: "Pichari", code: "080910", isSelva: true },
      { name: "Inkawasi", code: "080911", isSelva: true },
      { name: "Villa Virgen", code: "080912", isSelva: true },
      { name: "Villa Kintiarina", code: "080913", isSelva: true },
      { name: "Megantoni", code: "080914", isSelva: true },
      { name: "Kumpirushiato", code: "080915", isSelva: true },
      { name: "Cielo Punco", code: "080916", isSelva: true },
      { name: "Manitea", code: "080917", isSelva: true },
      { name: "Union Asháninka", code: "080918", isSelva: true },
    ],

  "0810": [
      { name: "Paruro", code: "081001", isSelva: false },
      { name: "Accha", code: "081002", isSelva: false },
      { name: "Ccapi", code: "081003", isSelva: false },
      { name: "Colcha", code: "081004", isSelva: false },
      { name: "Huanoquite", code: "081005", isSelva: false },
      { name: "Omacha", code: "081006", isSelva: false },
      { name: "Paccaritambo", code: "081007", isSelva: false },
      { name: "Pillpinto", code: "081008", isSelva: false },
      { name: "Yaurisque", code: "081009", isSelva: false },
    ],

  "0811": [
    { name: "Paucartambo", code: "081101", isSelva: false },
    { name: "Caicay", code: "081102", isSelva: false },
    { name: "Challabamba", code: "081103", isSelva: true },
    { name: "Colquepata", code: "081104", isSelva: false },
    { name: "Huancarani", code: "081105", isSelva: false },
    { name: "Pillcopata", code: "081106", isSelva: true }
  ],

  "0812": [
    { name: "Urcos", code: "081201", isSelva: false },
    { name: "Andahuaylillas", code: "081202", isSelva: false },
    { name: "Camanti", code: "081203", isSelva: true },
    { name: "Ccatca", code: "081204", isSelva: false },
    { name: "Cusipata", code: "081205", isSelva: false },
    { name: "Huaro", code: "081206", isSelva: false },
    { name: "Lucre", code: "081207", isSelva: false },
    { name: "Marcapata", code: "081208", isSelva: true },
    { name: "Ocongate", code: "081209", isSelva: false },
    { name: "Oropesa", code: "081210", isSelva: false },
    { name: "Quiquijana", code: "081211", isSelva: false }
  ],

  "0813": [
    { name: "Urubamba", code: "081301", isSelva: false },
    { name: "Chinchero", code: "081302", isSelva: false },
    { name: "Huayllabamba", code: "081303", isSelva: false },
    { name: "Machupicchu", code: "081304", isSelva: true },
    { name: "Maras", code: "081305", isSelva: false },
    { name: "Ollantaytambo", code: "081306", isSelva: false },
    { name: "Yucay", code: "081307", isSelva: false }
  ],


  // ==========================================
  // HUANCAVELICA (09)
  // ==========================================
  "0901": [
      { name: "Huancavelica", code: "090101", isSelva: false },
      { name: "Acobambilla", code: "090102", isSelva: false },
      { name: "Acoria", code: "090103", isSelva: false },
      { name: "Conayca", code: "090104", isSelva: false },
      { name: "Cuenca", code: "090105", isSelva: false },
      { name: "Huachocolpa", code: "090106", isSelva: false },
      { name: "Huayllahuara", code: "090107", isSelva: false },
      { name: "Izcuchaca", code: "090108", isSelva: false },
      { name: "Laria", code: "090109", isSelva: false },
      { name: "Manta", code: "090110", isSelva: false },
      { name: "Mariscal Cáceres", code: "090111", isSelva: false },
      { name: "Moya", code: "090112", isSelva: false },
      { name: "Nuevo Occoro", code: "090113", isSelva: false },
      { name: "Palca", code: "090114", isSelva: false },
      { name: "Pilchaca", code: "090115", isSelva: false },
      { name: "Vilca", code: "090116", isSelva: false },
      { name: "Yauli", code: "090117", isSelva: false },
      { name: "Ascension", code: "090118", isSelva: false },
      { name: "Huando", code: "090119", isSelva: false },
    ],

  "0902": [
      { name: "Acobamba", code: "090201", isSelva: false },
      { name: "Andabamba", code: "090202", isSelva: false },
      { name: "Anta", code: "090203", isSelva: false },
      { name: "Caja", code: "090204", isSelva: false },
      { name: "Marcas", code: "090205", isSelva: false },
      { name: "Paucara", code: "090206", isSelva: false },
      { name: "Pomacocha", code: "090207", isSelva: false },
      { name: "Rosario", code: "090208", isSelva: false },
    ],

  "0903": [
      { name: "Lircay", code: "090301", isSelva: false },
      { name: "Anchonga", code: "090302", isSelva: false },
      { name: "Callanmarca", code: "090303", isSelva: false },
      { name: "Ccochaccasa", code: "090304", isSelva: false },
      { name: "Chincho", code: "090305", isSelva: false },
      { name: "Congalla", code: "090306", isSelva: false },
      { name: "Huanca-Huanca", code: "090307", isSelva: false },
      { name: "Huayllay Grande", code: "090308", isSelva: false },
      { name: "Julcamarca", code: "090309", isSelva: false },
      { name: "San Antonio de Antaparco", code: "090310", isSelva: false },
      { name: "Santo Tomás de Pata", code: "090311", isSelva: false },
      { name: "Secclla", code: "090312", isSelva: false },
    ],

  "0904": [
      { name: "Castrovirreyna", code: "090401", isSelva: false },
      { name: "Arma", code: "090402", isSelva: false },
      { name: "Aurahua", code: "090403", isSelva: false },
      { name: "Capillas", code: "090404", isSelva: false },
      { name: "Chupamarca", code: "090405", isSelva: false },
      { name: "Cocas", code: "090406", isSelva: false },
      { name: "Huachos", code: "090407", isSelva: false },
      { name: "Huamatambo", code: "090408", isSelva: false },
      { name: "Mollepampa", code: "090409", isSelva: false },
      { name: "San Juan", code: "090410", isSelva: false },
      { name: "Santa Ana", code: "090411", isSelva: false },
      { name: "Tantara", code: "090412", isSelva: false },
      { name: "Ticrapo", code: "090413", isSelva: false },
    ],

  "0905": [
      { name: "Churcampa", code: "090501", isSelva: false },
      { name: "Anco", code: "090502", isSelva: false },
      { name: "Chinchihuasi", code: "090503", isSelva: false },
      { name: "El Carmen", code: "090504", isSelva: false },
      { name: "La Merced", code: "090505", isSelva: false },
      { name: "Locroja", code: "090506", isSelva: false },
      { name: "Paucarbamba", code: "090507", isSelva: false },
      { name: "San Miguel de Mayocc", code: "090508", isSelva: false },
      { name: "San Pedro de Coris", code: "090509", isSelva: false },
      { name: "Pachamarca", code: "090510", isSelva: false },
      { name: "Cosme", code: "090511", isSelva: false },
    ],

  "0906": [
      { name: "Huaytara", code: "090601", isSelva: false },
      { name: "Ayavi", code: "090602", isSelva: false },
      { name: "Cordova", code: "090603", isSelva: false },
      { name: "Huayacundo Arma", code: "090604", isSelva: false },
      { name: "Laramarca", code: "090605", isSelva: false },
      { name: "Ocoyo", code: "090606", isSelva: false },
      { name: "Pilpichaca", code: "090607", isSelva: false },
      { name: "Querco", code: "090608", isSelva: false },
      { name: "Quito-Arma", code: "090609", isSelva: false },
      { name: "San Antonio de Cusicancha", code: "090610", isSelva: false },
      { name: "San Francisco de Sangayaico", code: "090611", isSelva: false },
      { name: "San Isidro", code: "090612", isSelva: false },
      { name: "Santiago de Chocorvos", code: "090613", isSelva: false },
      { name: "Santiago de Quirahuara", code: "090614", isSelva: false },
      { name: "Santo Domingo de Capillas", code: "090615", isSelva: false },
      { name: "Tambo", code: "090616", isSelva: false },
    ],

  "0907": [
    { name: "Pampas", code: "090701", isSelva: false },
    { name: "Acostambo", code: "090702", isSelva: false },
    { name: "Acos", code: "090703", isSelva: false },
    { name: "Ahualá", code: "090704", isSelva: false },
    { name: "Colcabamba", code: "090705", isSelva: false },
    { name: "Daniel Cárdenas", code: "090706", isSelva: false },
    { name: "Huachocolpa", code: "090707", isSelva: false },
    { name: "Huaribamba", code: "090708", isSelva: false },
    { name: "Ñahuimpuquio", code: "090709", isSelva: false },
    { name: "Pazos", code: "090710", isSelva: false },
    { name: "Quishuar", code: "090711", isSelva: false },
    { name: "Santiago de Tucuma", code: "090712", isSelva: false },
    { name: "Santo Domingo de Capillas", code: "090713", isSelva: false },
    { name: "Surcubamba", code: "090714", isSelva: false },
    { name: "Tayacaja", code: "090715", isSelva: false },
    { name: "Yauli", code: "090716", isSelva: false },
    { name: "Purísima", code: "090717", isSelva: false },
    { name: "Ccollpas", code: "090718", isSelva: true },
    { name: "Santiago de Quirahuara", code: "090719", isSelva: true },
    { name: "Pichihua", code: "090720", isSelva: true },
    { name: "Andaymarca", code: "090721", isSelva: false },
    { name: "Chinchihuasi", code: "090722", isSelva: false },
    { name: "Cochabamba", code: "090723", isSelva: false },
    { name: "Heroinas Toledo", code: "090724", isSelva: false },
    { name: "Marcavalle", code: "090725", isSelva: false },
    { name: "Mulambullo", code: "090726", isSelva: false },
    { name: "Ocroy Mauli", code: "090727", isSelva: false },
    { name: "Pampas Tayacaja", code: "090728", isSelva: false },
    { name: "Salcabamba", code: "090729", isSelva: false },
    { name: "Santo Domingo", code: "090730", isSelva: false },
    { name: "Tocrapata", code: "090731", isSelva: true },
    { name: "Chinquilinay", code: "090732", isSelva: false },
    { name: "Huayllay", code: "090733", isSelva: false },
    { name: "Laria", code: "090734", isSelva: false },
    { name: "Pampas", code: "090735", isSelva: false }
  ],

  "1001": [
    { name: "Huánuco", code: "100101", isSelva: false },
    { name: "Amarilis", code: "100102", isSelva: false },
    { name: "Chinchao", code: "100103", isSelva: true },
    { name: "Churubamba", code: "100104", isSelva: true },
    { name: "Margos", code: "100105", isSelva: false },
    { name: "Quisqui", code: "100106", isSelva: true },
    { name: "San Francisco de Cayrán", code: "100107", isSelva: false },
    { name: "San Pedro de Chaulán", code: "100108", isSelva: true },
    { name: "Santa María del Valle", code: "100109", isSelva: true },
    { name: "Shunco", code: "100110", isSelva: false },
    { name: "Sinchao", code: "100111", isSelva: false },
    { name: "Yarumayo", code: "100112", isSelva: true }
  ],


  // ==========================================
  // HUÁNUCO (10)
  // ==========================================
  "1002": [
      { name: "Ambo", code: "100201", isSelva: false },
      { name: "Cayna", code: "100202", isSelva: false },
      { name: "Colpas", code: "100203", isSelva: false },
      { name: "Conchamarca", code: "100204", isSelva: false },
      { name: "Huacar", code: "100205", isSelva: false },
      { name: "San Francisco", code: "100206", isSelva: false },
      { name: "San Rafael", code: "100207", isSelva: false },
      { name: "Tomay Kichwa", code: "100208", isSelva: false },
    ],

  "1003": [
      { name: "La Union", code: "100301", isSelva: false },
      { name: "Chuquis", code: "100307", isSelva: false },
      { name: "Marias", code: "100311", isSelva: false },
      { name: "Pachas", code: "100313", isSelva: false },
      { name: "Quivilla", code: "100316", isSelva: false },
      { name: "Ripan", code: "100317", isSelva: false },
      { name: "Shunqui", code: "100321", isSelva: false },
      { name: "Sillapata", code: "100322", isSelva: false },
      { name: "Yanas", code: "100323", isSelva: false },
    ],

  "1004": [
    { name: "Huacaybamba", code: "100401", isSelva: false },
    { name: "Cochabamba", code: "100402", isSelva: false },
    { name: "Pinra", code: "100403", isSelva: true }
  ],

  "1005": [
    { name: "Llata", code: "100501", isSelva: false },
    { name: "Arancay", code: "100502", isSelva: true },
    { name: "Chavinillo", code: "100503", isSelva: false },
    { name: "Jacas Grande", code: "100504", isSelva: false },
    { name: "Jirki", code: "100505", isSelva: false },
    { name: "Miraflores", code: "100506", isSelva: false },
    { name: "Monzón", code: "100507", isSelva: true },
    { name: "Punchao", code: "100508", isSelva: false },
    { name: "Puños", code: "100509", isSelva: false },
    { name: "Singa", code: "100510", isSelva: false },
    { name: "Tantamayo", code: "100511", isSelva: false },
    { name: "Baños", code: "100512", isSelva: true }
  ],

  "1006": [
      { name: "Rupa-Rupa", code: "100601", isSelva: true },
      { name: "Daniel Alomias Robles", code: "100602", isSelva: true },
      { name: "Hermilio Valdizan", code: "100603", isSelva: true },
      { name: "José Crespo y Castillo", code: "100604", isSelva: true },
      { name: "Luyando", code: "100605", isSelva: true },
      { name: "Mariano Damaso Beraun", code: "100606", isSelva: true },
      { name: "Pucayacu", code: "100607", isSelva: true },
      { name: "Castillo Grande", code: "100608", isSelva: true },
      { name: "Pueblo Nuevo", code: "100609", isSelva: true },
      { name: "Santo Domingo de Anda", code: "100610", isSelva: true },
    ],

  "1007": [
    { name: "Huacrachucho", code: "100701", isSelva: true },
    { name: "Cholón", code: "100702", isSelva: true },
    { name: "San Buenaventura", code: "100703", isSelva: true },
    { name: "Buenos Aires", code: "100704", isSelva: false },
    { name: "Pinra", code: "100705", isSelva: false },
    { name: "San Marcos", code: "100706", isSelva: false },
    { name: "Rondos", code: "100707", isSelva: false }
  ],

  "1008": [
    { name: "Panao", code: "100801", isSelva: false },
    { name: "Chaglla", code: "100802", isSelva: true },
    { name: "Molino", code: "100803", isSelva: true },
    { name: "Umari", code: "100804", isSelva: true },
    { name: "San Pablo de Pillao", code: "100805", isSelva: true }
  ],

  "1009": [
      { name: "Puerto Inca", code: "100901", isSelva: true },
      { name: "Codo del Pozuzo", code: "100902", isSelva: true },
      { name: "Honoria", code: "100903", isSelva: true },
      { name: "Tournavista", code: "100904", isSelva: true },
      { name: "Yuyapichis", code: "100905", isSelva: true },
    ],

  "1010": [
    { name: "Jesús", code: "101001", isSelva: true },
    { name: "Baños", code: "101002", isSelva: true },
    { name: "Jivia", code: "101003", isSelva: true },
    { name: "Queropalca", code: "101004", isSelva: true },
    { name: "Rondos", code: "101005", isSelva: true },
    { name: "San Francisco de Asís", code: "101006", isSelva: true },
    { name: "San Miguel de Cauri", code: "101007", isSelva: true }
  ],

  "1011": [
      { name: "Chavinillo", code: "101101", isSelva: false },
      { name: "Cahuac", code: "101102", isSelva: false },
      { name: "Chacabamba", code: "101103", isSelva: false },
      { name: "Aparicio Pomares", code: "101104", isSelva: false },
      { name: "Jacas Chico", code: "101105", isSelva: false },
      { name: "Obas", code: "101106", isSelva: false },
      { name: "Pampamarca", code: "101107", isSelva: false },
      { name: "Choras", code: "101108", isSelva: false },
    ],


  // ==========================================
  // ICA (11)
  // ==========================================
  "1101": [
      { name: "Ica", code: "110101", isSelva: false },
      { name: "La Tinguiña", code: "110102", isSelva: false },
      { name: "Los Aquijes", code: "110103", isSelva: false },
      { name: "Ocucaje", code: "110104", isSelva: false },
      { name: "Pachacutec", code: "110105", isSelva: false },
      { name: "Parcona", code: "110106", isSelva: false },
      { name: "Pueblo Nuevo", code: "110107", isSelva: false },
      { name: "Salas", code: "110108", isSelva: false },
      { name: "San José de los Molinos", code: "110109", isSelva: false },
      { name: "San Juan Bautista", code: "110110", isSelva: false },
      { name: "Santiago", code: "110111", isSelva: false },
      { name: "Subtanjalla", code: "110112", isSelva: false },
      { name: "Tate", code: "110113", isSelva: false },
      { name: "Yauca del Rosario", code: "110114", isSelva: false },
    ],

  "1102": [
      { name: "Chincha Alta", code: "110201", isSelva: false },
      { name: "Alto Laran", code: "110202", isSelva: false },
      { name: "Chavin", code: "110203", isSelva: false },
      { name: "Chincha Baja", code: "110204", isSelva: false },
      { name: "El Carmen", code: "110205", isSelva: false },
      { name: "Grocio Prado", code: "110206", isSelva: false },
      { name: "Pueblo Nuevo", code: "110207", isSelva: false },
      { name: "San Juan de Yanac", code: "110208", isSelva: false },
      { name: "San Pedro de Huacarpana", code: "110209", isSelva: false },
      { name: "Sunampe", code: "110210", isSelva: false },
      { name: "Tambo de Mora", code: "110211", isSelva: false },
    ],

  "1103": [
      { name: "Nazca", code: "110301", isSelva: false },
      { name: "Changuillo", code: "110302", isSelva: false },
      { name: "El Ingenio", code: "110303", isSelva: false },
      { name: "Marcona", code: "110304", isSelva: false },
      { name: "Vista Alegre", code: "110305", isSelva: false },
    ],

  "1104": [
      { name: "Palpa", code: "110401", isSelva: false },
      { name: "Llipata", code: "110402", isSelva: false },
      { name: "Rio Grande", code: "110403", isSelva: false },
      { name: "Santa Cruz", code: "110404", isSelva: false },
      { name: "Tibillo", code: "110405", isSelva: false },
    ],

  "1105": [
      { name: "Pisco", code: "110501", isSelva: false },
      { name: "Huancano", code: "110502", isSelva: false },
      { name: "Humay", code: "110503", isSelva: false },
      { name: "Independencia", code: "110504", isSelva: false },
      { name: "Paracas", code: "110505", isSelva: false },
      { name: "San Andrés", code: "110506", isSelva: false },
      { name: "San Clemente", code: "110507", isSelva: false },
      { name: "Tupac Amaru Inca", code: "110508", isSelva: false },
    ],


  // ==========================================
  // JUNÍN (12)
  // ==========================================
  "1201": [
      { name: "Huancayo", code: "120101", isSelva: false },
      { name: "Carhuacallanga", code: "120104", isSelva: false },
      { name: "Chacapampa", code: "120105", isSelva: false },
      { name: "Chicche", code: "120106", isSelva: false },
      { name: "Chilca", code: "120107", isSelva: false },
      { name: "Chongos Alto", code: "120108", isSelva: false },
      { name: "Chupuro", code: "120111", isSelva: false },
      { name: "Colca", code: "120112", isSelva: false },
      { name: "Cullhuas", code: "120113", isSelva: false },
      { name: "El Tambo", code: "120114", isSelva: false },
      { name: "Huacrapuquio", code: "120116", isSelva: false },
      { name: "Hualhuas", code: "120117", isSelva: false },
      { name: "Huancan", code: "120119", isSelva: false },
      { name: "Huasicancha", code: "120120", isSelva: false },
      { name: "Huayucachi", code: "120121", isSelva: false },
      { name: "Ingenio", code: "120122", isSelva: false },
      { name: "Pariahuanca", code: "120124", isSelva: false },
      { name: "Pilcomayo", code: "120125", isSelva: false },
      { name: "Pucara", code: "120126", isSelva: false },
      { name: "Quichuay", code: "120127", isSelva: false },
      { name: "Quilcas", code: "120128", isSelva: false },
      { name: "San Agustin", code: "120129", isSelva: false },
      { name: "San Jerónimo de Tunan", code: "120130", isSelva: false },
      { name: "Saño", code: "120132", isSelva: false },
      { name: "Sapallanga", code: "120133", isSelva: false },
      { name: "Sicaya", code: "120134", isSelva: false },
      { name: "Santo Domingo de Acobamba", code: "120135", isSelva: false },
      { name: "Viques", code: "120136", isSelva: false },
    ],

  "1202": [
    { name: "Concepción", code: "120201", isSelva: false },
    { name: "Aco", code: "120202", isSelva: true },
    { name: "Andamarca", code: "120203", isSelva: false },
    { name: "Comas", code: "120204", isSelva: true },
    { name: "Chambará", code: "120205", isSelva: true },
    { name: "Heroínas Toledo", code: "120206", isSelva: true },
    { name: "Manzanares", code: "120207", isSelva: true },
    { name: "Mariscal Castilla", code: "120208", isSelva: true },
    { name: "Matahuasi", code: "120209", isSelva: false },
    { name: "Mito", code: "120210", isSelva: false },
    { name: "Ninacaca", code: "120211", isSelva: false },
    { name: "Orcotuna", code: "120212", isSelva: false },
    { name: "San José de Quero", code: "120213", isSelva: false },
    { name: "San Lorenzo", code: "120214", isSelva: true }
  ],

  "1203": [
      { name: "Chanchamayo", code: "120301", isSelva: true },
      { name: "Perene", code: "120302", isSelva: true },
      { name: "Pichanaqui", code: "120303", isSelva: true },
      { name: "San Luis de Shuaro", code: "120304", isSelva: true },
      { name: "San Ramón", code: "120305", isSelva: true },
      { name: "Vitoc", code: "120306", isSelva: true },
    ],

  "1204": [
      { name: "Jauja", code: "120401", isSelva: false },
      { name: "Acolla", code: "120402", isSelva: false },
      { name: "Apata", code: "120403", isSelva: false },
      { name: "Ataura", code: "120404", isSelva: false },
      { name: "Canchayllo", code: "120405", isSelva: false },
      { name: "Curicaca", code: "120406", isSelva: false },
      { name: "El Mantaro", code: "120407", isSelva: false },
      { name: "Huamali", code: "120408", isSelva: false },
      { name: "Huaripampa", code: "120409", isSelva: false },
      { name: "Huertas", code: "120410", isSelva: false },
      { name: "Janjaillo", code: "120411", isSelva: false },
      { name: "Julcan", code: "120412", isSelva: false },
      { name: "Leonor Ordoñez", code: "120413", isSelva: false },
      { name: "Llocllapampa", code: "120414", isSelva: false },
      { name: "Marco", code: "120415", isSelva: false },
      { name: "Masma", code: "120416", isSelva: false },
      { name: "Masma Chicche", code: "120417", isSelva: false },
      { name: "Molinos", code: "120418", isSelva: false },
      { name: "Monobamba", code: "120419", isSelva: false },
      { name: "Muqui", code: "120420", isSelva: false },
      { name: "Muquiyauyo", code: "120421", isSelva: false },
      { name: "Paca", code: "120422", isSelva: false },
      { name: "Paccha", code: "120423", isSelva: false },
      { name: "Pancan", code: "120424", isSelva: false },
      { name: "Parco", code: "120425", isSelva: false },
      { name: "Pomacancha", code: "120426", isSelva: false },
      { name: "Ricran", code: "120427", isSelva: false },
      { name: "San Lorenzo", code: "120428", isSelva: false },
      { name: "San Pedro de Chunan", code: "120429", isSelva: false },
      { name: "Sausa", code: "120430", isSelva: false },
      { name: "Sincos", code: "120431", isSelva: false },
      { name: "Tunan Marca", code: "120432", isSelva: false },
      { name: "Yauli", code: "120433", isSelva: false },
      { name: "Yauyos", code: "120434", isSelva: false },
    ],

  "1205": [
      { name: "Junin", code: "120501", isSelva: false },
      { name: "Carhuamayo", code: "120502", isSelva: false },
      { name: "Ondores", code: "120503", isSelva: false },
      { name: "Ulcumayo", code: "120504", isSelva: false },
    ],

  "1206": [
      { name: "Satipo", code: "120601", isSelva: true },
      { name: "Coviriali", code: "120602", isSelva: true },
      { name: "Llaylla", code: "120603", isSelva: true },
      { name: "Mazamari", code: "120604", isSelva: true },
      { name: "Pampa Hermosa", code: "120605", isSelva: true },
      { name: "Pangoa", code: "120606", isSelva: true },
      { name: "Rio Negro", code: "120607", isSelva: true },
      { name: "Rio Tambo", code: "120608", isSelva: true },
      { name: "Vizcatan del Ene", code: "120609", isSelva: true },
    ],

  "1207": [
    { name: "Tarma", code: "120701", isSelva: false },
    { name: "Acobamba", code: "120702", isSelva: true },
    { name: "Huaricolca", code: "120703", isSelva: false },
    { name: "Huasahuasi", code: "120704", isSelva: true },
    { name: "La Unión", code: "120705", isSelva: true },
    { name: "Palca", code: "120706", isSelva: true },
    { name: "Palcamayo", code: "120707", isSelva: false },
    { name: "San Pedro de Cajas", code: "120708", isSelva: false },
    { name: "Tapo", code: "120709", isSelva: false }
  ],

  "1208": [
      { name: "La Oroya", code: "120801", isSelva: false },
      { name: "Chacapalpa", code: "120802", isSelva: false },
      { name: "Huay-Huay", code: "120803", isSelva: false },
      { name: "Marcapomacocha", code: "120804", isSelva: false },
      { name: "Morococha", code: "120805", isSelva: false },
      { name: "Paccha", code: "120806", isSelva: false },
      { name: "Santa Barbara de Carhuacayan", code: "120807", isSelva: false },
      { name: "Santa Rosa de Sacco", code: "120808", isSelva: false },
      { name: "Suitucancha", code: "120809", isSelva: false },
      { name: "Yauli", code: "120810", isSelva: false },
    ],

  "1209": [
    { name: "Chupaca", code: "120901", isSelva: true },
    { name: "Ahuac", code: "120902", isSelva: true },
    { name: "Chicche", code: "120903", isSelva: true },
    { name: "Chongos Bajo", code: "120904", isSelva: true },
    { name: "Huamancaca Chico", code: "120905", isSelva: true },
    { name: "San Juan de Jarpa", code: "120906", isSelva: true },
    { name: "San Juan de Iscos", code: "120907", isSelva: true },
    { name: "Tres de Diciembre", code: "120908", isSelva: true },
    { name: "Yanacancha", code: "120909", isSelva: true }
  ],


  // ==========================================
  // LA LIBERTAD (13)
  // ==========================================
  "1301": [
      { name: "Trujillo", code: "130101", isSelva: false },
      { name: "El Porvenir", code: "130102", isSelva: false },
      { name: "Florencia de Mora", code: "130103", isSelva: false },
      { name: "Huanchaco", code: "130104", isSelva: false },
      { name: "La Esperanza", code: "130105", isSelva: false },
      { name: "Laredo", code: "130106", isSelva: false },
      { name: "Moche", code: "130107", isSelva: false },
      { name: "Poroto", code: "130108", isSelva: false },
      { name: "Salaverry", code: "130109", isSelva: false },
      { name: "Simbal", code: "130110", isSelva: false },
      { name: "Victor Larco Herrera", code: "130111", isSelva: false },
    ],

  "1302": [
      { name: "Ascope", code: "130201", isSelva: false },
      { name: "Chicama", code: "130202", isSelva: false },
      { name: "Chocope", code: "130203", isSelva: false },
      { name: "Magdalena de Cao", code: "130204", isSelva: false },
      { name: "Paijan", code: "130205", isSelva: false },
      { name: "Razuri", code: "130206", isSelva: false },
      { name: "Santiago de Cao", code: "130207", isSelva: false },
      { name: "Casa Grande", code: "130208", isSelva: false },
    ],

  "1303": [
    { name: "Bolívar", code: "130301", isSelva: false },
    { name: "Bambamarca", code: "130302", isSelva: false },
    { name: "Condormarca", code: "130303", isSelva: false },
    { name: "Longotea", code: "130304", isSelva: false },
    { name: "Uchumarca", code: "130305", isSelva: true },
    { name: "Ucuncha", code: "130306", isSelva: false }
  ],

  "1304": [
      { name: "Chepen", code: "130401", isSelva: false },
      { name: "Pacanga", code: "130402", isSelva: false },
      { name: "Pueblo Nuevo", code: "130403", isSelva: false },
    ],

  "1305": [
      { name: "Julcan", code: "130501", isSelva: false },
      { name: "Calamarca", code: "130502", isSelva: false },
      { name: "Carabamba", code: "130503", isSelva: false },
      { name: "Huaso", code: "130504", isSelva: false },
    ],

  "1306": [
      { name: "Otuzco", code: "130601", isSelva: false },
      { name: "Agallpampa", code: "130602", isSelva: false },
      { name: "Charat", code: "130604", isSelva: false },
      { name: "Huaranchal", code: "130605", isSelva: false },
      { name: "La Cuesta", code: "130606", isSelva: false },
      { name: "Mache", code: "130608", isSelva: false },
      { name: "Paranday", code: "130610", isSelva: false },
      { name: "Salpo", code: "130611", isSelva: false },
      { name: "Sinsicap", code: "130613", isSelva: false },
      { name: "Usquil", code: "130614", isSelva: false },
    ],

  "1307": [
      { name: "San Pedro de Lloc", code: "130701", isSelva: false },
      { name: "Guadalupe", code: "130702", isSelva: false },
      { name: "Jequetepeque", code: "130703", isSelva: false },
      { name: "Pacasmayo", code: "130704", isSelva: false },
      { name: "San José", code: "130705", isSelva: false },
    ],

  "1308": [
      { name: "Tayabamba", code: "130801", isSelva: false },
      { name: "Buldibuyo", code: "130802", isSelva: false },
      { name: "Chillia", code: "130803", isSelva: false },
      { name: "Huancaspata", code: "130804", isSelva: false },
      { name: "Huaylillas", code: "130805", isSelva: false },
      { name: "Huayo", code: "130806", isSelva: false },
      { name: "Ongon", code: "130807", isSelva: false },
      { name: "Parcoy", code: "130808", isSelva: false },
      { name: "Pataz", code: "130809", isSelva: false },
      { name: "Pias", code: "130810", isSelva: false },
      { name: "Santiago de Challas", code: "130811", isSelva: false },
      { name: "Taurija", code: "130812", isSelva: false },
      { name: "Urpay", code: "130813", isSelva: false },
    ],

  "1309": [
      { name: "Huamachuco", code: "130901", isSelva: false },
      { name: "Chugay", code: "130902", isSelva: false },
      { name: "Cochorco", code: "130903", isSelva: false },
      { name: "Curgos", code: "130904", isSelva: false },
      { name: "Marcabal", code: "130905", isSelva: false },
      { name: "Sanagoran", code: "130906", isSelva: false },
      { name: "Sarin", code: "130907", isSelva: false },
      { name: "Sartimbamba", code: "130908", isSelva: false },
    ],

  "1310": [
    { name: "Huamachuco", code: "131001", isSelva: false },
    { name: "Chugay", code: "131002", isSelva: false },
    { name: "Cochabamba", code: "131003", isSelva: false },
    { name: "Curgos", code: "131004", isSelva: false },
    { name: "Marcatruz", code: "131005", isSelva: true },
    { name: "Sarin", code: "131006", isSelva: false },
    { name: "Sanagorán", code: "131007", isSelva: false },
    { name: "Sartimbamba", code: "131008", isSelva: false }
  ],

  "1311": [
      { name: "Cascas", code: "131101", isSelva: false },
      { name: "Lucma", code: "131102", isSelva: false },
      { name: "Marmot", code: "131103", isSelva: false },
      { name: "Sayapullo", code: "131104", isSelva: false },
    ],

  "1312": [
      { name: "Viru", code: "131201", isSelva: false },
      { name: "Chao", code: "131202", isSelva: false },
      { name: "Guadalupito", code: "131203", isSelva: false },
    ],


  // ==========================================
  // LAMBAYEQUE (14)
  // ==========================================
  "1401": [
      { name: "Chiclayo", code: "140101", isSelva: false },
      { name: "Chongoyape", code: "140102", isSelva: false },
      { name: "Eten", code: "140103", isSelva: false },
      { name: "Eten Puerto", code: "140104", isSelva: false },
      { name: "José Leonardo Ortiz", code: "140105", isSelva: false },
      { name: "La Victoria", code: "140106", isSelva: false },
      { name: "Lagunas", code: "140107", isSelva: false },
      { name: "Monsefu", code: "140108", isSelva: false },
      { name: "Nueva Arica", code: "140109", isSelva: false },
      { name: "Oyotun", code: "140110", isSelva: false },
      { name: "Picsi", code: "140111", isSelva: false },
      { name: "Pimentel", code: "140112", isSelva: false },
      { name: "Reque", code: "140113", isSelva: false },
      { name: "Santa Rosa", code: "140114", isSelva: false },
      { name: "Saña", code: "140115", isSelva: false },
      { name: "Cayalti", code: "140116", isSelva: false },
      { name: "Patapo", code: "140117", isSelva: false },
      { name: "Pomalca", code: "140118", isSelva: false },
      { name: "Pucala", code: "140119", isSelva: false },
      { name: "Tuman", code: "140120", isSelva: false },
    ],

  "1402": [
      { name: "Ferreñafe", code: "140201", isSelva: false },
      { name: "Cañaris", code: "140202", isSelva: false },
      { name: "Incahuasi", code: "140203", isSelva: false },
      { name: "Manuel Antonio Mesones Muro", code: "140204", isSelva: false },
      { name: "Pitipo", code: "140205", isSelva: false },
      { name: "Pueblo Nuevo", code: "140206", isSelva: false },
    ],

  "1403": [
      { name: "Lambayeque", code: "140301", isSelva: false },
      { name: "Chochope", code: "140302", isSelva: false },
      { name: "Illimo", code: "140303", isSelva: false },
      { name: "Jayanca", code: "140304", isSelva: false },
      { name: "Mochumi", code: "140305", isSelva: false },
      { name: "Morrope", code: "140306", isSelva: false },
      { name: "Motupe", code: "140307", isSelva: false },
      { name: "Olmos", code: "140308", isSelva: false },
      { name: "Pacora", code: "140309", isSelva: false },
      { name: "Salas", code: "140310", isSelva: false },
      { name: "San José", code: "140311", isSelva: false },
      { name: "Tucume", code: "140312", isSelva: false },
    ],


  // ==========================================
  // LIMA (15)
  // ==========================================
  "1501": [
      { name: "Lima", code: "150101", isSelva: false },
      { name: "Ancon", code: "150102", isSelva: false },
      { name: "Ate", code: "150103", isSelva: false },
      { name: "Barranco", code: "150104", isSelva: false },
      { name: "Breña", code: "150105", isSelva: false },
      { name: "Carabayllo", code: "150106", isSelva: false },
      { name: "Chaclacayo", code: "150107", isSelva: false },
      { name: "Chorrillos", code: "150108", isSelva: false },
      { name: "Cieneguilla", code: "150109", isSelva: false },
      { name: "Comas", code: "150110", isSelva: false },
      { name: "El Agustino", code: "150111", isSelva: false },
      { name: "Independencia", code: "150112", isSelva: false },
      { name: "Jesus María", code: "150113", isSelva: false },
      { name: "La Molina", code: "150114", isSelva: false },
      { name: "La Victoria", code: "150115", isSelva: false },
      { name: "Lince", code: "150116", isSelva: false },
      { name: "Los Olivos", code: "150117", isSelva: false },
      { name: "Lurigancho", code: "150118", isSelva: false },
      { name: "Lurin", code: "150119", isSelva: false },
      { name: "Magdalena del Mar", code: "150120", isSelva: false },
      { name: "Pueblo Libre", code: "150121", isSelva: false },
      { name: "Miraflores", code: "150122", isSelva: false },
      { name: "Pachacamac", code: "150123", isSelva: false },
      { name: "Pucusana", code: "150124", isSelva: false },
      { name: "Puente Piedra", code: "150125", isSelva: false },
      { name: "Punta Hermosa", code: "150126", isSelva: false },
      { name: "Punta Negra", code: "150127", isSelva: false },
      { name: "Rimac", code: "150128", isSelva: false },
      { name: "San Bartolo", code: "150129", isSelva: false },
      { name: "San Borja", code: "150130", isSelva: false },
      { name: "San Isidro", code: "150131", isSelva: false },
      { name: "San Juan de Lurigancho", code: "150132", isSelva: false },
      { name: "San Juan de Miraflores", code: "150133", isSelva: false },
      { name: "San Luis", code: "150134", isSelva: false },
      { name: "San Martin de Porres", code: "150135", isSelva: false },
      { name: "San Miguel", code: "150136", isSelva: false },
      { name: "Santa Anita", code: "150137", isSelva: false },
      { name: "Santa María del Mar", code: "150138", isSelva: false },
      { name: "Santa Rosa", code: "150139", isSelva: false },
      { name: "Santiago de Surco", code: "150140", isSelva: false },
      { name: "Surquillo", code: "150141", isSelva: false },
      { name: "Villa el Salvador", code: "150142", isSelva: false },
      { name: "Villa María del Triunfo", code: "150143", isSelva: false },
      { name: "Santa María de Huachipa", code: "150144", isSelva: false },
    ],

  "1502": [
      { name: "Barranca", code: "150201", isSelva: false },
      { name: "Paramonga", code: "150202", isSelva: false },
      { name: "Pativilca", code: "150203", isSelva: false },
      { name: "Supe", code: "150204", isSelva: false },
      { name: "Supe Puerto", code: "150205", isSelva: false },
    ],

  "1503": [
      { name: "Cajatambo", code: "150301", isSelva: false },
      { name: "Copa", code: "150302", isSelva: false },
      { name: "Gorgor", code: "150303", isSelva: false },
      { name: "Huancapon", code: "150304", isSelva: false },
      { name: "Manas", code: "150305", isSelva: false },
    ],

  "1504": [
      { name: "Canta", code: "150401", isSelva: false },
      { name: "Arahuay", code: "150402", isSelva: false },
      { name: "Huamantanga", code: "150403", isSelva: false },
      { name: "Huaros", code: "150404", isSelva: false },
      { name: "Lachaqui", code: "150405", isSelva: false },
      { name: "San Buenaventura", code: "150406", isSelva: false },
      { name: "Santa Rosa de Quives", code: "150407", isSelva: false },
    ],

  "1505": [
      { name: "San Vicente de Cañete", code: "150501", isSelva: false },
      { name: "Asia", code: "150502", isSelva: false },
      { name: "Calango", code: "150503", isSelva: false },
      { name: "Cerro Azul", code: "150504", isSelva: false },
      { name: "Chilca", code: "150505", isSelva: false },
      { name: "Coayllo", code: "150506", isSelva: false },
      { name: "Imperial", code: "150507", isSelva: false },
      { name: "Lunahuana", code: "150508", isSelva: false },
      { name: "Mala", code: "150509", isSelva: false },
      { name: "Nuevo Imperial", code: "150510", isSelva: false },
      { name: "Pacaran", code: "150511", isSelva: false },
      { name: "Quilmana", code: "150512", isSelva: false },
      { name: "San Antonio", code: "150513", isSelva: false },
      { name: "San Luis", code: "150514", isSelva: false },
      { name: "Santa Cruz de Flores", code: "150515", isSelva: false },
      { name: "Zuñiga", code: "150516", isSelva: false },
    ],

  "1506": [
      { name: "Huaral", code: "150601", isSelva: false },
      { name: "Atavillos Alto", code: "150602", isSelva: false },
      { name: "Atavillos Bajo", code: "150603", isSelva: false },
      { name: "Aucallama", code: "150604", isSelva: false },
      { name: "Chancay", code: "150605", isSelva: false },
      { name: "Ihuari", code: "150606", isSelva: false },
      { name: "Lampian", code: "150607", isSelva: false },
      { name: "Pacaraos", code: "150608", isSelva: false },
      { name: "San Miguel de Acos", code: "150609", isSelva: false },
      { name: "Santa Cruz de Andamarca", code: "150610", isSelva: false },
      { name: "Sumbilca", code: "150611", isSelva: false },
      { name: "Veintisiete de Noviembre", code: "150612", isSelva: false },
    ],

  "1507": [
      { name: "Matucana", code: "150701", isSelva: false },
      { name: "Antioquia", code: "150702", isSelva: false },
      { name: "Callahuanca", code: "150703", isSelva: false },
      { name: "Carampoma", code: "150704", isSelva: false },
      { name: "Chicla", code: "150705", isSelva: false },
      { name: "Cuenca", code: "150706", isSelva: false },
      { name: "Huachupampa", code: "150707", isSelva: false },
      { name: "Huanza", code: "150708", isSelva: false },
      { name: "Huarochirí", code: "150709", isSelva: false },
      { name: "Lahuaytambo", code: "150710", isSelva: false },
      { name: "Langa", code: "150711", isSelva: false },
      { name: "Laraos", code: "150712", isSelva: false },
      { name: "Mariatana", code: "150713", isSelva: false },
      { name: "Ricardo Palma", code: "150714", isSelva: false },
      { name: "San Andrés de Tupicocha", code: "150715", isSelva: false },
      { name: "San Antonio", code: "150716", isSelva: false },
      { name: "San Bartolome", code: "150717", isSelva: false },
      { name: "San Damian", code: "150718", isSelva: false },
      { name: "San Juan de Iris", code: "150719", isSelva: false },
      { name: "San Juan de Tantaranche", code: "150720", isSelva: false },
      { name: "San Lorenzo de Quinti", code: "150721", isSelva: false },
      { name: "San Mateo", code: "150722", isSelva: false },
      { name: "San Mateo de Otao", code: "150723", isSelva: false },
      { name: "San Pedro de Casta", code: "150724", isSelva: false },
      { name: "San Pedro de Huancayre", code: "150725", isSelva: false },
      { name: "Sangallaya", code: "150726", isSelva: false },
      { name: "Santa Cruz de Cocachacra", code: "150727", isSelva: false },
      { name: "Santa Eulalia", code: "150728", isSelva: false },
      { name: "Santiago de Anchucaya", code: "150729", isSelva: false },
      { name: "Santiago de Tuna", code: "150730", isSelva: false },
      { name: "Santo Domingo de los Olleros", code: "150731", isSelva: false },
      { name: "Surco", code: "150732", isSelva: false },
    ],

  "1508": [
      { name: "Huacho", code: "150801", isSelva: false },
      { name: "Ambar", code: "150802", isSelva: false },
      { name: "Caleta de Carquin", code: "150803", isSelva: false },
      { name: "Checras", code: "150804", isSelva: false },
      { name: "Hualmay", code: "150805", isSelva: false },
      { name: "Huaura", code: "150806", isSelva: false },
      { name: "Leoncio Prado", code: "150807", isSelva: false },
      { name: "Paccho", code: "150808", isSelva: false },
      { name: "Santa Leonor", code: "150809", isSelva: false },
      { name: "Santa María", code: "150810", isSelva: false },
      { name: "Sayan", code: "150811", isSelva: false },
      { name: "Vegueta", code: "150812", isSelva: false },
    ],

  "1509": [
      { name: "Oyón", code: "150901", isSelva: false },
      { name: "Andajes", code: "150902", isSelva: false },
      { name: "Caujul", code: "150903", isSelva: false },
      { name: "Cochamarca", code: "150904", isSelva: false },
      { name: "Navan", code: "150905", isSelva: false },
      { name: "Pachangara", code: "150906", isSelva: false },
    ],

  "1510": [
      { name: "Yauyos", code: "151001", isSelva: false },
      { name: "Alis", code: "151002", isSelva: false },
      { name: "Ayauca", code: "151003", isSelva: false },
      { name: "Ayaviri", code: "151004", isSelva: false },
      { name: "Azangaro", code: "151005", isSelva: false },
      { name: "Cacra", code: "151006", isSelva: false },
      { name: "Carania", code: "151007", isSelva: false },
      { name: "Catahuasi", code: "151008", isSelva: false },
      { name: "Chocos", code: "151009", isSelva: false },
      { name: "Cochas", code: "151010", isSelva: false },
      { name: "Colonia", code: "151011", isSelva: false },
      { name: "Hongos", code: "151012", isSelva: false },
      { name: "Huampara", code: "151013", isSelva: false },
      { name: "Huancaya", code: "151014", isSelva: false },
      { name: "Huangascar", code: "151015", isSelva: false },
      { name: "Huantan", code: "151016", isSelva: false },
      { name: "Huañec", code: "151017", isSelva: false },
      { name: "Laraos", code: "151018", isSelva: false },
      { name: "Lincha", code: "151019", isSelva: false },
      { name: "Madean", code: "151020", isSelva: false },
      { name: "Miraflores", code: "151021", isSelva: false },
      { name: "Omas", code: "151022", isSelva: false },
      { name: "Putinza", code: "151023", isSelva: false },
      { name: "Quinches", code: "151024", isSelva: false },
      { name: "Quinocay", code: "151025", isSelva: false },
      { name: "San Joaquin", code: "151026", isSelva: false },
      { name: "San Pedro de Pilas", code: "151027", isSelva: false },
      { name: "Tanta", code: "151028", isSelva: false },
      { name: "Tauripampa", code: "151029", isSelva: false },
      { name: "Tomás", code: "151030", isSelva: false },
      { name: "Tupe", code: "151031", isSelva: false },
      { name: "Viñac", code: "151032", isSelva: false },
      { name: "Vitis", code: "151033", isSelva: false },
    ],


  // ==========================================
  // LORETO (16)
  // ==========================================
  "1601": [
      { name: "Iquitos", code: "160101", isSelva: true },
      { name: "Alto Nanay", code: "160102", isSelva: true },
      { name: "Fernando Lores", code: "160103", isSelva: true },
      { name: "Indiana", code: "160104", isSelva: true },
      { name: "Las Amazonas", code: "160105", isSelva: true },
      { name: "Mazan", code: "160106", isSelva: true },
      { name: "Napo", code: "160107", isSelva: true },
      { name: "Punchana", code: "160108", isSelva: true },
      { name: "Putumayo", code: "160109", isSelva: true },
      { name: "Torres Causana", code: "160110", isSelva: true },
      { name: "Belén", code: "160112", isSelva: true },
      { name: "San Juan Bautista", code: "160113", isSelva: true },
      { name: "Teniente Manuel Clavero", code: "160114", isSelva: true },
    ],

  "1602": [
      { name: "Yurimaguas", code: "160201", isSelva: true },
      { name: "Balsapuerto", code: "160202", isSelva: true },
      { name: "Jeberos", code: "160205", isSelva: true },
      { name: "Lagunas", code: "160206", isSelva: true },
      { name: "Santa Cruz", code: "160210", isSelva: true },
      { name: "Teniente Cesar López Rojas", code: "160211", isSelva: true },
    ],

  "1603": [
      { name: "Nauta", code: "160301", isSelva: true },
      { name: "Parinari", code: "160302", isSelva: true },
      { name: "Tigre", code: "160303", isSelva: true },
      { name: "Trompeteros", code: "160304", isSelva: true },
      { name: "Urarinas", code: "160305", isSelva: true },
    ],

  "1604": [
      { name: "Ramón Castilla", code: "160401", isSelva: true },
      { name: "Pebas", code: "160402", isSelva: true },
      { name: "Yavari", code: "160403", isSelva: true },
      { name: "San Pablo", code: "160404", isSelva: true },
    ],

  "1605": [
      { name: "Requena", code: "160501", isSelva: true },
      { name: "Alto Tapiche", code: "160502", isSelva: true },
      { name: "Capelo", code: "160503", isSelva: true },
      { name: "Emilio San Martin", code: "160504", isSelva: true },
      { name: "Maquia", code: "160505", isSelva: true },
      { name: "Puinahua", code: "160506", isSelva: true },
      { name: "Saquena", code: "160507", isSelva: true },
      { name: "Soplin", code: "160508", isSelva: true },
      { name: "Tapiche", code: "160509", isSelva: true },
      { name: "Jenaro Herrera", code: "160510", isSelva: true },
      { name: "Yaquerana", code: "160511", isSelva: true },
    ],

  "1606": [
      { name: "Contamana", code: "160601", isSelva: true },
      { name: "Inahuaya", code: "160602", isSelva: true },
      { name: "Padre Marquez", code: "160603", isSelva: true },
      { name: "Pampa Hermosa", code: "160604", isSelva: true },
      { name: "Sarayacu", code: "160605", isSelva: true },
      { name: "Vargas Guerra", code: "160606", isSelva: true },
    ],

  "1607": [
      { name: "Barranca", code: "160701", isSelva: true },
      { name: "Cahuapanas", code: "160702", isSelva: true },
      { name: "Manseriche", code: "160703", isSelva: true },
      { name: "Morona", code: "160704", isSelva: true },
      { name: "Pastaza", code: "160705", isSelva: true },
      { name: "Andoas", code: "160706", isSelva: true },
    ],

  "1608": [
      { name: "Putumayo", code: "160801", isSelva: true },
      { name: "Rosa Panduro", code: "160802", isSelva: true },
      { name: "Teniente Manuel Clavero", code: "160803", isSelva: true },
      { name: "Yaguas", code: "160804", isSelva: true },
    ],


  // ==========================================
  // MADRE DE DIOS (17)
  // ==========================================
  "1701": [
      { name: "Tambopata", code: "170101", isSelva: true },
      { name: "Inambari", code: "170102", isSelva: true },
      { name: "Las Piedras", code: "170103", isSelva: true },
      { name: "Laberinto", code: "170104", isSelva: true },
    ],

  "1702": [
      { name: "Manu", code: "170201", isSelva: true },
      { name: "Fitzcarrald", code: "170202", isSelva: true },
      { name: "Madre de Dios", code: "170203", isSelva: true },
      { name: "Huepetuhe", code: "170204", isSelva: true },
    ],

  "1703": [
      { name: "Iñapari", code: "170301", isSelva: true },
      { name: "Iberia", code: "170302", isSelva: true },
      { name: "Tahuamanu", code: "170303", isSelva: true },
    ],


  // ==========================================
  // MOQUEGUA (18)
  // ==========================================
  "1801": [
      { name: "Moquegua", code: "180101", isSelva: false },
      { name: "Carumas", code: "180102", isSelva: false },
      { name: "Cuchumbaya", code: "180103", isSelva: false },
      { name: "Samegua", code: "180104", isSelva: false },
      { name: "San Cristóbal", code: "180105", isSelva: false },
      { name: "Torata", code: "180106", isSelva: false },
    ],

  "1802": [
      { name: "Omate", code: "180201", isSelva: false },
      { name: "Chojata", code: "180202", isSelva: false },
      { name: "Coalaque", code: "180203", isSelva: false },
      { name: "Ichuña", code: "180204", isSelva: false },
      { name: "La Capilla", code: "180205", isSelva: false },
      { name: "Lloque", code: "180206", isSelva: false },
      { name: "Matalaque", code: "180207", isSelva: false },
      { name: "Puquina", code: "180208", isSelva: false },
      { name: "Quinistaquillas", code: "180209", isSelva: false },
      { name: "Ubinas", code: "180210", isSelva: false },
      { name: "Yunga", code: "180211", isSelva: false },
    ],

  "1803": [
      { name: "Ilo", code: "180301", isSelva: false },
      { name: "El Algarrobal", code: "180302", isSelva: false },
      { name: "Pacocha", code: "180303", isSelva: false },
    ],


  // ==========================================
  // PASCO (19)
  // ==========================================
  "1901": [
      { name: "Chaupimarca", code: "190101", isSelva: false },
      { name: "Huachon", code: "190102", isSelva: false },
      { name: "Huariaca", code: "190103", isSelva: false },
      { name: "Huayllay", code: "190104", isSelva: false },
      { name: "Ninacaca", code: "190105", isSelva: false },
      { name: "Pallanchacra", code: "190106", isSelva: false },
      { name: "Paucartambo", code: "190107", isSelva: false },
      { name: "San Francisco de Asis de Yarusyacan", code: "190108", isSelva: false },
      { name: "Simón Bolivar", code: "190109", isSelva: false },
      { name: "Ticlacayan", code: "190110", isSelva: false },
      { name: "Tinyahuarco", code: "190111", isSelva: false },
      { name: "Vicco", code: "190112", isSelva: false },
      { name: "Yanacancha", code: "190113", isSelva: false },
    ],

  "1902": [
      { name: "Yanahuanca", code: "190201", isSelva: false },
      { name: "Chacayan", code: "190202", isSelva: false },
      { name: "Goyllarisquizga", code: "190203", isSelva: false },
      { name: "Paucar", code: "190204", isSelva: false },
      { name: "San Pedro de Pillao", code: "190205", isSelva: false },
      { name: "Santa Ana de Tusi", code: "190206", isSelva: false },
      { name: "Tapuc", code: "190207", isSelva: false },
      { name: "Vilcabamba", code: "190208", isSelva: false },
    ],

  "1903": [
      { name: "Oxapampa", code: "190301", isSelva: true },
      { name: "Chontabamba", code: "190302", isSelva: true },
      { name: "Huancabamba", code: "190303", isSelva: true },
      { name: "Palcazu", code: "190304", isSelva: true },
      { name: "Pozuzo", code: "190305", isSelva: true },
      { name: "Puerto Bermudez", code: "190306", isSelva: true },
      { name: "Villa Rica", code: "190307", isSelva: true },
      { name: "Constitucion", code: "190308", isSelva: true },
    ],


  // ==========================================
  // PIURA (20)
  // ==========================================
  "2001": [
      { name: "Piura", code: "200101", isSelva: false },
      { name: "Castilla", code: "200104", isSelva: false },
      { name: "Catacaos", code: "200105", isSelva: false },
      { name: "Cura Mori", code: "200107", isSelva: false },
      { name: "El Tallan", code: "200108", isSelva: false },
      { name: "La Arena", code: "200109", isSelva: false },
      { name: "La Union", code: "200110", isSelva: false },
      { name: "Las Lomas", code: "200111", isSelva: false },
      { name: "Tambo Grande", code: "200114", isSelva: false },
      { name: "Veintiseis de Octubre", code: "200115", isSelva: false },
    ],

  "2002": [
    { name: "Ayabaca", code: "200201", isSelva: false },
    { name: "Frias", code: "200202", isSelva: false },
    { name: "Jilili", code: "200203", isSelva: false },
    { name: "Lagunas", code: "200204", isSelva: false },
    { name: "Montero", code: "200205", isSelva: true },
    { name: "Pacaipampa", code: "200206", isSelva: true },
    { name: "Paicapampa", code: "200207", isSelva: true },
    { name: "Sapillica", code: "200208", isSelva: false },
    { name: "Sicches", code: "200209", isSelva: true },
    { name: "Suyo", code: "200210", isSelva: false }
  ],

  "2003": [
    { name: "Huancabamba", code: "200301", isSelva: false },
    { name: "Canchaque", code: "200302", isSelva: false },
    { name: "Carmen de la Frontera", code: "200303", isSelva: true },
    { name: "Huarmaca", code: "200304", isSelva: false },
    { name: "Lalaquiz", code: "200305", isSelva: false },
    { name: "Miguel Checa", code: "200306", isSelva: false },
    { name: "San Miguel de El Faique", code: "200307", isSelva: false },
    { name: "Sondor", code: "200308", isSelva: false },
    { name: "Sondorillo", code: "200309", isSelva: false }
  ],

  "2004": [
    { name: "Chulucanas", code: "200401", isSelva: false },
    { name: "Buenos Aires", code: "200402", isSelva: false },
    { name: "Chalaco", code: "200403", isSelva: false },
    { name: "La Matanza", code: "200404", isSelva: false },
    { name: "Morropón", code: "200405", isSelva: false },
    { name: "Salitral", code: "200406", isSelva: false },
    { name: "San Juan de Bigote", code: "200407", isSelva: false },
    { name: "Santa Catalina de Mossa", code: "200408", isSelva: false },
    { name: "Santo Domingo", code: "200409", isSelva: true },
    { name: "Yamango", code: "200410", isSelva: true }
  ],

  "2005": [
      { name: "Paita", code: "200501", isSelva: false },
      { name: "Amotape", code: "200502", isSelva: false },
      { name: "Arenal", code: "200503", isSelva: false },
      { name: "Colan", code: "200504", isSelva: false },
      { name: "La Huaca", code: "200505", isSelva: false },
      { name: "Tamarindo", code: "200506", isSelva: false },
      { name: "Vichayal", code: "200507", isSelva: false },
    ],

  "2006": [
      { name: "Sullana", code: "200601", isSelva: false },
      { name: "Bellavista", code: "200602", isSelva: false },
      { name: "Ignacio Escudero", code: "200603", isSelva: false },
      { name: "Lancones", code: "200604", isSelva: false },
      { name: "Marcavelica", code: "200605", isSelva: false },
      { name: "Miguel Checa", code: "200606", isSelva: false },
      { name: "Querecotillo", code: "200607", isSelva: false },
      { name: "Salitral", code: "200608", isSelva: false },
    ],

  "2007": [
      { name: "Pariñas", code: "200701", isSelva: false },
      { name: "El Alto", code: "200702", isSelva: false },
      { name: "La Brea", code: "200703", isSelva: false },
      { name: "Lobitos", code: "200704", isSelva: false },
      { name: "Los Organos", code: "200705", isSelva: false },
      { name: "Mancora", code: "200706", isSelva: false },
    ],

  "2008": [
      { name: "Sechura", code: "200801", isSelva: false },
      { name: "Bellavista de la Union", code: "200802", isSelva: false },
      { name: "Bernal", code: "200803", isSelva: false },
      { name: "Cristo Nos Valga", code: "200804", isSelva: false },
      { name: "Vice", code: "200805", isSelva: false },
      { name: "Rinconada Llicuar", code: "200806", isSelva: false },
    ],


  // ==========================================
  // PUNO (21)
  // ==========================================
  "2101": [
      { name: "Puno", code: "210101", isSelva: false },
      { name: "Acora", code: "210102", isSelva: false },
      { name: "Amantani", code: "210103", isSelva: false },
      { name: "Atuncolla", code: "210104", isSelva: false },
      { name: "Capachica", code: "210105", isSelva: false },
      { name: "Chucuito", code: "210106", isSelva: false },
      { name: "Coata", code: "210107", isSelva: false },
      { name: "Huata", code: "210108", isSelva: false },
      { name: "Mañazo", code: "210109", isSelva: false },
      { name: "Paucarcolla", code: "210110", isSelva: false },
      { name: "Pichacani", code: "210111", isSelva: false },
      { name: "Plateria", code: "210112", isSelva: false },
      { name: "San Antonio", code: "210113", isSelva: false },
      { name: "Tiquillaca", code: "210114", isSelva: false },
      { name: "Vilque", code: "210115", isSelva: false },
    ],

  "2102": [
      { name: "Azangaro", code: "210201", isSelva: false },
      { name: "Achaya", code: "210202", isSelva: false },
      { name: "Arapa", code: "210203", isSelva: false },
      { name: "Asillo", code: "210204", isSelva: false },
      { name: "Caminaca", code: "210205", isSelva: false },
      { name: "Chupa", code: "210206", isSelva: false },
      { name: "José Domingo Choquehuanca", code: "210207", isSelva: false },
      { name: "Muñani", code: "210208", isSelva: false },
      { name: "Potoni", code: "210209", isSelva: false },
      { name: "Saman", code: "210210", isSelva: false },
      { name: "San Anton", code: "210211", isSelva: false },
      { name: "San José", code: "210212", isSelva: false },
      { name: "San Juan de Salinas", code: "210213", isSelva: false },
      { name: "Santiago de Pupuja", code: "210214", isSelva: false },
      { name: "Tirapata", code: "210215", isSelva: false },
    ],

  "2103": [
    { name: "Macusani", code: "210301", isSelva: false },
    { name: "Ajoyani", code: "210302", isSelva: false },
    { name: "Ayapata", code: "210303", isSelva: false },
    { name: "Coasa", code: "210304", isSelva: false },
    { name: "Corani", code: "210305", isSelva: true },
    { name: "Crucero", code: "210306", isSelva: false },
    { name: "Ituata", code: "210307", isSelva: false },
    { name: "Ollachea", code: "210308", isSelva: true },
    { name: "San Gabán", code: "210309", isSelva: true },
    { name: "Usicayos", code: "210310", isSelva: true }
  ],

  "2104": [
      { name: "Juli", code: "210401", isSelva: false },
      { name: "Desaguadero", code: "210402", isSelva: false },
      { name: "Huacullani", code: "210403", isSelva: false },
      { name: "Kelluyo", code: "210404", isSelva: false },
      { name: "Pisacoma", code: "210405", isSelva: false },
      { name: "Pomata", code: "210406", isSelva: false },
      { name: "Zepita", code: "210407", isSelva: false },
    ],

  "2105": [
      { name: "Ilave", code: "210501", isSelva: false },
      { name: "Capazo", code: "210502", isSelva: false },
      { name: "Pilcuyo", code: "210503", isSelva: false },
      { name: "Santa Rosa", code: "210504", isSelva: false },
      { name: "Conduriri", code: "210505", isSelva: false },
    ],

  "2106": [
      { name: "Huancane", code: "210601", isSelva: false },
      { name: "Cojata", code: "210602", isSelva: false },
      { name: "Huatasani", code: "210603", isSelva: false },
      { name: "Inchupalla", code: "210604", isSelva: false },
      { name: "Pusi", code: "210605", isSelva: false },
      { name: "Rosaspata", code: "210606", isSelva: false },
      { name: "Taraco", code: "210607", isSelva: false },
      { name: "Vilque Chico", code: "210608", isSelva: false },
    ],

  "2107": [
      { name: "Lampa", code: "210701", isSelva: false },
      { name: "Cabanilla", code: "210702", isSelva: false },
      { name: "Calapuja", code: "210703", isSelva: false },
      { name: "Nicasio", code: "210704", isSelva: false },
      { name: "Ocuviri", code: "210705", isSelva: false },
      { name: "Palca", code: "210706", isSelva: false },
      { name: "Paratia", code: "210707", isSelva: false },
      { name: "Pucara", code: "210708", isSelva: false },
      { name: "Santa Lucia", code: "210709", isSelva: false },
      { name: "Vilavila", code: "210710", isSelva: false },
    ],

  "2108": [
      { name: "Ayaviri", code: "210801", isSelva: false },
      { name: "Antauta", code: "210802", isSelva: false },
      { name: "Cupi", code: "210803", isSelva: false },
      { name: "Llalli", code: "210804", isSelva: false },
      { name: "Macari", code: "210805", isSelva: false },
      { name: "Nuñoa", code: "210806", isSelva: false },
      { name: "Orurillo", code: "210807", isSelva: false },
      { name: "Santa Rosa", code: "210808", isSelva: false },
      { name: "Umachiri", code: "210809", isSelva: false },
    ],

  "2109": [
      { name: "Moho", code: "210901", isSelva: false },
      { name: "Conima", code: "210902", isSelva: false },
      { name: "Huayrapata", code: "210903", isSelva: false },
      { name: "Tilali", code: "210904", isSelva: false },
    ],

  "2110": [
      { name: "Putina", code: "211001", isSelva: false },
      { name: "Ananea", code: "211002", isSelva: false },
      { name: "Pedro Vilca Apaza", code: "211003", isSelva: false },
      { name: "Quilcapuncu", code: "211004", isSelva: false },
      { name: "Sina", code: "211005", isSelva: false },
    ],

  "2111": [
      { name: "Juliaca", code: "211101", isSelva: false },
      { name: "Cabana", code: "211102", isSelva: false },
      { name: "Cabanillas", code: "211103", isSelva: false },
      { name: "Caracoto", code: "211104", isSelva: false },
      { name: "San Miguel", code: "211105", isSelva: false },
    ],

  "2112": [
    { name: "Sandia", code: "211201", isSelva: true },
    { name: "Cuyocuyo", code: "211202", isSelva: false },
    { name: "Limbani", code: "211203", isSelva: true },
    { name: "Patambuco", code: "211204", isSelva: true },
    { name: "Phara", code: "211205", isSelva: true },
    { name: "Quiaca", code: "211206", isSelva: true },
    { name: "San Juan del Oro", code: "211207", isSelva: true },
    { name: "Yanahuanca", code: "211208", isSelva: true },
    { name: "Alto Inambari", code: "211209", isSelva: true }
  ],

  "2113": [
      { name: "Yunguyo", code: "211301", isSelva: false },
      { name: "Anapia", code: "211302", isSelva: false },
      { name: "Copani", code: "211303", isSelva: false },
      { name: "Cuturapi", code: "211304", isSelva: false },
      { name: "Ollaraya", code: "211305", isSelva: false },
      { name: "Tinicachi", code: "211306", isSelva: false },
      { name: "Unicachi", code: "211307", isSelva: false },
    ],


  // ==========================================
  // SAN MARTÍN (22)
  // ==========================================
  "2201": [
      { name: "Moyobamba", code: "220101", isSelva: true },
      { name: "Calzada", code: "220102", isSelva: true },
      { name: "Habana", code: "220103", isSelva: true },
      { name: "Jepelacio", code: "220104", isSelva: true },
      { name: "Soritor", code: "220105", isSelva: true },
      { name: "Yantalo", code: "220106", isSelva: true },
    ],

  "2202": [
      { name: "Bellavista", code: "220201", isSelva: true },
      { name: "Alto Biavo", code: "220202", isSelva: true },
      { name: "Bajo Biavo", code: "220203", isSelva: true },
      { name: "Huallaga", code: "220204", isSelva: true },
      { name: "San Pablo", code: "220205", isSelva: true },
      { name: "San Rafael", code: "220206", isSelva: true },
    ],

  "2203": [
      { name: "San José de Sisa", code: "220301", isSelva: true },
      { name: "Agua Blanca", code: "220302", isSelva: true },
      { name: "San Martin", code: "220303", isSelva: true },
      { name: "Santa Rosa", code: "220304", isSelva: true },
      { name: "Shatoja", code: "220305", isSelva: true },
    ],

  "2204": [
      { name: "Saposoa", code: "220401", isSelva: true },
      { name: "Alto Saposoa", code: "220402", isSelva: true },
      { name: "El Eslabon", code: "220403", isSelva: true },
      { name: "Piscoyacu", code: "220404", isSelva: true },
      { name: "Sacanche", code: "220405", isSelva: true },
      { name: "Tingo de Saposoa", code: "220406", isSelva: true },
    ],

  "2205": [
      { name: "Lamas", code: "220501", isSelva: true },
      { name: "Alonso de Alvarado", code: "220502", isSelva: true },
      { name: "Barranquita", code: "220503", isSelva: true },
      { name: "Caynarachi", code: "220504", isSelva: true },
      { name: "Cuñumbuqui", code: "220505", isSelva: true },
      { name: "Pinto Recodo", code: "220506", isSelva: true },
      { name: "Rumisapa", code: "220507", isSelva: true },
      { name: "San Roque de Cumbaza", code: "220508", isSelva: true },
      { name: "Shanao", code: "220509", isSelva: true },
      { name: "Tabalosos", code: "220510", isSelva: true },
      { name: "Zapatero", code: "220511", isSelva: true },
    ],

  "2206": [
      { name: "Juanjui", code: "220601", isSelva: true },
      { name: "Campanilla", code: "220602", isSelva: true },
      { name: "Huicungo", code: "220603", isSelva: true },
      { name: "Pachiza", code: "220604", isSelva: true },
      { name: "Pajarillo", code: "220605", isSelva: true },
    ],

  "2207": [
      { name: "Picota", code: "220701", isSelva: true },
      { name: "Buenos Aires", code: "220702", isSelva: true },
      { name: "Caspisapa", code: "220703", isSelva: true },
      { name: "Pilluana", code: "220704", isSelva: true },
      { name: "Pucacaca", code: "220705", isSelva: true },
      { name: "San Cristóbal", code: "220706", isSelva: true },
      { name: "San Hilarion", code: "220707", isSelva: true },
      { name: "Shamboyacu", code: "220708", isSelva: true },
      { name: "Tingo de Ponasa", code: "220709", isSelva: true },
      { name: "Tres Unidos", code: "220710", isSelva: true },
    ],

  "2208": [
      { name: "Rioja", code: "220801", isSelva: true },
      { name: "Awajun", code: "220802", isSelva: true },
      { name: "Elias Soplin Vargas", code: "220803", isSelva: true },
      { name: "Nueva Cajamarca", code: "220804", isSelva: true },
      { name: "Pardo Miguel", code: "220805", isSelva: true },
      { name: "Posic", code: "220806", isSelva: true },
      { name: "San Fernando", code: "220807", isSelva: true },
      { name: "Yorongos", code: "220808", isSelva: true },
      { name: "Yuracyacu", code: "220809", isSelva: true },
    ],

  "2209": [
      { name: "Tarapoto", code: "220901", isSelva: true },
      { name: "Alberto Leveau", code: "220902", isSelva: true },
      { name: "Cacatachi", code: "220903", isSelva: true },
      { name: "Chazuta", code: "220904", isSelva: true },
      { name: "Chipurana", code: "220905", isSelva: true },
      { name: "El Porvenir", code: "220906", isSelva: true },
      { name: "Huimbayoc", code: "220907", isSelva: true },
      { name: "Juan Guerra", code: "220908", isSelva: true },
      { name: "La Banda de Shilcayo", code: "220909", isSelva: true },
      { name: "Morales", code: "220910", isSelva: true },
      { name: "Papaplaya", code: "220911", isSelva: true },
      { name: "San Antonio", code: "220912", isSelva: true },
      { name: "Sauce", code: "220913", isSelva: true },
      { name: "Shapaja", code: "220914", isSelva: true },
    ],

  "2210": [
      { name: "Tocache", code: "221001", isSelva: true },
      { name: "Nuevo Progreso", code: "221002", isSelva: true },
      { name: "Polvora", code: "221003", isSelva: true },
      { name: "Shunte", code: "221004", isSelva: true },
      { name: "Uchiza", code: "221005", isSelva: true },
      { name: "Santa Lucia", code: "221006", isSelva: true },
    ],


  // ==========================================
  // TACNA (23)
  // ==========================================
  "2301": [
      { name: "Tacna", code: "230101", isSelva: false },
      { name: "Alto de la Alianza", code: "230102", isSelva: false },
      { name: "Calana", code: "230103", isSelva: false },
      { name: "Ciudad Nueva", code: "230104", isSelva: false },
      { name: "Inclan", code: "230105", isSelva: false },
      { name: "Pachia", code: "230106", isSelva: false },
      { name: "Palca", code: "230107", isSelva: false },
      { name: "Pocollay", code: "230108", isSelva: false },
      { name: "Sama", code: "230109", isSelva: false },
      { name: "Coronel Gregorio Albarracin Lanchipa", code: "230110", isSelva: false },
      { name: "La Yarada los Palos", code: "230111", isSelva: false },
    ],

  "2302": [
      { name: "Candarave", code: "230201", isSelva: false },
      { name: "Cairani", code: "230202", isSelva: false },
      { name: "Camilaca", code: "230203", isSelva: false },
      { name: "Curibaya", code: "230204", isSelva: false },
      { name: "Huanuara", code: "230205", isSelva: false },
      { name: "Quilahuani", code: "230206", isSelva: false },
    ],

  "2303": [
      { name: "Locumba", code: "230301", isSelva: false },
      { name: "Ilabaya", code: "230302", isSelva: false },
      { name: "Ite", code: "230303", isSelva: false },
    ],

  "2304": [
      { name: "Tarata", code: "230401", isSelva: false },
      { name: "Heroes Albarracin Chucatamani", code: "230402", isSelva: false },
      { name: "Estique", code: "230403", isSelva: false },
      { name: "Estique-Pampa", code: "230404", isSelva: false },
      { name: "Sitajara", code: "230405", isSelva: false },
      { name: "Susapaya", code: "230406", isSelva: false },
      { name: "Tarucachi", code: "230407", isSelva: false },
      { name: "Ticaco", code: "230408", isSelva: false },
    ],


  // ==========================================
  // TUMBES (24)
  // ==========================================
  "2401": [
      { name: "Tumbes", code: "240101", isSelva: false },
      { name: "Corrales", code: "240102", isSelva: false },
      { name: "La Cruz", code: "240103", isSelva: false },
      { name: "Pampas de Hospital", code: "240104", isSelva: false },
      { name: "San Jacinto", code: "240105", isSelva: false },
      { name: "San Juan de la Virgen", code: "240106", isSelva: false },
    ],

  "2402": [
      { name: "Zorritos", code: "240201", isSelva: false },
      { name: "Casitas", code: "240202", isSelva: false },
      { name: "Canoas de Punta Sal", code: "240203", isSelva: false },
    ],

  "2403": [
      { name: "Zarumilla", code: "240301", isSelva: false },
      { name: "Aguas Verdes", code: "240302", isSelva: false },
      { name: "Matapalo", code: "240303", isSelva: false },
      { name: "Papayal", code: "240304", isSelva: false },
    ],


  // ==========================================
  // UCAYALI (25)
  // ==========================================
  "2501": [
      { name: "Calleria", code: "250101", isSelva: true },
      { name: "Campoverde", code: "250102", isSelva: true },
      { name: "Iparia", code: "250103", isSelva: true },
      { name: "Masisea", code: "250104", isSelva: true },
      { name: "Yarinacocha", code: "250105", isSelva: true },
      { name: "Nueva Requena", code: "250106", isSelva: true },
      { name: "Manantay", code: "250107", isSelva: true },
    ],

  "2502": [
      { name: "Raymondi", code: "250201", isSelva: true },
      { name: "Sepahua", code: "250202", isSelva: true },
      { name: "Tahuania", code: "250203", isSelva: true },
      { name: "Yurua", code: "250204", isSelva: true },
    ],

  "2503": [
      { name: "Padre Abad", code: "250301", isSelva: true },
      { name: "Irazola", code: "250302", isSelva: true },
      { name: "Curimana", code: "250303", isSelva: true },
      { name: "Neshuya", code: "250304", isSelva: true },
      { name: "Alexander Von Humboldt", code: "250305", isSelva: true },
      { name: "Huipoca", code: "250306", isSelva: true },
      { name: "Boqueron", code: "250307", isSelva: true },
    ],

  "2504": [
      { name: "Purus", code: "250401", isSelva: true },
    ],
}

const DISTRICT_BY_CODE = new Map<string, DistrictData>();
for (const [_provinceCode, districts] of Object.entries(PARTIAL_DISTRICTS)) {
  for (const d of districts) {
    DISTRICT_BY_CODE.set(d.code, d);
  }
}

export function getDistrictsForProvince(provinceCode: string): GeoDistrict[] {
  const districts = PARTIAL_DISTRICTS[provinceCode];
  if (!districts) return [];
  const deptCode = provinceCode.substring(0, 2);
  return districts.map((d) => ({
    code: d.code,
    provinceCode,
    departmentCode: deptCode,
    name: d.name,
    isSelva: d.isSelva,
  }));
}

export function getDistrict(code: string): GeoDistrict | null {
  if (!code || code.length !== 6) return null;
  const d = DISTRICT_BY_CODE.get(code);
  if (!d) return null;
  return {
    code: d.code,
    provinceCode: code.substring(0, 4),
    departmentCode: code.substring(0, 2),
    name: d.name,
    isSelva: d.isSelva,
  };
}

export function isDistrictSelva(code: string): boolean {
  const district = getDistrict(code);
  return district?.isSelva ?? false;
}

export function getAllDistricts(): GeoDistrict[] {
  const result: GeoDistrict[] = [];
  for (const provinceCode of Object.keys(PARTIAL_DISTRICTS)) {
    result.push(...getDistrictsForProvince(provinceCode));
  }
  return result;
}

export function getSelvaDistricts(): GeoDistrict[] {
  return getAllDistricts().filter((d) => d.isSelva);
}

export function getDistrictStats() {
  const all = getAllDistricts();
  const selva = all.filter((d) => d.isSelva);
  const provinces = Object.keys(PARTIAL_DISTRICTS).length;
  return {
    totalDistricts: all.length,
    selvaDistricts: selva.length,
    nonSelvaDistricts: all.length - selva.length,
    partialProvinces: provinces,
    coveragePercent: all.length > 0 ? Math.round((selva.length / all.length) * 100) : 0,
  };
}
