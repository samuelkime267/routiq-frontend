"use client";

import { Icon } from "@/components/icons";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { useAdminSession } from "@/components/admin/AdminSession";
import { adminInitials, formatAdminRole, formatAdminStatus } from "@/lib/admin";
import { APP_URLS } from "@/lib/urls";

export default function AdminProfileMenu() {
  const { user, permissions, logout } = useAdminSession();

  return (
    <DropdownMenu
      label="Account menu"
      align="right"
      widthClassName="w-72"
      triggerClassName="h-10 gap-2 py-1 pr-2 pl-1"
      trigger={
        <>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pri text-[11px] font-semibold text-lime">
            {adminInitials(user.name)}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[150px] truncate text-[12px] leading-tight font-semibold text-ink">
              {user.name}
            </span>
            <span className="block text-[10px] leading-tight text-muted">
              {formatAdminRole(user.adminRole)}
            </span>
          </span>
          <Icon name="chevron-down" className="size-3.5 text-muted" />
        </>
      }
      header={
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pri text-[12px] font-semibold text-lime">
            {adminInitials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
            <p className="mt-1.5 text-[10px] font-semibold text-pri">
              {formatAdminRole(user.adminRole)} ·{" "}
              {formatAdminStatus(user.adminStatus)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              {permissions.length} permissions
            </p>
          </div>
        </div>
      }
      items={[
        {
          id: "dashboard",
          label: "Admin dashboard",
          icon: "activity",
          href: "/",
        },
        {
          id: "marketplace",
          label: "View marketplace",
          icon: "arrow-up-right",
          onSelect: () => {
            window.location.assign(APP_URLS.marketplace);
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
