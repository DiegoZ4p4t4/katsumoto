import { useState } from "react";
import { formatCents } from "@/lib/format";
import type { Cents, PaymentMethod } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, CreditCard, ArrowLeftRight, Clock, CheckCircle, Download, Sparkles, Smartphone, Printer, type LucideIcon } from "lucide-react";

const _iconMap: Record<string, LucideIcon> = { Banknote, CreditCard, ArrowLeftRight, Clock, Smartphone };

const methodConfig: Record<PaymentMethod, { label: string; icon: LucideIcon; color: string; bg: string; desc: string }> = {
  cash: { label: "Efectivo", icon: Banknote, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40", desc: "Pago en efectivo" },
  debit_card: { label: "Tarj. Débito", icon: CreditCard, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40", desc: "Tarjeta de débito" },
  credit_card: { label: "Tarj. Crédito", icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40", desc: "Tarjeta de crédito" },
  transfer: { label: "Transferencia", icon: ArrowLeftRight, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40", desc: "Transferencia bancaria" },
  yape: { label: "Yape", icon: Smartphone, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40", desc: "Pago con Yape" },
  plin: { label: "Plin", icon: Smartphone, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20 hover:border-teal-500/40", desc: "Pago con Plin" },
  credit: { label: "Crédito 30d", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40", desc: "Pago a 30 días" },
};

interface PosPaymentDialogProps {
  open: boolean;
  totalCents: Cents;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  lastInvoiceNumber?: string;
  onDownloadPDF?: () => void;
  onPrintTicket?: () => void;
}

export function PosPaymentDialog({ open, totalCents, onClose, onConfirm, lastInvoiceNumber, onDownloadPDF, onPrintTicket }: PosPaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [success, setSuccess] = useState(false);

  const receivedCents = Math.round(Number(cashReceived) * 100);
  const change = cashReceived ? Math.max(0, receivedCents - totalCents) : 0;
  const isCashShort = method === "cash" && cashReceived && receivedCents < totalCents;
  const canConfirm = method !== "cash" || receivedCents >= totalCents;

  const handleConfirm = () => {
    setSuccess(true);
    onConfirm(method);
  };

  const handleClose = () => {
    setSuccess(false);
    setCashReceived("");
    setMethod("cash");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-slate-800 bg-slate-950 text-white">
        {success ? (
          <div className="py-10 px-8">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping opacity-20" />
                <div className="relative w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-500/30">
                  <CheckCircle className="w-12 h-12 text-orange-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">¡Venta Exitosa!</h3>
              <p className="text-slate-400 text-sm mb-4">El comprobante se emitió correctamente</p>
              {lastInvoiceNumber && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 mb-6">
                  <ReceiptIcon className="w-4 h-4 text-orange-400" />
                  <span className="font-mono font-semibold text-sm">{lastInvoiceNumber}</span>
                </div>
              )}
              {method === "cash" && change > 0 && (
                <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 mb-6">
                  <p className="text-xs text-orange-400 font-medium mb-1">Cambio a devolver</p>
                  <p className="text-3xl font-bold text-orange-400 tabular-nums">{formatCents(change as Cents)}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                {onPrintTicket && (
                  <Button variant="outline" className="rounded-xl bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:text-white" onClick={onPrintTicket}>
                    <Printer className="w-4 h-4 mr-2" />Ticket Térmico
                  </Button>
                )}
                {onDownloadPDF && (
                  <Button variant="outline" className="rounded-xl bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:text-white" onClick={onDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />PDF A4
                  </Button>
                )}
                <Button className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white border-0" onClick={handleClose}>
                  <Sparkles className="w-4 h-4 mr-2" />Nueva Venta
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500" />
              <DialogHeader className="relative">
                <DialogTitle className="text-xl text-white text-center pt-6 pb-2">Procesar Cobro</DialogTitle>
              </DialogHeader>
              <div className="relative text-center pb-6">
                <p className="text-orange-100 text-xs mb-1">Total a cobrar</p>
                <p className="text-4xl font-bold text-white tabular-nums">{formatCents(totalCents)}</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Método de Pago</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.entries(methodConfig) as [PaymentMethod, typeof methodConfig[PaymentMethod]][]).map(([key, mc]) => {
                    const isActive = method === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setMethod(key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          isActive ? mc.bg + " border-current" : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <mc.icon className={`w-5 h-5 ${isActive ? mc.color : "text-slate-500"}`} />
                          <div>
                            <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-400"}`}>{mc.label}</p>
                            <p className="text-[10px] text-slate-500">{mc.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {method === "cash" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Efectivo Recibido (S/.)</p>
                    <Input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="rounded-2xl h-14 text-xl text-center font-bold bg-slate-900 border-slate-700 text-white focus:ring-orange-500 focus:border-orange-500 tabular-nums"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {[{ label: "S/ 20", value: 20 }, { label: "S/ 50", value: 50 }, { label: "S/ 100", value: 100 }, { label: "S/ 200", value: 200 }, { label: "Exacto", value: totalCents / 100 }].map((amt) => (
                      <button key={amt.label} onClick={() => setCashReceived(String(amt.value))} className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30 transition-all">
                        {amt.label}
                      </button>
                    ))}
                  </div>
                  {cashReceived && (
                    <div className={`p-4 rounded-2xl text-center transition-all ${isCashShort ? "bg-red-500/10 border border-red-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}>
                      <p className={`text-xs font-medium mb-1 ${isCashShort ? "text-red-400" : "text-orange-400"}`}>{isCashShort ? "Falta" : "Cambio"}</p>
                      <p className={`text-3xl font-bold tabular-nums ${isCashShort ? "text-red-400" : "text-orange-400"}`}>
                        {isCashShort ? formatCents((totalCents - receivedCents) as Cents) : formatCents(change as Cents)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleConfirm} disabled={!canConfirm} className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-lg font-bold text-white shadow-xl shadow-orange-900/50 border-0 disabled:opacity-40 disabled:shadow-none transition-all">
                Confirmar Venta — {formatCents(totalCents)}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}