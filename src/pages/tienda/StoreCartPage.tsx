import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/components/store/CartContext";
import { useBranches } from "@/hooks/useBranches";
import { formatCents } from "@/lib/format";
import { IGV_RATE, TAX_AFFECTATION_TYPES } from "@/lib/constants";
import { calcIgvCents } from "@/lib/calculations";
import { getBranchStock, getWarehouseBranchId } from "@/lib/utils/stock";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, ArrowRight, Shield, Truck, Lock } from "lucide-react";

export default function StoreCartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalCents, totalItems } = useCart();
  const { branches, branchStocks } = useBranches();

  const warehouseBranchId = useMemo(() => getWarehouseBranchId(branches), [branches]);

  const getWarehouseStock = useMemo(() => {
    if (!warehouseBranchId) return (_productId: string) => 0;
    return (_productId: string) => getBranchStock(branchStocks, warehouseBranchId, _productId);
  }, [warehouseBranchId, branchStocks]);

  const igvCents = calcIgvCents(totalCents, IGV_RATE);
  const subtotalCents = totalCents - igvCents;
  const grandTotal = totalCents;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Tu carrito está vacío</h2>
        <p className="text-muted-foreground mb-8">Agrega productos desde nuestro catálogo</p>
        <Link to="/tienda">
          <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 px-8 font-bold text-white shadow-lg shadow-orange-500/20 border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ir al catálogo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Mi Carrito</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalItems} producto{totalItems !== 1 ? "s" : ""} en tu carrito</p>
        </div>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-semibold transition-colors">
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const taxInfo = TAX_AFFECTATION_TYPES[item.product.tax_affectation || "gravado"];
            const lineTotal = item.product.price_cents * item.quantity;
            return (
              <div key={item.product.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <ProductImage src={item.product.image_url} name={item.product.name} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.product.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground font-mono">{item.product.sku}</span>
                    {taxInfo && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${taxInfo.solidColor}`}>
                        {taxInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400 mt-1.5">
                    {formatCents(item.product.price_cents)} <span className="text-[10px] font-normal text-muted-foreground">c/u</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeItem(item.product.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group">
                    <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-red-500" />
                  </button>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, getWarehouseStock(item.product.id))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">{formatCents(lineTotal)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-5">Resumen del pedido</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal ({totalItems} ítems)</span>
                <span className="font-semibold">{formatCents(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IGV ({(IGV_RATE * 100).toFixed(0)}%)</span>
                <span className="font-semibold">{formatCents(igvCents)}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">Total</span>
                <span className="font-extrabold text-2xl text-orange-600 dark:text-orange-400">{formatCents(grandTotal)}</span>
              </div>
            </div>
            <Link to="/tienda/checkout">
              <Button className="w-full mt-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 text-base font-bold shadow-lg shadow-orange-500/20 border-0 text-white">
                Proceder al checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/tienda" className="block mt-3">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Seguir comprando
              </Button>
            </Link>
          </div>

          {/* Trust — Orange accents */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-3">
            {[
              { icon: Shield, text: "Pago 100% seguro" },
              { icon: Truck, text: "Despacho en 24–48h" },
              { icon: Lock, text: "Datos protegidos" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <t.icon className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                <span className="font-medium">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}