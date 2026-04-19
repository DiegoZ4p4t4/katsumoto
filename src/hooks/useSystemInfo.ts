import { useQuery } from "@tanstack/react-query";
import { usePlatform } from "@/lib/platform";
import { supabase } from "@/lib/supabase";

export interface SystemInfo {
  version: string;
  platform: string;
  arch: string;
  companyName: string;
  ruc: string;
  sunatMode: string;
}

export function useSystemInfo() {
  const { isTauri } = usePlatform();

  const { data: sunatConfig } = useQuery({
    queryKey: ["sunat-config"],
    queryFn: async () => {
      const { data } = await supabase.from("sunat_config").select("*").single();
      return data;
    },
  });

  const info: SystemInfo = {
    version: __APP_VERSION__,
    platform: isTauri ? "macOS" : "Web",
    arch: "aarch64",
    companyName: sunatConfig?.razon_social ?? "Katsumoto",
    ruc: sunatConfig?.ruc ?? "20608183672",
    sunatMode: sunatConfig?.modo_sunat === "produccion" ? "Produccion" : "Beta",
  };

  return info;
}
