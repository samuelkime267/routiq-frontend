"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import ErrorState from "@/components/ui/ErrorState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { useKeyedResource } from "@/hooks/useKeyedResource";
import { financialAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import {
  changeDirection,
  formatPercent,
} from "@/lib/operations";
import type {
  DashboardRangeKey,
  FinancialOverviewResult,
  FinancialRevenueResult,
  FinancialSeriesPoint,
  RevenueVendorRow,
} from "@/types/api";
import RangeFilter from "@/components/admin/dashboard/RangeFilter";
import { PageSkeleton, SectionCard } from "./shared";

interface RangeSelection {
  range: DashboardRangeKey;
  from?: string;
  to?: string;
}

interface ReportBundle {
  overview: FinancialOverviewResult;
  revenue: FinancialRevenueResult;
}

const trend = (change: number | null | undefined, positiveWhenUp = true) => ({
  value: formatPercent(change),
  direction: changeDirection(change),
  positive: change === null || change === undefined
    ? undefined
    : positiveWhenUp
      ? change >= 0
      : change <= 0,
});

export default function FinancialOverview() {
  const [selection, setSelection] = useState<RangeSelection>({ range: "30d" });

  const requestKey = `${selection.range}:${selection.from ?? ""}:${selection.to ?? ""}`;

  const { data, loading, error, reload } = useKeyedResource<ReportBundle>(
    requestKey,
    async () => {
      const query = {
        range: selection.range,
        from: selection.from,
        to: selection.to,
      };

      const [overview, revenue] = await Promise.all([
        financialAdminApi.overview(query),
        financialAdminApi.revenue(query),
      ]);

      return { overview, revenue };
    },
  );

  const rangeLabel = data?.overview.range.label;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Financial overview"
        eyebrow="Finance"
        description="GMV, collected payments, commission, refunds, settlements and escrow are reported separately. Escrow is a liability and is never counted as realised revenue."
        breadcrumbs={breadcrumbsFor("/reports")}
        actions={
          <>
            <Button variant="outline" size="sm" href="/reconciliation">
              Reconciliation
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={reload}
              loading={loading}
            >
              Refresh
            </Button>
          </>
        }
      />

      <RangeFilter
        value={selection.range}
        from={selection.from}
        to={selection.to}
        rangeLabel={rangeLabel}
        loading={loading}
        onChange={setSelection}
        onRefresh={reload}
      />

      {error && !data ? (
        <ErrorState
          title="Could not load financial figures"
          description={error}
          onRetry={reload}
        />
      ) : null}

      {loading && !data ? (
        <PageSkeleton label="Loading financial overview" />
      ) : null}

      {data ? (
        <div className={cn("space-y-4", loading && "opacity-70")}>
          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="GMV"
              value={formatNaira(data.overview.totals.gmv)}
              hint={`${data.overview.totals.orders} orders placed`}
              icon="shopping-bag"
              trend={trend(data.overview.change.gmv)}
            />
            <MetricCard
              label="Payments collected"
              value={formatNaira(data.overview.totals.paymentVolume)}
              hint={`${data.overview.totals.successfulPayments} successful payments`}
              icon="card"
              trend={trend(data.overview.change.paymentVolume)}
            />
            <MetricCard
              label="Commission"
              value={formatNaira(data.overview.totals.commission)}
              hint="Platform fee on successful payments"
              icon="bar-chart"
              trend={trend(data.overview.change.commission)}
            />
            <MetricCard
              label="Refunds"
              value={formatNaira(data.overview.totals.refundVolume)}
              hint={`${data.overview.totals.refunds} refunds`}
              icon="refresh"
              trend={trend(data.overview.change.refundVolume, false)}
            />
            <MetricCard
              label="Settlements"
              value={formatNaira(data.overview.totals.settlementVolume)}
              hint={`${data.overview.totals.releases} releases to vendors`}
              icon="check-circle"
              trend={trend(data.overview.change.settlementVolume)}
            />
            <MetricCard
              label="Net revenue"
              value={formatNaira(data.overview.totals.netRevenue)}
              hint="Commission minus refunded commission"
              icon="activity"
              trend={trend(data.overview.change.netRevenue)}
            />
            <MetricCard
              label="Escrow balance"
              value={formatNaira(data.overview.totals.escrowBalance)}
              hint="All-time liability, not revenue"
              icon="wallet"
            />
            <MetricCard
              label="Refunded commission"
              value={formatNaira(data.overview.totals.refundedCommission)}
              hint="Commission reversed by refunds"
              icon="shield"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <SectionCard
                title="Commission and refunds"
                description="Platform commission collected and reversed, bucketed over the selected period."
              >
                <div className="space-y-4">
                  <SeriesBars
                    title="Commission"
                    points={data.revenue.series.commission}
                    tone="bg-pri"
                    emptyLabel="No commission was collected in this period."
                  />
                  <SeriesBars
                    title="Refunded commission"
                    points={data.revenue.series.refunds}
                    tone="bg-accent"
                    emptyLabel="No commission was refunded in this period."
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Revenue by vendor"
                description="Top vendors by commission in the selected period. Limit 15, ranked by the backend."
              >
                <VendorRevenueTable rows={data.revenue.vendors} />
              </SectionCard>
            </div>

            <aside className="space-y-4">
              <SectionCard title="Selected period">
                <dl className="space-y-2 text-[12px]">
                  <SummaryRow label="Range" value={data.overview.range.label} />
                  <SummaryRow
                    label="Starts"
                    value={formatAdminDate(data.overview.range.start)}
                  />
                  <SummaryRow
                    label="Ends"
                    value={formatAdminDate(data.overview.range.end)}
                  />
                  <SummaryRow
                    label="Timezone"
                    value={data.overview.range.timezone.replace(/_/g, " ")}
                  />
                  <SummaryRow
                    label="Generated"
                    value={formatAdminDate(data.overview.generatedAt)}
                  />
                </dl>
              </SectionCard>

              <SectionCard
                title="How these figures are defined"
                description="A refund is never counted as new revenue."
              >
                <ul className="space-y-2.5">
                  {Object.entries(data.overview.definitions).map(
                    ([key, definition]) => (
                      <li key={key} className="text-[11px] leading-relaxed text-muted">
                        <span className="font-semibold text-ink">
                          {definitionLabel(key)}:{" "}
                        </span>
                        {definition}
                      </li>
                    ),
                  )}
                </ul>
              </SectionCard>

              <SectionCard title="Escrow basis">
                <Badge tone="amber">All-time liability</Badge>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Escrow is reported across all time because it is a liability,
                  not a period figure. It is shown alongside the period totals so
                  held vendor proceeds are never mistaken for income.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  href="/escrow"
                >
                  Open escrow
                </Button>
              </SectionCard>
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-2 last:border-0 last:pb-0">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="text-right text-[12px] text-ink">{value}</dd>
    </div>
  );
}

function definitionLabel(key: string) {
  const labels: Record<string, string> = {
    gmv: "GMV",
    paymentVolume: "Payments collected",
    commission: "Commission",
    refundVolume: "Refunds",
    settlementVolume: "Settlements",
    netRevenue: "Net revenue",
    escrowBalance: "Escrow balance",
  };

  return labels[key] ?? key;
}

function SeriesBars({
  title,
  points,
  tone,
  emptyLabel,
}: {
  title: string;
  points: FinancialSeriesPoint[];
  tone: string;
  emptyLabel: string;
}) {
  const max = Math.max(...points.map((point) => point.value), 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          {title}
        </p>
        <p className="text-[11px] font-semibold text-ink">
          {formatNaira(points.reduce((sum, point) => sum + point.value, 0))}
        </p>
      </div>

      {max === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-[11px] text-muted">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-2 flex h-24 items-end gap-[3px] overflow-x-auto">
          {points.map((point) => {
            const height = Math.max(2, Math.round((point.value / max) * 100));

            return (
              <div
                key={point.key}
                className="group flex min-w-[6px] flex-1 flex-col items-center justify-end"
                title={`${point.label}: ${formatNaira(point.value)} (${point.count})`}
              >
                <span
                  className={cn("w-full rounded-t-[3px]", tone)}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VendorRevenueTable({ rows }: { rows: RevenueVendorRow[] }) {
  const columns: DataTableColumn<RevenueVendorRow>[] = [
    {
      id: "vendor",
      header: "Vendor",
      primary: true,
      cell: (row) => (
        <div className="min-w-0">
          {row.vendorId ? (
            <Link
              href={`/vendors/${row.vendorId}`}
              className="block truncate text-[12px] font-semibold text-ink hover:text-pri"
            >
              {row.name}
            </Link>
          ) : (
            <p className="truncate text-[12px] font-semibold text-ink">
              {row.name}
            </p>
          )}
          <p className="truncate text-[10px] text-muted">
            {row.stores.length > 0 ? row.stores.join(", ") : row.email ?? "No store"}
          </p>
        </div>
      ),
    },
    {
      id: "payments",
      header: "Payments",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-[12px] text-ink">{row.payments}</span>
      ),
    },
    {
      id: "volume",
      header: "Collected",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-[12px] text-ink">
          {formatNaira(row.paymentVolume)}
        </span>
      ),
    },
    {
      id: "commission",
      header: "Commission",
      align: "right",
      cell: (row) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(row.commission)}
        </span>
      ),
    },
    {
      id: "netRevenue",
      header: "Net",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-[12px] font-medium text-pri">
          {formatNaira(row.netRevenue)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      caption="Top vendors by commission in the selected period"
      columns={columns}
      rows={rows}
      getRowId={(row) => row.vendorId ?? row.name}
      loading={false}
      emptyTitle="No commission recorded"
      emptyDescription="No successful payments carried a platform fee in this period."
      skeletonRows={3}
    />
  );
}
