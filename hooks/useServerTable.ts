"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_PAGE_SIZE,
  emptyMeta,
  toggleSort,
  type SortDirection,
  type SortState,
} from "@/lib/pagination";
import type { PaginationMeta } from "@/types/api";
import { useDebouncedValue } from "./useDebouncedValue";

export interface ServerTableQuery {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortDirection;
  /** Active filter values keyed by API query parameter. */
  filters: Record<string, string>;
}

export type ServerTableLoader<T> = (
  query: ServerTableQuery,
) => Promise<{ rows: T[]; pagination: PaginationMeta }>;

interface UseServerTableOptions<T> {
  loader: ServerTableLoader<T>;
  initialPageSize?: number;
  initialSearch?: string;
  initialFilters?: Record<string, string>;
  initialSort?: SortState | null;
  searchDebounceMs?: number;
}

interface TableSnapshot<T> {
  /** Request identity, used to derive the loading state without an effect. */
  key: string;
  rows: T[];
  meta: PaginationMeta;
  error: string | null;
}

/**
 * State container for server-side collection tables.
 *
 * The loader receives page/limit/search/filter/sort values and must return the
 * API's pagination block. Rows are never sliced or filtered in the browser.
 */
export function useServerTable<T>({
  loader,
  initialPageSize = DEFAULT_PAGE_SIZE,
  initialSearch = "",
  initialFilters = {},
  initialSort = null,
  searchDebounceMs = 350,
}: UseServerTableOptions<T>) {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [sort, setSort] = useState<SortState | null>(initialSort);
  const [reloadToken, setReloadToken] = useState(0);
  const [snapshot, setSnapshot] = useState<TableSnapshot<T> | null>(null);

  const search = useDebouncedValue(searchInput.trim(), searchDebounceMs);

  // Keep the latest loader without re-running the fetch when the caller passes
  // an inline function. Writing refs during render is disallowed, so the ref
  // is synchronised in its own effect before the fetch effect below.
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const requestKey = JSON.stringify({
    page,
    pageSize,
    search,
    sort,
    filters,
    reloadToken,
  });

  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    const key = requestKey;

    loaderRef
      .current({
        page,
        limit: pageSize,
        search: search || undefined,
        sortBy: sort?.key,
        sortOrder: sort?.direction,
        filters,
      })
      .then((result) => {
        if (cancelled || requestId.current !== currentRequest) return;

        setSnapshot({
          key,
          rows: result.rows,
          meta: result.pagination,
          error: null,
        });

        // Deleting the last row of the last page should not strand the user on
        // an empty page.
        if (result.pagination.pages > 0 && page > result.pagination.pages) {
          setPageState(result.pagination.pages);
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled || requestId.current !== currentRequest) return;

        setSnapshot({
          key,
          rows: [],
          meta: emptyMeta(pageSize),
          error:
            requestError instanceof ApiError
              ? requestError.message
              : "Something went wrong while loading this collection.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, search, sort, filters, reloadToken, requestKey]);

  const setPage = useCallback((next: number) => {
    setPageState(Math.max(1, next || 1));
  }, []);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPageState(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchInput(value);
    setPageState(1);
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((current) => {
      const next = { ...current };
      if (value) next[key] = value;
      else delete next[key];

      return next;
    });
    setPageState(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchInput(initialSearch);
    setPageState(1);
    // `initialFilters` is intentionally captured once for this table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeSort = useCallback((key: string) => {
    setSort((current) => toggleSort(current, key));
    setPageState(1);
  }, []);

  const setSorting = useCallback((key: string, direction: SortDirection) => {
    setSort({ key, direction });
    setPageState(1);
  }, []);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const rows = snapshot?.rows ?? [];
  const meta = snapshot?.meta ?? emptyMeta(pageSize);
  const loading = snapshot?.key !== requestKey;

  return {
    rows,
    meta,
    loading,
    /** True while re-fetching an already populated table. */
    refreshing: loading && rows.length > 0,
    error: loading ? null : (snapshot?.error ?? null),
    page,
    pageSize,
    search,
    searchInput,
    filters,
    sort,
    activeFilterCount,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    resetFilters,
    changeSort,
    setSorting,
    reload,
  };
}
