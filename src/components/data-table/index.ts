/**
 * Data table components for reusable sort + pagination UI.
 *
 * Usage:
 * ```tsx
 * import { SortableHeader } from "@/components/data-table/SortableHeader";
 * import { PaginationControls } from "@/components/data-table/PaginationControls";
 * import { useTableSort } from "@/hooks/useTableSort";
 * import { usePagination } from "@/hooks/usePagination";
 * ```
 */

export { SortableHeader } from "./SortableHeader";
export type { SortableHeaderProps } from "./SortableHeader";

export { PaginationControls } from "./PaginationControls";
export type { PaginationControlsProps } from "./PaginationControls";
