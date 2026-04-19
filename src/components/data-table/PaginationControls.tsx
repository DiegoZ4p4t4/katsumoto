import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UsePaginationReturn } from "@/hooks/usePagination";

/**
 * Props for PaginationControls component.
 */
export interface PaginationControlsProps {
  /** Pagination state and controls from usePagination hook. */
  pagination: UsePaginationReturn;
  /** Total number of items being paginated (for display). */
  totalItems: number;
  /** Label for the items (e.g. "productos", "clientes"). */
  itemLabel?: string;
  /** Whether to show page number buttons with windowing (default: false = simple "X / Y"). */
  showPageNumbers?: boolean;
}

/**
 * Reusable pagination controls bar.
 * Shows "Mostrando N–M de T items", a page size selector, and navigation buttons.
 *
 * Two display modes:
 * - **Simple** (default): Shows `⏪ ◀ X / Y ▶ ⏩`
 * - **With page numbers**: Shows `⏪ ◀ [1][2]…[10] ▶ ⏩` with windowing (up to 7 visible)
 */
export function PaginationControls({
  pagination,
  totalItems,
  itemLabel = "registros",
  showPageNumbers = false,
}: PaginationControlsProps) {
  const {
    safePage,
    pageSize,
    totalPages,
    pageSizes,
    firstPage,
    prevPage,
    nextPage,
    lastPage,
    setPage,
    setPageSize,
    startIndex,
    endIndex,
  } = pagination;

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
      {/* Info: "Mostrando 1–25 de 100 productos" */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Mostrando</span>
        <span className="font-semibold text-foreground">
          {startIndex + 1}–{endIndex}
        </span>
        <span>de</span>
        <span className="font-semibold text-foreground">{totalItems}</span>
        <span>{itemLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Page size selector */}
        <Select
          value={String(pageSize)}
          onValueChange={(v) => setPageSize(Number(v))}
        >
          <SelectTrigger className="w-[70px] h-8 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Navigation buttons */}
        <button
          onClick={firstPage}
          disabled={safePage <= 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={prevPage}
          disabled={safePage <= 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {showPageNumbers ? (
          /* Page number buttons with windowing */
          <PageNumbers
            safePage={safePage}
            totalPages={totalPages}
            onPageClick={setPage}
          />
        ) : (
          /* Simple "X / Y" display */
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {safePage} / {totalPages}
          </span>
        )}

        <button
          onClick={nextPage}
          disabled={safePage >= totalPages}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={lastPage}
          disabled={safePage >= totalPages}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Page number buttons with windowing (up to 7 visible).
 */
function PageNumbers({
  safePage,
  totalPages,
  onPageClick,
}: {
  safePage: number;
  totalPages: number;
  onPageClick: (page: number) => void;
}) {
  const pages = buildPageWindow(safePage, totalPages);

  return (
    <div className="flex items-center gap-1">
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageClick(p as number)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              safePage === p
                ? "bg-orange-600 text-white shadow-sm"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ),
      )}
    </div>
  );
}

/**
 * Builds a windowed array of page numbers with ellipsis.
 * Shows at most 7 items: first, last, and neighbors of current page.
 */
function buildPageWindow(
  current: number,
  total: number,
): (number | "...")[] {
  const all = Array.from({ length: total }, (_, i) => i + 1);

  if (total <= 7) return all;

  return all
    .filter((p) => {
      if (p === 1 || p === total) return true;
      if (Math.abs(p - current) <= 1) return true;
      return false;
    })
    .reduce<(number | "...")[]>((acc, p, i) => {
      if (i > 0 && p - (acc[acc.length - 1] as number) > 1) {
        acc.push("...");
      }
      acc.push(p);
      return acc;
    }, []);
}
