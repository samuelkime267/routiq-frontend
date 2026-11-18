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
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useServerTable } from "@/hooks/useServerTable";
import { ApiError, vendorPortalApi } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { SortDirection } from "@/lib/pagination";
import {
  FULFILLMENT_OPTIONS,
  fulfillmentLabel,
  fulfillmentTone,
  orderCustomer,
  orderPaymentLabel,
  orderPaymentTone,
  orderReference,
  orderShipment,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/orders";
import { SHIPMENT_STATUS_OPTIONS, shipmentStatusLabel } from "@/lib/shipments";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import {
  VENDOR_ORDER_STATUS_FILTERS,
  VENDOR_PAYMENT_FILTERS,
  formatVendorDate,
} from "@/lib/vendorPortal";
import type { ApiAdminOrder } from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "total:desc", label: "Highest value" },
  { value: "total:asc", label: "Lowest value" },
  { value: "orderNumber:asc", label: "Reference A–Z" },
];

export default function VendorOrderDirectory() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [paymentSummary, setPaymentSummary] = useState<Record<string, number>>(
    {},
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const table = useServerTable<ApiAdminOrder>({
    loader: async (query) => {
      const result = await vendorPortalApi.orders({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        paymentStatus: query.filters.paymentStatus,
        fulfillmentStatus: query.filters.fulfillmentStatus,
        shipmentStatus: query.filters.shipmentStatus,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);
      setPaymentSummary(result.paymentSummary);

      return { rows: result.orders, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const totalOrders = Object.values(summary).reduce(
    (sum, count) => sum + count,
    0,
  );

  async function transition(
    order: ApiAdminOrder,
    status: "confirmed" | "processing",
  ) {
    setBusyId(order._id);

    try {
      await vendorPortalApi.updateOrderStatus(order._id, { status });
      toast({
        title:
          status === "confirmed" ? "Order confirmed" : "Order in processing",
        tone: "success",
      });
      table.reload();
    } catch (error) {
      toast({
        title: "Could not update the order",
        description:
          error instanceof ApiError
            ? error.message
            : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  function actionsFor(order: ApiAdminOrder): DropdownItem[] {
    const items: DropdownItem[] = [
      {
        id: "open",
        label: "Open order",
        icon: "eye",
        href: `/orders/${order._id}`,
      },
    ];

    if (order.status === "pending" && order.paymentStatus === "paid") {
      items.push({
        id: "confirm",
        label: "Confirm order",
        icon: "check-circle",
        separatorBefore: true,
        onSelect: () => void transition(order, "confirmed"),
      });
    }

    if (order.status === "confirmed") {
      items.push({
        id: "processing",
        label: "Start processing",
        icon: "package",
        separatorBefore: true,
        onSelect: () => void transition(order, "processing"),
      });
    }

    if (order.status === "processing") {
      items.push({
        id: "ship",
        label: "Record shipment",
        icon: "truck",
        separatorBefore: true,
        href: `/orders/${order._id}?action=ship`,
      });
    }

    if (order.status === "shipped") {
      items.push({
        id: "deliver",
        label: "Mark delivered",
        icon: "check",
        href: `/orders/${order._id}?action=deliver`,
      });
    }

    return items;
  }

  const columns: DataTableColumn<ApiAdminOrder>[] = [
    {
      id: "reference",
      header: "Order",
      primary: true,
      sortable: true,
      sortKey: "orderNumber",
      cell: (order) => (
        <div className="min-w-0">
          <Link
            href={`/orders/${order._id}`}
            className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
          >
            {orderReference(order)}
          </Link>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {order.items.length} item{order.items.length === 1 ? "" : "s"}
            {order.subOrderNumber ? ` · ${order.subOrderNumber}` : ""}
          </p>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (order) => {
        const customer = orderCustomer(order);

        return customer ? (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">
              {customer.name}
            </p>
            <p className="truncate text-[11px] text-muted">
              {customer.phone ?? customer.email ?? "—"}
            </p>
          </div>
        ) : (
          <span className="text-[12px] text-muted">—</span>
        );
      },
    },
    {
      id: "date",
      header: "Placed",
      hideOnMobile: true,
      sortable: true,
      sortKey: "createdAt",
      cell: (order) => (
        <span className="text-[12px] text-muted">
          {formatVendorDate(order.createdAt)}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      sortKey: "total",
      cell: (order) => (
        <span className="text-[12px] font-semibold text-ink">
          {formatNaira(order.total)}
        </span>
      ),
    },
    {
      id: "payment",
      header: "Payment",
      sortable: true,
      sortKey: "paymentStatus",
      hideOnMobile: true,
      cell: (order) => (
        <Badge tone={orderPaymentTone(order.paymentStatus)}>
          {orderPaymentLabel(order.paymentStatus)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
      cell: (order) => (
        <div className="space-y-1">
          <Badge tone={orderStatusTone(order.status)}>
            {orderStatusLabel(order.status)}
          </Badge>
          <p className="text-[10px] text-muted">
            {fulfillmentLabel(order.fulfillmentStatus)}
          </p>
        </div>
      ),
    },
    {
      id: "fulfillment",
      header: "Fulfilment",
      hideOnMobile: true,
      cell: (order) => {
        const shipment = orderShipment(order);

        return (
          <div className="space-y-1">
            <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
              {fulfillmentLabel(order.fulfillmentStatus)}
            </Badge>
            {shipment ? (
              <p className="truncate text-[10px] text-muted">
                {shipment.trackingNumber} · {shipmentStatusLabel(shipment.status)}
              </p>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Confirm, prepare and ship the orders placed with your store. Only your own sub-orders appear here."
        breadcrumbs={vendorBreadcrumbs("/orders")}
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
            <Badge tone="amber">{summary.confirmed ?? 0} to confirm</Badge>
            <Badge tone="blue">{summary.processing ?? 0} processing</Badge>
            <Badge tone="blue">{summary.shipped ?? 0} shipped</Badge>
            <Badge tone="green">{summary.delivered ?? 0} delivered</Badge>
            <Badge tone="neutral">
              {paymentSummary.paid ?? 0} paid
            </Badge>
          </div>
        }
      />

      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={table.searchInput}
            onChange={table.setSearch}
            placeholder="Search by order number, customer or reference"
            label="Search orders"
            className="w-full lg:max-w-sm"
          />

          <Tabs
            variant="pill"
            ariaLabel="Filter orders by status"
            value={table.filters.status ?? ""}
            onChange={(id) => table.setFilter("status", id)}
            items={VENDOR_ORDER_STATUS_FILTERS.map((option) => ({
              id: option.value,
              label: option.label,
              count:
                option.value === "" ? totalOrders : summary[option.value] ?? 0,
            }))}
          />
        </div>

        <div className="border-t border-line">
          <FilterBar
            onReset={table.resetFilters}
            activeCount={table.activeFilterCount}
          >
            <FilterSelect
              label="Payment"
              value={table.filters.paymentStatus ?? ""}
              onChange={(value) => table.setFilter("paymentStatus", value)}
              options={VENDOR_PAYMENT_FILTERS}
            />
            <FilterSelect
              label="Fulfilment"
              value={table.filters.fulfillmentStatus ?? ""}
              onChange={(value) => table.setFilter("fulfillmentStatus", value)}
              options={[
                { value: "", label: "Any fulfilment" },
                ...FULFILLMENT_OPTIONS,
              ]}
            />
            <FilterSelect
              label="Shipment"
              value={table.filters.shipmentStatus ?? ""}
              onChange={(value) => table.setFilter("shipmentStatus", value)}
              options={[
                { value: "", label: "Any shipment" },
                ...SHIPMENT_STATUS_OPTIONS,
              ]}
            />
            <FilterDate
              label="Created from"
              value={table.filters.createdFrom ?? ""}
              onChange={(value) => table.setFilter("createdFrom", value)}
            />
            <FilterDate
              label="Created to"
              value={table.filters.createdTo ?? ""}
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
        caption="Your orders, sorted and paginated by the server"
        columns={columns}
        rows={table.rows}
        getRowId={(order) => order._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        sort={table.sort}
        onSortChange={table.changeSort}
        rowActions={(order) => (
          <div className="flex items-center justify-end gap-1">
            {order.status === "pending" && order.paymentStatus === "paid" ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden px-2.5 sm:inline-flex"
                loading={busyId === order._id}
                onClick={() => void transition(order, "confirmed")}
              >
                Confirm
              </Button>
            ) : null}
            {order.status === "confirmed" ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden px-2.5 sm:inline-flex"
                loading={busyId === order._id}
                onClick={() => void transition(order, "processing")}
              >
                Process
              </Button>
            ) : null}
            <DropdownMenu
              label={`Actions for ${orderReference(order)}`}
              align="right"
              widthClassName="w-56"
              triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
              trigger={<Icon name="more-horizontal" className="size-4" />}
              items={actionsFor(order)}
            />
          </div>
        )}
        emptyTitle={
          table.search || table.activeFilterCount > 0
            ? "No orders match these filters"
            : "No orders yet"
        }
        emptyDescription={
          table.search || table.activeFilterCount > 0
            ? "Try a different search term or reset the filters."
            : "Orders appear here as soon as a customer buys from your store."
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
            itemLabel="orders"
            disabled={table.loading}
          />
        }
      />
    </div>
  );
}
