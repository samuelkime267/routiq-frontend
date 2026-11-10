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
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useServerTable } from "@/hooks/useServerTable";
import { userAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira, formatNumber } from "@/lib/format";
import { formatUserRole } from "@/lib/operations";
import type { SortDirection } from "@/lib/pagination";
import type { AdminUserListEntry, AdminUserListResult } from "@/types/api";
import { initials } from "./shared";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest accounts" },
  { value: "createdAt:asc", label: "Oldest accounts" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "lastLoginAt:desc", label: "Recent sign-in" },
];

const statusOptions = [
  { value: "", label: "All account statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const roleOptions = [
  { value: "", label: "All account types" },
  { value: "user", label: "Customers" },
  { value: "vendor", label: "Vendors" },
  { value: "admin", label: "Administrators" },
];

export default function UserDirectory() {
  const [summary, setSummary] = useState<AdminUserListResult["summary"] | null>(
    null,
  );

  const table = useServerTable<AdminUserListEntry>({
    loader: async (query) => {
      const result = await userAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        role: query.filters.role,
        status: query.filters.status,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);

      return { rows: result.users, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const columns: DataTableColumn<AdminUserListEntry>[] = [
    {
      id: "name",
      header: "Account",
      primary: true,
      sortable: true,
      cell: (user) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-pri text-[11px] font-semibold text-white">
            {user.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePicture}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initials(user.name)
            )}
          </span>
          <div className="min-w-0">
            <Link
              href={`/customers/${user._id}`}
              className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
            >
              {user.name}
            </Link>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Type",
      sortable: true,
      cell: (user) => (
        <Badge tone={user.role === "vendor" ? "lime" : user.role === "admin" ? "teal" : "neutral"}>
          {formatUserRole(user.role)}
        </Badge>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      hideOnMobile: true,
      cell: (user) => (
        <span className="text-[12px] text-muted">{user.phone || "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (user) => <StatusBadge status={user.status} />,
    },
    {
      id: "orders",
      header: "Orders",
      align: "right",
      hideOnMobile: true,
      cell: ({ metrics }) => (
        <span className="text-[12px] text-ink">{formatNumber(metrics.orders)}</span>
      ),
    },
    {
      id: "value",
      header: "Value",
      align: "right",
      hideOnMobile: true,
      cell: ({ metrics }) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(metrics.transactionValue)}
        </span>
      ),
    },
    {
      id: "disputes",
      header: "Disputes",
      align: "right",
      hideOnMobile: true,
      cell: ({ metrics }) => (
        <span className="text-[12px] text-ink">
          {formatNumber(metrics.disputes)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Joined",
      sortable: true,
      hideOnMobile: true,
      cell: (user) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(user.createdAt)}
        </span>
      ),
    },
  ];

  function rowActions(user: AdminUserListEntry) {
    const items: DropdownItem[] = [
      {
        id: "profile",
        label: "Open account",
        icon: "eye",
        href: `/customers/${user._id}`,
      },
      {
        id: "orders",
        label: "Order history",
        icon: "shopping-bag",
        href: `/customers/${user._id}?tab=orders`,
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: "card",
        href: `/customers/${user._id}?tab=transactions`,
      },
    ];

    return (
      <DropdownMenu
        label={`Actions for ${user.name}`}
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
        title="Users"
        eyebrow="Marketplace"
        description="Every customer and vendor account on Routiq. One account identity is shared across orders, payments and support; administrators are shown only to colleagues who can access the admin module."
        breadcrumbs={breadcrumbsFor("/customers")}
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
            <Badge tone="neutral">
              {formatNumber(summary?.total ?? table.meta.total)} accounts
            </Badge>
            {summary ? (
              <>
                <Badge tone="neutral">
                  {formatNumber(summary.roles.user ?? 0)} customers
                </Badge>
                <Badge tone="lime">
                  {formatNumber(summary.roles.vendor ?? 0)} vendors
                </Badge>
                <Badge tone="amber">
                  {formatNumber(summary.statuses.suspended ?? 0)} suspended
                </Badge>
              </>
            ) : null}
          </div>
        }
      />

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search by name, email, phone or username"
              label="Search accounts"
              className="w-full lg:max-w-md"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter accounts by type"
              value={table.filters.role ?? ""}
              onChange={(id) => table.setFilter("role", id)}
              items={[
                { id: "", label: "All" },
                { id: "user", label: "Customers" },
                { id: "vendor", label: "Vendors" },
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Account type"
                value={table.filters.role ?? ""}
                onChange={(value) => table.setFilter("role", value)}
                options={roleOptions}
              />
              <FilterSelect
                label="Account status"
                value={table.filters.status ?? ""}
                onChange={(value) => table.setFilter("status", value)}
                options={statusOptions}
              />
              <FilterDate
                label="Registered from"
                value={table.filters.createdFrom ?? ""}
                max={table.filters.createdTo || undefined}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <FilterDate
                label="Registered to"
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
          caption="Marketplace accounts, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(user) => user._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No accounts match these filters"
              : "No accounts yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the type, status and registration-date filters."
              : "Customer and vendor accounts appear here after registration."
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
              itemLabel="accounts"
              disabled={table.loading}
            />
          }
        />
      </div>
    </div>
  );
}
