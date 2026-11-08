"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useAdminSession } from "@/components/admin/AdminSession";
import StoreActionDialog from "@/components/admin/stores/StoreActionDialog";
import { useServerTable } from "@/hooks/useServerTable";
import { storeAdminApi } from "@/lib/api";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatAdminDate } from "@/lib/admin";
import type { SortDirection } from "@/lib/pagination";
import type { StoreActionKind } from "@/lib/schemas/store";
import type { ApiStore } from "@/types/api";
import { formatBusinessType, storeStatusLabel } from "@/lib/vendors";

interface StoreApprovalsProps {
  /** Pre-selected status, e.g. from `/stores?status=pending`. */
  initialStatus?: string;
}

interface ActiveDialog {
  store: ApiStore;
  action: StoreActionKind;
}

const sortOptions = [
  { value: "submittedAt:desc", label: "Newest submissions" },
  { value: "submittedAt:asc", label: "Oldest submissions" },
  { value: "name:asc", label: "Store name A–Z" },
  { value: "name:desc", label: "Store name Z–A" },
  { value: "reviewedAt:desc", label: "Recently reviewed" },
];

function ownerOf(store: ApiStore) {
  return typeof store.owner === "string" ? null : store.owner;
}

/**
 * The store approval queue.
 *
 * Counts come from the API summary block, so the tabs always reflect the whole
 * collection rather than the current page. Every status-changing action opens
 * the shared confirmation dialog and reloads the server table on success.
 */
export default function StoreApprovals({
  initialStatus,
}: StoreApprovalsProps) {
  const { permissions } = useAdminSession();
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);

  const canApprove = permissions.includes("stores.approve");
  const canReject = permissions.includes("stores.reject");
  const canSuspend = permissions.includes("stores.suspend");

  const table = useServerTable<ApiStore>({
    loader: async (query) => {
      const result = await storeAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
      });

      setSummary(result.summary);

      return { rows: result.stores, pagination: result.pagination };
    },
    initialFilters: initialStatus ? { status: initialStatus } : {},
    initialSort: { key: "submittedAt", direction: "desc" },
  });

  function actionsFor(store: ApiStore): DropdownItem[] {
    const items: DropdownItem[] = [
      {
        id: "review",
        label: "Open review",
        icon: "eye",
        href: `/stores/${store._id}`,
      },
    ];

    const reviewing = ["pending", "under_review"].includes(store.status);

    if (reviewing && canApprove) {
      items.push(
        {
          id: "approve",
          label: "Approve store",
          icon: "check-circle",
          separatorBefore: true,
          onSelect: () => setDialog({ store, action: "approve" }),
        },
        {
          id: "request-info",
          label: "Request information",
          icon: "message-square",
          onSelect: () => setDialog({ store, action: "request-information" }),
        },
      );
    }

    if (reviewing && canReject) {
      items.push({
        id: "reject",
        label: "Reject application",
        icon: "x",
        danger: true,
        onSelect: () => setDialog({ store, action: "reject" }),
      });
    }

    if (store.status === "approved" && canSuspend) {
      items.push({
        id: "suspend",
        label: "Suspend store",
        icon: "lock",
        danger: true,
        separatorBefore: true,
        onSelect: () => setDialog({ store, action: "suspend" }),
      });
    }

    if (store.status === "suspended" && canSuspend) {
      items.push({
        id: "reactivate",
        label: "Reactivate store",
        icon: "refresh",
        separatorBefore: true,
        onSelect: () => setDialog({ store, action: "reactivate" }),
      });
    }

    return items;
  }

  const columns: DataTableColumn<ApiStore>[] = [
    {
      id: "name",
      header: "Store",
      primary: true,
      sortable: true,
      cell: (store) => (
        <div className="min-w-0">
          <Link
            href={`/stores/${store._id}`}
            className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
          >
            {store.name}
          </Link>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {store.category || "Uncategorised"} ·{" "}
            {formatBusinessType(store.businessType)}
          </p>
        </div>
      ),
    },
    {
      id: "owner",
      header: "Vendor",
      hideOnMobile: true,
      cell: (store) => {
        const owner = ownerOf(store);

        if (!owner) {
          return <span className="text-[12px] text-muted">—</span>;
        }

        return (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">
              {owner.name}
            </p>
            <p className="truncate text-[11px] text-muted">{owner.email}</p>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (store) => (
        <StatusBadge status={store.status} label={storeStatusLabel(store.status)} />
      ),
    },
    {
      id: "submittedAt",
      header: "Submitted",
      sortable: true,
      hideOnMobile: true,
      cell: (store) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(store.submittedAt ?? store.createdAt)}
        </span>
      ),
    },
    {
      id: "reviewedAt",
      header: "Last reviewed",
      hideOnMobile: true,
      cell: (store) => (
        <span className="text-[12px] text-muted">
          {store.reviewedAt ? formatAdminDate(store.reviewedAt) : "Not yet"}
        </span>
      ),
    },
  ];

  const total = summary
    ? Object.values(summary).reduce((count, value) => count + value, 0)
    : table.meta.total;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Store approvals"
        eyebrow="Marketplace"
        description="Review vendor store applications, verify business details and decide who can trade on Routiq. Every decision is recorded in the store history and shared with the vendor."
        breadcrumbs={breadcrumbsFor("/stores")}
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
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="amber">
              {summary?.pending ?? 0} awaiting first review
            </Badge>
            <Badge tone="blue">
              {summary?.under_review ?? 0} under review
            </Badge>
            <Badge tone="green">
              {summary?.approved ?? 0} approved stores
            </Badge>
          </div>
        }
      />

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search by store, business name or email"
              label="Search stores"
              className="w-full lg:max-w-sm"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter stores by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All", count: total },
                { id: "pending", label: "Pending", count: summary?.pending },
                {
                  id: "under_review",
                  label: "Under review",
                  count: summary?.under_review,
                },
                {
                  id: "approved",
                  label: "Approved",
                  count: summary?.approved,
                },
                {
                  id: "rejected",
                  label: "Rejected",
                  count: summary?.rejected,
                },
                {
                  id: "suspended",
                  label: "Suspended",
                  count: summary?.suspended,
                },
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
                options={[
                  { value: "", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "pending", label: "Pending" },
                  { value: "under_review", label: "Under review" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "suspended", label: "Suspended" },
                  { value: "closed", label: "Closed" },
                ]}
              />
              <FilterSelect
                label="Sort by"
                value={
                  table.sort
                    ? `${table.sort.key}:${table.sort.direction}`
                    : "submittedAt:desc"
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
          caption="Store applications, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(store) => store._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={(store) => (
            <DropdownMenu
              label={`Actions for ${store.name}`}
              align="right"
              widthClassName="w-60"
              triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
              trigger={<Icon name="more-horizontal" className="size-4" />}
              items={actionsFor(store)}
            />
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No stores match these filters"
              : "No store applications yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the status filter."
              : "Vendor store applications appear here as soon as they are submitted."
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
              itemLabel="stores"
              disabled={table.loading}
            />
          }
        />
      </div>

      {dialog ? (
        <StoreActionDialog
          key={`${dialog.action}:${dialog.store._id}`}
          storeId={dialog.store._id}
          storeName={dialog.store.name}
          action={dialog.action}
          onClose={() => setDialog(null)}
          onCompleted={table.reload}
        />
      ) : null}
    </div>
  );
}
