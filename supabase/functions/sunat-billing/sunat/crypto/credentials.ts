const ENCRYPTION_KEY = Deno.env.get("SUNAT_CREDENTIALS_KEY") ??
  "katsumoto-enc-key-2026";

async function deriveKey(): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(32);
  const encoded = new TextEncoder().encode(ENCRYPTION_KEY);
  keyBytes.set(encoded.slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
}

export async function tryDecrypt(value: string | null): Promise<string | null> {
  if (!value) return null;

  try {
    const combined = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    if (combined.length <= 12) return value;

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await deriveKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return value;
  }
}
