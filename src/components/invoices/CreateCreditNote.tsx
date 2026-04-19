import { useState, useMemo } from "react";
import { formatCents } from "@/lib/format";
import { CREDIT_NOTE_REASONS } from "@/lib/constants/invoices";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { invoiceService } from "@/services/invoice.service";
import { sunatService } from "@/services/sunat.service";
import type { Invoice, InvoiceItem } from "@/lib/types";

interface SelectedItem {
  item: InvoiceItem;
  selected: boolean;
  returnQuantity: number;
}

interface CreateCreditNoteProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCreditNote({ invoice, open, onOpenChange, onSuccess }: CreateCreditNoteProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() =>
    (invoice.items || []).map((item) => ({
      item,
      selected: false,
      returnQuantity: item.quantity,
    }))
  );
  const [motivo, setMotivo] = useState("01");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const motivoInfo = CREDIT_NOTE_REASONS[motivo];

  const handleMotivoChange = (code: string) => {
    setMotivo(code);
    const info = CREDIT_NOTE_REASONS[code];
    if (info) setDescripcion(info.description);
  };

  const toggleItem = (index: number) => {
    setSelectedItems((prev) =>
      prev.map((si, i) => (i === index ? { ...si, selected: !si.selected } : si))
    );
  };

  const updateQuantity = (index: number, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((si, i) => {
        if (i !== index) return si;
        const clamped = Math.max(0, Math.min(qty, si.item.quantity));
        return { ...si, returnQuantity: clamped };
      })
    );
  };

  const selectAll = () => {
    const allSelected = selectedItems.every((si) => si.selected);
    setSelectedItems((prev) => prev.map((si) => ({ ...si, selected: !allSelected })));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let igv = 0;
    for (const si of selectedItems) {
      if (!si.selected || si.returnQuantity <= 0) continue;
      const ratio = si.returnQuantity / si.item.quantity;
      const lineTotal = Math.round(si.item.line_total_cents * ratio);
      const igvAmount = Math.round(si.item.igv_cents * ratio);
      subtotal += lineTotal;
      igv += igvAmount;
    }
    return { subtotal, igv, total: subtotal + igv };
  }, [selectedItems]);

  const ncItems = useMemo(() => {
    const items: Array<{
      product_id: string | null;
      product_name: string;
      product_sku: string | null;
      quantity: number;
      unit_price_cents: number;
      discount_percent: number;
      discount_cents: number;
      line_total_cents: number;
      tax_affectation: string;
      igv_cents: number;
    }> = [];
    for (const si of selectedItems) {
      if (!si.selected || si.returnQuantity <= 0) continue;
      const ratio = si.returnQuantity / si.item.quantity;
      items.push({
        product_id: si.item.product_id,
        product_name: si.item.product_name,
        product_sku: si.item.product_sku,
        quantity: si.returnQuantity,
        unit_price_cents: si.item.unit_price_cents,
        discount_percent: si.item.discount_percent,
        discount_cents: Math.round(si.item.discount_cents * ratio),
        line_total_cents: Math.round(si.item.line_total_cents * ratio),
        tax_affectation: si.item.tax_affectation,
        igv_cents: Math.round(si.item.igv_cents * ratio),
      });
    }
    return items;
  }, [selectedItems]);

  const canSubmit = ncItems.length > 0 && motivo && descripcion.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await invoiceService.createCreditNote({
        parentInvoiceId: invoice.id,
        items: ncItems,
        motivo,
        descripcion,
        branchId: invoice.branch_id,
      });

      showSuccess(`Nota de Crédito ${result.serie}-${String(result.correlativo).padStart(6, "0")} creada`);

      const parentType = invoice.invoice_type;

      if (parentType === "factura") {
        setSending(true);
        try {
          const sendResult = await sunatService.sendInvoice(result.invoice_id);
          if (sendResult.success) {
            showSuccess("NC enviada y aceptada por SUNAT");
          } else {
            showError(`SUNAT: ${sendResult.error_message || "Error al enviar NC"}`);
          }
        } catch (e) {
          showError(`Error enviando NC a SUNAT: ${(e as Error).message}`);
        } finally {
          setSending(false);
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Nota de Crédito
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Referencia: <span className="font-mono font-medium">{invoice.number}</span>
            {" · "}
            {invoice.customer?.name}
            {" · "}
            {formatCents(invoice.total_cents)}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Motivo SUNAT</Label>
              <select
                value={motivo}
                onChange={(e) => handleMotivoChange(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {Object.entries(CREDIT_NOTE_REASONS).map(([code, info]) => (
                  <option key={code} value={code}>
                    [{code}] {info.label}
                  </option>
                ))}
              </select>
              {motivoInfo && (
                <p className="text-xs text-muted-foreground">{motivoInfo.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Descripción del motivo</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items a devolver</Label>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>
                {selectedItems.every((si) => si.selected) ? "Deseleccionar todos" : "Seleccionar todos"}
              </Button>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="py-2 px-3 w-10"></th>
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Producto</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Cant. Original</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground w-24">Cant. Devolver</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((si, i) => (
                    <tr key={si.item.id} className={`border-b last:border-0 ${si.selected ? "bg-orange-50/50 dark:bg-orange-900/10" : ""}`}>
                      <td className="py-2 px-3">
                        <Checkbox checked={si.selected} onCheckedChange={() => toggleItem(i)} />
                      </td>
                      <td className="py-2 px-3">
                        <p>{si.item.product_name}</p>
                        {si.item.product_sku && (
                          <p className="text-xs text-muted-foreground">{si.item.product_sku}</p>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">{si.item.quantity}</td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={si.item.quantity}
                          value={si.returnQuantity}
                          onChange={(e) => updateQuantity(i, parseInt(e.target.value) || 0)}
                          disabled={!si.selected}
                          className="h-8 w-20 text-right ml-auto"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {si.selected && si.returnQuantity > 0
                          ? formatCents(Math.round(si.item.line_total_cents * (si.returnQuantity / si.item.quantity)))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {ncItems.length} ítem{ncItems.length !== 1 ? "s" : ""} seleccionado{ncItems.length !== 1 ? "s" : ""}
              </p>
              {totals.igv > 0 && (
                <p className="text-xs text-muted-foreground">
                  Subtotal: {formatCents(totals.subtotal)} + IGV: {formatCents(totals.igv)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total NC</p>
              <p className="text-2xl font-bold">{formatCents(totals.total)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {sending ? "Enviando a SUNAT..." : "Creando NC..."}
                </>
              ) : (
                "Emitir Nota de Crédito"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
