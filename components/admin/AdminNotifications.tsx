"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { useAdminSession } from "@/components/admin/AdminSession";
import { formatAdminDate, formatAdminRole } from "@/lib/admin";
import { cn } from "@/lib/cn";

interface NotificationEntry {
  id: string;
  title: string;
  description?: string;
  time?: string;
  icon: "shield" | "lock" | "sparkles" | "clock";
  tone: "teal" | "lime" | "amber";
}

export default function AdminNotifications() {
  const { user, permissions } = useAdminSession();
  const [read, setRead] = useState(false);

  const entries: NotificationEntry[] = [
    {
      id: "sign-in",
      title: "Signed in to the admin console",
      description: `Latest session recorded for ${user.email}.`,
      time: formatAdminDate(user.lastLoginAt),
      icon: "shield",
      tone: "teal",
    },
    {
      id: "role",
      title: `${formatAdminRole(user.adminRole)} access`,
      description: `${permissions.length} permissions are active on this account.`,
      time: "Current session",
      icon: "lock",
      tone: "lime",
    },
  ];

  if (user.permissionGrants?.length) {
    entries.push({
      id: "grants",
      title: "Extra permissions granted",
      description: `${user.permissionGrants.length} permission${
        user.permissionGrants.length === 1 ? "" : "s"
      } added on top of your role defaults.`,
      time: "Account configuration",
      icon: "sparkles",
      tone: "amber",
    });
  }

  const unread = read ? 0 : 1;

  return (
    <DropdownMenu
      label="Notifications"
      align="right"
      widthClassName="w-[340px] max-w-[calc(100vw-2rem)]"
      panelClassName="p-0"
      triggerClassName="relative size-9 justify-center p-0"
      trigger={
        <>
          <Icon name="bell" className="size-4" />
          {unread > 0 ? (
            <span
              aria-label={`${unread} unread notification`}
              className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-white"
            />
          ) : null}
        </>
      }
    >
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-[12px] font-semibold text-ink">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => setRead(true)}
              className="rounded text-[11px] font-semibold text-pri transition hover:underline focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
            >
              Mark all as read
            </button>
          ) : (
            <span className="text-[10px] font-medium text-muted">
              You&apos;re up to date
            </span>
          )}
        </div>

        <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "flex gap-3 px-4 py-3",
                unread > 0 && entry.id === "sign-in" && "bg-well/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                  entry.tone === "teal" && "bg-pri/10 text-pri",
                  entry.tone === "lime" && "bg-lime/40 text-pri-deep",
                  entry.tone === "amber" && "bg-accent/20 text-[#8a5a00]",
                )}
              >
                <Icon name={entry.icon} className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] leading-snug font-semibold text-ink">
                  {entry.title}
                </p>
                {entry.description ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {entry.description}
                  </p>
                ) : null}
                {entry.time ? (
                  <p className="mt-1 text-[10px] text-muted/80">{entry.time}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <p className="border-t border-line px-4 py-2.5 text-[10px] leading-relaxed text-muted">
          Notifications reflect activity in your admin session.
        </p>
      </div>
    </DropdownMenu>
  );
}
