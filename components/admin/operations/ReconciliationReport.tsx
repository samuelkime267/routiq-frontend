"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import { FilterSelect } from "@/components/ui/FilterBar";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useServerTable } from "@/hooks/useServerTable";
import { financialAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira, formatNumber } from "@/lib/format";
import { orderReference, partyName } from "@/lib/operations";
import type { SortDirection } from "@/lib/pagination";
import type {
  DashboardRangeKey,
  ReconciliationRecord,
  ReconciliationReport as ReconciliationReportData,
  ReconciliationResult,
} from "@/types/api";
import RangeFilter from "@/components/admin/dashboard/RangeFilter";

const RESULT_LABELS: Record<ReconciliationResult, string> = {
  matched: "Matched",
  missing: "Missing escrow",
  amount_mismatch: "Amount mismatch",
  status_mismatch: "Status mismatch",
};

const RESULT_TONES = {
  matched: "green",
  missing: "red",
  amount_mismatch: "amber",
  status_mismatch: "blue",
} as const;

const resultOptions = [
  { value: "", label: "All results" },
  { value: "matched", label: "Matched" },
  { value: "missing", label: "Missing escrow" },
  { value: "amount_mismatch", label: "Amount mismatch" },
  { value: "status_mismatch", label: "Status mismatch" },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Largest amount" },
  { value: "amount:asc", label: "Smallest amount" },
  { value: "reference:asc", label: "Reference A–Z" },
];

