export interface SunatConfig {
  id: string;
  organization_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  ubigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  usuario_sol: string;
  has_clave_sol: boolean;
  certificado_path: string | null;
  has_certificado_password: boolean;
  modo_produccion: boolean;
  is_configured: boolean;
  created_at: string;
  updated_at: string;
}

export interface SunatConfigFormData {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  usuario_sol: string;
  clave_sol: string;
  certificado_path?: string | null;
  certificado_password?: string | null;
  modo_produccion?: boolean;
}

export const INVOICE_TYPE_SUNAT_CODE: Record<string, string> = {
  factura: "01",
  boleta: "03",
  nota_credito: "07",
  nota_debito: "08",
};

export const DOCUMENT_TYPE_SUNAT_CODE: Record<string, string> = {
  RUC: "6",
  DNI: "1",
  Pasaporte: "7",
  CE: "4",
  Otros: "0",
};

export const TAX_AFFECTATION_SUNAT_CODE: Record<string, string> = {
  gravado: "10",
  exonerado: "20",
  inafecto: "30",
  exportacion: "40",
};

export const PAYMENT_METHOD_SUNAT: Record<string, string> = {
  cash: "Contado",
  debit_card: "Contado",
  credit_card: "Contado",
  transfer: "Contado",
  yape: "Contado",
  plin: "Contado",
  credit: "Credito",
};
