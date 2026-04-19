import { useState, useMemo, useCallback } from "react";

/**
 * Generic sort direction type.
 */
export type SortDirection = "asc" | "desc";

/**
 * Generic sort state.
 */
export interface SortState<K extends string = string> {
  column: K;
  direction: SortDirection;
}

/**
 * A comparator function: returns negative, zero, or positive.
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * A map of column keys to comparator functions.
 */
export type Comparators<T, K extends string = string> = Record<K, Comparator<T>>;

/**
 * Options for useTableSort.
 */
export interface UseTableSortOptions<T, K extends string = string> {
  /** Map of sortable column keys to comparator functions. */
  comparators: Comparators<T, K>;
  /** Default sort column. */
  defaultColumn: K;
  /** Default sort direction (default: "asc"). */
  defaultDirection?: SortDirection;
}

/**
 * Return type for useTableSort.
 */
export interface UseTableSortReturn<T, K extends string = string> {
  sort: SortState<K>;
  setSort: React.Dispatch<React.SetStateAction<SortState<K>>>;
  toggleSort: (column: K) => void;
  sorted: T[];
}

/**
 * Generic sort hook. Sorts an array of items using configured comparators.
 *
 * @param items - The array to sort (typically filtered results)
 * @param options - Sort configuration
 * @returns Sort state, toggle function, and sorted array
 *
 * @example
 * ```tsx
 * const { sort, toggleSort, sorted } = useTableSort(filtered, {
 *   comparators: {
 *     name: (a, b) => a.name.localeCompare(b.name),
 *     price: (a, b) => a.price - b.price,
 *   },
 *   defaultColumn: "name",
 * });
 * ```
 */
export function useTableSort<T, K extends string = string>(
  items: T[],
  options: UseTableSortOptions<T, K>,
): UseTableSortReturn<T, K> {
  const { comparators, defaultColumn, defaultDirection = "asc" } = options;

  const [sort, setSort] = useState<SortState<K>>({
    column: defaultColumn,
    direction: defaultDirection,
  });

  const toggleSort = useCallback(
    (column: K) => {
      setSort((prev) =>
        prev.column === column
          ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" }
          : { column, direction: "asc" },
      );
    },
    [],
  );

  const sorted = useMemo(() => {
    const comparator = comparators[sort.column];
    if (!comparator) return items;

    const arr = [...items];
    arr.sort((a, b) => {
      const cmp = comparator(a, b);
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [items, sort, comparators]);

  return { sort, setSort, toggleSort, sorted };
}
