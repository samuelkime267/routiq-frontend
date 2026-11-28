"use client";

import type { ApiUser } from "@/types/api";
import { useHydrated } from "@/lib/useHydrated";
import { useAppSelector } from "@/store/hooks";

/**
 * Reads the signed-in account from the Redux store.
 *
 * The session is resolved once per host by `ReduxProvider`, so consumers just
 * subscribe to the store instead of polling local storage or listening for
 * custom events.
 */
export function useMarketplaceAccount() {
  const hydrated = useHydrated();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);
  const account = user && "role" in user ? (user as ApiUser) : null;

  return {
    hydrated,
    user: hydrated ? account : null,
    status,
  };
}

/**
 * Kept for callers that used to broadcast a session change. Redux already
 * notifies every subscriber, so this is intentionally a no-op.
 */
export function announceSessionChange() {}
