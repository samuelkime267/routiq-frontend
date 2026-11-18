"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Logo } from "@/components/icons";
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  authApi,
  userApi,
  vendorPortalApi,
} from "@/lib/api";
import { clearAuth, saveUser } from "@/lib/session";
import type {
  ApiUser,
  VendorSettingsSnapshot,
  VendorStoreAccess,
} from "@/types/api";

interface VendorSessionValue {
  user: ApiUser;
  store: VendorSettingsSnapshot["store"];
  access: VendorStoreAccess;
  /** Re-reads the store snapshot after a settings change. */
  refreshStore: () => Promise<void>;
  logout: () => Promise<void>;
}

const VendorSessionContext = createContext<VendorSessionValue | null>(null);

export function useVendorSession() {
  const session = useContext(VendorSessionContext);

  if (!session) {
    throw new Error("useVendorSession must be used inside VendorSession");
  }

  return session;
}

/**
 * Protects the vendor portal.
 *
 * The API verifies the session and the store on every request; this provider
 * only decides what to render while that happens. Vendors without a store are
 * sent to onboarding instead of seeing an empty workspace.
 */
export default function VendorSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{
    user: ApiUser;
    store: VendorSettingsSnapshot["store"];
    access: VendorStoreAccess;
  } | null>(null);
  const redirecting = useRef(false);

  const redirect = useCallback((target: string) => {
    if (redirecting.current) return;
    redirecting.current = true;
    clearAuth();
    window.location.replace(target);
  }, []);

  const load = useCallback(async () => {
    const user = await userApi.me();

    if (user.role !== "vendor") {
      redirect("/auth/login?reason=denied");
      return null;
    }

    try {
      const settings = await vendorPortalApi.settings();

      return { user, store: settings.store, access: settings.access };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // A vendor account exists but has not submitted a store application.
        redirect("/onboarding");
        return null;
      }

      throw error;
    }
  }, [redirect]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const next = await load();
        if (!next || cancelled) return;

        saveUser(next.user);
        setSession(next);
      } catch (error) {
        if (cancelled) return;

        const reason =
          error instanceof ApiError && error.status === 403
            ? "denied"
            : "expired";
        redirect(`/auth/login?reason=${reason}`);
      }
    }

    void start();

    const handleExpired = () => redirect("/auth/login?reason=expired");
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      void load()
        .then((next) => {
          if (!next || cancelled) return;
          saveUser(next.user);
          setSession(next);
        })
        .catch(() => {
          /* A failed background refresh keeps the current session visible. */
        });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load, redirect]);

  const refreshStore = useCallback(async () => {
    const settings = await vendorPortalApi.settings();
    setSession((current) =>
      current
        ? { ...current, store: settings.store, access: settings.access }
        : current,
    );
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clearing local state still signs this browser out.
    } finally {
      clearAuth();
      redirecting.current = true;
      window.location.replace("/auth/login");
    }
  }, []);

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-soft/60 px-6">
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-line bg-white px-10 py-9 text-center">
          <span className="grid size-11 place-items-center rounded-2xl bg-pri text-lime">
            <Logo className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              Opening your vendor workspace
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Checking your session and store…
            </p>
          </div>
          <span className="size-5 animate-spin rounded-full border-2 border-pri/20 border-t-pri" />
        </div>
      </div>
    );
  }

  return (
    <VendorSessionContext.Provider value={{ ...session, refreshStore, logout }}>
      {children}
    </VendorSessionContext.Provider>
  );
}
