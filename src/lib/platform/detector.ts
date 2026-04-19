import type { PlatformType } from "./types";

export function detectPlatform(): PlatformType {
  return "__TAURI_INTERNALS__" in window ? "tauri" : "web";
}
