import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, FileText, Users, Wheat,
  LogOut, ArrowUpDown, Store, Building2, ArrowLeftRight,
  Cog, ChevronsLeft, ChevronsRight, Wallet, ShoppingBag,
  Scale, ShieldCheck, FileSpreadsheet, Truck, ChevronDown,
  Printer, Monitor, BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "./SidebarContext";

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/pos", label: "Punto de Venta", icon: Store },
    ],
  },
  {
    label: "Inventario",
    items: [
      { path: "/inventory", label: "Productos", icon: Package },
      { path: "/machines", label: "Modelos de Máquina", icon: Cog },
      { path: "/transfers", label: "Transferencias", icon: ArrowLeftRight },
      { path: "/stock", label: "Movimientos", icon: ArrowUpDown },
    ],
  },
  {
    label: "Ventas",
    items: [
      { path: "/invoices", label: "Facturación", icon: FileText },
      { path: "/clients", label: "Clientes", icon: Users },
      { path: "/orders", label: "Pedidos Online", icon: ShoppingBag },
      { path: "/cash-registers", label: "Cajas", icon: Wallet },
      { path: "/reports", label: "Reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Logística",
    items: [
      { path: "/despatches", label: "Guías Remisión", icon: Truck },
    ],
  },
  {
    label: "SUNAT",
    items: [
      { path: "/sunat-config", label: "Configuración", icon: ShieldCheck },
      { path: "/sunat-documents", label: "Documentos", icon: FileSpreadsheet },
      { path: "/tax-configuration", label: "Config. Tributaria", icon: Scale },
    ],
  },
  {
    label: "Admin",
    items: [
      { path: "/branches", label: "Sedes", icon: Building2 },
      { path: "/printer-settings", label: "Impresora", icon: Printer },
      { path: "/system", label: "Sistema", icon: Monitor },
    ],
  },
];

function CollapsibleSection({
  section,
  isCollapsed,
  onClose,
  defaultOpen = true,
}: {
  section: NavSection;
  isCollapsed: boolean;
  onClose?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (isCollapsed) {
    return (
      <div>
        <div className="mx-2 my-2 border-t border-slate-200 dark:border-slate-700/60" />
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center justify-center px-0 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 mb-1 group"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {section.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-300 dark:text-slate-600 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      <div
        className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {section.items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/25 dark:shadow-orange-900/30 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="text-[13px] whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, signOut } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const isCollapsed = !onClose && collapsed;

  return (
    <div
      className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-border transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className={`${isCollapsed ? "px-3 py-5" : "p-6"} border-b border-border`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 bg-orange-500/20 dark:bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wheat className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white whitespace-nowrap">
                Katsumoto
              </h1>
              <p className="text-[11px] text-orange-700 dark:text-orange-300/60 whitespace-nowrap">
                Sistema de Facturación
              </p>
            </div>
          )}
        </div>
      </div>

      {!onClose && (
        <div
          className={`flex ${
            isCollapsed ? "justify-center" : "justify-end"
          } ${isCollapsed ? "px-3 py-3" : "px-4 pt-4 pb-1"}`}
        >
          <button
            onClick={toggle}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronsLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      )}

      <nav
        className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} overflow-auto`}
      >
        {navSections.map((section, sectionIdx) => (
          <div key={section.label} className={sectionIdx > 0 ? "mt-3" : ""}>
            <CollapsibleSection
              section={section}
              isCollapsed={isCollapsed}
              onClose={onClose}
            />
          </div>
        ))}
      </nav>

      <div className={`${isCollapsed ? "px-2 py-3" : "p-4"} border-t border-border`}>
        {user && !isCollapsed && (
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 dark:text-orange-100 truncate">
                {user.full_name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-orange-300/50 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors ml-2"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-slate-400 dark:text-orange-100/60" />
            </button>
          </div>
        )}
        {user && isCollapsed && (
          <button
            onClick={signOut}
            className="flex items-center justify-center w-full p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            title={`Cerrar sesión (${user.full_name})`}
          >
            <LogOut className="w-4 h-4 text-slate-400 dark:text-orange-100/60" />
          </button>
        )}
        {!isCollapsed && (
          <p className="text-[10px] text-slate-400 dark:text-orange-200/40 text-center">
            Katsumoto v{__APP_VERSION__}
          </p>
        )}
      </div>
    </div>
  );
}