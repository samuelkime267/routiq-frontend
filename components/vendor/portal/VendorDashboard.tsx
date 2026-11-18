"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import ChartFrame from "@/components/admin/dashboard/ChartFrame";
import RangeFilter from "@/components/admin/dashboard/RangeFilter";
import SeriesChart from "@/components/admin/dashboard/SeriesChart";
import { useVendorSession } from "@/components/vendor/portal/VendorSession";
import { useVendorDashboard } from "@/hooks/useVendorDashboard";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import {
  orderCustomer,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/orders";
import { storeStatusLabel } from "@/lib/vendors";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import {
  formatRelativeTime,
  formatVendorDay,
  formatVendorMetricValue,
  PENDING_TONES,
  vendorMetricIcon,
  vendorPendingIcon,
} from "@/lib/vendorPortal";
import type { VendorChartSeries } from "@/types/api";

const STORE_TONES = {
  draft: "neutral",
  pending: "amber",
  under_review: "blue",
  approved: "green",
  rejected: "red",
  suspended: "red",
  closed: "neutral",
} as const;

export default function VendorDashboard() {
  const { user, store, access } = useVendorSession();
  const firstName = user.name.split(/\s+/)[0] || "there";
  const { selection, status, data, error, applySelection, refresh } =
    useVendorDashboard({ range: "7d" });

  const loading = status === "loading";
  const refreshing = status === "refreshing";
  const metrics = data?.metrics ?? [];
  const charts = data?.charts ?? [];
  const pendingActions = data?.pendingActions ?? [];
  const pendingTotal = pendingActions.reduce(
    (total, item) => total + item.count,
    0,
  );
  const finance = data?.finance;

  const seriesFor = (key: string) =>
    charts.find((series) => series.key === key);

  const renderChart = (
    key: string,
    variant: "area" | "bar",
    className?: string,
  ) => {
    const series: VendorChartSeries | undefined = seriesFor(key);

    if (!series) {
      return (
        <ChartFrame
          className={className}
          title="Loading chart"
          description="Fetching your latest store activity."
          total={0}
          kind="count"
          loading
          hasData={false}
        >
          <div />
        </ChartFrame>
      );
    }

    return (
      <ChartFrame
        className={className}
        title={series.label}
        description={series.description}
        total={series.total}
        kind={series.kind}
        loading={loading}
        hasData={series.total > 0}
        footnote={`${series.points.length} ${
          data?.range.granularity === "hour" ? "hourly" : "daily"
        } buckets · ${data?.range.timezone ?? "Africa/Lagos"}`}
      >
        <SeriesChart
          points={series.points}
          kind={series.kind}
          variant={variant}
        />
      </ChartFrame>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Your store health, sales performance and the work waiting on you today. Every figure is calculated from your own store records."
        breadcrumbs={vendorBreadcrumbs("/")}
        actions={
          <>
            <Button
              href="/products/new"
              size="sm"
              icon={<Icon name="plus" />}
            >
              Add product
            </Button>
            <Button
              href="/orders"
              variant="outline"
              size="sm"
              icon={<Icon name="shopping-bag" />}
            >
              View orders
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={STORE_TONES[store.status]}>
              {storeStatusLabel(store.status)}
            </Badge>
            <Badge tone="neutral">{store.category}</Badge>
            {data ? (
              <Badge tone="neutral">
                Updated {formatRelativeTime(data.generatedAt)}
              </Badge>
            ) : null}
          </div>
        }
      />

      {!access.canSell ? (
        <Alert tone="info" title="Your store is not selling yet">
          {access.restriction ??
            "Finish store review before products can be published or orders fulfilled."}{" "}
          <Link
            href="/onboarding"
            className="font-semibold text-pri underline underline-offset-2"
          >
            Review your application
          </Link>
        </Alert>
      ) : null}

      <RangeFilter
        value={selection.range}
        from={selection.from}
        to={selection.to}
        rangeLabel={data?.range.label}
        timezone={data?.range.timezone}
        loading={refreshing}
        onChange={applySelection}
        onRefresh={refresh}
      />

      {error && !data ? (
        <ErrorState
          title="Dashboard unavailable"
          description={error}
          onRetry={refresh}
        />
      ) : (
        <>
          {error ? (
            <Alert tone="error" title="Could not refresh your dashboard">
              {error} Showing the last successful snapshot.
            </Alert>
          ) : null}

          {refreshing ? (
            <p
              className="flex items-center gap-2 text-[11px] font-medium text-muted"
              role="status"
            >
              <span className="size-3 animate-spin rounded-full border-2 border-pri/30 border-t-pri" />
              Updating {data?.range.label.toLowerCase()}…
            </p>
          ) : null}

          <section aria-label="Key metrics">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading && !metrics.length
                ? Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-[116px] rounded-2xl" />
                  ))
                : metrics.map((metric) => {
                    const change = metric.changePct;

                    return (
                      <div key={metric.key} title={metric.description}>
                        <MetricCard
                          label={metric.label}
                          value={formatVendorMetricValue(metric)}
                          icon={vendorMetricIcon(metric)}
                          href={metric.href}
                          hint={
                            metric.basis === "range"
                              ? "vs previous period"
                              : "All time"
                          }
                          trend={
                            typeof change === "number"
                              ? {
                                  value: `${change > 0 ? "+" : ""}${change}%`,
                                  direction:
                                    change > 0
                                      ? "up"
                                      : change < 0
                                        ? "down"
                                        : "flat",
                                  positive: change >= 0,
                                }
                              : undefined
                          }
                          className="h-full"
                        />
                      </div>
                    );
                  })}
            </div>
          </section>

          {finance ? (
            <section
              aria-label="Balance summary"
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                    Your balance
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">
                    Authoritative ledger figures. Withdrawals are reserved the
                    moment you request them.
                  </p>
                </div>
                <Link
                  href="/finance"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
                >
                  Open finance
                  <Icon name="arrow-up-right" className="size-3" />
                </Link>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Available balance",
                    value: finance.totals.availableBalance,
                    hint: "Ready to withdraw",
                    tone: "text-pri",
                  },
                  {
                    label: "Pending earnings",
                    value: finance.totals.pendingEarnings,
                    hint: "Held in escrow",
                    tone: "text-ink",
                  },
                  {
                    label: "Net earnings",
                    value: finance.totals.netEarnings,
                    hint: "After platform fees and refunds",
                    tone: "text-ink",
                  },
                  {
                    label: "Withdrawn",
                    value: finance.totals.withdrawn,
                    hint: `${finance.totals.withdrawalPending > 0 ? "Requests awaiting payout are reserved" : "No open requests"}`,
                    tone: "text-ink",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-line bg-soft/40 px-3.5 py-3"
                  >
                    <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      {item.label}
                    </dt>
                    <dd
                      className={cn(
                        "mt-1.5 text-[16px] font-semibold tracking-tight",
                        item.tone,
                      )}
                    >
                      {formatNaira(item.value)}
                    </dd>
                    <p className="mt-1 text-[10px] text-muted">{item.hint}</p>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section aria-label="Store charts" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {renderChart("sales", "area", "lg:col-span-2")}
              {renderChart("orders", "bar")}
            </div>
            {renderChart("settlements", "area")}
          </section>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section
              aria-labelledby="vendor-pending-heading"
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="vendor-pending-heading"
                    className="text-[13px] font-semibold tracking-tight text-ink"
                  >
                    Waiting on you
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">
                    Operational work for your store. Each card opens the screen
                    with the right filter applied.
                  </p>
                </div>
                <Badge tone={pendingTotal > 0 ? "red" : "green"}>
                  {pendingTotal > 0 ? `${pendingTotal} open` : "All clear"}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {loading && !pendingActions.length
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-[92px] rounded-xl" />
                    ))
                  : pendingActions.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                          "group rounded-xl border px-3.5 py-3 transition focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
                          item.count > 0
                            ? "border-line bg-white hover:border-pri/30 hover:bg-well/40"
                            : "border-dashed border-line bg-soft/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-ink">
                            <span className="grid size-7 place-items-center rounded-lg bg-well text-pri">
                              <Icon
                                name={vendorPendingIcon(item.key)}
                                className="size-3.5"
                              />
                            </span>
                            {item.label}
                          </span>
                          {item.count > 0 ? (
                            <Badge tone={PENDING_TONES[item.severity]}>
                              {item.count}
                            </Badge>
                          ) : (
                            <Icon
                              name="check-circle"
                              className="size-4 text-success"
                            />
                          )}
                        </div>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                          {item.description}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-muted/80">
                          {item.count > 0 && item.oldestAt
                            ? `Oldest ${formatRelativeTime(item.oldestAt)}`
                            : "Nothing waiting"}
                        </p>
                      </Link>
                    ))}
              </div>
            </section>

            <section
              aria-labelledby="vendor-recent-orders-heading"
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="vendor-recent-orders-heading"
                    className="text-[13px] font-semibold tracking-tight text-ink"
                  >
                    Recent orders
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">
                    Your latest sub-orders across every status.
                  </p>
                </div>
                <Link
                  href="/orders"
                  className="text-[11px] font-semibold text-pri hover:underline"
                >
                  See all
                </Link>
              </div>

              <div className="mt-4">
                {loading && !data ? (
                  <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : (data?.recentOrders.length ?? 0) === 0 ? (
                  <EmptyState
                    icon="shopping-bag"
                    title="No orders yet"
                    description="Orders appear here as soon as a customer buys from your store."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {(data?.recentOrders ?? []).map((order) => {
                      const customer = orderCustomer(order);

                      return (
                        <li key={order._id}>
                          <Link
                            href={`/orders/${order._id}`}
                            className="flex items-center gap-3 py-2.5 transition hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-well text-pri">
                              <Icon name="shopping-bag" className="size-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-ink">
                                {order.orderNumber}
                              </p>
                              <p className="truncate text-[10px] text-muted">
                                {customer?.name ?? "Customer"} ·{" "}
                                {formatVendorDay(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[12px] font-semibold text-ink">
                                {formatNaira(order.total)}
                              </p>
                              <Badge
                                tone={orderStatusTone(order.status)}
                                className="mt-1 px-2 py-0.5 text-[10px]"
                              >
                                {orderStatusLabel(order.status)}
                              </Badge>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
