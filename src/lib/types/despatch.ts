export type DespatchStatus = "draft" | "issued" | "accepted" | "cancelled";

export type MotivoTraslado =
  | "01" | "02" | "03" | "04" | "05" | "06" | "07"
  | "08" | "09" | "10" | "11" | "12" | "13" | "14";

export const MOTIVO_TRASLADO_LABELS: Record<MotivoTraslado, string> = {
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

export interface DespatchItem {
  id: string;
  despatch_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface Despatch {
  id: string;
  organization_id: string;
  branch_id: string;
  serie: string;
  correlativo: number;
  status: DespatchStatus;
  issue_date: string;
  motivo_traslado: MotivoTraslado;
  descripcion_motivo: string;
  fecha_inicio_traslado: string;
  peso_bruto_total: number;
  numero_bultos: number;
  remitente_ubigeo: string;
  remitente_direccion: string;
  destino_ubigeo: string;
  destino_direccion: string;
  destinatario_tipo_doc: string;
  destinatario_documento: string;
  destinatario_nombre: string;
  transportista_tipo_doc: string;
  transportista_documento: string;
  transportista_nombre: string;
  conductor_tipo_doc: string;
  conductor_documento: string;
  conductor_nombre: string;
  conductor_licencia: string;
  vehiculo_placa: string;
  sunat_hash: string | null;
  sunat_xml_path: string | null;
  sunat_cdr_path: string | null;
  sunat_ticket: string | null;
  sunat_error_code: string | null;
  sunat_error_message: string | null;
  sunat_sent_at: string | null;
  sunat_accepted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: DespatchItem[];
}

export interface DespatchItemFormData {
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit?: string;
}

export interface DespatchFormData {
  branch_id: string;
  motivo_traslado: MotivoTraslado;
  descripcion_motivo: string;
  fecha_inicio_traslado: string;
  peso_bruto_total: number;
  numero_bultos: number;
  remitente_ubigeo: string;
  remitente_direccion: string;
  destino_ubigeo: string;
  destino_direccion: string;
  destinatario_tipo_doc: string;
  destinatario_documento: string;
  destinatario_nombre: string;
  transportista_tipo_doc: string;
  transportista_documento: string;
  transportista_nombre: string;
  conductor_tipo_doc: string;
  conductor_documento: string;
  conductor_nombre: string;
  conductor_licencia: string;
  vehiculo_placa: string;
  items: DespatchItemFormData[];
}
