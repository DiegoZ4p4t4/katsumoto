export const INVOICE_TYPE_MAP: Record<string, string> = {
  factura: "01",
  boleta: "03",
  nota_credito: "07",
  nota_debito: "08",
};

export const DOC_TYPE_MAP: Record<string, string> = {
  RUC: "6",
  DNI: "1",
  Pasaporte: "7",
  CE: "4",
  Otros: "0",
};

export const TAX_AFFECTATION_MAP: Record<string, string> = {
  gravado: "10",
  exonerado: "20",
  inafecto: "30",
  exportacion: "40",
};

export const CERT_ERROR_MAP: Record<string, string> = {
  "2076": "El RUC no corresponde al certificado digital.",
  "2074": "Certificado digital expirado.",
  "2073": "Clave del certificado digital incorrecta.",
};

export const DESPATCH_TYPE = "09";

export const MOTIVO_TRASLADO_MAP: Record<string, string> = {
  "01": "Venta",
  "02": "Traslado entre establecimientos",
  "03": "Importacion",
  "04": "Recojo de bienes",
  "05": "Devolucion",
  "06": "Reposicion",
  "07": "Traslado emisor itinerante",
  "08": "Importacion con fin de transformacion",
  "09": "Traslado con fin de comercializacion",
  "10": "Traslado con fin de transformacion",
  "11": "Traslado con fin de venta a zona primaria",
  "12": "Traslado con fin de Exportacion",
  "13": "Traslado con fin de recepcion",
  "14": "Traslado con fin de devolucion",
};

export const VALID_ACTIONS = [
  "test",
  "send",
  "send-despatch",
  "debug-despatch",
  "check-despatch-ticket",
  "check-ticket",
  "send-summary",
  "send-voided",
  "check-summary-ticket",
];
