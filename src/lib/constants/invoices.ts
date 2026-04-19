// ==========================================
// Métodos de Pago
// ==========================================
export const PAYMENT_METHODS: Record<string, { label: string; shortLabel: string; icon: string; color: string; bg: string; desc: string }> = {
  cash: { label: "Efectivo", shortLabel: "Efectivo", icon: "Banknote", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", desc: "Pago en efectivo" },
  debit_card: { label: "Tarjeta Débito", shortLabel: "Débito", icon: "CreditCard", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800", desc: "Tarjeta de débito" },
  credit_card: { label: "Tarjeta Crédito", shortLabel: "Crédito T.", icon: "CreditCard", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800", desc: "Tarjeta de crédito" },
  transfer: { label: "Transferencia", shortLabel: "Transfer.", icon: "ArrowLeftRight", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800", desc: "Transferencia bancaria" },
  yape: { label: "Yape", shortLabel: "Yape", icon: "Smartphone", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800", desc: "Pago con Yape" },
  plin: { label: "Plin", shortLabel: "Plin", icon: "Smartphone", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800", desc: "Pago con Plin" },
  credit: { label: "Crédito (30 días)", shortLabel: "Crédito", icon: "Clock", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800", desc: "Pago a 30 días" },
};

// ==========================================
// Tipos de Comprobante (SUNAT)
// ==========================================
export const INVOICE_TYPES: Record<string, { label: string; serie_prefix: string; description: string }> = {
  factura: { label: "Factura", serie_prefix: "F", description: "Para clientes con RUC. Emisor debe tener RUC activo." },
  boleta: { label: "Boleta de Venta", serie_prefix: "B", description: "Para clientes con DNI. Consumidores finales." },
  nota_credito: { label: "Nota de Crédito", serie_prefix: "FC", description: "Modifica o anula un comprobante emitido." },
  nota_debito: { label: "Nota de Débito", serie_prefix: "FD", description: "Incrementa el valor de un comprobante emitido." },
};

export const INVOICE_STATUSES = {
  draft: { label: "Borrador", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: "Clock" },
  issued: { label: "Emitido", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: "CircleDot" },
  accepted: { label: "Aceptado SUNAT", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", icon: "CheckCircle" },
  paid: { label: "Pagado", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: "CheckCircle" },
  cancelled: { label: "Anulado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: "XCircle" },
} as const;

export const DEFAULT_SERIES = { factura: "F001", boleta: "B001", nota_credito: "FC01", nota_debito: "FD01" } as const;

export const NC_SERIES_BY_PARENT = { factura: "FC01", boleta: "BC01" } as const;

export const CREDIT_NOTE_REASONS: Record<string, { code: string; label: string; description: string }> = {
  "01": { code: "01", label: "Anulación de la operación", description: "Cancelación total del comprobante" },
  "02": { code: "02", label: "Anulación por error en el RUC", description: "RUC del cliente incorrecto" },
  "03": { code: "03", label: "Corrección por error en la descripción", description: "Error en el detalle de productos" },
  "04": { code: "04", label: "Descuento global", description: "Descuento no aplicado originalmente" },
  "05": { code: "05", label: "Descuento por ítem", description: "Descuento por producto específico" },
  "06": { code: "06", label: "Devolución por ítem", description: "Devolución parcial de productos" },
  "07": { code: "07", label: "Devolución global", description: "Devolución total de la venta" },
};
