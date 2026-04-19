// ==========================================
// Tipos de Sede
// ==========================================
export const BRANCH_TYPES: Record<string, { label: string; description: string; color: string; icon: string }> = {
  warehouse: { label: "Almacén", description: "Recibe compras, stock central, distribuye a otras sedes", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "Warehouse" },
  pos: { label: "Punto de Venta", description: "Venta presencial, genera comprobantes SUNAT", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "Store" },
  online: { label: "Tienda Virtual", description: "Venta online, pedidos web, despachos", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: "Globe" },
};
