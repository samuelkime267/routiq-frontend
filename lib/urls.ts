const FALLBACK = {
  vendor: "http://vendor.localhost:3000",
  admin: "http://admin.localhost:3000",
  marketplace: "http://localhost:3000",
} as const;

export const APP_URLS = {
  vendor: process.env.NEXT_PUBLIC_VENDOR_URL || FALLBACK.vendor,
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || FALLBACK.admin,
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_URL || FALLBACK.marketplace,
};

/**
 * Authentication is per host.
 *
 * Every application subdomain serves the same `/auth/*` routes so a session can
 * be created where it is used: cookies and local storage are first-party, and
 * no token ever crosses a subdomain boundary.
 */
export type AuthScope = "marketplace" | "vendor";

export const AUTH_ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  verifyEmail: "/auth/verify-email",
  resetPassword: (token: string) =>
    `/auth/reset-password/${encodeURIComponent(token)}`,
} as const;

/** Roles each host accepts at its own sign-in form. */
export const AUTH_SCOPE_ROLES: Record<AuthScope, readonly string[]> = {
  marketplace: ["user"],
  vendor: ["vendor"],
};

export function authLoginUrl(next?: string | null) {
  return next
    ? `${AUTH_ROUTES.login}?next=${encodeURIComponent(next)}`
    : AUTH_ROUTES.login;
}

export function authRegisterUrl(role?: "user" | "vendor", next?: string | null) {
  const params = new URLSearchParams();

  if (role) params.set("role", role);
  if (next) params.set("next", next);

  const query = params.toString();

  return query ? `${AUTH_ROUTES.register}?${query}` : AUTH_ROUTES.register;
}

/** Where an account for `role` has to sign in. */
export function loginForRole(role: string) {
  if (role === "vendor") return `${APP_URLS.vendor}${AUTH_ROUTES.login}`;
  if (role === "admin") return `${APP_URLS.admin}/login`;

  return `${APP_URLS.marketplace}${AUTH_ROUTES.login}`;
}

/** Human name of the app that owns a role, used in mismatch messages. */
export function appNameForRole(role: string) {
  if (role === "vendor") return "vendor";
  if (role === "admin") return "admin";

  return "customer";
}

/** Absolute home of the app that owns a role. */
export function appHomeForRole(role: string) {
  if (role === "vendor") return APP_URLS.vendor;
  if (role === "admin") return APP_URLS.admin;

  return APP_URLS.marketplace;
}

/**
 * Reads the `next` parameter the marketplace adds when it sends a guest to
 * sign in. Only same-site absolute paths are accepted, so a crafted link can
 * never turn the auth page into an open redirect.
 */
export function readNextPath() {
  if (typeof window === "undefined") return null;

  const next = new URLSearchParams(window.location.search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\") || /^\s*[a-z]+:/i.test(next)) return null;

  return next;
}
