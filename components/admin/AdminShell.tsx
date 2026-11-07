"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { useAdminSession } from "@/components/admin/AdminSession";
import { cn } from "@/lib/cn";

/**
 * Application frame for the admin console.
 *
 * Desktop uses a persistent sidebar; below `lg` the same navigation becomes a
 * modal drawer opened from the top bar. A skip link keeps keyboard users from
 * tabbing through the whole navigation before reaching page content.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, permissions } = useAdminSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-soft/60">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:rounded-full focus:bg-pri focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:ring-4 focus:ring-pri/30 focus:outline-none"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-line lg:block">
        <AdminSidebar user={user} permissions={permissions} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-pri-deep/45 backdrop-blur-[2px] transition-opacity duration-200",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setDrawerOpen(false)}
        />

        <div
          id="admin-mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-[292px] flex-col border-r border-line bg-white shadow-[24px_0_64px_rgba(6,76,80,0.2)] transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
            className="absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-full text-muted transition hover:bg-well hover:text-ink focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
          >
            <Icon name="x" className="size-4" />
          </button>

          <AdminSidebar
            user={user}
            permissions={permissions}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </div>

      <div className="flex min-h-dvh flex-col lg:pl-[256px]">
        <AdminTopbar onOpenMenu={() => setDrawerOpen(true)} />

        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 px-4 pt-5 pb-10 focus:outline-none sm:px-6 sm:pt-6 lg:px-8 lg:pb-12"
        >
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
