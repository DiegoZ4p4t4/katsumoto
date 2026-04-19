import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentOrgId(): Promise<string> {
  const now = Date.now();
  if (orgIdCache.value && now - orgIdCache.timestamp < orgIdCache.ttl) {
    return orgIdCache.value;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (error || !profile) throw new Error("Perfil no encontrado");
  orgIdCache.value = profile.organization_id;
  orgIdCache.timestamp = now;
  return profile.organization_id;
}

const orgIdCache = { value: "", timestamp: 0, ttl: 5 * 60 * 1000 };

export function clearOrgIdCache() {
  orgIdCache.value = "";
  orgIdCache.timestamp = 0;
}
