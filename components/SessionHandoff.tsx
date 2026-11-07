"use client";

import { useEffect } from "react";
import { ensureSessionBootstrap } from "@/lib/api";

/**
 * Exchanges a cross-app handoff token for a first-party session on this host.
 * Pages that call the API do this automatically; this covers pages that do not.
 */
export default function SessionHandoff() {
  useEffect(() => {
    void ensureSessionBootstrap();
  }, []);

  return null;
}
