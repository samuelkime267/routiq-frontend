"use client";

import type { AdminPermission, ApiUser } from "@/types/api";
import { store } from "@/store";
import {
  sessionResolved,
  sessionSignedOut,
  tokenUpdated,
  userUpdated,
} from "@/store/authSlice";

/**
 * Session facade.
 *
 * The access token and user live in the Redux store (memory only). The durable
 * part of the session is the httpOnly refresh cookie, which the browser sends
 * to the API but JavaScript cannot read. Nothing is written to localStorage or
 * a readable cookie, so an XSS cannot lift a long-lived credential.
 *
 * This module keeps the small function surface the rest of the app already
 * imports, while the Redux store remains the single source of truth.
 */

export function getAccessToken(): string | null {
  return store.getState().auth.accessToken;
}

export function setAccessToken(token: string | null) {
  store.dispatch(tokenUpdated(token));
}

export function saveAuth(
  accessToken: string,
  user: ApiUser,
  permissions: AdminPermission[] = [],
) {
  store.dispatch(tokenUpdated(accessToken));
  store.dispatch(
    sessionResolved({
      scope: user.role === "admin" ? "admin" : "app",
      user,
      permissions,
    }),
  );
}

export function saveUser(user: ApiUser) {
  store.dispatch(userUpdated(user));
}

export function getStoredUser(): ApiUser | null {
  const user = store.getState().auth.user;

  return user && "role" in user ? (user as ApiUser) : null;
}

export function clearAuth() {
  store.dispatch(tokenUpdated(null));
  store.dispatch(sessionSignedOut({ reason: null }));
}
