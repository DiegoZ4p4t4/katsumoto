import type { SupabaseClientLike } from "./types.ts";

export async function verifyCertInStorage(
  supabase: SupabaseClientLike,
  certPath: string | null,
): Promise<boolean> {
  if (!certPath) return false;

  const lastSlash = certPath.lastIndexOf("/");
  const dir = certPath.substring(0, lastSlash);
  const fileName = certPath.substring(lastSlash + 1);
  const { data, error: lsError } = await supabase.storage.from(
    "sunat-documents",
  ).list(dir);

  if (lsError || !data) return false;
  return data.some((file: { name: string }) => file.name === fileName);
}
