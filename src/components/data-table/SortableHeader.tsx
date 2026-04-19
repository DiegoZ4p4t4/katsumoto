import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/hooks/useTableSort";

/**
 * Props for SortableHeader component.
 */
export interface SortableHeaderProps<K extends string = string> {
  /** The column key this header sorts by. */
  column: K;
  /** Display label for the header. */
  label: string;
  /** Whether this column is currently the active sort column. */
  isActive: boolean;
  /** Current sort direction (only relevant when isActive is true). */
  direction: SortDirection;
  /** Callback when header is clicked to toggle sort. */
  onSort: (column: K) => void;
  /** Additional CSS classes for the <th> element. */
  className?: string;
}

/**
 * A reusable sortable table header cell.
 * Shows sort arrows: inactive (↕), ascending (↑), descending (↓).
 * Active column uses orange accent color to match Katsumoto's theme.
 */
export function SortableHeader<K extends string = string>({
  column,
  label,
  isActive,
  direction,
  onSort,
  className = "",
}: SortableHeaderProps<K>) {
  return (
    <th
      className={`py-3 px-4 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-muted/60 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {isActive ? (
          direction === "asc" ? (
            <ArrowUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          ) : (
            <ArrowDown className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/60" />
        )}
      </span>
    </th>
  );
}
