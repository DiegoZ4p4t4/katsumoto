import { DirectSunatClient } from "./direct-client.ts";
import type { SupabaseClientLike } from "./types.ts";

export function createSunatClient(
  supabase: SupabaseClientLike,
) {
  return new DirectSunatClient(supabase);
}
