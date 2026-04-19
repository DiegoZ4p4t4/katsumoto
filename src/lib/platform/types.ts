export type PlatformType = "tauri" | "web";

export interface PrinterConfig {
  enabled: boolean;
  connectionType: "usb-serial" | "network-tcp" | "browser-pdf";
  paperWidth: 80 | 58;
  charsPerLine: 48 | 32 | 36;
  baudRate: 9600 | 19200 | 38400;
  serialPortName?: string;
  networkIp?: string;
  networkPort?: number;
  autoPrint: boolean;
  autoCut: boolean;
  openDrawer: boolean;
  copies: 1 | 2 | 3;
}

export interface PrinterAdapter {
  readonly type: "native" | "pdf";
  readonly supportsAutoPrint: boolean;
  readonly supportsCashDrawer: boolean;
  readonly supportsNetworkPrinter: boolean;
  printReceipt(escpos: Uint8Array): Promise<void>;
  printTest(): Promise<void>;
  openCashDrawer(): Promise<void>;
  getStatus(): Promise<"ready" | "disconnected" | "error" | "no-config">;
}

export interface HardwareAdapter {
  printer: PrinterAdapter;
  platform: PlatformType;
  isTauri: boolean;
}
