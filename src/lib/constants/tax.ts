import type { TaxAffectation } from "../types";

export const IGV_RATE = 0.18;
export const DEFAULT_TAX_RATE = IGV_RATE;

export const TAX_RATE_MAP: Record<TaxAffectation, number> = {
  gravado: IGV_RATE,
  exonerado: 0,
  inafecto: 0,
  exportacion: 0,
};

export const TAX_AFFECTATION_TYPES: Record<
  TaxAffectation,
  {
    label: string;
    code: string;
    description: string;
    rate: string;
    color: string;
    solidColor: string;
    icon: string;
  }
> = {
  gravado: {
    label: "Gravado",
    code: "10",
    description: "Operación onerosa gravada con IGV",
    rate: "18%",
    color:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    solidColor: "bg-red-600 text-white",
    icon: "🔴",
  },
  exonerado: {
    label: "Exonerado",
    code: "20",
    description: "Exonerado del pago de IGV por ley",
    rate: "0%",
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    solidColor: "bg-emerald-500 text-white",
    icon: "🟢",
  },
  inafecto: {
    label: "Inafecto",
    code: "30",
    description: "No afecto al IGV por naturaleza",
    rate: "0%",
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    solidColor: "bg-blue-600 text-white",
    icon: "🔵",
  },
  exportacion: {
    label: "Exportación",
    code: "40",
    description: "Exportación de bienes o servicios",
    rate: "0%",
    color:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    solidColor: "bg-purple-600 text-white",
    icon: "🟣",
  },
};

export const TAX_AFFECTATION_KEYS = Object.keys(
  TAX_AFFECTATION_TYPES
) as TaxAffectation[];
