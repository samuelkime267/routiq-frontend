"use client";

import { Icon } from "@/components/icons";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { useVendorSession } from "@/components/vendor/portal/VendorSession";
import { APP_URLS } from "@/lib/urls";
import { storeStatusLabel } from "@/lib/vendors";
import { vendorInitials } from "@/lib/vendorPortal";

export default function VendorProfileMenu() {
  const { user, store, logout } = useVendorSession();

  return (
    <DropdownMenu
      label="Account menu"
      align="right"
      widthClassName="w-72"
      triggerClassName="h-10 gap-2 py-1 pr-2 pl-1"
      trigger={
        <>
          {user.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profilePicture}
              alt=""
              className="size-8 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pri text-[11px] font-semibold text-lime">
              {vendorInitials(user.name)}
            </span>
          )}
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[150px] truncate text-[12px] leading-tight font-semibold text-ink">
              {user.name}
            </span>
            <span className="block max-w-[150px] truncate text-[10px] leading-tight text-muted">
              {store.name}
            </span>
          </span>
          <Icon name="chevron-down" className="size-3.5 text-muted" />
        </>
      }
      header={
        <div className="flex items-start gap-3">
          {user.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profilePicture}
              alt=""
              className="size-10 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pri text-[12px] font-semibold text-lime">
              {vendorInitials(user.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
            <p className="mt-1.5 text-[10px] font-semibold text-pri">
              {store.name} · {storeStatusLabel(store.status)}
            </p>
          </div>
        </div>
      }
      items={[
        {
          id: "dashboard",
          label: "Vendor dashboard",
          icon: "activity",
          href: "/",
        },
        {
          id: "settings",
          label: "Account settings",
          icon: "settings",
          href: "/settings",
        },
        {
          id: "marketplace",
          label: "View marketplace",
          icon: "arrow-up-right",
          onSelect: () => {
            window.open(APP_URLS.marketplace, "_blank", "noreferrer");
          },
        },
        {
          id: "sign-out",
          label: "Sign out",
          icon: "logout",
          danger: true,
          separatorBefore: true,
          onSelect: () => {
            void logout();
          },
        },
      ]}
    />
  );
}
