"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { ApiError, vendorNotificationApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatRelativeTime,
  notificationIcon,
  notificationTone,
} from "@/lib/vendorPortal";
import type { ApiNotification } from "@/types/api";

const POLL_INTERVAL_MS = 60_000;

const toneStyles = {
  teal: "bg-pri/10 text-pri",
  lime: "bg-lime/40 text-pri-deep",
  amber: "bg-accent/20 text-[#8a5a00]",
  red: "bg-danger/10 text-danger",
} as const;

/**
 * Vendor notification bell.
 *
 * Reads the shared notification feed scoped to the signed-in account. Unread
 * state is owned by the server, so marking read here also clears it elsewhere.
 */
export default function VendorNotifications() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const result = await vendorNotificationApi.list({ limit: 8 });
      if (!mounted.current) return;

      setNotifications(result.notifications);
      setUnread(result.unread);
      setError(null);
    } catch (requestError) {
      if (!mounted.current) return;

      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Notifications could not be loaded.",
      );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    // The first fetch runs in a task so the effect only wires up subscriptions;
    // React's lint rules treat an immediate async call as a cascading render.
    const firstLoad = window.setTimeout(() => {
      void load();
    }, 0);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted.current = false;
      window.clearTimeout(firstLoad);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  const markRead = useCallback(
    async (notification: ApiNotification) => {
      if (notification.readAt || busy) return;

      setBusy(true);
      try {
        await vendorNotificationApi.markRead(notification._id);
        if (!mounted.current) return;

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
        setUnread((current) => Math.max(0, current - 1));
      } catch {
        // A failed read receipt is not worth interrupting the vendor.
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [busy],
  );

  const markAllRead = useCallback(async () => {
    if (busy || unread === 0) return;

    setBusy(true);
    try {
      await vendorNotificationApi.markAllRead();
      if (!mounted.current) return;

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
      );
      setUnread(0);
    } catch {
      // Ignore: the badge will correct itself on the next poll.
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [busy, unread]);

  return (
    <DropdownMenu
      label="Notifications"
      align="right"
      widthClassName="w-[360px] max-w-[calc(100vw-2rem)]"
      panelClassName="p-0"
      triggerClassName="relative size-9 justify-center p-0"
      trigger={
        <>
          <Icon name="bell" className="size-4" />
          {unread > 0 ? (
            <span
              aria-label={`${unread} unread notification${
                unread === 1 ? "" : "s"
              }`}
              className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-semibold text-white ring-2 ring-white"
            >
              {unread > 9 ? "9+" : unread}
            </span>
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
              onClick={() => void markAllRead()}
              disabled={busy}
              className="rounded text-[11px] font-semibold text-pri transition hover:underline disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
            >
              Mark all as read
            </button>
          ) : (
            <span className="text-[10px] font-medium text-muted">
              You&apos;re up to date
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2 px-4 py-4">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <span className="size-7 shrink-0 animate-pulse rounded-full bg-well" />
                <div className="flex-1 space-y-1.5">
                  <span className="block h-2.5 w-2/3 animate-pulse rounded bg-well" />
                  <span className="block h-2 w-full animate-pulse rounded bg-well/70" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[11px] text-muted">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 text-[11px] font-semibold text-pri hover:underline"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[12px] font-semibold text-ink">Nothing new</p>
            <p className="mt-1 text-[11px] text-muted">
              Order, product and payout updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="max-h-[340px] divide-y divide-line overflow-y-auto">
            {notifications.map((notification) => {
              const tone = notificationTone(notification.type);
              const unreadRow = !notification.readAt;
              const body = (
                <div className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                      toneStyles[tone],
                    )}
                  >
                    <Icon
                      name={notificationIcon(notification.type)}
                      className="size-3.5"
                    />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[12px] leading-snug text-ink",
                        unreadRow ? "font-semibold" : "font-medium",
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted/80">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {unreadRow ? (
                    <span className="mt-1.5 ml-auto size-1.5 shrink-0 rounded-full bg-pri" />
                  ) : null}
                </div>
              );

              return (
                <li
                  key={notification._id}
                  className={cn("px-4 py-3", unreadRow && "bg-well/40")}
                >
                  {notification.href ? (
                    <Link
                      href={notification.href}
                      onClick={() => void markRead(notification)}
                      className="block rounded-lg focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void markRead(notification)}
                      className="block w-full text-left"
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="border-t border-line px-4 py-2.5 text-[10px] leading-relaxed text-muted">
          Sales, catalogue and payout updates for your store.
        </p>
      </div>
    </DropdownMenu>
  );
}
