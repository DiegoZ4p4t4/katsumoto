import type { PrinterConfig } from "./types";

const STORAGE_KEY = "katsumoto-printer-config";

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  enabled: false,
  connectionType: "browser-pdf",
  paperWidth: 80,
  charsPerLine: 48,
  baudRate: 9600,
  autoPrint: false,
  autoCut: true,
  openDrawer: false,
  copies: 1,
};

export function loadPrinterConfig(): PrinterConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_PRINTER_CONFIG };
}

export function savePrinterConfig(config: PrinterConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
