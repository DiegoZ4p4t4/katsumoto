interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

const REFRESH_BUFFER_MS = 10 * 60 * 1000;

export function getCachedToken(): string | null {
  if (!cachedToken) return null;
  if (Date.now() >= cachedToken.expiresAt - REFRESH_BUFFER_MS) {
    cachedToken = null;
    return null;
  }
  return cachedToken.accessToken;
}

export function setCachedToken(accessToken: string, expiresIn: number): void {
  cachedToken = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export function clearTokenCache(): void {
  cachedToken = null;
}
