import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { HardwareAdapter, PlatformType, PrinterAdapter } from "./types";
import { detectPlatform } from "./detector";
import { WebPrinterAdapter } from "./adapters/web-printer";

const PlatformContext = createContext<HardwareAdapter | null>(null);

async function createTauriAdapter(): Promise<PrinterAdapter> {
  const adapterPath = ["./adapters", "tauri-printer"].join("/");
  const mod = await import(/* @vite-ignore */ adapterPath);
  return new mod.TauriPrinterAdapter();
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<HardwareAdapter>(() => {
    const platform: PlatformType = detectPlatform();
    return {
      printer: new WebPrinterAdapter(),
      platform,
      isTauri: platform === "tauri",
    };
  });

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const platform = detectPlatform();
    if (platform !== "tauri") return;

    createTauriAdapter().then((printer) => {
      setAdapter({ printer, platform: "tauri", isTauri: true });
    }).catch(() => {});
  }, []);

  return (
    <PlatformContext.Provider value={adapter}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform(): HardwareAdapter {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return ctx;
}
