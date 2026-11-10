"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

interface KeyedResourceState<T> {
  /** Request descriptor the stored response belongs to. */
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Loads a resource that is keyed by a request descriptor (for example a
 * reporting range).
 *
 * Unlike `useResource`, a changed key is treated as a fresh load, so the caller
 * can show a loading state instead of presenting figures from the previous
 * range as if they belonged to the new one. Loading is derived from the stored
 * key rather than written in the effect body, which keeps the effect free of
 * render-phase state updates.
 */
export function useKeyedResource<T>(
  key: string,
  load: () => Promise<T>,
  fallbackError = "We could not load this report. Please try again.",
) {
  const [state, setState] = useState<KeyedResourceState<T>>({
    key: "",
    data: null,
    error: null,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const requestKey = `${key}::${reloadToken}`;

  useEffect(() => {
    let active = true;

    loadRef
      .current()
      .then((data) => {
        if (!active) return;
        setState({ key, data, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState((previous) => ({
          key,
          data: previous.key === key ? previous.data : null,
          error:
            error instanceof ApiError ? error.message : fallbackError,
        }));
      });

    return () => {
      active = false;
    };
  }, [requestKey, key, fallbackError]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const stale = state.key !== key;

  return {
    data: state.data,
    error: stale ? null : state.error,
    loading: stale,
    reload,
  };
}
