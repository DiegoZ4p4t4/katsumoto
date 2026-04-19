import { formatCents, toCents } from "@/lib/format";
import { calcMargin, getMarginColor, TIER_PRESETS, TIER_COLORS, type TierFormState } from "@/lib/pricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Tag, TrendingDown } from "lucide-react";

interface PriceTiersEditorProps {
  tiers: TierFormState[];
  basePriceSoles: number;
  costSoles: number;
  onChange: (tiers: TierFormState[]) => void;
}

export function PriceTiersEditor({ tiers, basePriceSoles, costSoles, onChange }: PriceTiersEditorProps) {
  const baseMargin = costSoles > 0 && basePriceSoles > 0
    ? calcMargin(toCents(costSoles), toCents(basePriceSoles))
    : null;

  const addTier = () => {
    const lastMinQty = tiers.length > 0 ? tiers[tiers.length - 1].min_quantity : 2;
    const suggestedPrice = basePriceSoles > 0 ? Math.round(basePriceSoles * 0.85 * 100) / 100 : 0;
    onChange([...tiers, { label: "Mayorista", min_quantity: lastMinQty + 3, price_soles: suggestedPrice }]);
  };

  const updateTier = (index: number, field: keyof TierFormState, value: string | number) => {
    onChange(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

  const _hasOverlap = sortedTiers.some((t, i) =>
    i > 0 && t.min_quantity <= sortedTiers[i - 1].min_quantity
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          Escalas de Precio por Volumen
        </Label>
        {tiers.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {tiers.length + 1} escala{tiers.length + 1 !== 1 ? "s" : ""} definida{tiers.length + 1 !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Base Tier */}
      <div className="p-3 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200 dark:border-orange-800 rounded-lg text-[10px]">
              Base
            </Badge>
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Minorista</span>
          </div>
          {baseMargin !== null && (
            <span className={`text-sm font-bold ${getMarginColor(baseMargin)}`}>
              {baseMargin.toFixed(1)}% margen
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Desde <span className="font-bold text-foreground">1</span> ud.</span>
          <span>→</span>
          <span className="font-semibold text-foreground">{basePriceSoles > 0 ? formatCents(toCents(basePriceSoles)) : "S/. —"}</span>
          {costSoles > 0 && (
            <span className="text-muted-foreground">(costo: {formatCents(toCents(costSoles))})</span>
          )}
        </div>
      </div>

      {/* Additional Tiers */}
      {sortedTiers.map((tier, _originalIndex) => {
        const actualIndex = tiers.indexOf(tier);
        const margin = costSoles > 0 && tier.price_soles > 0
          ? calcMargin(toCents(costSoles), toCents(tier.price_soles))
          : null;
        const tierColor = TIER_COLORS[tier.label] || TIER_COLORS["Especial"];
        const prevMinQty = actualIndex === 0 ? 1 : sortedTiers[sortedTiers.indexOf(tier) - 1]?.min_quantity || 1;
        const isInvalid = tier.min_quantity <= 1 || tier.min_quantity <= prevMinQty;

        return (
          <div
            key={actualIndex}
            className={`p-3 rounded-xl border transition-colors ${
              isInvalid
                ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Select value={tier.label} onValueChange={(v) => updateTier(actualIndex, "label", v)}>
                  <SelectTrigger className={`h-7 w-36 rounded-lg text-[11px] font-semibold border ${tierColor}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_PRESETS.map((preset) => (
                      <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                {margin !== null && (
                  <span className={`text-sm font-bold ${getMarginColor(margin)}`}>
                    {margin.toFixed(1)}% margen
                  </span>
                )}
                <button
                  onClick={() => removeTier(actualIndex)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar escala"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400 dark:text-red-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-[11px] text-muted-foreground whitespace-nowrap">Desde</Label>
                <Input
                  type="number"
                  min={2}
                  value={tier.min_quantity || ""}
                  onChange={(e) => updateTier(actualIndex, "min_quantity", Number(e.target.value))}
                  className="w-20 h-8 rounded-lg text-sm text-center"
                />
                <span className="text-[11px] text-muted-foreground">uds.</span>
              </div>
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-[11px] text-muted-foreground whitespace-nowrap">Precio S/.</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={tier.price_soles || ""}
                  onChange={(e) => updateTier(actualIndex, "price_soles", Number(e.target.value))}
                  className="w-28 h-8 rounded-lg text-sm"
                />
              </div>
            </div>

            {isInvalid && tier.min_quantity > 0 && (
              <p className="text-[10px] text-red-500 dark:text-red-400 mt-1.5">
                La cantidad mínima debe ser mayor a {prevMinQty}
              </p>
            )}
            {tier.price_soles > 0 && costSoles > 0 && tier.price_soles < costSoles && (
              <p className="text-[10px] text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                El precio está por debajo del costo ({formatCents(toCents(costSoles))})
              </p>
            )}
          </div>
        );
      })}

      {/* Add Tier Button */}
      <button
        onClick={addTier}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar Escala de Precio
      </button>

      {/* Summary */}
      {tiers.length > 0 && costSoles > 0 && basePriceSoles > 0 && (
        <div className="p-3 bg-muted/30 rounded-xl border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resumen de Escalas</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">1 ud. → Minorista</span>
              <span className="font-medium">{formatCents(toCents(basePriceSoles))}</span>
              <span className={`font-bold ${getMarginColor(baseMargin || 0)}`}>{baseMargin?.toFixed(1)}%</span>
            </div>
            {sortedTiers.map((tier, i) => {
              const margin = calcMargin(toCents(costSoles), toCents(tier.price_soles));
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {tier.min_quantity}+ uds. → {tier.label}
                  </span>
                  <span className="font-medium">{formatCents(toCents(tier.price_soles))}</span>
                  <span className={`font-bold ${getMarginColor(margin)}`}>{margin.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}