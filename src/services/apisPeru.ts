import { supabase } from "@/lib/supabase";

export interface ApisPeruRucResult {
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  telefonos: string[];
  tipo: string | null;
  estado: string;
  condicion: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
}

export interface ApisPeruDniResult {
  success: boolean;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  codVerifica: number;
  codVerificaLetra: string;
}

async function callProxy(type: "ruc" | "dni", number: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("apis-peru-proxy", {
    body: { type, number },
  });

  if (error) {
    const message = error.message || "Error al consultar el servicio";
    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function queryRuc(ruc: string): Promise<ApisPeruRucResult> {
  const data = await callProxy("ruc", ruc);
  if (!data.ruc) throw new Error("RUC no encontrado en SUNAT");
  return data;
}

export async function queryDni(dni: string): Promise<ApisPeruDniResult> {
  const data = await callProxy("dni", dni);
  if (!data.success) throw new Error("DNI no encontrado en RENIEC");
  return data;
}
