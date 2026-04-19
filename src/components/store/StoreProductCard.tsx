import type { Product } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { TAX_AFFECTATION_TYPES } from "@/lib/constants";
import { getDisplayStock } from "@/lib/utils/stock";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Star, Zap } from "lucide-react";

interface StoreProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  featured?: boolean;
  warehouseStock: number;
}

export function StoreProductCard({ product, onAdd, featured = false, warehouseStock }: StoreProductCardProps) {
  const taxInfo = TAX_AFFECTATION_TYPES[product.tax_affectation || "gravado"];
  const isLowStock = warehouseStock > 0 && warehouseStock <= 3;
  const isOutOfStock = warehouseStock <= 0;
  const displayStock = getDisplayStock(warehouseStock);

  return (
    <div
      className={`group bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
        featured
          ? "border-orange-200 dark:border-orange-800 shadow-md"
          : "border-slate-200/80 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-800"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        <ProductImage
          src={product.image_url}
          name={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {featured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md">
              <Star className="w-3 h-3" /> Popular
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-sm animate-pulse">
              <Zap className="w-3 h-3" /> ¡Últimas {warehouseStock}!
            </span>
          )}
        </div>

        {/* Tax Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold shadow-sm backdrop-blur-sm ${taxInfo?.solidColor || "bg-slate-500 text-white"}`}>
            {taxInfo?.label || "Gravado"}
          </span>
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            disabled={isOutOfStock}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-10 text-sm font-bold shadow-lg shadow-orange-500/30 disabled:opacity-50 border-0"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isOutOfStock ? "Agotado" : "Agregar al carrito"}
          </Button>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-5 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 shadow-lg border border-slate-200 dark:border-slate-700">
              Producto agotado
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category — sky blue instead of green */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {product.category}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{product.sku}</span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm leading-snug text-slate-900 dark:text-white line-clamp-2 min-h-[2.5rem] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">{product.description}</p>
        )}

        {/* Price & Action */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight tabular-nums">
                {formatCents(product.price_cents)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                por {product.unit} · {taxInfo?.rate || "18%"} IGV
              </p>
              {!isOutOfStock && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-0.5">
                  <Package className="w-3 h-3 inline mr-0.5" />{displayStock} disponibles
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => onAdd(product)}
              disabled={isOutOfStock}
              className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-600 dark:text-slate-300 h-9 w-9 p-0 transition-all border-0 shadow-none hover:shadow-md disabled:opacity-40"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}