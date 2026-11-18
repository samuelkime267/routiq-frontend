"use client";

import { useState } from "react";
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
import { useResource } from "@/hooks/useResource";
import { vendorPortalApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatNaira, formatNumber } from "@/lib/format";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import { formatRelativeTime } from "@/lib/vendorPortal";
import type {
  DashboardRangeKey,
  VendorFinanceResult,
  VendorLedgerTotals,
} from "@/types/api";

interface RangeSelection {
  range: DashboardRangeKey;
  from?: string;
  to?: string;
}

const MIN_WITHDRAWAL_AMOUNT = 1_000;

const LEDGER_ROWS: Array<{
  key: keyof VendorLedgerTotals;
  label: string;
  sign?: "plus" | "minus" | "neutral";
}> = [
  { key: "grossSales", label: "Gross sales", sign: "plus" },
  { key: "platformFees", label: "Platform commission", sign: "minus" },
  { key: "netEarnings", label: "Net earnings", sign: "neutral" },
  { key: "refundedEarnings", label: "Refunded earnings", sign: "minus" },
  { key: "settledEarnings", label: "Settled from escrow", sign: "plus" },
  { key: "pendingEarnings", label: "Still held in escrow", sign: "neutral" },
  { key: "withdrawn", label: "Withdrawals paid", sign: "minus" },
  { key: "withdrawalPending", label: "Withdrawals reserved", sign: "minus" },
  { key: "adjustments", label: "Manual adjustments", sign: "neutral" },
  { key: "availableBalance", label: "Available balance", sign: "neutral" },
];

