const UNIDADES = [
  "",
  "UN",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
];
const DECENAS = [
  "",
  "DIEZ",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];
const ESPECIALES: Record<string, string> = {
  "10": "DIEZ",
  "11": "ONCE",
  "12": "DOCE",
  "13": "TRECE",
  "14": "CATORCE",
  "15": "QUINCE",
  "16": "DIECISEIS",
  "17": "DIECISIETE",
  "18": "DIECIOCHO",
  "19": "DIECINUEVE",
  "20": "VEINTE",
  "21": "VEINTIUNO",
  "22": "VEINTIDOS",
  "23": "VEINTITRES",
  "24": "VEINTICUATRO",
  "25": "VEINTICINCO",
  "26": "VEINTISEIS",
  "27": "VEINTISIETE",
  "28": "VEINTIOCHO",
  "29": "VEINTINUEVE",
};
const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function decenas(n: number): string {
  const key = String(n);
  if (ESPECIALES[key]) return ESPECIALES[key];

  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function centenas(n: number): string {
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${decenas(resto)}`;
}

function miles(n: number): string {
  if (n === 0) return "";
  if (n < 10) {
    const prefix = n === 1 ? "" : UNIDADES[n];
    return `${prefix} MIL`;
  }

  const m = Math.floor(n / 1000);
  const resto = n % 1000;
  if (m < 10) {
    const prefix = m === 1 ? "" : UNIDADES[m];
    return resto === 0 ? `${prefix} MIL` : `${prefix} MIL ${centenas(resto)}`;
  }

  return resto === 0
    ? `${centenas(m)} MIL`
    : `${centenas(m)} MIL ${centenas(resto)}`;
}

function millones(n: number): string {
  if (n === 0) return "";
  const mm = Math.floor(n / 1000000);
  const resto = n % 1000000;
  if (mm < 10) {
    const singularOrPlural = mm === 1
      ? "UN MILLON"
      : `${UNIDADES[mm]} MILLONES`;
    return resto === 0
      ? singularOrPlural
      : `${singularOrPlural} ${miles(resto) || centenas(resto)}`;
  }

  const literal = `${centenas(mm)} MILLONES`;
  return resto === 0
    ? literal
    : `${literal} ${miles(resto) || centenas(resto)}`;
}

export function numeroALetras(n: number): string {
  if (n === 0) return "CERO";

  const entero = Math.floor(n);
  const centavos = Math.round((n - entero) * 100);
  let texto = "";

  if (entero >= 1000000) texto = millones(entero);
  else if (entero >= 1000) texto = miles(entero);
  else if (entero >= 100) texto = centenas(entero);
  else texto = decenas(entero);

  return `${texto} CON ${String(centavos).padStart(2, "0")}/100 SOLES`;
}
