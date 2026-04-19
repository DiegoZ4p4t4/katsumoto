import type { PrinterAdapter } from "../types";
import { loadPrinterConfig } from "../printer-config";
import { buildTestReceipt } from "@/lib/printing/thermal";
import { generateThermalTicket } from "@/lib/printing/formats/thermal-ticket";

export class WebPrinterAdapter implements PrinterAdapter {
  readonly type = "pdf" as const;
  readonly supportsAutoPrint = false;
  readonly supportsCashDrawer = false;
  readonly supportsNetworkPrinter = false;

  async printReceipt(_escpos: Uint8Array): Promise<void> {
    throw new Error(
      "La impresión ESC/POS directa no está disponible en modo web. " +
      "Use printInvoice() o instale la versión desktop."
    );
  }

  async printReceiptFromInvoice(
    invoice: Parameters<typeof generateThermalTicket>[0],
    sellerInfo: Parameters<typeof generateThermalTicket>[1],
    options?: Parameters<typeof generateThermalTicket>[2],
  ): Promise<void> {
    await generateThermalTicket(invoice, sellerInfo, {
      ...options,
      action: "print",
    });
  }

  async printTest(): Promise<void> {
    const config = loadPrinterConfig();
    const result = buildTestReceipt(config.paperWidth);
    const textBlob = new Blob([result.text], { type: "text/plain" });
    const url = URL.createObjectURL(textBlob);
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async openCashDrawer(): Promise<void> {
  }

  async getStatus(): Promise<"no-config"> {
    return "no-config";
  }
}
