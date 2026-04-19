import type jsPDF from "jspdf";
import type { Invoice } from "../types";
import type { SellerInfo } from "./seller-info";

export interface PdfTaxConfig {
  sellerProvinceCode: string;
  sellerDistrictCode?: string;
  selvaLawEnabled: boolean;
}

export type DocumentFormat = "a4" | "thermal-80mm";

export type PrintAction = "download" | "preview" | "print";

export interface PrintOptions {
  format?: DocumentFormat;
  branchName?: string;
  taxConfig?: PdfTaxConfig;
  action?: PrintAction;
}

export interface PdfContext {
  doc: jsPDF;
  invoice: Invoice;
  sellerInfo: SellerInfo;
  options: PrintOptions;
  pageWidth: number;
  margin: number;
  contentWidth: number;
}
