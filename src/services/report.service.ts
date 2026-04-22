import { supabase, getCurrentOrgId } from "@/lib/supabase";
import type { Invoice, InvoiceType, InvoiceStatus } from "@/lib/types";
import { toSoles, formatDate } from "@/lib/format";

function getSunatStatus(inv: Invoice): string {
  if (inv.status === "cancelled") return "ANULADA";
  if (inv.status === "draft") return "—";
  if (inv.sunat_cdr_path) return "ACEPTADA";
  if (inv.sunat_ticket) return "EN PROCESO";
  if (inv.sunat_error_code) return "RECHAZADA";
  if (inv.sunat_hash) return "ENVIADA";
  return "PENDIENTE";
}

export function getInvoiceTypeLabel(type: InvoiceType): string {
  const map: Record<InvoiceType, string> = {
    factura: "FACTURA",
    boleta: "BOLETA DE VENTA",
    nota_credito: "NOTA DE CRÉDITO",
    nota_debito: "NOTA DE DÉBITO",
  };
  return map[type] || type.toUpperCase();
}

export function getStatusLabel(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    draft: "BORRADOR",
    issued: "EMITIDO",
    accepted: "ACEPTADO",
    paid: "PAGADO",
    cancelled: "ANULADO",
  };
  return map[status] || status.toUpperCase();
}

function fmtSoles(cents: number): string {
  return toSoles(cents).toFixed(2);
}

export interface AccountingRow {
  id: string;
  rowNumber: number;
  issueDate: string;
  invoiceType: InvoiceType;
  serie: string;
  correlativo: number;
  customerName: string;
  customerDocument: string;
  currency: string;
  discountWithoutIgv: number;
  discountWithIgv: number;
  subtotal: number;
  igv: number;
  isc: number;
  icbper: number;
  otherCharges: number;
  advance: number;
  total: number;
  gravada: number;
  inafecta: number;
  exonerada: number;
  gratuita: number;
  refSerie: string | null;
  refCorrelativo: string | null;
  refIssueDate: string | null;
  status: InvoiceStatus;
  sunatStatus: string;
}

export interface AccountingSummary {
  count: number;
  totalGravada: number;
  totalExonerada: number;
  totalInafecta: number;
  totalIgv: number;
  totalTotal: number;
  facturas: number;
  boletas: number;
  notasCredito: number;
  notasDebito: number;
}

export const reportService = {
  async getAccountingReport(filters: {
    dateFrom: string;
    dateTo: string;
    branchId: string;
  }): Promise<Invoice[]> {
    const orgId = await getCurrentOrgId();
    let query = supabase
      .from("invoices")
      .select("*, customer:customers(id, name, document_number, document_type)")
      .eq("organization_id", orgId)
      .gte("issue_date", filters.dateFrom)
      .lte("issue_date", filters.dateTo)
      .order("issue_date", { ascending: false })
      .order("correlativo", { ascending: false });

    if (filters.branchId !== "all") {
      query = query.eq("branch_id", filters.branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  mapToAccountingRows(
    invoices: Invoice[],
    getReferenceInvoice: (id: string) => Invoice | undefined
  ): AccountingRow[] {
    return invoices.map((inv, idx) => {
      const ref = inv.reference_invoice_id
        ? getReferenceInvoice(inv.reference_invoice_id)
        : null;

      const discountCents =
        inv.items?.reduce((sum, item) => sum + item.discount_cents, 0) || 0;

      return {
        id: inv.id,
        rowNumber: idx + 1,
        issueDate: inv.issue_date,
        invoiceType: inv.invoice_type,
        serie: inv.serie,
        correlativo: inv.correlativo,
        customerName: inv.customer?.name || "—",
        customerDocument: inv.customer?.document_number || "—",
        currency: "SOLES",
        discountWithoutIgv: 0,
        discountWithIgv: discountCents,
        subtotal: inv.subtotal_cents,
        igv: inv.igv_cents,
        isc: 0,
        icbper: 0,
        otherCharges: 0,
        advance: 0,
        total: inv.total_cents,
        gravada: inv.gravada_cents,
        inafecta: inv.inafecta_cents,
        exonerada: inv.exonerada_cents,
        gratuita: 0,
        refSerie: ref?.serie || null,
        refCorrelativo: ref
          ? String(ref.correlativo).padStart(8, "0")
          : null,
        refIssueDate: ref?.issue_date || null,
        status: inv.status,
        sunatStatus: getSunatStatus(inv),
      };
    });
  },

  getAccountingExportHeaders(): string[] {
    return [
      "N°",
      "F. Emisión",
      "Tipo Doc.",
      "Serie",
      "Correlativo",
      "Recep. Razón Social",
      "N° Doc. Receptor",
      "Moneda",
      "T. Descuento Sin IGV",
      "T. Descuento Con IGV",
      "Monto Sub Total",
      "Monto IGV",
      "Monto ISC",
      "Monto ICBPER",
      "Otros Cargos",
      "Monto Adelanto",
      "Monto Total",
      "Oper. Gravadas",
      "Oper. Inafectas",
      "Oper. Exoneradas",
      "Oper. Gratuitas",
      "Serie Doc. Destino",
      "Correlativo Doc. Destino",
      "Fecha Emision Destino",
      "Estado",
      "Estado Sunat",
    ];
  },

  getAccountingExportRow(row: AccountingRow): string[] {
    return [
      String(row.rowNumber),
      formatDate(row.issueDate),
      getInvoiceTypeLabel(row.invoiceType),
      row.serie,
      String(row.correlativo).padStart(8, "0"),
      row.customerName,
      row.customerDocument,
      row.currency,
      fmtSoles(row.discountWithoutIgv),
      fmtSoles(row.discountWithIgv),
      fmtSoles(row.subtotal),
      fmtSoles(row.igv),
      fmtSoles(row.isc),
      fmtSoles(row.icbper),
      fmtSoles(row.otherCharges),
      fmtSoles(row.advance),
      fmtSoles(row.total),
      fmtSoles(row.gravada),
      fmtSoles(row.inafecta),
      fmtSoles(row.exonerada),
      fmtSoles(row.gratuita),
      row.refSerie || "",
      row.refCorrelativo || "",
      row.refIssueDate ? formatDate(row.refIssueDate) : "",
      getStatusLabel(row.status),
      row.sunatStatus,
    ];
  },

  getAccountingSummary(rows: AccountingRow[]): AccountingSummary {
    return rows.reduce(
      (acc, r) => ({
        count: acc.count + 1,
        totalGravada: acc.totalGravada + r.gravada,
        totalExonerada: acc.totalExonerada + r.exonerada,
        totalInafecta: acc.totalInafecta + r.inafecta,
        totalIgv: acc.totalIgv + r.igv,
        totalTotal: acc.totalTotal + r.total,
        facturas: acc.facturas + (r.invoiceType === "factura" ? 1 : 0),
        boletas: acc.boletas + (r.invoiceType === "boleta" ? 1 : 0),
        notasCredito:
          acc.notasCredito + (r.invoiceType === "nota_credito" ? 1 : 0),
        notasDebito:
          acc.notasDebito + (r.invoiceType === "nota_debito" ? 1 : 0),
      }),
      {
        count: 0,
        totalGravada: 0,
        totalExonerada: 0,
        totalInafecta: 0,
        totalIgv: 0,
        totalTotal: 0,
        facturas: 0,
        boletas: 0,
        notasCredito: 0,
        notasDebito: 0,
      }
    );
  },
};
