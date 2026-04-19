import { error } from "./http.ts";
import type { SupabaseClientLike } from "./types.ts";

export function extractUserId(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

export async function resolveAuth(
  req: Request,
  supabase: SupabaseClientLike,
) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { error: error("Unauthorized", 401, "NO_AUTH") };

  const token = authHeader.replace("Bearer ", "");
  if (!token || token.length < 10) {
    return { error: error("Unauthorized: empty token", 401, "NO_AUTH") };
  }

  const userId = extractUserId(token);
  if (!userId) return { error: error("Invalid token", 401, "INVALID_TOKEN") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userId)
    .single();

  if (!profile) return { error: error("Profile not found", 403) };
  return {
    orgId: (profile as Record<string, unknown>).organization_id,
    role: (profile as Record<string, unknown>).role,
  };
}
