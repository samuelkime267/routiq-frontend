import type { PaginationMeta } from "@/types/api";

/**
 * Shared server-side pagination primitives.
 *
 * Every collection page must send `page`, `limit`, `search`, sort and filter
 * values to the API and render the `pagination` block it returns. Records are
 * never sliced in the browser.
 */

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 20;

export type QueryValue = string | number | boolean | undefined | null;

export function buildQueryString(params: Record<string, QueryValue>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();

  return query ? `?${query}` : "";
}

export function emptyMeta(limit = DEFAULT_PAGE_SIZE): PaginationMeta {
  return { page: 1, limit, total: 0, pages: 0 };
}

export function pageBounds(meta: PaginationMeta) {
  if (meta.total === 0) return { from: 0, to: 0 };

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return { from, to };
}

/**
 * Produces a compact page list such as [1, "…", 4, 5, 6, "…", 12].
 * Page numbers are zero-indexed positions, gaps are rendered as ellipses.
 */
export function pageWindow(page: number, pages: number, span = 1) {
  if (pages <= 0) return [] as (number | "gap")[];

  const pagesAround = new Set<number>([1, pages]);

  for (let index = page - span; index <= page + span; index += 1) {
    if (index >= 1 && index <= pages) pagesAround.add(index);
  }

  const sorted = [...pagesAround].sort((left, right) => left - right);
  const result: (number | "gap")[] = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push("gap");
    result.push(value);
  });

  return result;
}

export function toggleSort(
  current: SortState | null,
  key: string,
  initialDirection: SortDirection = "asc",
): SortState {
  if (!current || current.key !== key) {
    return { key, direction: initialDirection };
  }

  return {
    key,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}
