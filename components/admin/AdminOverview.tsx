"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import ErrorState from "@/components/ui/ErrorState";
import Alert from "@/components/ui/Alert";
import ChartFrame from "@/components/admin/dashboard/ChartFrame";
import RangeFilter from "@/components/admin/dashboard/RangeFilter";
import SeriesChart from "@/components/admin/dashboard/SeriesChart";
import { useAdminSession } from "@/components/admin/AdminSession";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatAdminRole, formatAdminStatus } from "@/lib/admin";
import {
  activityMeta,
  formatMetricValue,
  METRIC_ICONS,
  METRIC_LINKS,
  PENDING_ICONS,
  PENDING_TONES,
} from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useDashboard } from "@/hooks/useDashboard";
import type { DashboardSeries } from "@/types/api";

export default function AdminOverview() {
  const { user, permissions } = useAdminSession();
  const firstName = user.name.split(/\s+/)[0] || "Admin";
  const {
    selection,
    status,
    data,
    error,
    applySelection,
    refresh,
  } = useDashboard({ range: "7d" });

  const loading = status === "loading";
  const refreshing = status === "refreshing";
  const metrics = data?.metrics ?? [];
  const charts = data?.charts ?? [];
  const pendingActions = data?.pendingActions ?? [];
  const pendingTotal = pendingActions.reduce(
    (total, item) => total + item.count,
    0,
  );

  const seriesFor = (key: DashboardSeries["key"]) =>
    charts.find((series) => series.key === key);

  const activityItems: TimelineItem[] = (data?.recentActivity ?? []).map(
    (item) => {
      const meta = activityMeta(item.type);

      return {
        id: item.id,
        title: item.title,
        description: item.description ?? undefined,
        time: `${formatRelativeTime(item.createdAt)} · ${item.actorName}`,
        icon: meta.icon,
        tone: meta.tone,
        href: item.href ?? undefined,
      };
    },
  );

  const renderChart = (
    key: DashboardSeries["key"],
    variant: "area" | "bar",
    className?: string,
  ) => {
    const series = seriesFor(key);

    if (!series) {
      return (
        <ChartFrame
          className={className}
          title="Loading chart"
          description="Fetching the latest marketplace activity."
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
        footnote={`${series.points.length} ${data?.range.granularity === "hour" ? "hourly" : "daily"} buckets · ${data?.range.timezone ?? "Africa/Lagos"}`}
      >
        <SeriesChart points={series.points} kind={series.kind} variant={variant} />
      </ChartFrame>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Live marketplace health, operational queues and recent activity. Every number below is aggregated from platform records; nothing is hardcoded."
        breadcrumbs={breadcrumbsFor("/")}
        actions={
          <Button
            href="/admins"
            variant="outline"
            size="sm"
            icon={<Icon name="users" />}
          >
            Admin directory
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="teal">{formatAdminRole(user.adminRole)}</Badge>
            <Badge tone={user.adminStatus === "ACTIVE" ? "green" : "amber"}>
              {formatAdminStatus(user.adminStatus)}
            </Badge>
            {data ? (
              <Badge tone="neutral">
                Updated {formatRelativeTime(data.generatedAt)}
              </Badge>
            ) : null}
          </div>
        }
      />

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
            <Alert tone="error" title="Could not refresh the dashboard">
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
            {loading && !metrics.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton key={index} className="h-[116px] rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const change = metric.changePct;

                  return (
                    <div key={metric.key} title={metric.description}>
                      <MetricCard
                        label={metric.label}
                        value={formatMetricValue(metric)}
                        icon={METRIC_ICONS[metric.key]}
                        href={METRIC_LINKS[metric.key]}
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
            )}
          </section>

          {metrics.length ? (
            <details className="rounded-2xl border border-line bg-white px-4 py-3">
              <summary className="cursor-pointer text-[11px] font-semibold text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none">
                How these numbers are calculated
              </summary>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.key} className="rounded-xl bg-soft/60 p-3">
                    <dt className="text-[11px] font-semibold text-ink">
                      {metric.label}
                    </dt>
                    <dd className="mt-1 text-[10px] leading-relaxed text-muted">
                      {metric.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          ) : null}

          <section aria-label="Marketplace charts" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {renderChart("orders", "area", "lg:col-span-2")}
              {renderChart("salesVolume", "bar")}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {renderChart("marketplaceRevenue", "area")}
              {renderChart("vendorRegistrations", "bar")}
              {renderChart("storeApprovals", "bar")}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section
              aria-labelledby="pending-actions-heading"
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="pending-actions-heading"
                    className="text-[13px] font-semibold tracking-tight text-ink"
                  >
                    Pending actions
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">
                    Operational queues that need an administrator. Each opens
                    the module with the matching filter applied.
                  </p>
                </div>
                <Badge tone={pendingTotal > 0 ? "red" : "green"}>
                  {pendingTotal > 0 ? `${pendingTotal} open` : "All clear"}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {loading && !pendingActions.length
                  ? Array.from({ length: 6 }).map((_, index) => (
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
                                name={PENDING_ICONS[item.key]}
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
              aria-labelledby="recent-activity-heading"
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="recent-activity-heading"
                    className="text-[13px] font-semibold tracking-tight text-ink"
                  >
                    Recent activity
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">
                    Latest marketplace and administrative events from the
                    activity log.
                  </p>
                </div>
                <Icon name="activity" className="size-4 text-muted" />
              </div>

              <div className="mt-4">
                {loading && !data ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex gap-3">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2 pt-1">
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-2.5 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Timeline
                    items={activityItems}
                    emptyLabel="No activity recorded yet."
                  />
                )}
              </div>

              {permissions.includes("audit_logs.view") ? (
                <Link
                  href="/audit-logs"
                  className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
                >
                  View audit logs
                  <Icon name="arrow-up-right" className="size-3" />
                </Link>
              ) : null}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
