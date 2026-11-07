"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

interface ResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
}

/**
 * Loads a single API resource and exposes an explicit `reload`.
 *
 * `resourceKey` controls when the record changes; `reload` re-fetches without
 * discarding the currently rendered data. The request-generation guard keeps
 * an older response from overwriting a newer one.
 */
export function useResource<T>(
  resourceKey: string,
  load: () => Promise<T>,
  fallbackError = "We could not load this record. Please try again.",
) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    let active = true;

    loadRef
      .current()
      .then((data) => {
        if (!active) return;
        setState({ data, error: null, loading: false, refreshing: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState((previous) => ({
          data: previous.data,
          error: error instanceof ApiError ? error.message : fallbackError,
          loading: false,
          refreshing: false,
        }));
      });

    return () => {
      active = false;
    };
  }, [resourceKey, reloadToken, fallbackError]);

  const reload = useCallback(() => {
    setState((previous) => ({
      ...previous,
      loading: !previous.data,
      refreshing: Boolean(previous.data),
      error: null,
    }));
    setReloadToken((token) => token + 1);
  }, []);

  return { ...state, reload };
}
