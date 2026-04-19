import { Outlet } from "react-router-dom";
import { CartProvider } from "@/components/store/CartContext";
import { StoreHeader } from "@/components/store/StoreHeader";
import { FloatingButtons } from "@/components/store/FloatingButtons";
import { BranchSelectionProvider } from "@/lib/branch-selection-context";
import { CategoryImagesProvider } from "@/lib/category-images-context";
import { STORE_CONFIG, getWhatsAppUrl } from "@/lib/store-config";
import {
  Wheat, Phone, Mail, MapPin, Clock, MessageCircle,
} from "lucide-react";

const footerCategories = [
  { label: "Repuestos", items: ["Filtración", "Transmisión", "Rodamientos", "Bombas", "Lubricantes"] },
  { label: "Herramientas", items: ["Manuales", "Eléctricas", "Medición", "Soldadura", "Corte"] },
  { label: "Servicios", items: ["Mantenimiento preventivo", "Reparación", "Instalación", "Diagnóstico", "Calibración"] },
];

export default function StoreLayout() {
  return (
    <BranchSelectionProvider>
      <CategoryImagesProvider>
        <CartProvider>
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
          <StoreHeader />
          <main className="flex-1">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-white">
            {/* CTA Section */}
            <div className="border-b border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-2">¿Necesitas ayuda con tu pedido?</h3>
                    <p className="text-slate-400 text-sm">Comunícate con nosotros y te asesoramos en la elección del repuesto correcto.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 md:justify-end">
                    <a href={STORE_CONFIG.phoneHref} className="flex items-center gap-2.5 px-5 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold text-sm transition-colors">
                      <Phone className="w-4 h-4" />
                      {STORE_CONFIG.phone}
                    </a>
                    <a href={getWhatsAppUrl("Hola, necesito asesoría sobre un repuesto")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-5 py-3 bg-[#25D366] hover:bg-[#20BD5A] rounded-xl font-semibold text-sm transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                    <a href={`mailto:${STORE_CONFIG.email}`} className="flex items-center gap-2.5 px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-sm transition-colors border border-slate-700">
                      <Mail className="w-4 h-4" />
                      {STORE_CONFIG.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                {/* Brand */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Wheat className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg leading-tight">Katsumoto</h4>
                      <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest">Agroindustrial</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xs">
                    Repuestos y servicios agroindustriales de calidad. Más de 10 años apoyando al sector agrícola en Junín y selva central.
                  </p>
                  <div className="space-y-2.5">
                    <a href={STORE_CONFIG.addressMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-orange-400 transition-colors">
                      <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>{STORE_CONFIG.address}</span>
                    </a>
                    <a href={STORE_CONFIG.phoneHref} className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-orange-400 transition-colors">
                      <Phone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>{STORE_CONFIG.phone}</span>
                    </a>
                    <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-[#25D366] transition-colors">
                      <MessageCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>{STORE_CONFIG.whatsappDisplay}</span>
                    </a>
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>{STORE_CONFIG.schedule}</span>
                    </div>
                  </div>
                </div>

                {/* Category Columns */}
                {footerCategories.map(cat => (
                  <div key={cat.label}>
                    <h4 className="font-bold text-sm text-white mb-4 uppercase tracking-wider">{cat.label}</h4>
                    <ul className="space-y-2.5">
                      {cat.items.map(item => (
                        <li key={item}>
                          <a href="#" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">{item}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500">© {new Date().getFullYear()} Katsumoto Agroindustrial. Todos los derechos reservados.</p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-600">Precios incluyen IGV donde aplica</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-[10px] text-slate-600">RUC: {STORE_CONFIG.ruc}</span>
                </div>
              </div>
            </div>
          </footer>

          {/* Floating WhatsApp + Scroll to Top */}
          <FloatingButtons />
        </div>
        </CartProvider>
      </CategoryImagesProvider>
    </BranchSelectionProvider>
  );
}