import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

/**
 * One store per browser tab. Authentication state is intentionally in memory:
 * the refresh token stays in the httpOnly cookie, so a reload re-resolves the
 * session instead of trusting anything written to disk.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
