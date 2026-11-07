"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/icons";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminProfileMenu from "@/components/admin/AdminProfileMenu";
import { findNavItem } from "@/lib/adminNavigation";
import { APP_URLS } from "@/lib/urls";

interface AdminTopbarProps {
  onOpenMenu: () => void;
}

export default function AdminTopbar({ onOpenMenu }: AdminTopbarProps) {
  const pathname = usePathname();
  const match = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2.5 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          aria-controls="admin-mobile-navigation"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-pri/25 hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none lg:hidden"
        >
          <Icon name="menu" className="size-4" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 lg:hidden"
          aria-label="Routiq admin dashboard"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-pri text-lime">
            <Logo className="size-4" />
          </span>
          <span className="hidden text-[13px] font-semibold text-pri sm:block">
            Routiq Admin
          </span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-muted uppercase">
            {match?.group.label ?? "Admin console"}
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold text-ink">
            {match?.item.label ?? "Dashboard"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a
            href={APP_URLS.marketplace}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the marketplace in a new tab"
            title="View marketplace"
            className="hidden size-9 place-items-center rounded-full border border-line text-muted transition hover:border-pri/25 hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none sm:grid"
          >
            <Icon name="arrow-up-right" className="size-4" />
          </a>

          <AdminNotifications />
          <AdminProfileMenu />
        </div>
      </div>
    </header>
  );
}
