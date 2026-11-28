"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Logo } from "@/components/icons";
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  adminAuthApi,
} from "@/lib/api";
import { clearAuth } from "@/lib/session";
import { sessionResolved } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
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
 * every request. The session itself is resolved by `ReduxProvider`.
 */
export default function AdminSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const sessionUser = useAppSelector((state) => state.auth.user);
  const permissions = useAppSelector((state) => state.auth.permissions);
  const reason = useAppSelector((state) => state.auth.reason);
  const redirecting = useRef(false);

  const redirectToLogin = useCallback(
    (nextReason: "expired" | "denied") => {
      if (redirecting.current) return;
      redirecting.current = true;
      clearAuth();
      // A hard navigation keeps the public, host-relative path and its query
      // string intact through the host rewrite in `proxy.ts`.
      window.location.replace(`/login?reason=${nextReason}`);
    },
    [],
  );

  const user =
    sessionUser && sessionUser.role === "admin"
      ? (sessionUser as ApiAdminUser)
      : null;

  useEffect(() => {
    if (status === "anonymous") {
      redirectToLogin(reason ?? "expired");
      return;
    }

    if (status === "authenticated" && !user) {
      redirectToLogin("denied");
    }
  }, [status, user, reason, redirectToLogin]);

  useEffect(() => {
    const handleExpired = () => redirectToLogin("expired");
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      void adminAuthApi
        .me()
        .then((profile) => {
          dispatch(
            sessionResolved({
              scope: "admin",
              user: profile.user,
              permissions: profile.permissions,
            }),
          );
        })
        .catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 403) {
            redirectToLogin("denied");
            return;
          }

          redirectToLogin("expired");
        });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dispatch, redirectToLogin]);

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

  if (!user || status !== "authenticated") {
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
    <AdminSessionContext.Provider value={{ user, permissions, logout }}>
      {children}
    </AdminSessionContext.Provider>
  );
}
