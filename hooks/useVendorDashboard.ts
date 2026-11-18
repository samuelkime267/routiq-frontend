"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, vendorPortalApi } from "@/lib/api";
import type { DashboardRangeKey, VendorDashboard } from "@/types/api";

export interface VendorRangeSelection {
  range: DashboardRangeKey;
  from?: string;
  to?: string;
}

export type VendorDashboardStatus =
  | "loading"
  | "refreshing"
  | "ready"
  | "error";

interface VendorDashboardState {
  status: VendorDashboardStatus;
  data: VendorDashboard | null;
  error: string | null;
}

const INITIAL_STATE: VendorDashboardState = {
  status: "loading",
  data: null,
  error: null,
};

/**
 * Loads the vendor dashboard for the selected reporting range.
 *
 * The API owns every number; this hook only tracks the request lifecycle so the
 * screen can keep the last good snapshot visible while a new range loads.
 */
export function useVendorDashboard(
  initialSelection: VendorRangeSelection = { range: "7d" },
) {
  const [selection, setSelection] =
    useState<VendorRangeSelection>(initialSelection);
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<VendorDashboardState>(INITIAL_STATE);

  useEffect(() => {
    let active = true;

    vendorPortalApi
      .dashboard(selection)
      .then((data) => {
        if (!active) return;
        setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState((previous) => ({
          status: "error",
          data: previous.data,
          error:
            error instanceof ApiError
              ? error.message
              : "We could not load your dashboard. Check your connection and try again.",
        }));
      });

    return () => {
      active = false;
    };
  }, [selection, requestKey]);

  const applySelection = useCallback((next: VendorRangeSelection) => {
    setSelection(next);
    setState((previous) => ({
      status: previous.data ? "refreshing" : "loading",
      data: previous.data,
      error: null,
    }));
    setRequestKey((key) => key + 1);
  }, []);

  const refresh = useCallback(() => {
    setState((previous) => ({
      status: previous.data ? "refreshing" : "loading",
      data: previous.data,
      error: null,
    }));
    setRequestKey((key) => key + 1);
  }, []);

  return {
    selection,
    status: state.status,
    data: state.data,
    error: state.error,
    applySelection,
    refresh,
  };
}
