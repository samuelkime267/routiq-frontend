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
  vendorPortalApi,
} from "@/lib/api";
import { clearAuth } from "@/lib/session";
import { useAppSelector } from "@/store/hooks";
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
 * Vendor workspace shell.
 *
 * Authentication comes from the Redux store, which `ReduxProvider` resolves
 * from the refresh cookie. This provider adds the store snapshot and decides
 * whether the vendor still needs onboarding.
 *
 * The API verifies the session and the store on every request; this provider
 * only decides what to render while that happens. Vendors without a store are
 * sent to onboarding instead of seeing an empty workspace.
 */
export default function VendorSession({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.auth.status);
  const sessionUser = useAppSelector((state) => state.auth.user);
  const reason = useAppSelector((state) => state.auth.reason);
  const [snapshot, setSnapshot] = useState<{
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

  const user =
    sessionUser && sessionUser.role !== "admin"
      ? (sessionUser as ApiUser)
      : null;

  const loadStore = useCallback(async () => {
    try {
      const settings = await vendorPortalApi.settings();

      return { store: settings.store, access: settings.access };
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
    if (status === "anonymous") {
      redirect(`/auth/login?reason=${reason ?? "expired"}`);
      return;
    }

    if (status !== "authenticated" || !sessionUser) return;

    if (sessionUser.role !== "vendor") {
      redirect("/auth/login?reason=denied");
      return;
    }

    let cancelled = false;

    void loadStore()
      .then((next) => {
        if (!next || cancelled) return;
        setSnapshot(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        redirect(
          `/auth/login?reason=${
            error instanceof ApiError && error.status === 403
              ? "denied"
              : "expired"
          }`,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [status, sessionUser, reason, loadStore, redirect]);

  useEffect(() => {
    const handleExpired = () => redirect("/auth/login?reason=expired");
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      void loadStore()
        .then((next) => {
          if (next) setSnapshot(next);
        })
        .catch(() => {
          /* A failed background refresh keeps the current session visible. */
        });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadStore, redirect]);

  const refreshStore = useCallback(async () => {
    const next = await loadStore();

    if (next) setSnapshot(next);
  }, [loadStore]);

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

  if (!user || status !== "authenticated" || !snapshot) {
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
    <VendorSessionContext.Provider
      value={{
        user,
        store: snapshot.store,
        access: snapshot.access,
        refreshStore,
        logout,
      }}
    >
      {children}
    </VendorSessionContext.Provider>
  );
}
