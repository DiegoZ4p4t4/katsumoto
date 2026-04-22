import type { Cents } from "./common";
import type { InvoiceType, InvoiceStatus } from "./invoice";

export interface AccountingReportRow {
  id: string;
  rowNumber: number;
  issueDate: string;
  invoiceType: InvoiceType;
  serie: string;
  correlativo: number;
  customerName: string;
  customerDocument: string;
  currency: string;
  discountWithoutIgv: Cents;
  discountWithIgv: Cents;
  subtotal: Cents;
  igv: Cents;
  isc: Cents;
  icbper: Cents;
  otherCharges: Cents;
  advance: Cents;
  total: Cents;
  gravada: Cents;
  inafecta: Cents;
  exonerada: Cents;
  gratuita: Cents;
  refSerie: string | null;
  refCorrelativo: string | null;
  refIssueDate: string | null;
  status: InvoiceStatus;
  sunatStatus: string;
}

export interface AccountingReportFilters {
  dateFrom: string;
  dateTo: string;
  invoiceType: string;
  status: string;
  sunatStatus: string;
  branchId: string;
}

export interface SalesPeriodRow {
  period: string;
  totalFacturas: number;
  totalBoletas: number;
  totalNotasCredito: number;
  totalNotasDebito: number;
  gravada: Cents;
  exonerada: Cents;
  inafecta: Cents;
  igv: Cents;
  total: Cents;
}

export interface SalesReportFilters {
  dateFrom: string;
  dateTo: string;
  groupBy: "day" | "week" | "month";
  invoiceType: string;
  branchId: string;
}

export interface InventoryReportRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costCents: Cents;
  priceCents: Cents;
  totalStock: number;
  branchStocks: Record<string, number>;
  totalValue: Cents;
}

export type SunatStatus = "accepted" | "pending" | "rejected" | "none";
