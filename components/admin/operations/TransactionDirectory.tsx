"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import {
  FilterBar,
  FilterDate,
  FilterSelect,
} from "@/components/ui/FilterBar";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useServerTable } from "@/hooks/useServerTable";
import { transactionAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira, formatNumber } from "@/lib/format";
import {
  formatPaymentChannel,
  orderReference,
  partyName,
} from "@/lib/operations";
import type { SortDirection } from "@/lib/pagination";
import type {
  AdminTransactionEntry,
  AdminTransactionListResult,
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

export default function TransactionDirectory() {
  const [summary, setSummary] = useState<
    AdminTransactionListResult["summary"] | null
  >(null);

  const table = useServerTable<AdminTransactionEntry>({
    loader: async (query) => {
      const result = await transactionAdminApi.list({
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

  const columns: DataTableColumn<AdminTransactionEntry>[] = [
    {
      id: "reference",
      header: "Reference",
      primary: true,
      sortable: true,
      cell: (transaction) => (
        <div className="min-w-0">
          <Link
            href={`/payments/${transaction._id}`}
            className="block truncate font-mono text-[11px] font-semibold text-ink hover:text-pri"
          >
            {transaction.reference}
          </Link>
          <p className="truncate text-[10px] text-muted">
            {orderReference(transaction.order)}
          </p>
        </div>
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
      id: "customer",
      header: "Customer",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-ink">
          {partyName(transaction.customer, "Unknown customer")}
        </span>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-ink">
          {partyName(transaction.vendor, "Unknown vendor")}
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
          <p className="text-[12px] font-medium text-ink">
            {formatNaira(transaction.amount)}
          </p>
          <p className="text-[10px] text-muted">
            Fee {formatNaira(transaction.platformFee)}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (transaction) => <StatusBadge status={transaction.status} />,
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
      id: "createdAt",
      header: "Created",
      sortable: true,
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(transaction.createdAt)}
        </span>
      ),
    },
  ];

  function rowActions(transaction: AdminTransactionEntry) {
    const items: DropdownItem[] = [
      {
        id: "detail",
        label: "Open transaction",
        icon: "eye",
        href: `/payments/${transaction._id}`,
      },
    ];

    if (transaction.order && typeof transaction.order === "object") {
      items.push({
        id: "order",
        label: "Open order",
        icon: "shopping-bag",
        href: `/orders/${transaction.order._id}`,
      });
    }

    if (transaction.escrow && typeof transaction.escrow === "object") {
      items.push({
        id: "escrow",
        label: "Open escrow record",
        icon: "wallet",
        href: `/escrow/${transaction.escrow._id}`,
      });
    }

    return (
      <DropdownMenu
        label={`Actions for ${transaction.reference}`}
        align="right"
        widthClassName="w-56"
        triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
        trigger={<Icon name="more-horizontal" className="size-4" />}
        items={items}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        eyebrow="Finance"
        description="Payments and refunds from the backend payment ledger. Successful volume, refunds and commission are reported separately so a refund is never counted as new revenue."
        breadcrumbs={breadcrumbsFor("/payments")}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="refresh" />}
            onClick={table.reload}
            disabled={table.loading}
          >
            Refresh
          </Button>
        }
        meta={
          <Badge tone="neutral">
            {formatNumber(summary?.total ?? table.meta.total)} matching
            transactions
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
          hint="Separate from collections"
          icon="wallet"
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
          hint={`${formatNumber(summary?.statusCounts.refunded ?? 0)} refunds`}
          icon="activity"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search reference, order, customer or vendor"
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
          caption="Payment and refund records, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(transaction) => transaction._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
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
            ) : undefined
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
    </div>
  );
}
