export type DbRecord = Record<string, unknown>;
export type SupabaseClientLike = any;

export interface SunatCredentials {
  ruc: unknown;
  razon_social: unknown;
  nombre_comercial: unknown;
  usuario_sol: unknown;
  clave_sol: unknown;
  certificado_path: unknown;
  certificado_password: unknown;
  ubigeo: unknown;
  departamento: unknown;
  provincia: unknown;
  distrito: unknown;
  direccion: unknown;
  modo_produccion: unknown;
  gre_version?: unknown;
  gre_client_id?: unknown;
  gre_client_secret?: unknown;
}

export interface SunatResult {
  success?: boolean;
  hash?: string | null;
  ticket?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  xml?: string | null;
  cdr_zip?: string | null;
  result?: unknown;
  [key: string]: unknown;
}

export interface SunatClient {
  testConnection(credentials: SunatCredentials): Promise<SunatResult>;
  checkTicket(
    credentials: SunatCredentials,
    ticket: string,
    kind: "summary" | "voided",
  ): Promise<SunatResult>;
  sendSummary(
    credentials: SunatCredentials,
    document: DbRecord,
  ): Promise<SunatResult>;
  sendVoided(
    credentials: SunatCredentials,
    document: DbRecord,
  ): Promise<SunatResult>;
  sendInvoice(
    credentials: SunatCredentials,
    document: DbRecord,
    kind: "invoice" | "boleta" | "credit-note" | "debit-note",
  ): Promise<SunatResult>;
  sendDespatch(
    credentials: SunatCredentials,
    document: DbRecord,
    greVersion?: string,
  ): Promise<SunatResult>;
  checkDespatchTicket(
    credentials: SunatCredentials,
    ticket: string,
  ): Promise<SunatResult>;
}
