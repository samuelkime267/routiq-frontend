"use client";

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
import { useServerTable } from "@/hooks/useServerTable";
import { vendorApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira } from "@/lib/format";
import type { SortDirection } from "@/lib/pagination";
import { storeStatusLabel } from "@/lib/vendors";
import type { VendorListEntry } from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest vendors" },
  { value: "createdAt:asc", label: "Oldest vendors" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "email:asc", label: "Email A–Z" },
];

const vendorStatusOptions = [
  { value: "", label: "All account statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

const storeStatusOptions = [
  { value: "", label: "All store statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "V"
  );
}

/**
 * Vendor directory.
 *
 * One row per vendor account, with the vendor's single store and lifetime
 * commerce rollups loaded in the same page request.
 */
export default function VendorDirectory() {
  const table = useServerTable<VendorListEntry>({
    loader: async (query) => {
      const result = await vendorApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        storeStatus: query.filters.storeStatus,
      });

      return { rows: result.vendors, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const columns: DataTableColumn<VendorListEntry>[] = [
    {
      id: "name",
      header: "Vendor",
      primary: true,
      sortable: true,
      cell: ({ vendor }) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-pri text-[11px] font-semibold text-white">
            {vendor.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.profilePicture}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initials(vendor.name)
            )}
          </span>
          <div className="min-w-0">
            <Link
              href={`/vendors/${vendor._id}`}
              className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
            >
              {vendor.name}
            </Link>
            <p className="truncate text-[11px] text-muted">{vendor.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "store",
      header: "Store",
      cell: ({ store }) =>
        store ? (
          <div className="min-w-0">
            <Link
              href={`/stores/${store._id}`}
              className="block truncate text-[12px] font-medium text-ink hover:text-pri"
            >
              {store.name}
            </Link>
            <div className="mt-1">
              <StatusBadge
                status={store.status}
                label={storeStatusLabel(store.status)}
              />
            </div>
          </div>
        ) : (
          <Badge tone="neutral">No store yet</Badge>
        ),
    },
    {
      id: "status",
      header: "Account",
      sortable: true,
      hideOnMobile: true,
      cell: ({ vendor }) => <StatusBadge status={vendor.status} />,
    },
    {
      id: "products",
      header: "Products",
      align: "right",
      hideOnMobile: true,
      cell: ({ metrics }) => (
        <span className="text-[12px] text-ink">{metrics.products}</span>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      align: "right",
      hideOnMobile: true,
      cell: ({ metrics }) => (
        <span className="text-[12px] text-ink">{metrics.orders}</span>
      ),
    },
    {
      id: "revenue",
      header: "Revenue",
      align: "right",
      hideOnMobile: true,
      cell: ({ metrics }) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(metrics.revenue)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Joined",
      sortable: true,
      hideOnMobile: true,
      cell: ({ vendor }) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(vendor.createdAt)}
        </span>
      ),
    },
  ];

  function rowActions({ vendor, store }: VendorListEntry) {
    const items: DropdownItem[] = [
      {
        id: "profile",
        label: "Open vendor profile",
        icon: "eye",
        href: `/vendors/${vendor._id}`,
      },
    ];

    if (store) {
      items.push({
        id: "store-review",
        label: "Open store review",
        icon: "store",
        href: `/stores/${store._id}`,
      });
    }

    return (
      <DropdownMenu
        label={`Actions for ${vendor.name}`}
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
        title="Vendors"
        eyebrow="Marketplace"
        description="Every vendor account on Routiq, with the store it operates and lifetime commerce totals. Open a profile to review verification, notes and account access."
        breadcrumbs={breadcrumbsFor("/vendors")}
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
            {table.meta.total} matching{" "}
            {table.meta.total === 1 ? "vendor" : "vendors"}
          </Badge>
        }
      />

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search by vendor name, email or username"
              label="Search vendors"
              className="w-full lg:max-w-sm"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter vendors by account status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All" },
                { id: "active", label: "Active" },
                { id: "suspended", label: "Suspended" },
                { id: "inactive", label: "Inactive" },
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Account status"
                value={table.filters.status ?? ""}
                onChange={(value) => table.setFilter("status", value)}
                options={vendorStatusOptions}
              />
              <FilterSelect
                label="Store status"
                value={table.filters.storeStatus ?? ""}
                onChange={(value) => table.setFilter("storeStatus", value)}
                options={storeStatusOptions}
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
          caption="Vendors, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(entry) => entry.vendor._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No vendors match these filters"
              : "No vendors yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the account and store filters."
              : "Vendor accounts appear here once sellers register on Routiq."
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
              itemLabel="vendors"
              disabled={table.loading}
            />
          }
        />
      </div>
    </div>
  );
}
