"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Tabs from "@/components/ui/Tabs";
import { useServerTable } from "@/hooks/useServerTable";
import { orderAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira } from "@/lib/format";
import {
  FULFILLMENT_OPTIONS,
  ORDER_PAYMENT_OPTIONS,
  ORDER_STATUS_OPTIONS,
  fulfillmentLabel,
  fulfillmentTone,
  orderAddressLine,
  orderCustomer,
  orderMasterReference,
  orderPaymentLabel,
  orderPaymentTone,
  orderReference,
  orderShipment,
  orderStore,
  orderVendor,
} from "@/lib/orders";
import { SHIPMENT_STATUS_OPTIONS, shipmentStatusLabel } from "@/lib/shipments";
import type { SortDirection } from "@/lib/pagination";
import type { ApiAdminOrder } from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "total:desc", label: "Highest value" },
  { value: "total:asc", label: "Lowest value" },
  { value: "orderNumber:asc", label: "Reference A–Z" },
  { value: "status:asc", label: "Status" },
  { value: "paymentStatus:asc", label: "Payment status" },
];

export default function OrderDirectory() {
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>(
    {},
  );
  const [paymentSummary, setPaymentSummary] = useState<Record<string, number>>(
    {},
  );
  const [fulfillmentSummary, setFulfillmentSummary] = useState<
    Record<string, number>
  >({});
  const [shipmentSummary, setShipmentSummary] = useState<Record<string, number>>(
    {},
  );

  const table = useServerTable<ApiAdminOrder>({
    loader: async (query) => {
      const result = await orderAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        paymentStatus: query.filters.paymentStatus,
        fulfillmentStatus: query.filters.fulfillmentStatus,
        shipmentStatus: query.filters.shipmentStatus,
        customer: query.filters.customer,
        vendor: query.filters.vendor,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setStatusSummary(result.summary);
      setPaymentSummary(result.paymentSummary);
      setFulfillmentSummary(result.fulfillmentSummary);
      setShipmentSummary(result.shipmentSummary);

      return { rows: result.orders, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const totalOrders = Object.values(statusSummary).reduce(
    (sum, count) => sum + count,
    0,
  );
  const failedShipments = shipmentSummary.failed ?? 0;

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
            Master {orderMasterReference(order)}
            {order.shipmentCount
              ? ` · ${order.shipmentCount} shipment${order.shipmentCount > 1 ? "s" : ""}`
              : ""}
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
              {customer.email ?? (orderAddressLine(order) || "—")}
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
          {formatAdminDate(order.createdAt)}
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
        <div>
          <p className="text-[12px] font-semibold text-ink">
            {formatNaira(order.total)}
          </p>
          {order.discount > 0 ? (
            <p className="text-[11px] text-muted">
              −{formatNaira(order.discount)} discount
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "payment",
      header: "Payment",
      sortable: true,
      sortKey: "paymentStatus",
      cell: (order) => (
        <Badge tone={orderPaymentTone(order.paymentStatus)}>
          {orderPaymentLabel(order.paymentStatus)}
        </Badge>
      ),
    },
    {
      id: "fulfillment",
      header: "Fulfilment",
      cell: (order) => {
        const shipment = orderShipment(order);

        return (
          <div className="space-y-1">
            <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
              {fulfillmentLabel(order.fulfillmentStatus)}
            </Badge>
            {shipment ? (
              <p className="text-[10px] text-muted">
                {shipment.trackingNumber} ·{" "}
                {shipmentStatusLabel(shipment.status)}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "vendor",
      header: "Vendor / sub-order",
      hideOnMobile: true,
      cell: (order) => {
        const vendor = orderVendor(order);
        const store = orderStore(order);

        return (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">
              {vendor?.name ?? "—"}
            </p>
            <p className="truncate text-[11px] text-muted">
              {[store?.name, order.subOrderNumber ?? order.orderNumber]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        eyebrow="Operations"
        description="Every vendor sub-order produced by a checkout, with payment, fulfilment and shipment state kept independent."
        breadcrumbs={breadcrumbsFor("/orders")}
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
            <Badge tone="teal">{totalOrders} orders</Badge>
            <Badge tone="amber">
              {fulfillmentSummary.unfulfilled ?? 0} unfulfilled
            </Badge>
            <Badge tone="blue">{fulfillmentSummary.shipped ?? 0} in fulfilment</Badge>
            {failedShipments > 0 ? (
              <Badge tone="red">{failedShipments} failed deliveries</Badge>
            ) : null}
            {paymentSummary.failed > 0 ? (
              <Badge tone="red">{paymentSummary.failed} payment failures</Badge>
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
              placeholder="Search reference, customer, vendor or store"
              label="Search orders"
              className="w-full lg:max-w-sm"
            />

            <Tabs
              variant="pill"
              ariaLabel="Filter orders by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All", count: totalOrders },
                ...ORDER_STATUS_OPTIONS.map((option) => ({
                  id: option.value,
                  label: option.label,
                  count: statusSummary[option.value],
                })),
              ]}
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
                options={[{ value: "", label: "Any payment" }, ...ORDER_PAYMENT_OPTIONS]}
              />
              <FilterSelect
                label="Fulfilment"
                value={table.filters.fulfillmentStatus ?? ""}
                onChange={(value) =>
                  table.setFilter("fulfillmentStatus", value)
                }
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
              <TextFilter
                label="Customer"
                value={table.filters.customer ?? ""}
                placeholder="Name or email"
                onChange={(value) => table.setFilter("customer", value)}
              />
              <TextFilter
                label="Vendor / store"
                value={table.filters.vendor ?? ""}
                placeholder="Name or email"
                onChange={(value) => table.setFilter("vendor", value)}
              />
              <DateFilter
                label="Placed from"
                value={table.filters.createdFrom ?? ""}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <DateFilter
                label="Placed to"
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
          caption="Orders, sorted and paginated by the server"
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
            <DropdownMenu
              label={`Actions for ${orderReference(order)}`}
              align="right"
              widthClassName="w-52"
              triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
              trigger={<Icon name="more-horizontal" className="size-4" />}
              items={[
                {
                  id: "open",
                  label: "Open order",
                  icon: "eye",
                  href: `/orders/${order._id}`,
                },
                ...(orderShipment(order)
                  ? [
                      {
                        id: "shipment",
                        label: "Open shipment",
                        icon: "truck" as const,
                        href: `/logistics/${orderShipment(order)!._id}`,
                      },
                    ]
                  : []),
              ]}
            />
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No orders match these filters"
              : "No orders yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different reference, customer or date range."
              : "Customer checkouts appear here as soon as they are placed."
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
    </div>
  );
}

function TextFilter({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full sm:w-40">
      <label className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 text-[12px] font-medium"
      />
    </div>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full sm:w-40">
      <label className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </label>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 text-[12px] font-medium"
      />
    </div>
  );
}
