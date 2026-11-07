"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/icons";
import { ApiError, authApi, userApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { clearAuth, getStoredUser, saveUser } from "@/lib/session";
import { useHydrated } from "@/lib/useHydrated";
import { APP_URLS, authLoginUrl } from "@/lib/urls";
import type { ApiUser } from "@/types/api";

const links = [
  { href: "/", label: "Dashboard", icon: "store" as const },
  { href: "/onboarding", label: "Add a store", icon: "plus" as const },
];

export default function VendorHeader() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const displayUser = user ?? (hydrated ? getStoredUser() : null);

  useEffect(() => {
    let cancelled = false;

    userApi
      .me()
      .then((currentUser) => {
        if (cancelled) return;
        setUser(currentUser);
        saveUser(currentUser);
      })
      .catch((error) => {
        if (cancelled) return;

        // apiFetch already tried the httpOnly refresh cookie, so a 401 here
        // means the session is genuinely gone. Network/server errors should
        // not sign the user out.
        if (error instanceof ApiError && error.status === 401) {
          clearAuth();
          window.location.href = authLoginUrl();
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await authApi.logout();
    } catch {
      // Signing out locally still matters if the refresh token is stale.
    } finally {
      clearAuth();
      window.location.href = authLoginUrl();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-pri text-lime">
            <Logo className="size-5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-pri">
            Routiq
            <span className="ml-1.5 rounded-full bg-well px-1.5 py-0.5 text-[9px] font-bold tracking-[0.08em] text-pri uppercase">
              Vendor
            </span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition",
                  active
                    ? "bg-well text-pri"
                    : "text-muted hover:bg-soft hover:text-ink",
                )}
              >
                <Icon name={link.icon} className="size-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={APP_URLS.marketplace}
            className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-pri/30 hover:bg-well md:inline-flex"
          >
            Marketplace
            <Icon name="arrow-up-right" className="size-3.5" />
          </a>

          <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pr-1 pl-2.5">
            <span className="hidden max-w-[120px] truncate text-[12px] font-medium text-ink sm:block">
              {displayUser?.name ?? "Vendor"}
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-pri text-[11px] font-semibold text-lime">
              {(displayUser?.name ?? "V").slice(0, 1).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-danger disabled:opacity-50"
            >
              <Icon name="logout" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-2 sm:hidden">
        <div className="flex items-center gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition",
                  active ? "bg-pri text-white" : "bg-soft text-muted",
                )}
              >
                <Icon name={link.icon} className="size-3.5" />
                {link.label}
              </Link>
            );
          })}
          <a
            href={APP_URLS.marketplace}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-soft px-3 py-2 text-[12px] font-semibold text-muted"
          >
            Shop
            <Icon name="arrow-up-right" className="size-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
