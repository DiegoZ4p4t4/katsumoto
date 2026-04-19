import type { PrinterAdapter } from "../types";
import { loadPrinterConfig } from "../printer-config";
import { buildTestReceipt } from "@/lib/printing/thermal";

type TauriInvoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

async function getInvoke(): Promise<TauriInvoke> {
  const mod = await import(/* @vite-ignore */ ["@tauri-apps/api", "core"].join("/"));
  return mod.invoke as TauriInvoke;
}

export class TauriPrinterAdapter implements PrinterAdapter {
  readonly type = "native" as const;
  readonly supportsAutoPrint = true;
  readonly supportsCashDrawer = true;
  readonly supportsNetworkPrinter = true;

  async printReceipt(escpos: Uint8Array): Promise<void> {
    const config = loadPrinterConfig();
    const invoke = await getInvoke();
    const data = Array.from(escpos);

    if (config.connectionType === "usb-serial") {
      await invoke("print_escpos", {
        portName: config.serialPortName,
        baudRate: config.baudRate,
        data,
      });
    } else if (config.connectionType === "network-tcp") {
      await invoke("print_tcp", {
        host: config.networkIp,
        port: config.networkPort ?? 9100,
        data,
      });
    } else {
      throw new Error("Tipo de conexion no soportado para impresion nativa");
    }
  }

  async printTest(): Promise<void> {
    const config = loadPrinterConfig();
    const result = buildTestReceipt(config.paperWidth);
    await this.printReceipt(result.escpos);
  }

  async openCashDrawer(): Promise<void> {
    const config = loadPrinterConfig();
    const invoke = await getInvoke();

    if (config.connectionType === "usb-serial") {
      await invoke("open_cash_drawer", {
        portName: config.serialPortName,
        baudRate: config.baudRate,
      });
    } else if (config.connectionType === "network-tcp") {
      await invoke("open_cash_drawer_tcp", {
        host: config.networkIp,
        port: config.networkPort ?? 9100,
      });
    }
  }

  async getStatus(): Promise<"ready" | "disconnected" | "error" | "no-config"> {
    const config = loadPrinterConfig();
    if (!config.enabled || config.connectionType === "browser-pdf") {
      return "no-config";
    }

    try {
      const invoke = await getInvoke();

      if (config.connectionType === "usb-serial") {
        return (await invoke("check_printer_status", {
          portName: config.serialPortName,
          baudRate: config.baudRate,
        })) as "ready" | "disconnected";
      }

      if (config.connectionType === "network-tcp") {
        return (await invoke("check_tcp_printer_status", {
          host: config.networkIp,
          port: config.networkPort ?? 9100,
        })) as "ready" | "disconnected";
      }

      return "no-config";
    } catch {
      return "error";
    }
  }

  async listSerialPorts(): Promise<string[]> {
    const invoke = await getInvoke();
    return (await invoke("list_serial_ports")) as string[];
  }
}
