"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/marketplace/OrderStatusBadge";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useMarketplaceAccount } from "@/hooks/useMarketplaceAccount";
import { ApiError, customerOrderApi } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { authLoginUrl } from "@/lib/urls";
import type { MarketplaceOrderDetail } from "@/types/api";

function paymentTone(status: string) {
  if (status === "successful" || status === "paid") return "Paid";
  if (status === "failed") return "Failed";

  return "Pending";
}

export default function OrderDetailPage({
  reference,
}: {
  reference: string;
}) {
  const { hydrated, user } = useMarketplaceAccount();
  const [order, setOrder] = useState<MarketplaceOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await customerOrderApi.get(reference);

        if (active) setOrder(result.order);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "We could not load this order. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user, reference, version]);

  if (!hydrated) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-3 w-80 max-w-full" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
          <Skeleton className="h-80 rounded-[20px]" />
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      </MarketplaceContainer>
    );
  }

  if (!user) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Orders", href: "/orders" },
            { label: "Order" },
          ]}
          eyebrow="Order details"
          title="Sign in to view this order"
          description="Order details are private to the customer who placed them."
        />
        <div className="mt-6">
          <Button
            href={authLoginUrl(`/orders/${reference}`)}
          >
            Sign in
          </Button>
        </div>
      </MarketplaceContainer>
    );
  }

  if (loading) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-3 w-72 max-w-full" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-[20px]" />
            <Skeleton className="h-56 rounded-[20px]" />
          </div>
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      </MarketplaceContainer>
    );
  }

  if (error || !order) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Orders", href: "/orders" },
            { label: "Order" },
          ]}
          eyebrow="Order details"
          title="We could not load this order"
        />
        <div className="mt-6 max-w-xl">
          <Alert tone="error" title="Please check the reference">
            {error ?? "This order could not be found on your account."}
          </Alert>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setVersion((current) => current + 1)}>
              Retry
            </Button>
            <Button href="/orders" variant="outline">
              All orders
            </Button>
            <Button href="/help" variant="ghost">
              Get help
            </Button>
          </div>
        </div>
      </MarketplaceContainer>
    );
  }

  const pendingPayment = order.orders.some(
    (row) =>
      row.paymentStatus !== "paid" &&
      row.status !== "cancelled" &&
      row.paymentStatus !== "refunded",
  );
  const address = order.orders[0]?.shippingAddress ?? null;
  const paidPayments = order.payments.filter(
    (payment) => payment.status === "successful",
  );

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Orders", href: "/orders" },
          { label: order.masterOrderNumber },
        ]}
        eyebrow="Order details"
        title={`Order ${order.masterOrderNumber}`}
        description="Track payment, delivery and each store's fulfilment in one place."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.orders[0]?.status ?? "pending"} />
            <PaymentStatusBadge
              status={order.orders[0]?.paymentStatus ?? "pending"}
            />
            <Badge tone="neutral">
              {order.summary.orderCount}{" "}
              {order.summary.orderCount === 1 ? "store" : "stores"}
            </Badge>
            <span className="text-[10.5px] text-muted">
              Placed {formatDate(order.orders[0]?.placedAt)}
            </span>
          </div>
        }
        actions={
          <Button href="/orders" variant="outline" size="sm">
            All orders
          </Button>
        }
      />

      {pendingPayment ? (
        <Alert
          tone="info"
          title="Payment not confirmed yet"
          className="mt-5"
        >
          This order is saved but the payment provider has not confirmed a
          payment. You can finish payment without rebuilding your cart.
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              href={`/checkout/confirmation/${encodeURIComponent(
                order.masterOrderNumber,
              )}`}
            >
              Review payment
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          {order.orders.map((subOrder) => (
            <section
              key={subOrder._id}
              className="overflow-hidden rounded-[20px] border border-line bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-soft text-pri">
                    <Icon name="store" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {subOrder.store?.name ?? "Store order"}
                    </p>
                    <p className="text-[10.5px] text-muted">
                      {subOrder.orderNumber}
                      {subOrder.subOrderNumber
                        ? ` · ${subOrder.subOrderNumber}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={subOrder.status} />
                  <PaymentStatusBadge status={subOrder.paymentStatus} />
                </div>
              </div>

              <ul className="divide-y divide-line/70 px-4 sm:px-5">
                {subOrder.items.map((item) => (
                  <li
                    key={`${subOrder._id}-${item.product}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-ink">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        {item.quantity} × {formatNaira(item.unitPrice)}
                      </p>
                    </div>
                    <p className="shrink-0 text-[12px] font-semibold text-ink">
                      {formatNaira(item.total)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="space-y-1.5 border-t border-line bg-soft/30 px-4 py-3 text-[11px] sm:px-5">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium text-ink">
                    {formatNaira(subOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery</span>
                  <span className="font-medium text-ink">
                    {subOrder.shippingFee === 0
                      ? "Free"
                      : formatNaira(subOrder.shippingFee)}
                  </span>
                </div>
                {subOrder.discount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted">Discount</span>
                    <span className="font-medium text-success">
                      −{formatNaira(subOrder.discount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-line pt-1.5">
                  <span className="font-semibold text-ink">Store total</span>
                  <span className="font-semibold text-ink">
                    {formatNaira(subOrder.total)}
                  </span>
                </div>
                {subOrder.expectedDeliveryAt ? (
                  <p className="flex items-center gap-1.5 pt-1 text-[10px] text-muted">
                    <Icon name="truck" className="size-3 text-pri" />
                    Estimated delivery {formatDate(subOrder.expectedDeliveryAt)}
                  </p>
                ) : null}
              </div>

              {subOrder.timeline.length > 0 ? (
                <div className="border-t border-line px-4 py-3 sm:px-5">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                    Latest updates
                  </p>
                  <ol className="mt-2 space-y-2">
                    {subOrder.timeline
                      .slice()
                      .reverse()
                      .slice(0, 4)
                      .map((event, index) => (
                        <li
                          key={`${event.type}-${event.occurredAt}-${index}`}
                          className="flex gap-2 text-[11px]"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pri" />
                          <div>
                            <p className="text-ink">
                              {event.description ?? event.type}
                            </p>
                            <p className="text-[10px] text-muted">
                              {formatDate(event.occurredAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ol>
                </div>
              ) : null}
            </section>
          ))}

          {order.shipments.length > 0 ? (
            <section className="rounded-[20px] border border-line bg-white">
              <div className="border-b border-line px-4 py-3.5 sm:px-5">
                <h2 className="text-[13px] font-semibold text-ink">
                  Deliveries
                </h2>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  Tracking comes from the delivery provider.
                </p>
              </div>
              <ul className="divide-y divide-line/70">
                {order.shipments.map((shipment) => (
                  <li key={shipment._id} className="px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[12px] font-semibold text-ink">
                          {shipment.trackingNumber || "Awaiting tracking"}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          {shipment.provider ?? "Delivery partner"} ·{" "}
                          {shipment.status.replace(/_/g, " ")}
                        </p>
                      </div>
                      {shipment.trackingUrl ? (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
                        >
                          Track
                          <Icon name="arrow-up-right" className="size-3" />
                        </a>
                      ) : null}
                    </div>

                    {shipment.failureReason ? (
                      <p className="mt-2 text-[10.5px] text-danger">
                        {shipment.failureReason}
                      </p>
                    ) : null}

                    {shipment.events.length > 0 ? (
                      <ol className="mt-2 space-y-1.5">
                        {shipment.events.slice(0, 4).map((event, index) => (
                          <li
                            key={`${shipment._id}-event-${index}`}
                            className="flex gap-2 text-[10.5px] text-muted"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line" />
                            <span>
                              {event.message ?? event.status ?? "Update"}
                              {event.occurredAt
                                ? ` · ${formatDate(event.occurredAt)}`
                                : ""}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="space-y-4 lg:sticky lg:top-[100px]">
          <section className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
            <h2 className="text-[12.5px] font-semibold text-ink">
              Order summary
            </h2>
            <p className="mt-1 text-[10.5px] text-muted">
              {order.summary.itemCount}{" "}
              {order.summary.itemCount === 1 ? "item" : "items"} ·{" "}
              {order.summary.orderCount}{" "}
              {order.summary.orderCount === 1 ? "store" : "stores"}
            </p>

            <div className="mt-3 space-y-1.5 text-[11.5px]">
              <div className="flex justify-between">
                <span className="text-muted">Items</span>
                <span className="font-medium text-ink">
                  {formatNaira(order.summary.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className="font-medium text-ink">
                  {order.summary.deliveryFee === 0
                    ? "Free"
                    : formatNaira(order.summary.deliveryFee)}
                </span>
              </div>
              {order.summary.discount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted">Discount</span>
                  <span className="font-medium text-success">
                    −{formatNaira(order.summary.discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <span className="text-[12px] font-semibold text-ink">Total</span>
                <span className="text-[17px] font-bold tracking-tight text-ink">
                  {formatNaira(order.summary.total)}
                </span>
              </div>
            </div>
          </section>

          {address ? (
            <section className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-soft text-pri">
                  <Icon name="map-pin" className="size-4" />
                </span>
                <h2 className="text-[12.5px] font-semibold text-ink">
                  Delivery address
                </h2>
              </div>
              <div className="mt-3 rounded-xl border border-line bg-soft/40 px-3 py-2.5">
                <p className="text-[12px] font-semibold text-ink">
                  {address.recipientName}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {address.street}, {address.city}, {address.lga},{" "}
                  {address.state}
                </p>
                <p className="mt-1 text-[11px] text-muted">{address.phone}</p>
              </div>
            </section>
          ) : null}

          <section className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
            <h2 className="text-[12.5px] font-semibold text-ink">Payments</h2>
            {order.payments.length === 0 ? (
              <p className="mt-2 text-[11px] text-muted">
                No payment has been recorded for this order yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {order.payments.map((payment) => (
                  <li
                    key={payment._id}
                    className="rounded-xl border border-line px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[10.5px] text-ink">
                          {payment.reference}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {payment.provider ?? "Provider"}
                          {payment.channel ? ` · ${payment.channel}` : ""}
                          {payment.paidAt
                            ? ` · ${formatDate(payment.paidAt)}`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11.5px] font-semibold text-ink">
                        {formatNaira(payment.amount)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <Badge
                        tone={
                          payment.status === "successful"
                            ? "green"
                            : payment.status === "failed"
                              ? "red"
                              : "amber"
                        }
                      >
                        {paymentTone(payment.status)}
                      </Badge>
                      {payment.failureReason ? (
                        <p className="min-w-0 text-right text-[10px] text-danger">
                          {payment.failureReason}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {paidPayments.length > 0 ? (
              <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
                <Icon name="shield" className="mt-0.5 size-3 shrink-0 text-pri" />
                Payment was confirmed by the provider before this order was
                marked paid.
              </p>
            ) : null}
          </section>

          <div className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-[12px] font-semibold text-ink">Need help?</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Contact support with {order.masterOrderNumber} and we can look up
              every store sub-order at once.
            </p>
            <Link
              href="/help"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
            >
              Visit help centre
              <Icon name="arrow-right" className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </MarketplaceContainer>
  );
}
