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
import { ApiError, SESSION_EXPIRED_EVENT, adminAuthApi } from "@/lib/api";
import { clearAuth, saveUser } from "@/lib/session";
import type { AdminPermission, ApiAdminUser } from "@/types/api";

interface AdminSessionValue {
  user: ApiAdminUser;
  permissions: AdminPermission[];
  logout: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function useAdminSession() {
  const session = useContext(AdminSessionContext);

  if (!session) {
    throw new Error("useAdminSession must be used inside AdminSessionProvider");
  }

  return session;
}

/**
 * Protects every admin console route. Frontend hiding is only a convenience:
 * the API independently verifies the session, admin status and permissions on
 * every request.
 */
export default function AdminSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<Omit<
    AdminSessionValue,
    "logout"
  > | null>(null);
  const redirecting = useRef(false);

  const redirectToLogin = useCallback(
    (reason: "expired" | "denied") => {
      if (redirecting.current) return;
      redirecting.current = true;
      clearAuth();
      // A hard navigation keeps the public, host-relative path and its query
      // string intact through the host rewrite in `proxy.ts`.
      window.location.replace(`/login?reason=${reason}`);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const profile = await adminAuthApi.me();
        if (cancelled) return;

        saveUser(profile.user);
        setSession({ user: profile.user, permissions: profile.permissions });
      } catch (error) {
        if (cancelled) return;

        const reason =
          error instanceof ApiError && error.status === 403
            ? "denied"
            : "expired";
        redirectToLogin(reason);
      }
    }

    void loadSession();

    const handleExpired = () => redirectToLogin("expired");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void loadSession();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [redirectToLogin]);

  const logout = useCallback(async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // Clearing local state still signs the user out of this browser.
    } finally {
      clearAuth();
      redirecting.current = true;
      window.location.replace("/login");
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
              Verifying admin access
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Checking your session and permissions…
            </p>
          </div>
          <span className="size-5 animate-spin rounded-full border-2 border-pri/20 border-t-pri" />
        </div>
      </div>
    );
  }

  return (
    <AdminSessionContext.Provider value={{ ...session, logout }}>
      {children}
    </AdminSessionContext.Provider>
  );
}
