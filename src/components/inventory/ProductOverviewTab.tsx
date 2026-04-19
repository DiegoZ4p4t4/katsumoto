import type { Product } from "@/lib/types";
import type { Cents } from "@/lib/types";
import { formatCents, formatDate } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import {
  Package, Calendar, Building2,
  Tag, DollarSign, QrCode,
} from "lucide-react";

interface StockStatus {
  label: string;
  color: string;
  bg: string;
  barColor: string;
}

interface ProductOverviewTabProps {
  product: Product;
  stockStatus: StockStatus;
  stockPercent: number;
  margin: string | null;
  totalValue: Cents;
  costValue: Cents;
}

export function ProductOverviewTab({ product, stockStatus, stockPercent, margin, totalValue, costValue }: ProductOverviewTabProps) {
  return (
    <div className="p-6 mt-0 space-y-5">
      {!product.image_url ? null : (
        <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border shadow-sm">
          <ProductImage src={product.image_url} name={product.name} className="w-full aspect-square" />
        </div>
      )}

      {product.description && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Descripción</p>
          <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <InfoRow icon={Tag} label="Categoría" value={product.category} />
          <InfoRow icon={QrCode} label="Código de Barras" value={product.barcode} mono />
          <InfoRow icon={DollarSign} label="Margen de Ganancia" value={margin ? `${margin}%` : "—"} />
        </div>
        <div className="space-y-3">
          {product.supplier && <InfoRow icon={Building2} label="Proveedor" value={product.supplier} />}
          <InfoRow icon={Calendar} label="Fecha de Registro" value={formatDate(product.created_at)} />
          <InfoRow icon={Package} label="Unidad de Medida" value={product.unit} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Nivel de Stock</p>
        <div className={`p-4 rounded-xl border ${stockStatus.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${stockStatus.color}`}>{product.stock}</span>
              <span className="text-sm text-muted-foreground">{product.unit}</span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>{stockStatus.label}</span>
          </div>
          <div className="w-full h-2.5 bg-white/60 dark:bg-black/20 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${stockStatus.barColor}`} style={{ width: `${stockPercent}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>Mínimo: {product.min_stock}</span>
            <span>Máximo: {product.max_stock}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Valor al Costo</p>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-1">{formatCents(costValue)}</p>
          <p className="text-[10px] text-purple-500 dark:text-purple-400/70 mt-0.5">{product.stock} × {formatCents(product.cost_cents)}</p>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Valor de Venta</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">{formatCents(totalValue)}</p>
          <p className="text-[10px] text-emerald-500 dark:text-emerald-400/70 mt-0.5">{product.stock} × {formatCents(product.price_cents)}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
