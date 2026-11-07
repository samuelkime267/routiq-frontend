const FALLBACK = {
  auth: "http://auth.localhost:3000",
  vendor: "http://vendor.localhost:3000",
  admin: "http://admin.localhost:3000",
  marketplace: "http://localhost:3000",
} as const;

export const APP_URLS = {
  auth: process.env.NEXT_PUBLIC_AUTH_URL || FALLBACK.auth,
  vendor: process.env.NEXT_PUBLIC_VENDOR_URL || FALLBACK.vendor,
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || FALLBACK.admin,
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_URL || FALLBACK.marketplace,
};

export function roleHome(role: string) {
  if (role === "admin") return APP_URLS.admin;
  if (role === "vendor") return APP_URLS.vendor;

  return APP_URLS.marketplace;
}

export function authLoginUrl() {
  return `${APP_URLS.auth}/login`;
}

/**
 * Appends a short-lived access token when navigating to another Routiq app.
 * The target app exchanges it for a first-party refresh cookie, because a
 * refresh cookie set on auth.localhost cannot be read from vendor.localhost in
 * browsers that block third-party cookies.
 */
export function withSessionHandoff(url: string, accessToken?: string | null) {
  if (!accessToken || typeof window === "undefined") return url;

  try {
    const target = new URL(url);

    if (target.origin === window.location.origin) return url;

    target.hash = new URLSearchParams({ handoff: accessToken }).toString();

    return target.toString();
  } catch {
    return url;
  }
}