export default function VendorFinance() {
  const [selection, setSelection] = useState<RangeSelection>({ range: "30d" });
  const query = {
    range: selection.range,
    from: selection.from,
    to: selection.to,
  };
  const { data, error, loading, refreshing, reload } =
    useResource<VendorFinanceResult>(
      `vendor-finance:${query.range}:${query.from ?? ""}:${query.to ?? ""}`,
      () => vendorPortalApi.finance(query),
      "We could not load your finance summary.",
    );

  const summary = data;
  const analytics = data?.analytics;
  const totals = summary?.totals;
  const reconciliation = summary?.reconciliation;
  const charts = analytics?.charts ?? [];

  function seriesFor(key: string) {
    return charts.find((series) => series.key === key);
  }

  function renderChart(
    key: string,
    variant: "area" | "bar",
    className?: string,
  ) {
    const series = seriesFor(key);

    if (!series) {
      return (
        <ChartFrame
          className={className}
          title="Loading chart"
          description="Fetching your earnings history."
          total={0}
          kind="count"
          loading={loading}
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
        footnote={`${analytics?.range.label ?? "Selected period"} · ${
          analytics?.range.timezone ?? "Africa/Lagos"
        }`}
      >
        <SeriesChart
          points={series.points}
          kind={series.kind}
          variant={variant}
        />
      </ChartFrame>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Finance"
          title="Earnings and balance"
          description="Every figure is calculated from your payment, escrow and withdrawal records."
          breadcrumbs={vendorBreadcrumbs("/finance")}
        />
        <ErrorState
          title="Finance unavailable"
          description={error}
          onRetry={reload}
        />
      </div>
    );
  }

  const canWithdraw = (totals?.availableBalance ?? 0) >= MIN_WITHDRAWAL_AMOUNT;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Earnings and balance"
        description="Your sales, platform commission, escrow settlements and withdrawals. Withdrawals are validated against this ledger on the server."
        breadcrumbs={vendorBreadcrumbs("/finance")}
        actions={
          <>
            <Button
              href="/finance/withdrawals"
              size="sm"
              icon={<Icon name="wallet" />}
            >
              Withdrawals
            </Button>
            <Button
              href="/finance/transactions"
              variant="outline"
              size="sm"
              icon={<Icon name="card" />}
            >
              Transactions
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            {reconciliation ? (
              <Badge tone={reconciliation.matches ? "green" : "red"}>
                {reconciliation.matches
                  ? "Ledger reconciled"
                  : "Reconciliation mismatch"}
              </Badge>
            ) : null}
            {summary ? (
              <Badge tone="neutral">
                Updated {formatRelativeTime(summary.generatedAt)}
              </Badge>
            ) : null}
          </div>
        }
      />

      {error ? (
        <Alert tone="error" title="Could not refresh your finance summary">
          {error} Showing the last successful snapshot.
        </Alert>
      ) : null}

      <RangeFilter
        value={selection.range}
        from={selection.from}
        to={selection.to}
        rangeLabel={analytics?.range.label}
        timezone={analytics?.range.timezone}
        loading={refreshing}
        onChange={setSelection}
        onRefresh={reload}
      />

      <section aria-label="Balance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !totals
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[116px] rounded-2xl" />
            ))
          : [
              {
                label: "Available balance",
                value: totals?.availableBalance ?? 0,
                hint: "Ready to withdraw",
                icon: "wallet" as const,
                tone: "border-pri/25 bg-well/50",
              },
              {
                label: "Pending earnings",
                value: totals?.pendingEarnings ?? 0,
                hint: `${totals?.heldEscrows ?? 0} escrow record${
                  totals?.heldEscrows === 1 ? "" : "s"
                } still held`,
                icon: "clock" as const,
                tone: "border-line bg-white",
              },
              {
                label: "Settled earnings",
                value: totals?.settledEarnings ?? 0,
                hint: "Released from escrow",
                icon: "check-circle" as const,
                tone: "border-line bg-white",
              },
              {
                label: "Withdrawn",
                value: totals?.withdrawn ?? 0,
                hint:
                  (totals?.withdrawalPending ?? 0) > 0
                    ? `${formatNaira(totals?.withdrawalPending ?? 0)} reserved`
                    : "No open requests",
                icon: "wallet" as const,
                tone: "border-line bg-white",
              },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-2xl border", item.tone)}>
                <MetricCard
                  label={item.label}
                  value={formatNaira(item.value)}
                  hint={item.hint}
                  icon={item.icon}
                  className="border-0 bg-transparent"
                />
              </div>
            ))}
      </section>

      {totals ? (
        <section
          className={cn(
            "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            canWithdraw
              ? "border-pri/15 bg-well text-pri"
              : "border-line bg-soft/40 text-ink",
          )}
        >
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">
              {canWithdraw
                ? "You can request a withdrawal"
                : "No withdrawable balance yet"}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
              {canWithdraw
                ? `${formatNaira(totals.availableBalance)} is settled and not reserved. Withdrawals need a verified bank account and clear review before payout.`
                : "Pending earnings become available once escrow is released. Only settled money can be withdrawn."}
            </p>
          </div>
          {canWithdraw ? (
            <Button href="/finance/withdrawals" size="sm" className="shrink-0">
              Request withdrawal
            </Button>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Ledger breakdown
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                Lifetime figures. The reconciliation below proves the balance is
                derived, not typed in.
              </p>
            </div>
            <Badge tone={reconciliation?.matches ? "green" : "red"}>
              {reconciliation?.matches ? "Balanced" : "Check failed"}
            </Badge>
          </div>

          <dl className="mt-4 divide-y divide-line">
            {LEDGER_ROWS.map((row) => (
              <div
                key={row.key}
                className={cn(
                  "flex items-center justify-between gap-3 py-2.5",
                  (row.key === "availableBalance" ||
                    row.key === "netEarnings") &&
                    "font-semibold",
                )}
              >
                <dt
                  className={cn(
                    "text-[12px]",
                    row.key === "availableBalance"
                      ? "font-semibold text-pri"
                      : "text-muted",
                  )}
                  title={summary?.definitions?.[row.key]}
                >
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "text-[12px]",
                    row.key === "availableBalance"
                      ? "font-semibold text-pri"
                      : "text-ink",
                  )}
                >
                  {row.sign === "minus" ? "−" : row.sign === "plus" ? "+" : ""}
                  {formatNaira(totals?.[row.key] ?? 0)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl border border-line bg-soft/50 px-3.5 py-3">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
              Reconciliation
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {reconciliation?.equation ??
                "available = settled earnings + adjustments − paid withdrawals − reserved withdrawals"}
            </p>
            <p className="mt-2 text-[12px] font-semibold text-ink">
              {formatNaira(reconciliation?.ledgerAvailable ?? 0)}
              <span className="mx-1.5 text-muted">=</span>
              {formatNaira(reconciliation?.recomputedAvailable ?? 0)}{" "}
              <span
                className={cn(
                  "ml-1 text-[11px] font-semibold",
                  reconciliation?.matches ? "text-success" : "text-danger",
                )}
              >
                {reconciliation?.matches ? "matched" : "differs"}
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">
            This period
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            Compared with the previous period of the same length.
          </p>

          <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {[
              {
                label: "Gross sales",
                value: analytics?.current.gross ?? 0,
                change: analytics?.change.gross,
              },
              {
                label: "Net earnings",
                value: analytics?.current.net ?? 0,
                change: analytics?.change.net,
              },
              {
                label: "Orders",
                value: analytics?.current.orders ?? 0,
                change: analytics?.change.orders,
                count: true,
              },
              {
                label: "Order value",
                value: analytics?.current.orderValue ?? 0,
                change: analytics?.change.orderValue,
              },
              {
                label: "Escrow settled",
                value: analytics?.current.settled ?? 0,
                change: analytics?.change.settled,
              },
              {
                label: "Paid orders",
                value: analytics?.current.paidOrders ?? 0,
                count: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-line bg-soft/40 px-3.5 py-3"
              >
                <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                  {item.label}
                </dt>
                <dd className="mt-1 text-[15px] font-semibold tracking-tight text-ink">
                  {item.count
                    ? formatNumber(item.value)
                    : formatNaira(item.value)}
                </dd>
                <PeriodChange value={item.change} />
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button
              href="/finance/transactions"
              variant="outline"
              size="sm"
              icon={<Icon name="card" />}
            >
              Transactions
            </Button>
            <Button
              href="/finance/withdrawals"
              variant="outline"
              size="sm"
              icon={<Icon name="wallet" />}
            >
              Withdrawals
            </Button>
            <Button
              href="/finance/bank-accounts"
              variant="outline"
              size="sm"
              icon={<Icon name="building" />}
            >
              Bank accounts
            </Button>
          </div>
        </section>
      </div>

      <section aria-label="Earnings charts" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {renderChart("sales", "area", "lg:col-span-2")}
          {renderChart("orders", "bar")}
        </div>
        {renderChart("settlements", "area")}
      </section>

      {!data && !loading ? (
        <EmptyState
          icon="wallet"
          title="No finance records yet"
          description="Your ledger starts when a customer pays for one of your products."
        />
      ) : null}
    </div>
  );
}

function PeriodChange({ value }: { value?: number | null }) {
  if (typeof value !== "number") {
    return (
      <p className="mt-1 text-[10px] text-muted">No comparison available</p>
    );
  }

  return (
    <p
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-[10px] font-semibold",
        value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted",
      )}
    >
      {value > 0 ? "▲" : value < 0 ? "▼" : "—"} {value > 0 ? "+" : ""}
      {value}% vs previous
    </p>
  );
}
