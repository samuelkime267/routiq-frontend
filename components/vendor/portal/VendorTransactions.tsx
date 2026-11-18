"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import { FilterBar, FilterDate, FilterSelect } from "@/components/ui/FilterBar";
import MetricCard from "@/components/ui/MetricCard";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useServerTable } from "@/hooks/useServerTable";
import { vendorPortalApi } from "@/lib/api";
import { formatNaira, formatNumber } from "@/lib/format";
import { formatPaymentChannel } from "@/lib/operations";
import type { SortDirection } from "@/lib/pagination";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import { formatVendorDate } from "@/lib/vendorPortal";
import type {
  ApiVendorTransaction,
  VendorTransactionListResult,
} from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "paidAt:desc", label: "Recently paid" },
  { value: "amount:desc", label: "Largest amount" },
  { value: "amount:asc", label: "Smallest amount" },
  { value: "reference:asc", label: "Reference A–Z" },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "successful", label: "Successful" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const channelOptions = [
  { value: "", label: "All channels" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "ussd", label: "USSD" },
  { value: "wallet", label: "Wallet" },
];

export default function VendorTransactions() {
  const [summary, setSummary] = useState<
    VendorTransactionListResult["summary"] | null
  >(null);
  const [selected, setSelected] = useState<ApiVendorTransaction | null>(null);

  const table = useServerTable<ApiVendorTransaction>({
    loader: async (query) => {
      const result = await vendorPortalApi.transactions({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        type: query.filters.type,
        status: query.filters.status,
        channel: query.filters.channel,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);

      return { rows: result.transactions, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const columns: DataTableColumn<ApiVendorTransaction>[] = [
    {
      id: "reference",
      header: "Reference",
      primary: true,
      sortable: true,
      cell: (transaction) => (
        <button
          type="button"
          onClick={() => setSelected(transaction)}
          className="block max-w-full text-left"
        >
          <span className="block truncate font-mono text-[11px] font-semibold text-ink hover:text-pri">
            {transaction.reference}
          </span>
          <span className="block truncate text-[10px] text-muted">
            {transaction.order
              ? `Order ${String(transaction.order).slice(-6)}`
              : "No order linked"}
          </span>
        </button>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (transaction) => (
        <Badge
          tone={transaction.transactionType === "refund" ? "blue" : "teal"}
        >
          {transaction.transactionType === "refund" ? "Refund" : "Payment"}
        </Badge>
      ),
    },
    {
      id: "channel",
      header: "Channel",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatPaymentChannel(transaction.channel)}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      cell: (transaction) => (
        <div className="text-right">
          <p className="text-[12px] font-semibold text-ink">
            {formatNaira(transaction.amount)}
          </p>
          <p className="text-[10px] text-muted">
            Your share {formatNaira(transaction.vendorAmount)}
          </p>
        </div>
      ),
    },
    {
      id: "fees",
      header: "Fee",
      align: "right",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatNaira(transaction.platformFee)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (transaction) => <StatusBadge status={transaction.status} />,
    },
    {
      id: "paidAt",
      header: "Paid",
      hideOnMobile: true,
      sortable: true,
      sortKey: "paidAt",
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {transaction.paidAt ? formatVendorDate(transaction.paidAt) : "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortable: true,
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatVendorDate(transaction.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Transactions"
        description="Payments and refunds on your store. Totals are read from the payment ledger, so a refund is never counted as new revenue."
        breadcrumbs={vendorBreadcrumbs("/finance/transactions", [
          { label: "Finance", href: "/finance" },
          { label: "Transactions" },
        ])}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={table.reload}
              disabled={table.loading}
            >
              Refresh
            </Button>
            <Button href="/finance" variant="outline" size="sm">
              Finance overview
            </Button>
          </>
        }
        meta={
          <Badge tone="neutral">
            {formatNumber(summary?.total ?? table.meta.total)} matching records
          </Badge>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Collected"
          value={formatNaira(summary?.successfulVolume ?? 0)}
          hint="Successful payments only"
          icon="card"
        />
        <MetricCard
          label="Refunded"
          value={formatNaira(summary?.refundedVolume ?? 0)}
          hint="Paid back to customers"
          icon="refresh"
        />
        <MetricCard
          label="Commission"
          value={formatNaira(summary?.platformFees ?? 0)}
          hint="Platform fee on successful payments"
          icon="bar-chart"
        />
        <MetricCard
          label="Records"
          value={formatNumber(summary?.total ?? table.meta.total)}
          hint={`${formatNumber(summary?.statusCounts.refunded ?? 0)} refunded`}
          icon="activity"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search reference, order or amount"
              label="Search transactions"
              className="w-full lg:max-w-md"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter transactions by type"
              value={table.filters.type ?? ""}
              onChange={(id) => table.setFilter("type", id)}
              items={[
                { id: "", label: "All" },
                { id: "payment", label: "Payments" },
                { id: "refund", label: "Refunds" },
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Status"
                value={table.filters.status ?? ""}
                onChange={(value) => table.setFilter("status", value)}
                options={statusOptions}
              />
              <FilterSelect
                label="Channel"
                value={table.filters.channel ?? ""}
                onChange={(value) => table.setFilter("channel", value)}
                options={channelOptions}
              />
              <FilterDate
                label="Created from"
                value={table.filters.createdFrom ?? ""}
                max={table.filters.createdTo || undefined}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <FilterDate
                label="Created to"
                value={table.filters.createdTo ?? ""}
                min={table.filters.createdFrom || undefined}
                onChange={(value) => table.setFilter("createdTo", value)}
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
            </FilterBar>
          </div>
        </div>

        <DataTable
          caption="Your payment and refund records, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(transaction) => transaction._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={(transaction) => (
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5"
              onClick={() => setSelected(transaction)}
            >
              Details
            </Button>
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No transactions match these filters"
              : "No transactions yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the type, status, channel and date filters."
              : "Payment records appear here after a customer checks out."
          }
          emptyAction={
            table.search || table.activeFilterCount > 0 ? (
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
            ) : (
              <Button href="/products" variant="outline" size="sm">
                Review your products
              </Button>
            )
          }
          footer={
            <Pagination
              meta={table.meta}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="transactions"
              disabled={table.loading}
            />
          }
        />
      </div>

      {selected ? (
        <Modal
          open
          onClose={() => setSelected(null)}
          title="Transaction detail"
          description={selected.reference}
          size="md"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          }
        >
          <dl className="space-y-2 text-[12px]">
            <Row
              label="Type"
              value={
                selected.transactionType === "refund" ? "Refund" : "Payment"
              }
            />
            <Row label="Status" value={selected.status} />
            <Row label="Channel" value={formatPaymentChannel(selected.channel)} />
            <Row label="Customer paid" value={formatNaira(selected.amount)} />
            <Row
              label="Platform fee"
              value={formatNaira(selected.platformFee)}
            />
            <Row label="Your share" value={formatNaira(selected.vendorAmount)} />
            <Row
              label="Paid"
              value={selected.paidAt ? formatVendorDate(selected.paidAt) : "—"}
            />
            <Row
              label="Created"
              value={formatVendorDate(selected.createdAt)}
            />
            {selected.order ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Order</dt>
                <dd>
                  <Link
                    href={`/orders/${String(selected.order)}`}
                    className="font-semibold text-pri hover:underline"
                  >
                    Open order
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>

          {selected.failedReason ? (
            <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger">
              {selected.failedReason}
            </p>
          ) : null}

          {selected.escrow ? (
            <div className="mt-4 rounded-xl border border-line bg-soft/50 px-3.5 py-3 text-[11px]">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                Escrow
              </p>
              <p className="mt-1 text-ink">
                {formatNaira(selected.escrow.amountHeld)} held ·{" "}
                {formatNaira(selected.escrow.amountReleased)} released
              </p>
              <p className="mt-0.5 text-muted">
                Status {selected.escrow.status}
                {selected.escrow.releaseDueAt
                  ? ` · due ${formatVendorDate(selected.escrow.releaseDueAt)}`
                  : ""}
              </p>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all text-right text-ink capitalize">{value}</dd>
    </div>
  );
}
