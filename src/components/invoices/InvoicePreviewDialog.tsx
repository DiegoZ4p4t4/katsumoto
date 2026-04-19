import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { Invoice } from "@/lib/types";
import type { SellerInfo } from "@/lib/printing/seller-info";
import type { PrintOptions } from "@/lib/printing/types";
import { generateInvoice } from "@/lib/printing/generate";

interface InvoicePreviewDialogProps {
  invoice: Invoice | null;
  sellerInfo: SellerInfo | null;
  printOptions?: PrintOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewDialog({
  invoice,
  sellerInfo,
  printOptions,
  open,
  onOpenChange,
}: InvoicePreviewDialogProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoice || !sellerInfo) {
      setBlobUrl(null);
      return;
    }
    let cancelled = false;
    const opts: PrintOptions = { ...printOptions, action: "preview" };
    generateInvoice(invoice, sellerInfo, opts).then((doc) => {
      if (cancelled) return;
      const url = doc.output("bloburl") as string;
      setBlobUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, invoice, sellerInfo, printOptions]);

  if (!invoice) return null;

  const handleDownload = async () => {
    if (!sellerInfo) return;
    await generateInvoice(invoice, sellerInfo, { ...printOptions, action: "download" });
  };

  const handlePrint = async () => {
    if (!sellerInfo) return;
    await generateInvoice(invoice, sellerInfo, { ...printOptions, action: "print" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl rounded-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg">
              Vista Previa — {invoice.number}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={handlePrint}>
                <Printer className="w-4 h-4" />Imprimir
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleDownload}>
                <Download className="w-4 h-4" />Descargar
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="w-full h-[70vh] border rounded-xl overflow-hidden bg-muted/30">
          {blobUrl ? (
            <iframe src={blobUrl} className="w-full h-full border-0" title={`PDF ${invoice.number}`} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Generando vista previa...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
