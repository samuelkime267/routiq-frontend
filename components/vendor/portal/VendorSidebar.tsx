"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { APP_URLS } from "@/lib/urls";
import { storeStatusLabel } from "@/lib/vendors";
import {
  VENDOR_NAVIGATION,
  findVendorNavItem,
} from "@/lib/vendorNavigation";
import type { ApiUser, StoreStatus, VendorSettingsSnapshot } from "@/types/api";

const STATUS_TONES: Record<
  StoreStatus,
  "green" | "amber" | "red" | "neutral" | "blue"
> = {
  draft: "neutral",
  pending: "amber",
  under_review: "blue",
  approved: "green",
  rejected: "red",
  suspended: "red",
  closed: "neutral",
};

interface VendorSidebarProps {
  user: ApiUser;
  store: VendorSettingsSnapshot["store"];
  onNavigate?: () => void;
  className?: string;
}

export default function VendorSidebar({
  user,
  store,
  onNavigate,
  className,
}: VendorSidebarProps) {
  const pathname = usePathname();
  const active = findVendorNavItem(pathname);

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <span className="grid size-9 place-items-center rounded-xl bg-pri text-lime">
          <Logo className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] leading-none font-semibold tracking-tight text-pri">
            Routiq
          </p>
          <p className="mt-1 text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Vendor workspace
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b border-line px-3 py-3">
        <div className="rounded-2xl border border-line bg-well/50 p-3">
          <div className="flex items-center gap-2.5">
            {store.logo ? (
              // Store images are vendor-supplied remote URLs, so a plain image
              // tag keeps the portal free of Next image-domain configuration.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo}
                alt=""
                className="size-9 shrink-0 rounded-xl border border-line object-cover"
              />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pri/10 text-pri">
                <Icon name="store" className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-ink">
                {store.name}
              </p>
              <p className="truncate text-[10px] text-muted">{store.category}</p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <Badge
              tone={STATUS_TONES[store.status]}
              className="px-2.5 py-0.5 text-[10px]"
            >
              {storeStatusLabel(store.status)}
            </Badge>
            <Link
              href="/settings"
              onClick={onNavigate}
              className="text-[10px] font-semibold text-pri transition hover:underline"
            >
              Manage
            </Link>
          </div>
        </div>
      </div>

      <nav
        aria-label="Vendor navigation"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-5">
          {VENDOR_NAVIGATION.map((group) => (
            <div key={group.id}>
              <p className="px-2 pb-1.5 text-[9px] font-semibold tracking-[0.18em] text-muted/80 uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    active?.item.href === item.href &&
                    active.group.id === group.id;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        title={item.description}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold transition focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
                          isActive
                            ? "bg-pri text-white"
                            : "text-muted hover:bg-well hover:text-pri",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={cn(
                            "size-4",
                            isActive
                              ? "text-lime"
                              : "text-muted/80 group-hover:text-pri",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {isActive ? (
                          <span className="ml-auto size-1.5 rounded-full bg-lime" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <p className="px-3 pb-1.5 text-[10px] text-muted">
          Signed in as{" "}
          <span className="font-semibold text-ink">{user.email}</span>
        </p>
        <a
          href={APP_URLS.marketplace}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] font-semibold text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
        >
          View marketplace
          <Icon name="arrow-up-right" className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
