// ==========================================
// EAN-13 Barcode Generation
// Standard: GS1 Perú (prefix 775)
// Company code: 0001 (Katsumoto demo)
// ==========================================

const GS1_PREFIX = "775"; // Perú
const COMPANY_CODE = "0001"; // Katsumoto demo

/**
 * Genera un código de barras EAN-13 válido.
 * Formato: [GS1 Prefix 3][Company 4][Product 5][Check 1] = 13 dígitos
 */
export function generateBarcode(productSequential: number): string {
  const productCode = String(productSequential).padStart(5, "0");
  const base12 = GS1_PREFIX + COMPANY_CODE + productCode;
  const checkDigit = calculateEAN13CheckDigit(base12);
  return base12 + checkDigit;
}

/**
 * Calcula el dígito de verificación EAN-13.
 */
export function calculateEAN13CheckDigit(digits12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * Valida que un código EAN-13 sea correcto.
 */
export function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const base = code.slice(0, 12);
  const check = code.slice(12);
  return calculateEAN13CheckDigit(base) === check;
}

// ==========================================
// EAN-13 Visual Encoding (SVG bars)
// ==========================================

const L_PATTERNS = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];

const G_PATTERNS = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];

const R_PATTERNS = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];

const FIRST_DIGIT_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

/**
 * Encodes an EAN-13 code into a binary string for SVG rendering.
 * Returns a string of 95 binary digits (modules).
 */
export function encodeEAN13(code13: string): string {
  const firstDigit = parseInt(code13[0], 10);
  const parity = FIRST_DIGIT_PARITY[firstDigit];

  let binary = "";

  binary += "101";

  for (let i = 0; i < 6; i++) {
    const digit = parseInt(code13[i + 1], 10);
    const pattern = parity[i] === "L" ? L_PATTERNS[digit] : G_PATTERNS[digit];
    binary += pattern;
  }

  binary += "01010";

  for (let i = 0; i < 6; i++) {
    const digit = parseInt(code13[i + 7], 10);
    binary += R_PATTERNS[digit];
  }

  binary += "101";

  return binary;
}