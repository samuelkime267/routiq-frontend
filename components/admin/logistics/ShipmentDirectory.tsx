"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import ShipmentCancelDialog from "@/components/admin/logistics/ShipmentCancelDialog";
import { useServerTable } from "@/hooks/useServerTable";
import { ApiError, shipmentAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import {
  orderReference,
} from "@/lib/orders";
import {
  SHIPMENT_STATUS_OPTIONS,
  isShipmentOverdue,
  providerStatusLabel,
  shipmentActions,
  shipmentCourierName,
  shipmentOrder,
  shipmentStatusLabel,
  shipmentStatusTone,
} from "@/lib/shipments";
import type { SortDirection } from "@/lib/pagination";
import type { ApiShipment } from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "lastEventAt:desc", label: "Latest tracking event" },
  { value: "lastEventAt:asc", label: "Oldest tracking event" },
  { value: "trackingNumber:asc", label: "Tracking A–Z" },
  { value: "status:asc", label: "Status" },
];

export default function ShipmentDirectory() {
  const { permissions } = useAdminSession();
  const { toast } = useToast();
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ApiShipment | null>(null);

  const canManage = permissions.includes("shipments.manage");

  const table = useServerTable<ApiShipment>({
    loader: async (query) => {
      const result = await shipmentAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        order: query.filters.order,
        customer: query.filters.customer,
        vendor: query.filters.vendor,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);

      return { rows: result.shipments, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const totalShipments = Object.values(summary).reduce(
    (sum, count) => sum + count,
    0,
  );
  const failed = summary.failed ?? 0;
  const overdue = table.rows.filter((shipment) => isShipmentOverdue(shipment))
    .length;

  async function runSync(shipment: ApiShipment, action: "refresh" | "retry") {
    setBusyId(shipment._id);

    try {
      const result = await shipmentAdminApi[action](shipment._id);

      toast({
        title:
          action === "refresh"
            ? "Shipment synchronised"
            : "Shipment retry completed",
        description: `${shipment.trackingNumber} is now ${shipmentStatusLabel(
          result.shipment.status,
        ).toLowerCase()}.`,
        tone: "success",
      });
      table.reload();
    } catch (actionError) {
      toast({
        title:
          actionError instanceof ApiError
            ? actionError.message
            : "The provider operation failed.",
        description: "Check the provider error on the shipment detail page.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  function actionsFor(shipment: ApiShipment): DropdownItem[] {
    const availability = shipmentActions(shipment);
    const items: DropdownItem[] = [
      {
        id: "open",
        label: "Open shipment",
        icon: "eye",
        href: `/logistics/${shipment._id}`,
      },
    ];

    if (!canManage) return items;

    if (availability.refresh) {
      items.push({
        id: "refresh",
        label: "Synchronise with provider",
        icon: "refresh",
        separatorBefore: true,
        onSelect: () => void runSync(shipment, "refresh"),
      });
    }

    if (availability.retry) {
      items.push({
        id: "retry",
        label: "Retry failed sync",
        icon: "refresh",
        onSelect: () => void runSync(shipment, "retry"),
      });
    }

    if (availability.cancel) {
      items.push({
        id: "cancel",
        label: "Cancel shipment",
        icon: "x",
        danger: true,
        separatorBefore: true,
        onSelect: () => setCancelTarget(shipment),
      });
    }

    return items;
  }

  const columns: DataTableColumn<ApiShipment>[] = [
    {
      id: "tracking",
      header: "Shipment",
      primary: true,
      sortable: true,
      sortKey: "trackingNumber",
      cell: (shipment) => (
        <div className="min-w-0">
          <Link
            href={`/logistics/${shipment._id}`}
            className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
          >
            {shipment.trackingNumber}
          </Link>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {shipment.provider} ·{" "}
            {shipment.providerOrderId ?? "no provider order id"}
          </p>
        </div>
      ),
    },
    {
      id: "order",
      header: "Order",
      cell: (shipment) => {
        const order = shipmentOrder(shipment);

        return order ? (
          <div className="min-w-0">
            <Link
              href={`/orders/${order._id}`}
              className="block truncate text-[12px] font-medium text-ink hover:text-pri"
            >
              {orderReference(order)}
            </Link>
            <p className="truncate text-[11px] text-muted">
              {order.masterOrderNumber || order.orderNumber}
            </p>
          </div>
        ) : (
          <span className="text-[12px] text-muted">Order not loaded</span>
        );
      },
    },
    {
      id: "customer",
      header: "Customer",
      hideOnMobile: true,
      cell: (shipment) => {
        const order = shipmentOrder(shipment);
        const customer =
          order?.customerSummary ??
          (order && typeof order.customer !== "string" ? order.customer : null);

        return customer ? (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">
              {customer.name}
            </p>
            <p className="truncate text-[11px] text-muted">
              {customer.email ?? customer.phone ?? "—"}
            </p>
          </div>
        ) : (
          <span className="text-[12px] text-muted">—</span>
        );
      },
    },
    {
      id: "courier",
      header: "Courier / ETA",
      hideOnMobile: true,
      cell: (shipment) => (
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink">
            {shipmentCourierName(shipment)}
          </p>
          <p className="truncate text-[11px] text-muted">
            {shipment.estimatedDeliveryAt
              ? `ETA ${formatAdminDate(shipment.estimatedDeliveryAt)}`
              : "No ETA reported"}
            {isShipmentOverdue(shipment) ? " · overdue" : ""}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
      cell: (shipment) => (
        <div className="space-y-1">
          <Badge tone={shipmentStatusTone(shipment.status)}>
            {shipmentStatusLabel(shipment.status)}
          </Badge>
          <p className="text-[10px] text-muted">
            Provider: {providerStatusLabel(shipment.providerStatus)}
          </p>
          {shipment.failureReason ? (
            <p className="max-w-[180px] truncate text-[10px] text-danger">
              {shipment.failureReason}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "lastEvent",
      header: "Last event",
      hideOnMobile: true,
      sortable: true,
      sortKey: "lastEventAt",
      cell: (shipment) => (
        <span className="text-[11px] text-muted">
          {shipment.lastEventAt
            ? formatAdminDate(shipment.lastEventAt)
            : "No events yet"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Logistics"
        eyebrow="Operations"
        description="Shipment records and provider tracking. Retries only re-run the internal Shipbubble synchronisation."
        breadcrumbs={breadcrumbsFor("/logistics")}
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
            <Badge tone="teal">{totalShipments} shipments</Badge>
            <Badge tone="blue">{summary.in_transit ?? 0} in transit</Badge>
            <Badge tone="green">{summary.delivered ?? 0} delivered</Badge>
            {failed > 0 ? (
              <Badge tone="red">{failed} failed deliveries</Badge>
            ) : null}
            {overdue > 0 ? (
              <Badge tone="amber">{overdue} past ETA on this page</Badge>
            ) : null}
          </div>
        }
      />

      {failed > 0 ? (
        <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                <Icon name="alert-circle" className="size-4" />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-ink">
                  {failed} failed {failed === 1 ? "delivery" : "deliveries"}{" "}
                  need attention
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  Review the provider error, then retry the internal
                  synchronisation or cancel a shipment that never left the hub.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setFilter("status", "failed")}
            >
              Show failed deliveries
            </Button>
          </div>
        </section>
      ) : null}

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search tracking, provider order or order reference"
              label="Search shipments"
              className="w-full lg:max-w-sm"
            />

            <Tabs
              variant="pill"
              ariaLabel="Filter shipments by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All", count: totalShipments },
                ...SHIPMENT_STATUS_OPTIONS.map((option) => ({
                  id: option.value,
                  label: option.label,
                  count: summary[option.value],
                })),
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <TextFilter
                label="Order"
                value={table.filters.order ?? ""}
                placeholder="Reference"
                onChange={(value) => table.setFilter("order", value)}
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
                label="Created from"
                value={table.filters.createdFrom ?? ""}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <DateFilter
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
          caption="Shipments, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(shipment) => shipment._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={(shipment) => (
            <DropdownMenu
              label={`Actions for ${shipment.trackingNumber}`}
              align="right"
              widthClassName="w-60"
              triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
              trigger={
                busyId === shipment._id ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-pri/30 border-t-pri" />
                ) : (
                  <Icon name="more-horizontal" className="size-4" />
                )
              }
              items={actionsFor(shipment)}
            />
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No shipments match these filters"
              : "No shipments yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different tracking number, order reference or date range."
              : "Shipments appear here once a vendor order is handed to the courier."
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
              itemLabel="shipments"
              disabled={table.loading}
            />
          }
        />
      </div>

      {cancelTarget ? (
        <ShipmentCancelDialog
          key={cancelTarget._id}
          shipmentId={cancelTarget._id}
          trackingNumber={cancelTarget.trackingNumber}
          onClose={() => setCancelTarget(null)}
          onCompleted={table.reload}
        />
      ) : null}
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
