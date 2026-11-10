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
import { useServerTable } from "@/hooks/useServerTable";
import { escrowAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira, formatNumber } from "@/lib/format";
import {
  ESCROW_RELEASE_LABELS,
  orderReference,
  partyName,
} from "@/lib/operations";
import type { SortDirection } from "@/lib/pagination";
import type { AdminEscrowEntry, AdminEscrowListResult } from "@/types/api";

const sortOptions = [
  { value: "heldAt:desc", label: "Newest held" },
  { value: "heldAt:asc", label: "Oldest held" },
  { value: "releaseDueAt:asc", label: "Release due soonest" },
  { value: "amountHeld:desc", label: "Largest held" },
  { value: "status:asc", label: "Status" },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "held", label: "Held" },
  { value: "released", label: "Released" },
  { value: "refunded", label: "Refunded" },
];

const releaseTone = {
  released: "green",
  refunded: "blue",
  due: "amber",
  scheduled: "neutral",
} as const;

export default function EscrowDirectory() {
  const [summary, setSummary] = useState<AdminEscrowListResult["summary"] | null>(
    null,
  );

  const table = useServerTable<AdminEscrowEntry>({
    loader: async (query) => {
      const result = await escrowAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);

      return { rows: result.escrows, pagination: result.pagination };
    },
    initialSort: { key: "heldAt", direction: "desc" },
  });

  const columns: DataTableColumn<AdminEscrowEntry>[] = [
    {
      id: "order",
      header: "Order",
      primary: true,
      cell: (escrow) => (
        <div className="min-w-0">
          <Link
            href={`/escrow/${escrow._id}`}
            className="block truncate text-[12px] font-semibold text-ink hover:text-pri"
          >
            {orderReference(escrow.order)}
          </Link>
          <p className="truncate text-[10px] text-muted">
            {escrow.payment && typeof escrow.payment === "object"
              ? escrow.payment.reference
              : "No payment reference"}
          </p>
        </div>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      hideOnMobile: true,
      cell: (escrow) => {
        const order =
          escrow.order && typeof escrow.order === "object"
            ? escrow.order
            : null;

        return (
          <span className="text-[12px] text-ink">
            {partyName(escrow.vendor ?? order?.vendor, "Unknown vendor")}
          </span>
        );
      },
    },
    {
      id: "amountHeld",
      header: "Held",
      align: "right",
      sortable: true,
      cell: (escrow) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(escrow.amountHeld)}
        </span>
      ),
    },
    {
      id: "availableHeld",
      header: "Available",
      align: "right",
      hideOnMobile: true,
      cell: (escrow) => (
        <span className="text-[12px] text-ink">
          {formatNaira(escrow.availableHeld)}
        </span>
      ),
    },
    {
      id: "releaseStatus",
      header: "Release",
      cell: (escrow) => (
        <div className="space-y-1">
          <Badge tone={releaseTone[escrow.releaseStatus]}>
            {ESCROW_RELEASE_LABELS[escrow.releaseStatus]}
          </Badge>
          {escrow.releaseDueAt ? (
            <p className="text-[10px] text-muted">
              Due {formatAdminDate(escrow.releaseDueAt)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Ledger",
      sortable: true,
      hideOnMobile: true,
      cell: (escrow) => <StatusBadge status={escrow.status} />,
    },
    {
      id: "dispute",
      header: "Dispute",
      hideOnMobile: true,
      cell: (escrow) =>
        escrow.dispute ? (
          <Link
            href={`/disputes/${escrow.dispute._id}`}
            className="text-[11px] font-semibold text-danger hover:underline"
          >
            {escrow.dispute.reference}
          </Link>
        ) : (
          <span className="text-[11px] text-muted">None</span>
        ),
    },
    {
      id: "heldAt",
      header: "Held",
      sortable: true,
      hideOnMobile: true,
      cell: (escrow) => (
        <span className="text-[12px] text-muted">
          {escrow.heldAt ? formatAdminDate(escrow.heldAt) : "—"}
        </span>
      ),
    },
  ];

  function rowActions(escrow: AdminEscrowEntry) {
    const items: DropdownItem[] = [
      {
        id: "detail",
        label: "Open escrow record",
        icon: "eye",
        href: `/escrow/${escrow._id}`,
      },
    ];

    if (escrow.order && typeof escrow.order === "object") {
      items.push({
        id: "order",
        label: "Open order",
        icon: "shopping-bag",
        href: `/orders/${escrow.order._id}`,
      });
    }

    if (escrow.payment && typeof escrow.payment === "object") {
      items.push({
        id: "payment",
        label: "Open transaction",
        icon: "card",
        href: `/payments/${escrow.payment._id}`,
      });
    }

    return (
      <DropdownMenu
        label={`Actions for escrow ${escrow._id}`}
        align="right"
        widthClassName="w-60"
        triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
        trigger={<Icon name="more-horizontal" className="size-4" />}
        items={items}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Escrow"
        eyebrow="Finance"
        description="Funds held against orders before release or refund. Escrow is a liability, not realised revenue; this console is read-only because no release or refund client is configured."
        breadcrumbs={breadcrumbsFor("/escrow")}
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
            {formatNumber(summary?.total ?? table.meta.total)} escrow records
          </Badge>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Held balance"
          value={formatNaira(summary?.heldBalance ?? 0)}
          hint="Held minus released and refunded"
          icon="wallet"
        />
        <MetricCard
          label="Released"
          value={formatNaira(summary?.releasedVolume ?? 0)}
          hint="Settled to vendors"
          icon="check-circle"
        />
        <MetricCard
          label="Refunded"
          value={formatNaira(summary?.refundedVolume ?? 0)}
          hint="Returned from escrow"
          icon="refresh"
        />
        <MetricCard
          label="Records"
          value={formatNumber(summary?.total ?? table.meta.total)}
          hint={`${formatNumber(summary?.statusCounts.held ?? 0)} still held`}
          icon="activity"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="px-4 py-3">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search order number or payment reference"
              label="Search escrow"
              className="w-full lg:max-w-md"
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
              <FilterDate
                label="Held from"
                value={table.filters.createdFrom ?? ""}
                max={table.filters.createdTo || undefined}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <FilterDate
                label="Held to"
                value={table.filters.createdTo ?? ""}
                min={table.filters.createdFrom || undefined}
                onChange={(value) => table.setFilter("createdTo", value)}
              />
              <FilterSelect
                label="Sort by"
                value={
                  table.sort
                    ? `${table.sort.key}:${table.sort.direction}`
                    : "heldAt:desc"
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
          caption="Escrow records, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(escrow) => escrow._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No escrow records match these filters"
              : "No escrow records yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the status and held-date filters."
              : "Escrow entries are created when a payment is held for an order."
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
              itemLabel="escrow records"
              disabled={table.loading}
            />
          }
        />
      </div>
    </div>
  );
}
