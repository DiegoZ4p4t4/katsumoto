import { supabase, getCurrentOrgId } from "@/lib/supabase";
import type {
  Despatch,
  DespatchFormData,
  DespatchItem,
} from "@/lib/types/despatch";

export const despatchService = {
  async getAll(): Promise<Despatch[]> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("despatches")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Despatch | null> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("despatches")
      .select("*, items:despatch_items(*)")
      .eq("organization_id", orgId)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getItems(despatchId: string): Promise<DespatchItem[]> {
    const { data, error } = await supabase
      .from("despatch_items")
      .select("*")
      .eq("despatch_id", despatchId)
      .order("created_at");
    if (error) throw error;
    return data;
  },

  async getNextCorrelativo(serie: string): Promise<number> {
    const orgId = await getCurrentOrgId();
    const { data, error } = await supabase
      .from("despatches")
      .select("correlativo")
      .eq("organization_id", orgId)
      .eq("serie", serie)
      .order("correlativo", { ascending: false })
      .limit(1);
    if (error) throw error;
    const max = data?.[0]?.correlativo || 0;
    return max + 1;
  },

  async create(
    formData: DespatchFormData,
  ): Promise<{ id: string; serie: string; correlativo: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const orgId = await getCurrentOrgId();
    const serie = "T001";
    const correlativo = await this.getNextCorrelativo(serie);

    const { data, error } = await supabase
      .from("despatches")
      .insert({
        organization_id: orgId,
        branch_id: formData.branch_id,
        serie,
        correlativo,
        status: "issued",
        issue_date: new Date().toISOString().split("T")[0],
        motivo_traslado: formData.motivo_traslado,
        descripcion_motivo: formData.descripcion_motivo,
        fecha_inicio_traslado: formData.fecha_inicio_traslado,
        peso_bruto_total: formData.peso_bruto_total,
        numero_bultos: formData.numero_bultos,
        remitente_ubigeo: formData.remitente_ubigeo,
        remitente_direccion: formData.remitente_direccion,
        destino_ubigeo: formData.destino_ubigeo,
        destino_direccion: formData.destino_direccion,
        destinatario_tipo_doc: formData.destinatario_tipo_doc,
        destinatario_documento: formData.destinatario_documento,
        destinatario_nombre: formData.destinatario_nombre,
        transportista_tipo_doc: formData.transportista_tipo_doc,
        transportista_documento: formData.transportista_documento,
        transportista_nombre: formData.transportista_nombre,
        conductor_tipo_doc: formData.conductor_tipo_doc,
        conductor_documento: formData.conductor_documento,
        conductor_nombre: formData.conductor_nombre,
        conductor_licencia: formData.conductor_licencia,
        vehiculo_placa: formData.vehiculo_placa,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        const retryCorrelativo = await this.getNextCorrelativo(serie);
        const { data: retryData, error: retryError } = await supabase
          .from("despatches")
          .insert({
            organization_id: orgId,
            branch_id: formData.branch_id,
            serie,
            correlativo: retryCorrelativo,
            status: "issued",
            issue_date: new Date().toISOString().split("T")[0],
            motivo_traslado: formData.motivo_traslado,
            descripcion_motivo: formData.descripcion_motivo,
            fecha_inicio_traslado: formData.fecha_inicio_traslado,
            peso_bruto_total: formData.peso_bruto_total,
            numero_bultos: formData.numero_bultos,
            remitente_ubigeo: formData.remitente_ubigeo,
            remitente_direccion: formData.remitente_direccion,
            destino_ubigeo: formData.destino_ubigeo,
            destino_direccion: formData.destino_direccion,
            destinatario_tipo_doc: formData.destinatario_tipo_doc,
            destinatario_documento: formData.destinatario_documento,
            destinatario_nombre: formData.destinatario_nombre,
            transportista_tipo_doc: formData.transportista_tipo_doc,
            transportista_documento: formData.transportista_documento,
            transportista_nombre: formData.transportista_nombre,
            conductor_tipo_doc: formData.conductor_tipo_doc,
            conductor_documento: formData.conductor_documento,
            conductor_nombre: formData.conductor_nombre,
            conductor_licencia: formData.conductor_licencia,
            vehiculo_placa: formData.vehiculo_placa,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (retryError) throw retryError;

        const despatchId = retryData.id;
        if (formData.items.length > 0) {
          const { error: itemsError } = await supabase
            .from("despatch_items")
            .insert(
              formData.items.map((item) => ({
                despatch_id: despatchId,
                product_id: item.product_id || null,
                product_name: item.product_name,
                product_sku: item.product_sku || null,
                quantity: item.quantity,
                unit: item.unit || "NIU",
              })),
            );
          if (itemsError) throw itemsError;
        }
        return { id: despatchId, serie, correlativo: retryCorrelativo };
      }
      throw error;
    }

    const despatchId = data.id;
    if (formData.items.length > 0) {
      const { error: itemsError } = await supabase
        .from("despatch_items")
        .insert(
          formData.items.map((item) => ({
            despatch_id: despatchId,
            product_id: item.product_id || null,
            product_name: item.product_name,
            product_sku: item.product_sku || null,
            quantity: item.quantity,
            unit: item.unit || "NIU",
          })),
        );
      if (itemsError) throw itemsError;
    }
    return { id: despatchId, serie, correlativo };
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const orgId = await getCurrentOrgId();
    const { error } = await supabase
      .from("despatches")
      .update({ status })
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
  },
};
