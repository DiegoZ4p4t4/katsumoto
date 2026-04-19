import { useState, useCallback } from "react";

/**
 * Default page sizes offered in the selector.
 */
export const DEFAULT_PAGE_SIZES = [10, 25, 50] as const;

/**
 * Options for usePagination.
 */
export interface UsePaginationOptions {
  /** Total number of items. */
  totalItems: number;
  /** Initial page size (default: 25). */
  initialPageSize?: number;
  /** Available page sizes (default: [10, 25, 50]). */
  pageSizes?: readonly number[];
  /** Initial page number (default: 1). */
  initialPage?: number;
}

/**
 * Return type for usePagination.
 */
export interface UsePaginationReturn {
  /** Current page (1-based). */
  page: number;
  /** Current page size. */
  pageSize: number;
  /** Total number of pages (min 1). */
  totalPages: number;
  /** Safe current page (clamped to [1, totalPages]). */
  safePage: number;
  /** Available page sizes. */
  pageSizes: readonly number[];
  /** Go to a specific page. */
  setPage: (page: number) => void;
  /** Go to the next page (clamped). */
  nextPage: () => void;
  /** Go to the previous page (clamped). */
  prevPage: () => void;
  /** Go to the first page. */
  firstPage: () => void;
  /** Go to the last page. */
  lastPage: () => void;
  /** Change the page size (resets to page 1). */
  setPageSize: (size: number) => void;
  /** Reset to page 1. */
  resetPage: () => void;
  /** Index of the first item on the current page (0-based). */
  startIndex: number;
  /** Index of the last item on the current page (exclusive, 0-based). */
  endIndex: number;
}

/**
 * Generic pagination hook with page size selector support.
 *
 * @param options - Pagination configuration
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * const pagination = usePagination({ totalItems: sorted.length });
 * const paginated = sorted.slice(pagination.startIndex, pagination.endIndex);
 * ```
 */
export function usePagination(options: UsePaginationOptions): UsePaginationReturn {
  const {
    totalItems,
    initialPageSize = 25,
    pageSizes = DEFAULT_PAGE_SIZES,
    initialPage = 1,
  } = options;

  const [page, setPageRaw] = useState(initialPage);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  const setPage = useCallback((p: number) => {
    setPageRaw(p);
  }, []);

  const nextPage = useCallback(() => {
    setPageRaw((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPageRaw((p) => Math.max(p - 1, 1));
  }, []);

  const firstPage = useCallback(() => {
    setPageRaw(1);
  }, []);

  const lastPage = useCallback(() => {
    setPageRaw(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  const resetPage = useCallback(() => {
    setPageRaw(1);
  }, []);

  return {
    page,
    pageSize,
    totalPages,
    safePage,
    pageSizes,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    resetPage,
    startIndex,
    endIndex,
  };
}
