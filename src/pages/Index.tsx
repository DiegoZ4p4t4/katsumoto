import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranches } from "@/hooks/useBranches";
import { formatCents } from "@/lib/format";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import {
  Package, AlertTriangle, FileText, TrendingUp, ArrowUpRight,
  Clock, CheckCircle, CircleDot, ShieldCheck, XCircle,
  ShoppingCart, DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const statusMap: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: "Pagado", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: CheckCircle },
  accepted: { label: "Aceptado", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400", icon: ShieldCheck },
  issued: { label: "Emitido", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: CircleDot },
  draft: { label: "Borrador", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: Clock },
  cancelled: { label: "Anulado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: XCircle },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { branchProducts } = useProducts();
  const { branchInvoices } = useInvoices();
  const { getBranchName, selectedBranchId: branchId } = useBranches();

  const { totalProducts, activeProducts, outOfStock, lowStockProducts, pendingInvoices, paidInvoices, totalRevenue, totalPending, totalStockValue, categoryData, recentInvoices } = useMemo(() => {
    const totalProducts = branchProducts.length;
    const activeProducts = branchProducts.filter(p => p.is_active).length;
    const outOfStock = branchProducts.filter(p => p.stock === 0);
    const lowStockProducts = branchProducts.filter(p => p.stock > 0 && p.stock <= p.min_stock);
    const pendingInvoices = branchInvoices.filter(i => i.status === "issued" || i.status === "accepted");
    const paidInvoices = branchInvoices.filter(i => i.status === "paid");
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total_cents, 0);
    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.total_cents, 0);
    const totalStockValue = branchProducts.reduce((sum, p) => sum + p.price_cents * p.stock, 0);
    const categoryData = branchProducts
      .reduce((acc, p) => {
        const existing = acc.find(a => a.category === p.category);
        if (existing) {
          existing.count += 1;
          existing.value += p.price_cents * p.stock;
        } else {
          acc.push({ category: p.category, count: 1, value: p.price_cents * p.stock });
        }
        return acc;
      }, [] as { category: string; count: number; value: number }[])
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const recentInvoices = branchInvoices.slice(0, 5);
    return { totalProducts, activeProducts, outOfStock, lowStockProducts, pendingInvoices, paidInvoices, totalRevenue, totalPending, totalStockValue, categoryData, recentInvoices };
  }, [branchProducts, branchInvoices]);

  const metrics = useMemo(() => [
    {
      label: "Productos Activos",
      value: activeProducts.toString(),
      sub: `${totalProducts} total · ${outOfStock.length} agotados`,
      icon: Package,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
    },
    {
      label: "Stock Bajo",
      value: lowStockProducts.length.toString(),
      sub: "Productos por reponer",
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      label: "Comprobantes Pendientes",
      value: pendingInvoices.length.toString(),
      sub: totalPending > 0 ? `Por cobrar: ${formatCents(totalPending)}` : "Todo al día",
      icon: FileText,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Ingresos Cobrados",
      value: formatCents(totalRevenue),
      sub: `${paidInvoices.length} comprobantes pagados`,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
    },
  ], [activeProducts, totalProducts, outOfStock.length, lowStockProducts.length, pendingInvoices.length, totalPending, totalRevenue, paidInvoices.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <HelpHint {...HELP_TEXTS.dashboard} />
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        Resumen general del negocio
        {branchId !== "all" && (
          <> · {getBranchName(branchId)}</>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className={`rounded-2xl shadow-sm border ${m.border}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                  <m.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Valor de Stock por Categoría</CardTitle>
              <Badge variant="secondary" className="text-[10px] rounded-lg">
                Valor total: {formatCents(totalStockValue)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCents(value), "Valor"]}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#FF4D00"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                No hay datos de inventario
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Stock Bajo</CardTitle>
              <Badge variant="secondary" className="text-[10px] rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {lowStockProducts.length} productos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Todo el stock está bien</p>
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map((product) => {
                const percent = product.max_stock > 0 ? (product.stock / product.max_stock) * 100 : 0;
                return (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-amber-200 dark:bg-amber-800/50 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, percent)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          {product.stock}/{product.min_stock}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">{product.sku}</p>
                  </div>
                );
              })
            )}
            {lowStockProducts.length > 6 && (
              <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs" onClick={() => navigate("/inventory")}>
                Ver todos ({lowStockProducts.length}) <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Comprobantes Recientes</CardTitle>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => navigate("/invoices")}>
                Ver todos <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay comprobantes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((invoice) => {
                  const st = statusMap[invoice.status];
                  const StatusIcon = st?.icon || Clock;
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/invoices")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-mono">{invoice.number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st?.color || "bg-muted text-muted-foreground"}`}>
                              <StatusIcon className="w-3 h-3" />
                              {st?.label || invoice.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {invoice.customer?.name || "—"} · {new Date(invoice.issue_date).toLocaleDateString("es-PE")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold">{formatCents(invoice.total_cents)}</p>
                        <p className="text-[10px] text-muted-foreground">{invoice.items?.length || 0} ítems</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 justify-start h-11"
                onClick={() => navigate("/pos")}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Punto de Venta
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start h-11"
                onClick={() => navigate("/invoices/new")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Nuevo Comprobante
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start h-11"
                onClick={() => navigate("/inventory")}
              >
                <Package className="w-4 h-4 mr-2" />
                Gestionar Inventario
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-muted-foreground">Cobrado</span>
                </div>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatCents(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-muted-foreground">Por cobrar</span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCents(totalPending)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor en Stock</span>
                  <span className="text-sm font-bold">{formatCents(totalStockValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}