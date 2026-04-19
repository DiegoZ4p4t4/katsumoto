import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";

import { orderService } from "@/services/order.service";
import { useBranches } from "@/hooks/useBranches";
import { useCart } from "@/components/store/CartContext";
import { useTaxConfig } from "@/lib/tax-config-context";
import { getDepartments, getProvincesForDepartment, getDistrictsForProvince } from "@/lib/geo-peru";
import { formatCents } from "@/lib/format";
import { calculateInvoice } from "@/lib/calculations";
import { DOCUMENT_TYPES, TAX_AFFECTATION_TYPES } from "@/lib/constants";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle, User, Phone, Mail, FileText, ShoppingCart,
  Shield, Truck, Lock, MapPin, TreePine,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import type { DocumentType, TaxAffectation } from "@/lib/types";

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  document_type: DocumentType;
  document_number: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  name: "", phone: "", email: "",
  document_type: "DNI", document_number: "", notes: "",
};

export default function StoreCheckout() {
  const { items, clearCart, totalItems, totalCents: _totalCents } = useCart();
  const { branches } = useBranches();
  const { determineTaxForSale } = useTaxConfig();
  const _navigate = useNavigate();
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [shippingDept, setShippingDept] = useState("");
  const [shippingProv, setShippingProv] = useState("");
  const [shippingDist, setShippingDist] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const onlineBranch = useMemo(
    () => branches.find(b => b.type === "online" && b.is_active),
    [branches]
  );

  const taxDetermination = useMemo(() => {
    if (!onlineBranch || items.length === 0) return null;
    return determineTaxForSale(
      undefined,
      (shippingDept || shippingProv || shippingDist)
        ? { departmentCode: shippingDept, provinceCode: shippingProv, districtCode: shippingDist }
        : undefined,
      {
        department_code: onlineBranch.department_code || "",
        province_code: onlineBranch.province_code || "",
        district_code: onlineBranch.district_code || "",
        is_selva_zone: onlineBranch.is_selva_zone,
      },
    );
  }, [onlineBranch, items, determineTaxForSale, shippingDept, shippingProv, shippingDist]);

  const formItems = useMemo(() =>
    items.map((item) => {
      let taxAffectation: TaxAffectation = item.product.tax_affectation || "gravado";
      if (taxDetermination) {
        const productTax = item.product.tax_affectation;
        if (productTax === "exportacion") taxAffectation = "exportacion";
        else if (productTax === "inafecto") taxAffectation = "inafecto";
        else if (taxDetermination.affectation === "exonerado") taxAffectation = "exonerado";
        else if (productTax === "exonerado") taxAffectation = "exonerado";
        else taxAffectation = "gravado";
      }
      return {
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price_cents: item.product.price_cents,
        discount_percent: 0,
        tax_affectation: taxAffectation,
      };
    }),
    [items, taxDetermination]
  );

  const calc = useMemo(() => formItems.length > 0 ? calculateInvoice(formItems) : null, [formItems]);

  const isSelvaExonerado = taxDetermination?.affectation === "exonerado";

  const canSubmit = form.name.trim() && form.phone.trim() && form.document_number.trim() && items.length > 0;

  const departments = useMemo(() => getDepartments(), []);
  const provinces = useMemo(() => shippingDept ? getProvincesForDepartment(shippingDept) : [], [shippingDept]);
  const districts = useMemo(() => shippingProv ? getDistrictsForProvince(shippingProv) : [], [shippingProv]);

  if (items.length > 0 && !onlineBranch) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Tienda no disponible</h2>
        <p className="text-muted-foreground mb-4">No hay una tienda virtual configurada. Contacta al administrador.</p>
        <Link to="/tienda">
          <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Volver a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!canSubmit || !calc || !onlineBranch) return;
    try {
      const randBuf = new Uint16Array(1);
      crypto.getRandomValues(randBuf);
      const nextNum = (randBuf[0] % 9000) + 1000;
      const number = `PED-${String(nextNum).padStart(4, "0")}`;

      await orderService.create({
        orderNumber: number,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email,
        customerDocumentType: form.document_type,
        customerDocumentNumber: form.document_number,
        branchId: onlineBranch.id,
        shippingDepartmentCode: shippingDept,
        shippingProvinceCode: shippingProv,
        shippingDistrictCode: shippingDist,
        subtotalCents: calc.subtotal_cents,
        gravadaCents: calc.gravada_cents,
        exoneradaCents: calc.exonerada_cents,
        inafectaCents: calc.inafecta_cents,
        igvCents: calc.igv_cents,
        totalCents: calc.total_cents,
        notes: form.notes || undefined,
        items: calc.items.map((item) => ({
          productId: item.product_id || "",
          productName: item.product_name,
          productSku: items.find((ci) => ci.product.id === item.product_id)?.product.sku || "",
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
          lineTotalCents: item.line_total_cents,
          taxAffectation: item.tax_affectation,
          igvCents: item.igv_cents,
        })),
      });
      setOrderNumber(number);
      setSubmitted(true);
      clearCart();
      showSuccess(`¡Pedido ${number} registrado exitosamente!`);
    } catch (err) {
      showError("Error al registrar pedido: " + (err instanceof Error ? err.message : "Intenta nuevamente"));
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">¡Pedido registrado!</h2>
        <p className="text-muted-foreground mb-6">Tu pedido ha sido recibido y será procesado pronto.</p>
        <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 rounded-xl px-5 py-2.5 text-lg font-mono font-bold mb-6">
          {orderNumber}
        </Badge>
        <p className="text-sm text-muted-foreground mb-8">
          Te contactaremos al <strong>{form.phone}</strong> para confirmar los detalles.
        </p>
        <Link to="/tienda">
          <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 px-8 font-bold text-white shadow-lg border-0">
            Volver a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No hay productos en tu carrito</h2>
        <Link to="/tienda">
          <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Ir al catálogo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/tienda/carrito">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Checkout</h1>
          <p className="text-sm text-muted-foreground">Completa tus datos para finalizar el pedido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Datos de contacto</h3>
                  <p className="text-xs text-muted-foreground">Para confirmar tu pedido</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-sm font-semibold">Nombre completo / Razón social *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-11" placeholder="Juan Pérez o Mi Empresa S.A.C." />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Teléfono *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl h-11" placeholder="964 567 890" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Correo</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl h-11" placeholder="correo@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Tipo documento</Label>
                  <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v as DocumentType })}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">N° Documento *</Label>
                  <Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} className="rounded-xl h-11" placeholder={form.document_type === "RUC" ? "20123456781" : "45678901"} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Notas del pedido</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl h-11" placeholder="Instrucciones especiales, horario de entrega..." />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Dirección de envío</h3>
                  <p className="text-xs text-muted-foreground">Opcional — Define la afectación tributaria</p>
                </div>
                {isSelvaExonerado && (
                  <Badge variant="secondary" className="text-[10px] rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 gap-1 ml-auto">
                    <TreePine className="w-3 h-3" />Exonerado (Selva)
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Departamento</Label>
                  <Select
                    value={shippingDept || "__none__"}
                    onValueChange={(v) => {
                      setShippingDept(v === "__none__" ? "" : v);
                      setShippingProv("");
                      setShippingDist("");
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Depto." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Provincia</Label>
                  <Select
                    value={shippingProv || "__none__"}
                    onValueChange={(v) => {
                      setShippingProv(v === "__none__" ? "" : v);
                      setShippingDist("");
                    }}
                    disabled={!shippingDept}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Prov." />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distrito</Label>
                  <Select
                    value={shippingDist || "__none__"}
                    onValueChange={(v) => setShippingDist(v === "__none__" ? "" : v)}
                    disabled={!shippingProv}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Dist." />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!shippingDept && (
                <p className="text-[10px] text-muted-foreground">Sin dirección de envío se aplicará IGV 18% (gravado).</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            {[
              { icon: Shield, text: "Datos seguros" },
              { icon: Truck, text: "Despacho 24–48h" },
              { icon: Lock, text: "Pago protegido" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2 text-xs text-slate-500">
                <t.icon className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 sticky top-24 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">Tu pedido ({totalItems})</h3>
              <div className="space-y-3 max-h-60 overflow-auto mb-4">
                {items.map((item) => {
                  const taxInfo = TAX_AFFECTATION_TYPES[item.product.tax_affectation || "gravado"];
                  return (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                        <ProductImage src={item.product.image_url} name={item.product.name} className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">×{item.quantity}</span>
                          {taxInfo && <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${taxInfo.solidColor}`}>{taxInfo.label}</span>}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{formatCents(item.product.price_cents * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>
              {calc && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold">{formatCents(calc.subtotal_cents)}</span>
                  </div>
                  {calc.exonerada_cents > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Exonerado</span>
                      <span className="font-semibold">{formatCents(calc.exonerada_cents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">IGV</span>
                    <span className="font-semibold">{formatCents(calc.igv_cents)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold text-lg text-slate-900 dark:text-white">Total</span>
                    <span className="font-extrabold text-xl text-orange-600 dark:text-orange-400">{formatCents(calc.total_cents)}</span>
                  </div>
                </div>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full mt-5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 text-base font-bold shadow-lg shadow-orange-500/20 disabled:opacity-40 text-white border-0"
              >
                Confirmar pedido
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Al confirmar, tu pedido será revisado por nuestro equipo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
