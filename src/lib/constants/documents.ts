// ==========================================
// Tipos de Documento de Identidad
// ==========================================
export const DOCUMENT_TYPES = ["RUC", "DNI", "Pasaporte", "CE", "Otros"] as const;

export const DOCUMENT_LENGTHS: Record<string, { min: number; max: number }> = {
  RUC: { min: 11, max: 11 }, DNI: { min: 8, max: 8 }, Pasaporte: { min: 6, max: 12 }, CE: { min: 8, max: 12 }, Otros: { min: 1, max: 15 },
};
