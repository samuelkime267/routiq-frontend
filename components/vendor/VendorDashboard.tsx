"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ApiError, storeApi, userApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { clearAuth, getAccessToken, getStoredUser, saveUser } from "@/lib/session";
import { useHydrated } from "@/lib/useHydrated";
import {
  APP_URLS,
  authLoginUrl,
  roleHome,
  withSessionHandoff,
} from "@/lib/urls";
import type { ApiStore, ApiUser, StoreStatus } from "@/types/api";

const STATUS: Record<
  StoreStatus,
  {
    label: string;
    tone: "amber" | "green" | "red" | "neutral";
    copy: string;
  }
> = {
  draft: {
    label: "Draft",
    tone: "neutral",
    copy: "Finish your store details and submit the application for review.",
  },
  pending: {
    label: "Pending review",
    tone: "amber",
    copy: "Our team is reviewing your documents. You can still make edits.",
  },
  under_review: {
    label: "Under review",
    tone: "amber",
    copy: "A reviewer is checking your application and may request more information.",
  },
  approved: {
    label: "Approved",
    tone: "green",
    copy: "Your store is live. Keep stock and opening hours up to date.",
  },
  rejected: {
    label: "Needs changes",
    tone: "red",
    copy: "Update the requested details and resubmit for review.",
  },
  suspended: {
    label: "Suspended",
    tone: "neutral",
    copy: "This store is paused. Contact support for the next step.",
  },
  closed: {
    label: "Closed",
    tone: "neutral",
    copy: "This storefront is closed and cannot receive orders.",
  },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

function StoreCard({ store }: { store: ApiStore }) {
  const status = STATUS[store.status];
  const editable = store.status === "pending" || store.status === "rejected";

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative h-24 bg-pri">
        {store.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute -top-10 -right-8 size-40 rounded-full border border-white/10" />
            <div className="absolute top-8 -right-2 size-20 rounded-full bg-lime/10" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pri-deep/45 to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>

      <div className="relative px-4 pb-4">
        <div className="-mt-7 mb-3 flex items-end justify-between gap-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-well text-pri shadow-sm">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon name="store" className="size-5" />
            )}
          </span>
          <span className="pb-1 text-[11px] text-muted">
            {store.submittedAt ? `Sent ${formatDate(store.submittedAt)}` : "Draft"}
          </span>
        </div>

        <h3 className="truncate text-[15px] font-semibold text-ink">
          {store.name}
        </h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Icon name="store" className="size-3" />
            {store.category}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Icon name="map-pin" className="size-3" />
            {store.address.city}, {store.address.state}
          </span>
        </p>

        <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
          {status.copy}
        </p>

        {store.status === "rejected" && store.rejectionReason ? (
          <p className="mt-2 rounded-lg bg-danger/5 px-2.5 py-2 text-[11px] leading-relaxed text-danger">
            {store.rejectionReason}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          {editable ? (
            <Button
              href={`/onboarding/${store._id}`}
              size="sm"
              fullWidth
              icon={
                <Icon
                  name={store.status === "rejected" ? "refresh" : "file"}
                  className="size-3.5"
                />
              }
            >
              {store.status === "rejected" ? "Fix and resubmit" : "Edit details"}
            </Button>
          ) : (
            <Button
              href={`/onboarding/${store._id}`}
              size="sm"
              variant="outline"
              fullWidth
              icon={<Icon name="store" className="size-3.5" />}
            >
              View application
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function VendorDashboard() {
  const hydrated = useHydrated();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [currentUser, storeResult] = await Promise.all([
          userApi.me(),
          storeApi.mine(),
        ]);

        if (cancelled) return;

        if (currentUser.role === "user") {
          window.location.href = withSessionHandoff(
            roleHome(currentUser.role),
            getAccessToken(),
          );
          return;
        }

        setUser(currentUser);
        saveUser(currentUser);
        setStores(storeResult.stores);
      } catch (loadError) {
        if (cancelled) return;

        if (loadError instanceof ApiError) {
          if (loadError.status === 401) {
            clearAuth();
            window.location.href = authLoginUrl();
            return;
          }
          setError(loadError.message);
        } else {
          setError("Could not load your dashboard. Please refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const approved = stores.filter((store) => store.status === "approved").length;
  const pending = stores.filter((store) => store.status === "pending").length;
  const rejected = stores.filter((store) => store.status === "rejected").length;
  const needsAttention = rejected > 0;
  const displayUser = user ?? (hydrated ? getStoredUser() : null);
  const firstName = displayUser?.name?.split(" ")[0] ?? "there";
  const greetingText = hydrated ? greeting() : "Hello";

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pri/60">
            Vendor dashboard
          </p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[32px]">
            {greetingText}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Manage your storefront, verification, and payouts in one place.
          </p>
        </div>

        <Button
          href="/onboarding"
          icon={<Icon name="plus" className="size-4" />}
          className="max-sm:w-full"
        >
          Add a store
        </Button>
      </div>

      {error ? (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="relative overflow-hidden rounded-[24px] bg-pri px-5 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute top-12 -right-2 size-28 rounded-full bg-lime/10" />

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-lime uppercase">
            <Icon name="sparkles" className="size-3" />
            {stores.length ? "Store operations" : "Sell on Routiq"}
          </span>

          <h2 className="mt-4 max-w-[420px] text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
            {stores.length
              ? "Keep your storefront ready for every order."
              : "Turn your shelves into a storefront shoppers can find."}
          </h2>
          <p className="mt-3 max-w-[400px] text-[12px] leading-relaxed text-white/70">
            {stores.length
              ? "Verified vendors settle faster, appear in nearby search, and keep customers coming back."
              : "Complete a seven-step application with your business details, payout account, and KYB documents."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              href="/onboarding"
              variant="lime"
              icon={<Icon name="arrow-right" className="size-4" />}
            >
              {stores.length ? "Add another store" : "Start onboarding"}
            </Button>
            <a
              href={APP_URLS.marketplace}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse marketplace
              <Icon name="arrow-up-right" className="size-4" />
            </a>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[11px] text-white/60">
            <Icon name="shield" className="size-3.5 text-lime" />
            Nigerian KYB checks · Encrypted payout details
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Live stores", value: approved, icon: "check-circle" as const },
            { label: "In review", value: pending, icon: "clock" as const },
            { label: "Needs changes", value: rejected, icon: "alert-circle" as const },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl",
                  stat.label === "Needs changes" && stat.value > 0
                    ? "bg-danger/10 text-danger"
                    : "bg-well text-pri",
                )}
              >
                <Icon name={stat.icon} className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[20px] leading-none font-semibold text-ink">
                  {loading ? "—" : stat.value}
                </p>
                <p className="mt-1 text-[11px] text-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {needsAttention ? (
        <Alert tone="error" className="mt-4" title="A store needs your attention">
          One of your applications was returned with changes. Open it from the
          list below, fix the highlighted fields, and resubmit.
        </Alert>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
              Your stores
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {stores.length
                ? `${stores.length} store${stores.length === 1 ? "" : "s"} tied to your vendor account.`
                : "No storefronts yet. Your first application takes about 10 minutes."}
            </p>
          </div>
          {stores.length ? (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-pri hover:underline"
            >
              Add a store
              <Icon name="plus" className="size-3.5" />
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-64 animate-pulse rounded-2xl border border-line bg-white"
              />
            ))}
          </div>
        ) : stores.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store._id} store={store} />
            ))}
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <span className="grid size-11 place-items-center rounded-2xl bg-lime text-pri-deep">
                  <Icon name="store" className="size-5" />
                </span>
                <h3 className="mt-4 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                  Ready when you are
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  We will guide you through your business details, address,
                  opening hours, representative, payout account, and documents.
                </p>
                <Button
                  href="/onboarding"
                  className="mt-4"
                  icon={<Icon name="arrow-right" className="size-4" />}
                >
                  Start your application
                </Button>
              </div>

              <ul className="space-y-2.5">
                {[
                  "Add your business and store identity",
                  "Pin your location and opening hours",
                  "Upload CAC, ID, and proof of address",
                  "Submit for review and start selling",
                ].map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl bg-soft/70 px-3 py-2.5 text-[12px] text-ink"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-pri">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {stores.length ? (
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: "file" as const,
              title: "Keep documents current",
              body: "Expired IDs or CAC certificates can delay payouts.",
            },
            {
              icon: "clock" as const,
              title: "Update opening hours",
              body: "Shoppers only see stores as open during saved hours.",
            },
            {
              icon: "card" as const,
              title: "Confirm payout details",
              body: "Settlement accounts must match your business name.",
            },
          ].map((tip) => (
            <div
              key={tip.title}
              className="rounded-2xl border border-line bg-white px-4 py-4"
            >
              <Icon name={tip.icon} className="size-4 text-pri" />
              <p className="mt-2.5 text-[12px] font-semibold text-ink">
                {tip.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {tip.body}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="shield" className="size-3.5 text-pri" />
          Routiq vendor operations
        </span>
        <span>
          Need help?{" "}
          <a
            href={`mailto:support@routiq.ng`}
            className="font-semibold text-pri underline-offset-2 hover:underline"
          >
            support@routiq.ng
          </a>
        </span>
      </footer>
    </div>
  );
}
