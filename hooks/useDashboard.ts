"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, dashboardApi } from "@/lib/api";
import type { DashboardOverview, DashboardRangeKey } from "@/types/api";

export interface DashboardSelection {
  range: DashboardRangeKey;
  from?: string;
  to?: string;
}

export type DashboardStatus = "loading" | "refreshing" | "ready" | "error";

interface DashboardState {
  status: DashboardStatus;
  data: DashboardOverview | null;
  error: string | null;
}

const INITIAL_STATE: DashboardState = {
  status: "loading",
  data: null,
  error: null,
};

/**
 * Loads the dashboard overview and reloads it whenever the reporting range
 * changes. A request generation guard prevents an older response from
 * overwriting a newer range selection.
 */
export function useDashboard(
  initialSelection: DashboardSelection = { range: "7d" },
) {
  const [selection, setSelection] =
    useState<DashboardSelection>(initialSelection);
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  useEffect(() => {
    let active = true;

    dashboardApi
      .overview(selection)
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
              : "We could not load the dashboard. Check your connection and try again.",
        }));
      });

    return () => {
      active = false;
    };
  }, [selection, requestKey]);

  const applySelection = useCallback((next: DashboardSelection) => {
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
