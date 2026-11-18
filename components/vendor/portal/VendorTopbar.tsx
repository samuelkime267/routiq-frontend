"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/icons";
import VendorNotifications from "@/components/vendor/portal/VendorNotifications";
import VendorProfileMenu from "@/components/vendor/portal/VendorProfileMenu";
import { findVendorNavItem } from "@/lib/vendorNavigation";

interface VendorTopbarProps {
  onOpenMenu: () => void;
}

export default function VendorTopbar({ onOpenMenu }: VendorTopbarProps) {
  const pathname = usePathname();
  const match = findVendorNavItem(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2.5 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          aria-controls="vendor-mobile-navigation"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-pri/25 hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none lg:hidden"
        >
          <Icon name="menu" className="size-4" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 lg:hidden"
          aria-label="Routiq vendor dashboard"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-pri text-lime">
            <Logo className="size-4" />
          </span>
          <span className="hidden text-[13px] font-semibold text-pri sm:block">
            Routiq Vendor
          </span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-muted uppercase">
            {match?.group.label ?? "Vendor workspace"}
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold text-ink">
            {match?.item.label ?? "Dashboard"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/products/new"
            className="hidden items-center gap-1.5 rounded-full bg-pri px-3 py-2 text-[11.5px] font-semibold text-white transition hover:bg-pri-deep focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none sm:inline-flex"
          >
            <Icon name="plus" className="size-3.5 text-lime" />
            Add product
          </Link>

          <VendorNotifications />
          <VendorProfileMenu />
        </div>
      </div>
    </header>
  );
}