export default function ReconciliationReport() {
  const [summary, setSummary] = useState<
    ReconciliationReportData["summary"] | null
  >(null);
  const [external, setExternal] = useState<
    ReconciliationReportData["externalVerification"] | null
  >(null);

  const table = useServerTable<ReconciliationRecord>({
    loader: async (query) => {
      const result = await financialAdminApi.reconciliation({
        range: (query.filters.range as DashboardRangeKey) || "30d",
        from: query.filters.from,
        to: query.filters.to,
        result: (query.filters.result as ReconciliationResult) || undefined,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page,
        limit: query.limit,
      });

      setSummary(result.summary);
      setExternal(result.externalVerification);

      return { rows: result.records, pagination: result.pagination };
    },
    initialFilters: { range: "30d" },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const columns: DataTableColumn<ReconciliationRecord>[] = [
    {
      id: "reference",
      header: "Payment",
      primary: true,
      sortable: true,
      cell: (record) => (
        <div className="min-w-0">
          <Link
            href={`/payments/${record._id}`}
            className="block truncate font-mono text-[11px] font-semibold text-ink hover:text-pri"
          >
            {record.reference}
          </Link>
          <p className="truncate text-[10px] text-muted">
            {orderReference(record.order)}
          </p>
        </div>
      ),
    },
    {
      id: "result",
      header: "Result",
      cell: (record) => (
        <Badge tone={RESULT_TONES[record.result]}>
          {RESULT_LABELS[record.result]}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      cell: (record) => (
        <div className="text-right">
          <p className="text-[12px] font-medium text-ink">
            {formatNaira(record.amount)}
          </p>
          <p className="text-[10px] text-muted">
            Vendor {formatNaira(record.vendorAmount)}
          </p>
        </div>
      ),
    },
    {
      id: "escrow",
      header: "Escrow",
      hideOnMobile: true,
      cell: (record) => (
        <div className="space-y-1">
          {record.escrow ? (
            <>
              <StatusBadge status={record.escrow.status} />
              <p className="text-[10px] text-muted">
                Held {formatNaira(record.escrow.amountHeld)}
              </p>
            </>
          ) : (
            <Badge tone="red">No escrow record</Badge>
          )}
        </div>
      ),
    },
    {
      id: "expected",
      header: "Expected / recorded",
      align: "right",
      hideOnMobile: true,
      cell: (record) => (
        <div className="text-right text-[11px]">
          <p className="text-ink">
            {record.expectedEscrowAmount !== null &&
            record.expectedEscrowAmount !== undefined
              ? formatNaira(record.expectedEscrowAmount)
              : "—"}
          </p>
          <p className="text-muted">
            {record.recordedEscrowAmount !== null &&
            record.recordedEscrowAmount !== undefined
              ? formatNaira(record.recordedEscrowAmount)
              : "—"}
          </p>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      hideOnMobile: true,
      cell: (record) => (
        <span className="text-[12px] text-ink">
          {partyName(record.customer, "Unknown customer")}
        </span>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      hideOnMobile: true,
      cell: (record) => (
        <span className="text-[12px] text-ink">
          {partyName(record.vendor, "Unknown vendor")}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortable: true,
      hideOnMobile: true,
      cell: (record) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(record.createdAt)}
        </span>
      ),
    },
  ];

  const range = (table.filters.range as DashboardRangeKey) || "30d";
  const resultFilter = (table.filters.result as ReconciliationResult) || "";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reconciliation"
        eyebrow="Finance"
        description="Compare internal payments with the trusted backend escrow ledger. External provider or blockchain verification is not configured, so a match here confirms internal consistency only."
        breadcrumbs={breadcrumbsFor("/reconciliation")}
        actions={
          <>
            <Button variant="outline" size="sm" href="/reports">
              Financial overview
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={table.reload}
              disabled={table.loading}
            >
              Refresh
            </Button>
          </>
        }
        meta={
          <Badge tone={summary && summary.unresolved > 0 ? "amber" : "green"}>
            {formatNumber(summary?.unresolved ?? 0)} unresolved of{" "}
            {formatNumber(summary?.total ?? table.meta.total)}
          </Badge>
        }
      />

      <RangeFilter
        value={range}
        from={table.filters.from}
        to={table.filters.to}
        rangeLabel={
          summary ? `${formatNumber(summary.total)} internal payments` : undefined
        }
        loading={table.loading}
        onChange={(selection) => {
          table.setFilter("range", selection.range);
          table.setFilter("from", selection.from ?? "");
          table.setFilter("to", selection.to ?? "");
        }}
        onRefresh={table.reload}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Matched"
          value={formatNumber(summary?.matched ?? 0)}
          hint="Payment and escrow agree"
          icon="check-circle"
        />
        <MetricCard
          label="Missing escrow"
          value={formatNumber(summary?.missing ?? 0)}
          hint="No escrow record exists"
          icon="alert-circle"
        />
        <MetricCard
          label="Amount mismatch"
          value={formatNumber(summary?.amount_mismatch ?? 0)}
          hint="Vendor amount differs from held"
          icon="bar-chart"
        />
        <MetricCard
          label="Status mismatch"
          value={formatNumber(summary?.status_mismatch ?? 0)}
          hint="Payment and escrow status disagree"
          icon="refresh"
        />
      </div>

      {external ? (
        <Alert
          tone={external.configured ? "success" : "info"}
          title={
            external.configured
              ? "External verification configured"
              : "External verification not configured"
          }
        >
          {external.message}
        </Alert>
      ) : null}

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search reference, order, customer or vendor"
              label="Search reconciliation records"
              className="w-full lg:max-w-md"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter reconciliation by result"
              value={resultFilter}
              onChange={(id) => table.setFilter("result", id)}
              items={[
                { id: "", label: "All" },
                { id: "matched", label: "Matched" },
                { id: "missing", label: "Missing" },
                { id: "amount_mismatch", label: "Amount" },
                { id: "status_mismatch", label: "Status" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-end">
            <FilterSelect
              label="Result"
              value={resultFilter}
              onChange={(value) => table.setFilter("result", value)}
              options={resultOptions}
            />
            <FilterSelect
              label="Sort by"
              value={
                table.sort
                  ? `${table.sort.key}:${table.sort.direction}`
                  : "createdAt:desc"
              }
              onChange={(value) => {
                const [key, direction] = value.split(":");
                table.setSorting(key, direction as SortDirection);
              }}
              options={sortOptions}
            />
          </div>
        </div>

        <DataTable
          caption="Internal payments compared with escrow records"
          columns={columns}
          rows={table.rows}
          getRowId={(record) => record._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          emptyTitle={
            table.search || table.activeFilterCount > 1
              ? "No records match these filters"
              : "No payments to reconcile"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 1
              ? "Try a different search term or choose another result."
              : "Successful and refunded payments in the selected period appear here."
          }
          emptyAction={
            table.search || table.activeFilterCount > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  table.resetFilters();
                  table.setSearch("");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
          footer={
            <Pagination
              meta={table.meta}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="payments"
              disabled={table.loading}
            />
          }
        />
      </div>
    </div>
  );
}
