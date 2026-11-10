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
import { disputeAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNumber } from "@/lib/format";
import {
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  partyName,
} from "@/lib/operations";
import type { SortDirection } from "@/lib/pagination";
import type {
  AdminDisputeListResult,
  ApiDispute,
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
} from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "priority:desc", label: "Highest priority" },
  { value: "status:asc", label: "Status" },
  { value: "reference:asc", label: "Reference A–Z" },
];

const categoryOptions = [
  { value: "", label: "All categories" },
  { value: "payment", label: "Payment" },
  { value: "order", label: "Order" },
  { value: "delivery", label: "Delivery" },
  { value: "product", label: "Product" },
  { value: "vendor", label: "Vendor" },
];

const priorityOptions = [
  { value: "", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const assignedOptions = [
  { value: "", label: "All assignees" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

const priorityTone = {
  high: "red",
  medium: "amber",
  low: "neutral",
} as const;

export default function DisputeDirectory() {
  const [summary, setSummary] = useState<
    AdminDisputeListResult["summary"] | null
  >(null);

  const table = useServerTable<ApiDispute>({
    loader: async (query) => {
      const result = await disputeAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: (query.filters.status as DisputeStatus) || "",
        category: (query.filters.category as DisputeCategory) || "",
        priority: (query.filters.priority as DisputePriority) || "",
        assignedTo: query.filters.assignedTo,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);

      return { rows: result.disputes, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const columns: DataTableColumn<ApiDispute>[] = [
    {
      id: "subject",
      header: "Dispute",
      primary: true,
      cell: (dispute) => (
        <div className="min-w-0">
          <Link
            href={`/disputes/${dispute._id}`}
            className="block truncate text-[12px] font-semibold text-ink hover:text-pri"
          >
            {dispute.subject}
          </Link>
          <p className="truncate text-[10px] text-muted">{dispute.reference}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: (dispute) => (
        <span className="text-[12px] text-ink">
          {formatDisputeCategory(dispute.category)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (dispute) => (
        <StatusBadge
          status={dispute.status}
          label={formatDisputeStatus(dispute.status)}
        />
      ),
    },
    {
      id: "priority",
      header: "Priority",
      sortable: true,
      cell: (dispute) => (
        <Badge tone={priorityTone[dispute.priority]}>
          {formatDisputePriority(dispute.priority)}
        </Badge>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      hideOnMobile: true,
      cell: (dispute) => (
        <span className="text-[12px] text-ink">
          {partyName(dispute.raisedBy, "Unknown customer")}
        </span>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      hideOnMobile: true,
      cell: (dispute) => (
        <span className="text-[12px] text-ink">
          {partyName(dispute.vendor, "Unknown vendor")}
        </span>
      ),
    },
    {
      id: "assignee",
      header: "Assignee",
      hideOnMobile: true,
      cell: (dispute) =>
        dispute.assignedTo ? (
          <span className="text-[12px] text-ink">
            {partyName(dispute.assignedTo, "Unknown admin")}
          </span>
        ) : (
          <Badge tone="amber">Unassigned</Badge>
        ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      sortable: true,
      hideOnMobile: true,
      cell: (dispute) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(dispute.updatedAt ?? dispute.createdAt)}
        </span>
      ),
    },
  ];

  function rowActions(dispute: ApiDispute) {
    const items: DropdownItem[] = [
      {
        id: "detail",
        label: "Open dispute",
        icon: "eye",
        href: `/disputes/${dispute._id}`,
      },
    ];

    if (dispute.order && typeof dispute.order === "object") {
      items.push({
        id: "order",
        label: "Open order",
        icon: "shopping-bag",
        href: `/orders/${dispute.order._id}`,
      });
    }

    return (
      <DropdownMenu
        label={`Actions for ${dispute.reference}`}
        align="right"
        widthClassName="w-52"
        triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
        trigger={<Icon name="more-horizontal" className="size-4" />}
        items={items}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Disputes"
        eyebrow="Support"
        description="Customer and vendor disputes. Assignment, status changes and internal notes are recorded in the dispute history; resolving a dispute never moves money."
        breadcrumbs={breadcrumbsFor("/disputes")}
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
            {formatNumber(summary?.total ?? table.meta.total)} disputes
          </Badge>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open"
          value={formatNumber(summary?.statuses.OPEN ?? 0)}
          hint="Not yet picked up"
          icon="inbox"
        />
        <MetricCard
          label="Under review"
          value={formatNumber(summary?.statuses.UNDER_REVIEW ?? 0)}
          hint="An administrator is investigating"
          icon="eye"
        />
        <MetricCard
          label="Awaiting information"
          value={formatNumber(summary?.statuses.AWAITING_INFORMATION ?? 0)}
          hint="Waiting for a response"
          icon="message-square"
        />
        <MetricCard
          label="Resolved / closed"
          value={formatNumber(
            (summary?.statuses.RESOLVED ?? 0) + (summary?.statuses.CLOSED ?? 0),
          )}
          hint="No further action expected"
          icon="check-circle"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search reference, subject, order, customer or vendor"
              label="Search disputes"
              className="w-full lg:max-w-md"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter disputes by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All" },
                { id: "OPEN", label: "Open" },
                { id: "UNDER_REVIEW", label: "Review" },
                { id: "AWAITING_INFORMATION", label: "Awaiting" },
                { id: "RESOLVED", label: "Resolved" },
                { id: "CLOSED", label: "Closed" },
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Category"
                value={table.filters.category ?? ""}
                onChange={(value) => table.setFilter("category", value)}
                options={categoryOptions}
              />
              <FilterSelect
                label="Priority"
                value={table.filters.priority ?? ""}
                onChange={(value) => table.setFilter("priority", value)}
                options={priorityOptions}
              />
              <FilterSelect
                label="Assignee"
                value={table.filters.assignedTo ?? ""}
                onChange={(value) => table.setFilter("assignedTo", value)}
                options={assignedOptions}
              />
              <FilterDate
                label="Raised from"
                value={table.filters.createdFrom ?? ""}
                max={table.filters.createdTo || undefined}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <FilterDate
                label="Raised to"
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
          caption="Disputes, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(dispute) => dispute._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No disputes match these filters"
              : "No disputes yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the category, priority, assignee and date filters."
              : "Customer and vendor disputes appear here when they are raised."
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
              itemLabel="disputes"
              disabled={table.loading}
            />
          }
        />
      </div>
    </div>
  );
}
