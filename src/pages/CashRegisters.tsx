import { useState, useMemo, useCallback } from "react";
import { useRegisters } from "@/hooks/useRegisters";
import { useRegisterMutations } from "@/hooks/useRegisterMutations";
import { useBranches } from "@/hooks/useBranches";
import { formatCents, formatDate } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import type { CashRegister, Cents } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, Plus, Eye, Lock, Unlock, Clock, Building2,
  AlertTriangle, TrendingUp, Banknote, CreditCard, Smartphone, ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const _methodIcons: Record<string, LucideIcon> = { Banknote, CreditCard, Smartphone, ArrowLeftRight, Clock };

export default function CashRegisters() {
  const {
    registers: allRegisters,
    eligibleBranches,
    getTransactions,
    selectedBranchId,
  } = useRegisters();
  const { getBranchName } = useBranches();
  const { openRegister, closeRegister: closeRegisterMutation } = useRegisterMutations();

  const branchId = selectedBranchId;

  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialogId, setCloseDialogId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [dialogBranchId, setDialogBranchId] = useState("");
  const [closingAmount, setClosingAmount] = useState("");

  const registers = useMemo(() => {
    const regs = branchId === "all" ? allRegisters : allRegisters.filter(r => r.branch_id === branchId);
    return [...regs].sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  }, [allRegisters, branchId]);

  const openRegisters = useMemo(() => registers.filter(r => r.status === "open"), [registers]);
  const closedRegisters = useMemo(() => registers.filter(r => r.status === "closed"), [registers]);

  const getSummary = useCallback((reg: CashRegister) => {
    const txns = getTransactions(reg.id);
    const byMethod: Record<string, { count: number; total: number }> = {};
    for (const t of txns) {
      if (!byMethod[t.payment_method]) byMethod[t.payment_method] = { count: 0, total: 0 };
      byMethod[t.payment_method].count += 1;
      byMethod[t.payment_method].total += t.amount_cents;
    }
    const total = txns.reduce((s, t) => s + t.amount_cents, 0);
    const cashTotal = txns.filter(t => t.payment_method === "cash").reduce((s, t) => s + t.amount_cents, 0);
    const expectedCash = reg.opening_amount_cents + cashTotal;
    return { txns, byMethod, total, cashTotal, expectedCash };
  }, [getTransactions]);

  const handleOpen = () => {
    const branchToUse = branchId !== "all" ? branchId : dialogBranchId;
    if (!branchToUse) { showError("Selecciona una sede"); return; }

    const existingOpen = allRegisters.find(
      r => r.branch_id === branchToUse && r.status === "open"
    );
    if (existingOpen) {
      const branchName = eligibleBranches.find(b => b.id === branchToUse)?.name || "—";
      showError(`Ya existe una caja abierta para ${branchName} (Caja #${existingOpen.number})`);
      return;
    }

    const amount = Math.round(Number(openingAmount) * 100);
    if (amount < 0) { showError("Monto inválido"); return; }
    openRegister(branchToUse, amount);
    showSuccess(`Caja abierta`);
    setOpenDialog(false);
    setOpeningAmount("");
    setDialogBranchId("");
  };

  const handleClose = () => {
    if (!closeDialogId) return;
    const amount = Math.round(Number(closingAmount) * 100);
    const closeReg = allRegisters.find(r => r.id === closeDialogId);
    if (!closeReg) return;
    const summary = getSummary(closeReg);
    closeRegisterMutation(closeDialogId, amount, summary.expectedCash);
    showSuccess("Caja cerrada correctamente");
    setCloseDialogId(null);
    setClosingAmount("");
    setCloseNotes("");
  };

  const closeRegister = allRegisters.find(r => r.id === closeDialogId);
  const closeSummary = closeRegister ? getSummary(closeRegister) : null;

  const detailRegister = allRegisters.find(r => r.id === detailId);
  const detailSummary = detailRegister ? getSummary(detailRegister) : null;

  const summaryMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getSummary>>();
    for (const reg of registers) {
      map.set(reg.id, getSummary(reg));
    }
    return map;
  }, [registers, getSummary]);

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return registers
      .filter(r => r.opened_at.startsWith(today))
      .reduce((s, r) => s + (summaryMap.get(r.id)?.total ?? 0), 0);
  }, [registers, summaryMap]);

  const allTimeTotal = useMemo(() => {
    return registers.reduce((s, r) => s + (summaryMap.get(r.id)?.total ?? 0), 0);
  }, [registers, summaryMap]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Cajas</h1>
          <HelpHint {...HELP_TEXTS.cashRegisters} />
        </div>
        <Button onClick={() => setOpenDialog(true)} disabled={eligibleBranches.length === 0} className="rounded-xl bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />Abrir Caja
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center"><Unlock className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
            <div><p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Abiertas</p><p className="text-xl font-bold text-orange-700 dark:text-orange-300">{openRegisters.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Cerradas</p><p className="text-xl font-bold text-blue-700 dark:text-blue-300">{closedRegisters.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
            <div><p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Ventas Hoy</p><p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCents(todayTotal)}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center"><Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
            <div><p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Total Histórico</p><p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCents(allTimeTotal)}</p></div>
          </CardContent>
        </Card>
      </div>

      {openRegisters.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cajas Abiertas</p>
          {openRegisters.map((reg) => {
            const summary = getSummary(reg);
            return (
              <Card key={reg.id} className="rounded-2xl shadow-sm border-2 border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Unlock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">Caja #{reg.number}</span>
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200 dark:border-orange-800 rounded-lg text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mr-1.5" />ABIERTA
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{getBranchName(reg.branch_id)}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />Abierta: {formatDate(reg.opened_at)} · {new Date(reg.opened_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Fondo: {formatCents(reg.opening_amount_cents)}</p>
                        <p className="text-xs text-muted-foreground">{summary.txns.length} transacciones</p>
                        <p className="text-lg font-bold">{formatCents(summary.total)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => setDetailId(reg.id)}>
                          <Eye className="w-3 h-3 mr-1" />Detalle
                        </Button>
                        <Button size="sm" className="rounded-xl text-xs h-8 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setCloseDialogId(reg.id); setClosingAmount(""); }}>
                          <Lock className="w-3 h-3 mr-1" />Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {closedRegisters.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial de Cajas</p>
          <div className="space-y-2">
            {closedRegisters.map((reg) => {
              const summary = getSummary(reg);
              const diff = reg.difference_cents ?? 0;
              return (
                <Card key={reg.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Lock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Caja #{reg.number}</span>
                            <Badge variant="secondary" className="text-[10px] rounded-lg">{getBranchName(reg.branch_id)}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(reg.opened_at)} · {summary.txns.length} ventas · {formatCents(summary.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {diff !== 0 && (
                          <Badge className={`text-[10px] rounded-lg ${diff > 0 ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"}`}>
                            {diff > 0 ? "+" : ""}{formatCents(diff)}
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => setDetailId(reg.id)}>
                          <Eye className="w-3 h-3 mr-1" />Ver Detalle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {registers.length === 0 && (
        <div className="text-center py-16">
          <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay cajas registradas</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Abre una caja para comenzar a registrar ventas</p>
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl">Abrir Nueva Caja</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {branchId === "all" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Sede *</p>
                <Select value={dialogBranchId} onValueChange={setDialogBranchId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                  <SelectContent>
                    {eligibleBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {eligibleBranches.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Todas las sedes elegibles ya tienen una caja abierta
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Fondo Inicial (S/.) *</p>
              <Input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="rounded-xl h-12 text-lg font-bold text-center" placeholder="0.00" autoFocus />
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map(amt => (
                  <button key={amt} onClick={() => setOpeningAmount(String(amt))} className="flex-1 py-2 rounded-xl border text-xs font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                    S/ {amt.toLocaleString("es-PE")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleOpen} disabled={!openingAmount || (branchId === "all" && !dialogBranchId)} className="rounded-xl bg-orange-600 hover:bg-orange-700">
              <Unlock className="w-4 h-4 mr-2" />Abrir Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!closeDialogId} onOpenChange={() => setCloseDialogId(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl">Cerrar Caja #{closeRegister?.number}</DialogTitle></DialogHeader>
          {closeRegister && closeSummary && (
            <div className="space-y-5 py-2">
              <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resumen de Ventas</p>
                {Object.entries(closeSummary.byMethod).map(([method, data]) => {
                  const info = PAYMENT_METHODS[method];
                  return (
                    <div key={method} className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${info?.color || "text-foreground"}`}>{info?.label || method}</span>
                      <span className="font-medium">{formatCents(data.total)} <span className="text-muted-foreground text-xs">({data.count})</span></span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCents(closeSummary.total)}</span>
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 space-y-1.5">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Arqueo de Efectivo</p>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fondo inicial</span><span>{formatCents(closeRegister.opening_amount_cents)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">+ Ventas en efectivo</span><span>{formatCents(closeSummary.cashTotal)}</span></div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-orange-200 dark:border-orange-800"><span>Esperado en caja</span><span>{formatCents(closeSummary.expectedCash)}</span></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Efectivo Contado (S/.) *</p>
                <Input type="number" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} className="rounded-xl h-12 text-lg font-bold text-center" placeholder="0.00" autoFocus />
              </div>
              {closingAmount && (
                <div className={`p-4 rounded-xl text-center ${Math.round(Number(closingAmount) * 100) === closeSummary.expectedCash ? "bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800" : "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"}`}>
                  <p className={`text-xs font-medium mb-1 ${Math.round(Number(closingAmount) * 100) === closeSummary.expectedCash ? "text-orange-600 dark:text-orange-400" : "text-amber-600 dark:text-amber-400"}`}>
                    Diferencia
                  </p>
                  <p className={`text-2xl font-bold ${Math.round(Number(closingAmount) * 100) === closeSummary.expectedCash ? "text-orange-600 dark:text-orange-400" : Math.round(Number(closingAmount) * 100) > closeSummary.expectedCash ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCents((Math.round(Number(closingAmount) * 100) - closeSummary.expectedCash) as Cents)}
                  </p>
                  {Math.round(Number(closingAmount) * 100) !== closeSummary.expectedCash && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(Number(closingAmount) * 100) > closeSummary.expectedCash ? "Sobrante" : "Faltante"}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogId(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleClose} disabled={!closingAmount} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
              <Lock className="w-4 h-4 mr-2" />Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-3">
              <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Caja #{detailRegister?.number} — {detailRegister && getBranchName(detailRegister.branch_id)}
              {detailRegister?.status === "open" ? (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200 dark:border-orange-800 rounded-lg text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mr-1.5" />ABIERTA
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs rounded-lg">CERRADA</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailRegister && detailSummary && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Apertura</p>
                  <p className="text-sm font-semibold">{formatDate(detailRegister.opened_at)} · {new Date(detailRegister.opened_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Fondo Inicial</p>
                  <p className="text-sm font-semibold">{formatCents(detailRegister.opening_amount_cents)}</p>
                </div>
                {detailRegister.closed_at && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">Cierre</p>
                    <p className="text-sm font-semibold">{formatDate(detailRegister.closed_at)} · {new Date(detailRegister.closed_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                )}
                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
                  <p className="text-xs text-orange-600 dark:text-orange-400">Total Ventas</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{formatCents(detailSummary.total)}</p>
                  <p className="text-[10px] text-muted-foreground">{detailSummary.txns.length} transacciones</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ventas por Método de Pago</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(detailSummary.byMethod).map(([method, data]) => {
                    const info = PAYMENT_METHODS[method];
                    return (
                      <div key={method} className={`p-3 rounded-xl border ${info?.bg || "bg-muted/50 border-border"}`}>
                        <p className={`text-xs font-semibold ${info?.color || "text-foreground"}`}>{info?.label || method}</p>
                        <p className="text-lg font-bold">{formatCents(data.total)}</p>
                        <p className="text-[10px] text-muted-foreground">{data.count} venta{data.count !== 1 ? "s" : ""}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {detailRegister.status === "closed" && detailRegister.closing_amount_cents !== null && (
                <div className="p-4 bg-muted/30 rounded-xl border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Arqueo de Efectivo</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Fondo inicial</span><span>{formatCents(detailRegister.opening_amount_cents)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">+ Ventas en efectivo</span><span>{formatCents(detailSummary.cashTotal)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t"><span>Esperado</span><span>{formatCents(detailRegister.expected_closing_cents ?? 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Efectivo contado</span><span>{formatCents(detailRegister.closing_amount_cents)}</span></div>
                    <div className="flex justify-between font-bold pt-1 border-t">
                      <span>Diferencia</span>
                      <span className={(detailRegister.difference_cents ?? 0) === 0 ? "text-orange-600 dark:text-orange-400" : (detailRegister.difference_cents ?? 0) > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}>
                        {(detailRegister.difference_cents ?? 0) === 0 ? "S/. 0.00 ✓" : formatCents(detailRegister.difference_cents!)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detalle de Transacciones</p>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs">Comprobante</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs">Método</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs">Monto</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs hidden sm:table-cell">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSummary.txns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((t) => {
                        const info = PAYMENT_METHODS[t.payment_method];
                        return (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-xs">{t.invoice_number}</td>
                            <td className="py-2.5 px-3 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${info?.bg || "bg-muted"}`}>{info?.shortLabel || t.payment_method}</span></td>
                            <td className="py-2.5 px-3 text-right font-semibold">{formatCents(t.amount_cents)}</td>
                            <td className="py-2.5 px-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{new Date(t.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {detailSummary.txns.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Sin transacciones registradas</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}