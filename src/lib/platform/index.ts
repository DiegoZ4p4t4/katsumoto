export type { PlatformType, PrinterConfig, PrinterAdapter, HardwareAdapter } from "./types";
export { detectPlatform } from "./detector";
export { PlatformProvider, usePlatform } from "./platform-context";
export { loadPrinterConfig, savePrinterConfig, DEFAULT_PRINTER_CONFIG } from "./printer-config";
export { WebPrinterAdapter } from "./adapters/web-printer";
