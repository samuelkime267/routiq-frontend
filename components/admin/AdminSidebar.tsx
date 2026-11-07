"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { isActivePath, visibleNavigation } from "@/lib/adminNavigation";
import {
  formatAdminRole,
  formatAdminStatus,
} from "@/lib/admin";
import { APP_URLS } from "@/lib/urls";
import type { AdminPermission, ApiAdminUser } from "@/types/api";

const statusTone = {
  ACTIVE: "green",
  INVITED: "amber",
  SUSPENDED: "red",
  DEACTIVATED: "neutral",
} as const;

interface AdminSidebarProps {
  user: ApiAdminUser;
  permissions: AdminPermission[];
  onNavigate?: () => void;
  className?: string;
}

export default function AdminSidebar({
  user,
  permissions,
  onNavigate,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const groups = visibleNavigation(permissions);

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
            Admin console
          </p>
        </div>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2 pb-1.5 text-[9px] font-semibold tracking-[0.18em] text-muted/80 uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold transition focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
                          active
                            ? "bg-pri text-white"
                            : "text-muted hover:bg-well hover:text-pri",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={cn(
                            "size-4",
                            active ? "text-lime" : "text-muted/80 group-hover:text-pri",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {active ? (
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

        <div className="mt-6 rounded-2xl border border-line bg-well/50 p-3">
          <p className="text-[9px] font-semibold tracking-[0.16em] text-muted uppercase">
            Your access
          </p>
          <p className="mt-1.5 text-[12px] font-semibold text-pri">
            {formatAdminRole(user.adminRole)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {permissions.length} permissions enabled
          </p>
          <Badge
            tone={statusTone[user.adminStatus]}
            className="mt-2 px-2.5 py-0.5 text-[10px]"
          >
            {formatAdminStatus(user.adminStatus)}
          </Badge>
        </div>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <a
          href={APP_URLS.marketplace}
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] font-semibold text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
        >
          View marketplace
          <Icon name="arrow-up-right" className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
