import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminPermission, ApiAdminUser, ApiUser } from "@/types/api";

export type AuthScope = "app" | "admin";
export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "anonymous";

export type AuthUser = ApiUser | ApiAdminUser;

interface SessionPayload {
  scope: AuthScope;
  user: AuthUser;
  permissions?: AdminPermission[];
}

interface AuthState {
  status: AuthStatus;
  /** Which app host resolved the session; guards react to this. */
  scope: AuthScope | null;
  user: AuthUser | null;
  permissions: AdminPermission[];
  /** Why the session is anonymous, used to pick the sign-in message. */
  reason: "expired" | "denied" | null;
  /**
   * The access token lives in memory only. It is never written to local
   * storage or a cookie: the httpOnly refresh cookie is the durable session.
   */
  accessToken: string | null;
}

const initialState: AuthState = {
  status: "idle",
  scope: null,
  user: null,
  permissions: [],
  reason: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionLoading(state) {
      state.status = "loading";
      state.reason = null;
    },
    sessionResolved(state, action: PayloadAction<SessionPayload>) {
      state.status = "authenticated";
      state.scope = action.payload.scope;
      state.user = action.payload.user;
      state.permissions = action.payload.permissions ?? [];
      state.reason = null;
    },
    sessionSignedOut(
      state,
      action: PayloadAction<{ reason?: "expired" | "denied" | null } | undefined>,
    ) {
      state.status = "anonymous";
      state.user = null;
      state.permissions = [];
      state.accessToken = null;
      state.reason = action.payload?.reason ?? null;
    },
    userUpdated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    permissionsUpdated(state, action: PayloadAction<AdminPermission[]>) {
      state.permissions = action.payload;
    },
    tokenUpdated(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
  },
});

export const {
  sessionLoading,
  sessionResolved,
  sessionSignedOut,
  userUpdated,
  permissionsUpdated,
  tokenUpdated,
} = authSlice.actions;

export default authSlice.reducer;
