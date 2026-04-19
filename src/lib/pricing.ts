import type { Cents, PriceTier, Product } from "./types";

export interface MarginInfo {
  min: number;
  max: number;
  tierCount: number;
  details: Array<{
    label: string;
    min_quantity: number;
    price_cents: Cents;
    margin: number;
  }>;
}

export interface TierFormState {
  label: string;
  min_quantity: number;
  price_soles: number;
}

export const TIER_PRESETS = [
  "Mayorista",
  "Distribuidor",
  "Gran Distribuidor",
  "Especial",
] as const;

export const TIER_COLORS: Record<string, string> = {
  "Mayorista": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "Distribuidor": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  "Gran Distribuidor": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  "Especial": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
};

export function calcMargin(costCents: Cents, priceCents: Cents): number {
  if (priceCents <= 0) return 0;
  return (1 - costCents / priceCents) * 100;
}

export function getMarginColor(margin: number): string {
  if (margin >= 35) return "text-orange-600 dark:text-orange-400";
  if (margin >= 20) return "text-blue-600 dark:text-blue-400";
  if (margin >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function getMarginBadgeColor(margin: number): string {
  if (margin >= 35) return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
  if (margin >= 20) return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  if (margin >= 10) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
}

export function getPriceTiersForProduct(allTiers: PriceTier[], productId: string): PriceTier[] {
  return allTiers
    .filter(t => t.product_id === productId)
    .sort((a, b) => a.min_quantity - b.min_quantity);
}

export function getEffectivePrice(product: Product, allTiers: PriceTier[], quantity: number): Cents {
  const tiers = getPriceTiersForProduct(allTiers, product.id)
    .sort((a, b) => b.min_quantity - a.min_quantity);

  for (const tier of tiers) {
    if (quantity >= tier.min_quantity) return tier.price_cents;
  }

  return product.price_cents;
}

export interface EffectivePriceInfo {
  priceCents: Cents;
  tierLabel?: string;
  tierMinQuantity?: number;
  isRetail: boolean;
  savingsCents?: Cents;
  savingsPercent?: number;
}

export function getEffectivePriceInfo(
  product: Product,
  allTiers: PriceTier[],
  quantity: number
): EffectivePriceInfo {
  const tiers = getPriceTiersForProduct(allTiers, product.id)
    .sort((a, b) => b.min_quantity - a.min_quantity);

  for (const tier of tiers) {
    if (quantity >= tier.min_quantity) {
      const savingsCents = product.price_cents - tier.price_cents;
      return {
        priceCents: tier.price_cents,
        tierLabel: tier.label,
        tierMinQuantity: tier.min_quantity,
        isRetail: false,
        savingsCents: savingsCents > 0 ? savingsCents : undefined,
        savingsPercent:
          savingsCents > 0 && product.price_cents > 0
            ? (savingsCents / product.price_cents) * 100
            : undefined,
      };
    }
  }

  return { priceCents: product.price_cents, isRetail: true };
}

export function getLowestTierInfo(
  allTiers: PriceTier[],
  productId: string
): { priceCents: Cents; minQuantity: number; label: string } | null {
  const tiers = getPriceTiersForProduct(allTiers, productId)
    .sort((a, b) => a.min_quantity - b.min_quantity);
  if (tiers.length === 0) return null;
  return {
    priceCents: tiers[0].price_cents,
    minQuantity: tiers[0].min_quantity,
    label: tiers[0].label,
  };
}

export function getMarginRange(product: Product, allTiers: PriceTier[]): MarginInfo | null {
  if (product.cost_cents <= 0) return null;

  const productTiers = getPriceTiersForProduct(allTiers, product.id);

  const details: MarginInfo["details"] = [
    {
      label: "Minorista",
      min_quantity: 1,
      price_cents: product.price_cents,
      margin: calcMargin(product.cost_cents, product.price_cents),
    },
  ];

  for (const tier of productTiers) {
    details.push({
      label: tier.label,
      min_quantity: tier.min_quantity,
      price_cents: tier.price_cents,
      margin: calcMargin(product.cost_cents, tier.price_cents),
    });
  }

  const margins = details.map(d => d.margin);

  return {
    min: Math.min(...margins),
    max: Math.max(...margins),
    tierCount: details.length,
    details,
  };
}