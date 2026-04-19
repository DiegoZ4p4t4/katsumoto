// ==========================================
// Árbol Jerárquico de Categorías
// ==========================================
import type { ProductFamily } from "../types";

export const CATEGORY_TREE: Record<ProductFamily, {
  label: string; icon: string; color: string; activeColor: string;
  groups: Record<string, { label: string; icon: string; color: string; categories: readonly string[] }>;
}> = {
  productos: {
    label: "Productos", icon: "Package", color: "text-emerald-600 dark:text-emerald-400", activeColor: "bg-emerald-600 text-white",
    groups: {
      herramientas: { label: "Herramientas", icon: "Wrench", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", categories: ["Herramientas Manuales", "Herramientas Eléctricas", "Herramientas Neumáticas", "Medición y Precisión", "Corte y Mecanizado", "Soldadura", "Llaves y Dados", "Destornilladores", "Martillos y Mazos", "Otros Herramientas"] },
      repuestos: { label: "Repuestos", icon: "Cog", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", categories: ["Filtro de Aire", "Carburador", "Diafragma de Carburador", "Filtro de Combustible", "Bujía", "Gomeyet", "Perno", "Tuerca", "Tuerca de Cabezal", "Tuerca de Espárrago", "Rulemán", "Cadena", "Cebador", "Kit de Pernos", "Resorte", "Espárrago", "Válvula", "Cachimba / Llave", "Chupón de Bujía", "Filtración", "Transmisión", "Rodamientos", "Sellos", "Bombas", "Mangueras", "Mantenimiento", "Encendido", "Lubricantes", "Frenos", "Eléctrico", "Hidráulica", "Neumática", "Estructura", "Cosecha", "Riego", "Siembra", "Cuchillas", "Accesorios", "Otros"] },
      maquinas: { label: "Máquinas", icon: "Tractor", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", categories: ["Cosechadora", "Fumigadora", "Macheteadora", "Pulverizadora", "Sembradora", "Tractor", "Motosierra", "Bomba de Agua", "Generador", "Otras Máquinas"] },
    },
  },
  servicios: {
    label: "Servicios", icon: "Briefcase", color: "text-blue-600 dark:text-blue-400", activeColor: "bg-blue-600 text-white",
    groups: {
      transporte: { label: "Transporte", icon: "Truck", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", categories: ["Flete Local", "Flete Nacional", "Distribución", "Mudanza Maquinaria", "Otros Transportes"] },
      mantenimiento: { label: "Mantenimiento", icon: "Wrench", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", categories: ["Preventivo", "Correctivo", "Instalación", "Calibración", "Diagnóstico", "Reparación en Sitio", "Otros Mantenimientos"] },
    },
  },
};

export function getGroupsForFamily(family: string): Array<{ key: string; label: string; color: string }> {
  if (family === "all") return Object.entries(CATEGORY_TREE).flatMap(([, fVal]) => Object.entries(fVal.groups).map(([gKey, gVal]) => ({ key: gKey, label: gVal.label, color: gVal.color })));
  const fam = CATEGORY_TREE[family as ProductFamily];
  if (!fam) return [];
  return Object.entries(fam.groups).map(([key, val]) => ({ key, label: val.label, color: val.color }));
}

export function getCategoriesForGroup(family: string, group: string): string[] {
  if (!group || group === "all") return getCategoriesForFamily(family);
  const fam = CATEGORY_TREE[family as ProductFamily];
  if (!fam) return [];
  const grp = fam.groups[group];
  if (!grp) return [];
  return [...grp.categories];
}

export function getCategoriesForFamily(family: string): string[] {
  if (family === "all") return getAllCategories();
  const fam = CATEGORY_TREE[family as ProductFamily];
  if (!fam) return [];
  return Object.values(fam.groups).flatMap(g => [...g.categories]);
}

export function getAllCategories(): string[] {
  return Object.values(CATEGORY_TREE).flatMap(f => Object.values(f.groups).flatMap(g => [...g.categories]));
}

export function getFamilyForGroup(group: string): ProductFamily | null {
  for (const [fKey, fVal] of Object.entries(CATEGORY_TREE)) {
    if (group in fVal.groups) return fKey as ProductFamily;
  }
  return null;
}

export const CATEGORIES = getAllCategories();

// ==========================================
// Categorías de Máquinas
// ==========================================
export const MACHINE_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  macheteadora: { label: "Macheteadora / Desbrozadora", icon: "Scissors", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  fumigadora: { label: "Fumigadora", icon: "SprayCan", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  pulverizadora: { label: "Pulverizadora", icon: "Droplets", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  cosechadora: { label: "Cosechadora", icon: "Wheat", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  tractor: { label: "Tractor", icon: "Tractor", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  motosierra: { label: "Motosierra", icon: "TreePine", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  bomba: { label: "Bomba de Agua", icon: "Waves", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  generador: { label: "Generador / Planta", icon: "Zap", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  sembradora: { label: "Sembradora", icon: "Sprout", color: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400" },
  otro: { label: "Otro", icon: "Cog", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
};

export const MACHINE_CATEGORY_KEYS = Object.keys(MACHINE_CATEGORIES);

export const MACHINE_BRANDS = ["Stihl", "Husqvarna", "Honda", "Mitsubishi", "Zamora", "Shindaiwa", "Echo", "Dolmar", "Efco", "John Deere", "Massey Ferguson", "New Holland", "Kubota", "Yanmar", "Case IH", "Valtra", "Agromaster", "Locin", "Sipro", "Otra"] as const;

// ==========================================
// Unidades de Medida
// ==========================================
export const UNITS = ["Unidad", "Metro", "Litro", "Galón", "Kilogramo", "Tonelada", "Kit", "Juego", "Par", "Rollo", "Caja", "Saco", "Hora", "Servicio", "Viaje", "Kilómetro"] as const;
