"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useResource } from "@/hooks/useResource";
import { orderAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { formatNaira, formatNumber } from "@/lib/format";
import {
  escrowStatusLabel,
  fulfillmentLabel,
  fulfillmentTone,
  orderAddressLine,
  orderCustomer,
  orderMasterReference,
  orderPaymentLabel,
  orderPaymentTone,
  orderReference,
  orderStatusLabel,
  orderStore,
  orderVendor,
  paymentRecordLabel,
  paymentRecordTone,
  timelineEventPresentation,
} from "@/lib/orders";
import {
  isShipmentOverdue,
  providerStatusLabel,
  shipmentCourierName,
  shipmentStatusLabel,
  shipmentStatusTone,
} from "@/lib/shipments";
import type {
  AdminOrderDetail as AdminOrderDetailData,
  ApiAdminOrder,
  ApiPayment,
  ApiShipment,
} from "@/types/api";

interface OrderDetailProps {
  orderId: string;
}

const CHANNEL_LABELS: Record<ApiPayment["channel"], string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  ussd: "USSD",
  wallet: "Wallet",
};

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const { data, error, loading, refreshing, reload } =
    useResource<AdminOrderDetailData>(`admin-order-${orderId}`, () =>
      orderAdminApi.get(orderId),
    );

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Order detail"
          eyebrow="Operations"
          breadcrumbs={breadcrumbsForOrder()}
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-64 animate-pulse rounded-2xl border border-line bg-white" />
          <div className="h-64 animate-pulse rounded-2xl border border-line bg-white" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Order detail"
          eyebrow="Operations"
          breadcrumbs={breadcrumbsForOrder()}
        />
        <ErrorState
          title="Could not load this order"
          description={error ?? "This order may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/orders">
              Back to orders
            </Button>
          }
        />
      </div>
    );
  }

  const { order, summary, subOrders, payments, escrows, shipments, timeline } =
    data;
  const customer = orderCustomer(order);
  const vendor = orderVendor(order);
  const store = orderStore(order);
  const address = order.shippingAddress;
  const latestPayment = payments[0] ?? order.payment ?? null;
  const escrow = escrows[0] ?? order.escrow ?? null;
  const failedShipment = shipments.find(
    (shipment) => shipment.status === "failed",
  );

  const timelineItems: TimelineItem[] = [...timeline].reverse().map((event) => {
    const presentation = timelineEventPresentation(event);

    return {
      id: event.id,
      title: presentation.label,
      description: event.description ?? undefined,
      time: `${formatAdminDate(event.occurredAt)} · ${event.subOrderNumber ?? event.orderNumber}`,
      icon: presentation.icon,
      tone: presentation.tone,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={orderReference(order)}
        eyebrow="Order"
        description={`Master order ${orderMasterReference(order)} · placed ${formatAdminDate(order.createdAt)}`}
        breadcrumbs={breadcrumbsForOrder(orderReference(order))}
        actions={
          <>
            <Button variant="outline" size="sm" href="/orders">
              Back to orders
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={reload}
              loading={refreshing}
            >
              Refresh
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              status={order.status}
              label={orderStatusLabel(order.status)}
            />
            <Badge tone={orderPaymentTone(order.paymentStatus)}>
              {orderPaymentLabel(order.paymentStatus)}
            </Badge>
            <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
              {fulfillmentLabel(order.fulfillmentStatus)}
            </Badge>
            {shipments.map((shipment) => (
              <Badge
                key={shipment._id}
                tone={shipmentStatusTone(shipment.status)}
              >
                {shipment.trackingNumber} · {shipmentStatusLabel(shipment.status)}
              </Badge>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {failedShipment ? (
            <Callout
              title="Delivery failed"
              body={
                failedShipment.failureReason ??
                "The courier reported that this delivery could not be completed."
              }
              meta={
                failedShipment.lastEventAt
                  ? `Last event ${formatAdminDate(failedShipment.lastEventAt)}`
                  : undefined
              }
              href={`/logistics/${failedShipment._id}`}
              hrefLabel="Open shipment"
            />
          ) : null}

          <Card
            title={`Items (${order.items.length})`}
            description="Line items and the pricing captured at checkout."
          >
            <div className="space-y-2">
              {order.items.length ? (
                order.items.map((item, index) => (
                  <div
                    key={`${item.product}-${index}`}
                    className="flex items-start justify-between gap-4 rounded-xl bg-well/40 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-ink">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatNumber(item.quantity)} × {formatNaira(item.unitPrice)}
                      </p>
                    </div>
                    <p className="shrink-0 text-[12px] font-semibold text-ink">
                      {formatNaira(item.total)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-muted">
                  This order has no line items recorded.
                </p>
              )}
            </div>

            <dl className="mt-3 border-t border-line pt-1">
              <InfoRow label="Subtotal" value={formatNaira(order.subtotal)} />
              <InfoRow
                label="Shipping"
                value={order.shippingFee ? formatNaira(order.shippingFee) : "Free"}
              />
              <InfoRow
                label={order.discountCode ? `Discount (${order.discountCode})` : "Discount"}
                value={order.discount ? `−${formatNaira(order.discount)}` : null}
              />
              <InfoRow
                label="Order total"
                value={
                  <span className="text-[13px] font-semibold text-ink">
                    {formatNaira(order.total)}
                  </span>
                }
              />
            </dl>
          </Card>

          <Card
            title="Payment & escrow"
            description="Payment state and where the vendor proceeds currently sit."
          >
            {latestPayment ? (
              <dl>
                <InfoRow label="Reference" value={latestPayment.reference} />
                <InfoRow
                  label="Amount"
                  value={formatNaira(latestPayment.amount)}
                />
                <InfoRow
                  label="Method"
                  value={CHANNEL_LABELS[latestPayment.channel] ?? latestPayment.channel}
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge tone={paymentRecordTone(latestPayment)}>
                      {paymentRecordLabel(latestPayment)}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Paid"
                  value={
                    latestPayment.paidAt
                      ? formatAdminDate(latestPayment.paidAt)
                      : null
                  }
                />
                <InfoRow
                  label="Platform fee"
                  value={formatNaira(latestPayment.platformFee)}
                />
                <InfoRow
                  label="Vendor proceeds"
                  value={formatNaira(latestPayment.vendorAmount)}
                />
              </dl>
            ) : (
              <p className="text-[12px] text-muted">
                No payment attempt has been recorded for this order.
              </p>
            )}

            <div className="mt-3 rounded-xl border border-line bg-well/40 px-3.5 py-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Escrow
              </p>
              {escrow ? (
                <div className="mt-1.5 space-y-1">
                  <p className="text-[12px] font-semibold text-ink">
                    {escrowStatusLabel(escrow)}
                  </p>
                  <p className="text-[11px] text-muted">
                    Held {formatNaira(escrow.amountHeld)} · released{" "}
                    {formatNaira(escrow.amountReleased)} · refunded{" "}
                    {formatNaira(escrow.amountRefunded)}
                    {escrow.releaseDueAt
                      ? ` · due ${formatAdminDate(escrow.releaseDueAt)}`
                      : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-1.5 text-[12px] text-muted">
                  No escrow entry exists because no successful payment was
                  recorded.
                </p>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                Settlement actions are handled by the finance workflow and are
                not available in order management.
              </p>
            </div>
          </Card>

          <Card
            title="Order timeline"
            description="Only events that were actually recorded or proven by a payment or shipment timestamp."
          >
            <Timeline
              items={timelineItems}
              emptyLabel="No events have been recorded for this order yet."
            />
          </Card>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Customer</h2>
            {customer ? (
              <div className="mt-2.5 space-y-1">
                <p className="truncate text-[12px] font-semibold text-ink">
                  {customer.name}
                </p>
                {customer.email ? (
                  <p className="truncate text-[11px] text-muted">
                    {customer.email}
                  </p>
                ) : null}
                {customer.phone ? (
                  <p className="text-[11px] text-muted">{customer.phone}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-muted">
                Customer record not loaded.
              </p>
            )}

            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Delivery address
              </p>
              {address ? (
                <address className="mt-1 text-[12px] leading-relaxed text-ink not-italic">
                  {[
                    address.recipientName,
                    address.phone,
                    address.street,
                    [address.lga, address.city, address.state]
                      .filter(Boolean)
                      .join(", "),
                    address.country,
                    address.landmark,
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  {[
                    address.recipientName,
                    address.phone,
                    address.street,
                    address.city,
                    address.state,
                  ].every((value) => !value) ? (
                    <span className="text-muted">
                      No address was captured for this order.
                    </span>
                  ) : null}
                </address>
              ) : (
                <p className="mt-1 text-[12px] text-muted">
                  {orderAddressLine(order) || "No address was captured."}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">
              Vendor & store
            </h2>
            <div className="mt-2.5 space-y-1">
              <p className="truncate text-[12px] font-semibold text-ink">
                {vendor?.name ?? "—"}
              </p>
              <p className="truncate text-[11px] text-muted">
                {vendor?.email ?? "Vendor account not loaded"}
              </p>
              <p className="truncate text-[11px] text-muted">
                {store?.name ?? "Store not loaded"}
              </p>
            </div>
            <div className="mt-3 grid gap-1.5">
              {store ? (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  href={`/stores/${store._id}`}
                >
                  Open store review
                </Button>
              ) : null}
              {vendor ? (
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  href={`/vendors/${vendor._id}`}
                >
                  Open vendor profile
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-ink">
                Sub-orders
              </h2>
              <Badge tone="neutral">{summary.orderCount}</Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              {formatNaira(summary.subtotal)} goods ·{" "}
              {formatNaira(summary.shippingFee)} shipping ·{" "}
              {formatNaira(summary.total)} total
            </p>
            <div className="mt-2.5 space-y-2">
              {subOrders.map((subOrder) => (
                <SubOrderRow key={subOrder._id} order={subOrder} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-ink">Shipments</h2>
              <Badge tone="neutral">{shipments.length}</Badge>
            </div>
            <div className="mt-2.5 space-y-2">
              {shipments.length ? (
                shipments.map((shipment) => (
                  <ShipmentRow key={shipment._id} shipment={shipment} />
                ))
              ) : (
                <p className="text-[12px] text-muted">
                  No shipment has been created for this sub-order.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function breadcrumbsForOrder(reference?: string) {
  return [
    { label: "Admin console", href: "/" },
    { label: "Operations" },
    { label: "Orders", href: "/orders" },
    { label: reference ?? "Order" },
  ];
}

function SubOrderRow({ order }: { order: ApiAdminOrder }) {
  const vendor = orderVendor(order);
  const store = orderStore(order);

  return (
    <Link
      href={`/orders/${order._id}`}
      className="block rounded-xl border border-line px-3 py-2.5 transition hover:border-pri/30 hover:bg-well/40"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[12px] font-semibold text-ink">
          {orderReference(order)}
        </p>
        <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
          {fulfillmentLabel(order.fulfillmentStatus)}
        </Badge>
      </div>
      <p className="mt-1 truncate text-[11px] text-muted">
        {[vendor?.name, store?.name, formatNaira(order.total)]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}

function ShipmentRow({ shipment }: { shipment: ApiShipment }) {
  const overdue = isShipmentOverdue(shipment);

  return (
    <Link
      href={`/logistics/${shipment._id}`}
      className="block rounded-xl border border-line px-3 py-2.5 transition hover:border-pri/30 hover:bg-well/40"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[12px] font-semibold text-ink">
          {shipment.trackingNumber}
        </p>
        <Badge tone={shipmentStatusTone(shipment.status)}>
          {shipmentStatusLabel(shipment.status)}
        </Badge>
      </div>
      <p className="mt-1 truncate text-[11px] text-muted">
        {shipmentCourierName(shipment)}
        {shipment.estimatedDeliveryAt
          ? ` · ETA ${formatAdminDate(shipment.estimatedDeliveryAt)}`
          : ""}
        {overdue ? " · overdue" : ""}
      </p>
      {shipment.providerStatus ? (
        <p className="mt-0.5 truncate text-[10px] text-muted">
          Provider: {providerStatusLabel(shipment.providerStatus)}
        </p>
      ) : null}
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== "—";

  return (
    <div className="flex flex-col gap-0.5 border-b border-line/70 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="text-[12px] break-words text-ink sm:text-right">
        {hasValue ? value : "—"}
      </dd>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Callout({
  title,
  body,
  meta,
  href,
  hrefLabel,
}: {
  title: string;
  body: string;
  meta?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
          <Icon name="alert-circle" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{body}</p>
          {meta ? (
            <p className="mt-1 text-[11px] text-muted">{meta}</p>
          ) : null}
          {href ? (
            <Button
              variant="outline"
              size="sm"
              href={href}
              className="mt-2"
            >
              {hrefLabel ?? "Open"}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
