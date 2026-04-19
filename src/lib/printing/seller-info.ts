import { supabase, getCurrentOrgId } from "@/lib/supabase";

export interface SellerInfo {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

export async function getSellerInfo(): Promise<SellerInfo> {
  const orgId = await getCurrentOrgId();

  const [orgResult, sunatResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("ruc, name, address, phone, email, logo_url")
      .eq("id", orgId)
      .single(),
    supabase
      .from("sunat_config")
      .select("ruc, razon_social, nombre_comercial, direccion, ubigeo, departamento, provincia, distrito")
      .eq("organization_id", orgId)
      .single(),
  ]);

  const org = orgResult.data;
  const sunat = sunatResult.data;

  return {
    ruc: sunat?.ruc || org?.ruc || "",
    razonSocial: sunat?.razon_social || org?.name || "",
    nombreComercial: sunat?.nombre_comercial || org?.name || "",
    direccion: sunat?.direccion || org?.address || "",
    departamento: sunat?.departamento || "",
    provincia: sunat?.provincia || "",
    distrito: sunat?.distrito || "",
    ubigeo: sunat?.ubigeo || "",
    phone: org?.phone || "",
    email: org?.email || "",
    logoUrl: org?.logo_url || undefined,
  };
}
