"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { ApiError, adminAuthApi, userApi } from "@/lib/api";
import {
  sessionLoading,
  sessionResolved,
  sessionSignedOut,
  type AuthScope,
} from "@/store/authSlice";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

/**
 * Resolves the signed-in session from the httpOnly refresh cookie on first
 * paint. `apiFetch` performs the refresh itself when the access token is
 * missing, so one profile call is enough to rebuild the whole session.
 */
function AuthBootstrap({ scope }: { scope: AuthScope }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const resolvedScope = useAppSelector((state) => state.auth.scope);

  useEffect(() => {
    if (status === "authenticated" && resolvedScope === scope) return;

    dispatch(sessionLoading());

    let cancelled = false;

    (async () => {
      try {
        if (scope === "admin") {
          const profile = await adminAuthApi.me();

          if (cancelled) return;

          dispatch(
            sessionResolved({
              scope,
              user: profile.user,
              permissions: profile.permissions,
            }),
          );
        } else {
          const user = await userApi.me();

          if (cancelled) return;

          dispatch(sessionResolved({ scope, user }));
        }
      } catch (error) {
        if (cancelled) return;

        dispatch(
          sessionSignedOut({
            reason:
              error instanceof ApiError && error.status === 403
                ? "denied"
                : "expired",
          }),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, scope, status, resolvedScope]);

  return null;
}

interface ReduxProviderProps {
  children: ReactNode;
  /** Which session this host resolves: customer/vendor or administrator. */
  scope?: AuthScope;
}

export default function ReduxProvider({
  children,
  scope = "app",
}: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <AuthBootstrap scope={scope} />
      {children}
    </Provider>
  );
}
