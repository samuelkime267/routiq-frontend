"use client";

import { useEffect, useState } from "react";
import type { ApiUser } from "@/types/api";
import { getStoredUser } from "@/lib/session";
import { useHydrated } from "@/lib/useHydrated";

const SESSION_EVENT = "routiq:session";

/**
 * Reads the signed-in customer from the shared session store.
 *
 * The auth app writes the session on a shared development cookie and a
 * handoff token establishes the first-party token on this host, so the header
 * only needs to react to local storage and same-tab session events.
 */
export function useMarketplaceAccount() {
  const hydrated = useHydrated();
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SESSION_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SESSION_EVENT, sync);
    };
  }, []);

  return {
    hydrated,
    user: hydrated ? user : null,
  };
}

export function announceSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}
