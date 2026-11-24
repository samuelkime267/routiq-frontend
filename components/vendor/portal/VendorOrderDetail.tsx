"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";
import FileUpload from "@/components/ui/FileUpload";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { TextField, TextareaField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { ApiError, vendorPortalApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { formatNaira } from "@/lib/format";
import {
  fulfillmentLabel,
  fulfillmentTone,
  orderAddressLine,
  orderCustomer,
  orderPaymentLabel,
  orderPaymentTone,
  orderReference,
  orderStatusLabel,
  orderStatusTone,
  timelineEventPresentation,
} from "@/lib/orders";
import {
  vendorCancelOrderSchema,
  vendorShipmentSchema,
  type VendorCancelOrderValues,
  type VendorShipmentValues,
} from "@/lib/schemas/vendorOrder";
import { shipmentStatusLabel, shipmentStatusTone } from "@/lib/shipments";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import {
  formatVendorDate,
  formatVendorDay,
} from "@/lib/vendorPortal";
import type {
  ApiAdminOrder,
  VendorOrderDetailResult,
  VendorOrderDispute,
} from "@/types/api";

type OrderAction = "confirm" | "processing" | "ship" | "deliver";

interface VendorOrderDetailProps {
  orderId: string;
  /** Set by the orders list when it deep-links straight into an action. */
  initialAction?: "ship" | "deliver";
}

export default function VendorOrderDetail({
  orderId,
  initialAction,
}: VendorOrderDetailProps) {
  const { data, error, loading, reload, refreshing } =
    useResource<VendorOrderDetailResult>(
      `vendor-order:${orderId}`,
      () => vendorPortalApi.order(orderId),
      "We could not load this order.",
    );
  const { toast } = useToast();
  const [requestedAction, setRequestedAction] = useState<
    "ship" | "deliver" | null
  >(initialAction ?? null);
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<OrderAction | null>(null);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Skeleton className="h-[420px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    const notFound = error?.toLowerCase().includes("not found");

    return notFound ? (
      <ErrorState
        title="Order not found"
        description="This order does not exist for your store, or it belongs to another vendor."
        action={
          <Button href="/orders" size="sm">
            Back to orders
          </Button>
        }
      />
    ) : (
      <ErrorState
        title="Order unavailable"
        description={error ?? "We could not load this order."}
        onRetry={reload}
        action={
          <Button href="/orders" variant="outline" size="sm">
            Back to orders
          </Button>
        }
      />
    );
  }

  const {
    order,
    shipment,
    payment,
    escrow,
    dispute,
    timeline,
    fulfillmentStatus,
  } = data;
  const customer = orderCustomer(order);

  async function runAction(action: Exclude<OrderAction, "ship">) {
    setBusyAction(action);

    try {
      await vendorPortalApi.updateOrderStatus(orderId, {
        status:
          action === "confirm"
            ? "confirmed"
            : action === "deliver"
              ? "delivered"
              : "processing",
      });
      toast({
        title:
          action === "confirm"
            ? "Order confirmed"
            : action === "processing"
              ? "Order moved to processing"
              : "Order marked delivered",
        tone: "success",
      });
      reload();
    } catch (requestError) {
      toast({
        title: "Could not update the order",
        description:
          requestError instanceof ApiError
            ? requestError.message
            : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setBusyAction(null);
    }
  }

  const timelineItems: TimelineItem[] = timeline.map((event) => {
    const presentation = timelineEventPresentation(event);

    return {
      id: event.id,
      title: presentation.label,
      description: event.description ?? undefined,
      time: formatVendorDate(event.occurredAt),
      icon: presentation.icon,
      tone: presentation.tone,
    };
  });

  const canConfirm = order.status === "pending" && order.paymentStatus === "paid";
  const canProcess = order.status === "confirmed";
  const canShip = order.status === "processing";
  const canDeliver = order.status === "shipped";
  // The buyer owns cancellation until this vendor accepts the order, so
  // rejecting is only possible while it is still pending. A paid order that is
  // rejected is refunded automatically by the API.
  const canCancel = order.status === "pending";
  const cancelRefunds = order.paymentStatus === "paid";

  const shipDialogOpen = shipOpen || (requestedAction === "ship" && canShip);
  const deliverDialogOpen =
    deliverOpen || (requestedAction === "deliver" && canDeliver);

  function closeShipment() {
    setShipOpen(false);
    setRequestedAction(null);
  }

  function closeDelivered() {
    setDeliverOpen(false);
    setRequestedAction(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Order"
        title={orderReference(order)}
        description={
          order.subOrderNumber
            ? `Your sub-order ${order.subOrderNumber}${
                data.masterOrderNumber &&
                data.masterOrderNumber !== order.orderNumber
                  ? ` from checkout ${data.masterOrderNumber}`
                  : ""
              }. Other vendors' items are not shown.`
            : "The customer's items, payment and fulfilment for this order."
        }
        breadcrumbs={vendorBreadcrumbs("/orders", [
          { label: "Orders", href: "/orders" },
          { label: orderReference(order) },
        ])}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              href="/orders"
              icon={<Icon name="arrow-left" />}
            >
              Back to orders
            </Button>
            {canConfirm ? (
              <Button
                size="sm"
                loading={busyAction === "confirm"}
                onClick={() => void runAction("confirm")}
              >
                Confirm order
              </Button>
            ) : null}
            {canProcess ? (
              <Button
                size="sm"
                loading={busyAction === "processing"}
                onClick={() => void runAction("processing")}
              >
                Start processing
              </Button>
            ) : null}
            {canShip ? (
              <Button size="sm" onClick={() => setShipOpen(true)}>
                Record shipment
              </Button>
            ) : null}
            {canDeliver ? (
              <Button
                size="sm"
                loading={busyAction === "deliver"}
                onClick={() => void runAction("deliver")}
              >
                Mark delivered
              </Button>
            ) : null}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={orderStatusTone(order.status)}>
              {orderStatusLabel(order.status)}
            </Badge>
            <Badge tone={orderPaymentTone(order.paymentStatus)}>
              {orderPaymentLabel(order.paymentStatus)}
            </Badge>
            <Badge tone={fulfillmentTone(fulfillmentStatus)}>
              {fulfillmentLabel(fulfillmentStatus)}
            </Badge>
            <Badge tone="neutral">
              Placed {formatVendorDay(order.createdAt)}
            </Badge>
            {refreshing ? (
              <span className="size-3 animate-spin rounded-full border-2 border-pri/30 border-t-pri" />
            ) : null}
          </div>
        }
      />

      {order.status === "pending" && order.paymentStatus === "paid" ? (
        <Alert tone="info" title="This paid order needs your confirmation">
          Confirm it so the customer knows you have accepted the order, then move
          it to processing when you start preparing it. If you cannot fulfil it,
          reject it and the customer is refunded automatically.
        </Alert>
      ) : null}

      {order.status === "processing" ? (
        <Alert tone="info" title="Record shipment when it leaves your store">
          Add the courier and tracking details so the customer and Routiq can
          follow the delivery.
        </Alert>
      ) : null}

      {dispute?.isOpen ? (
        <Alert
          tone="warning"
          title={`Dispute ${dispute.reference} is open`}
        >
          {dispute.subject}. Earnings for this order stay on hold until Routiq
          resolves the case. Upload the waybill or delivery proof so support can
          review it.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                  Items
                </h2>
                <p className="mt-1 text-[11px] text-muted">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}{" "}
                  in this sub-order.
                </p>
              </div>
              <Badge tone="neutral">{formatNaira(order.total)}</Badge>
            </div>

            <ul className="divide-y divide-line">
              {order.items.map((item, index) => (
                <li
                  key={`${item.product}-${index}`}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-well text-pri">
                    <Icon name="package" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {item.quantity} × {formatNaira(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-[12px] font-semibold text-ink">
                    {formatNaira(item.total)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-[12px]">
              <div className="flex justify-between gap-4 text-muted">
                <dt>Subtotal</dt>
                <dd>{formatNaira(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>Delivery</dt>
                <dd>{formatNaira(order.shippingFee)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between gap-4 text-muted">
                  <dt>Discount</dt>
                  <dd>−{formatNaira(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-line pt-2 text-ink">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold">{formatNaira(order.total)}</dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Customer
              </h2>
              <div className="mt-3 space-y-1 text-[12px]">
                <p className="font-semibold text-ink">
                  {customer?.name ?? "Customer"}
                </p>
                {customer?.phone ? (
                  <p className="text-muted">{customer.phone}</p>
                ) : null}
                {customer?.email ? (
                  <p className="break-all text-muted">{customer.email}</p>
                ) : null}
              </div>

              <h3 className="mt-4 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Delivery address
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                {orderAddressLine(order) || "No delivery address recorded."}
              </p>
              {order.expectedDeliveryAt ? (
                <p className="mt-2 text-[11px] text-muted">
                  Expected {formatVendorDay(order.expectedDeliveryAt)}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Payment
              </h2>
              {payment ? (
                <dl className="mt-3 space-y-1.5 text-[12px]">
                  <Row label="Reference" value={payment.reference} />
                  <Row label="Amount" value={formatNaira(payment.amount)} />
                  <Row
                    label="Your share"
                    value={formatNaira(payment.vendorAmount)}
                  />
                  <Row
                    label="Platform fee"
                    value={formatNaira(payment.platformFee)}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Status</dt>
                    <dd>
                      <Badge tone={orderPaymentTone(order.paymentStatus)}>
                        {payment.status === "successful"
                          ? "Paid"
                          : payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                      </Badge>
                    </dd>
                  </div>
                  {payment.paidAt ? (
                    <Row
                      label="Paid"
                      value={formatVendorDate(payment.paidAt)}
                    />
                  ) : null}
                </dl>
              ) : (
                <p className="mt-3 text-[12px] text-muted">
                  No payment record yet. This order has not been paid.
                </p>
              )}

              {escrow ? (
                <div className="mt-4 rounded-xl bg-soft/60 px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                    Escrow
                  </p>
                  <p className="mt-1 text-[12px] text-ink">
                    {formatNaira(escrow.amountHeld)} held ·{" "}
                    {formatNaira(escrow.amountReleased)} released
                  </p>
                  {escrow.releaseDueAt ? (
                    <p className="mt-0.5 text-[10px] text-muted">
                      Release due {formatVendorDay(escrow.releaseDueAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Shipment
              </h2>
              {shipment ? (
                <Badge tone={shipmentStatusTone(shipment.status)}>
                  {shipmentStatusLabel(shipment.status)}
                </Badge>
              ) : null}
            </div>

            {shipment ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-line px-3 py-2.5">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Tracking number
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-ink">
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line px-3 py-2.5">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Courier
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-ink">
                      {shipment.courier?.name ?? "—"}
                    </p>
                  </div>
                </div>

                {shipment.trackingUrl ? (
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
                  >
                    Open tracking page
                    <Icon name="arrow-up-right" className="size-3" />
                  </a>
                ) : null}

                {shipment.estimatedDeliveryAt ? (
                  <p className="text-[11px] text-muted">
                    Estimated delivery{" "}
                    {formatVendorDay(shipment.estimatedDeliveryAt)}
                  </p>
                ) : null}

                {shipment.events && shipment.events.length > 0 ? (
                  <ul className="space-y-2 border-t border-line pt-3">
                    {[...shipment.events]
                      .slice(-5)
                      .reverse()
                      .map((event, index) => (
                        <li
                          key={`${event.status}-${index}`}
                          className="flex items-start gap-2 text-[11px]"
                        >
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-pri" />
                          <div>
                            <p className="font-medium text-ink">
                              {event.message ??
                                shipmentStatusLabel(
                                  event.status as never,
                                )}
                            </p>
                            <p className="text-[10px] text-muted">
                              {formatVendorDate(event.occurredAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-line bg-soft/40 px-4 py-5 text-center">
                <p className="text-[12px] font-semibold text-ink">
                  No shipment recorded
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {canShip
                    ? "Add the courier and tracking details once the order leaves your store."
                    : "Shipment details appear here after the order is ready."}
                </p>
                {canShip ? (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setShipOpen(true)}
                  >
                    Record shipment
                  </Button>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Timeline
            </h2>
            <div className="mt-4">
              <Timeline
                items={timelineItems}
                emptyLabel="No order events recorded yet."
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Next step
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              Only the actions your order status allows are shown.
            </p>

            <div className="mt-3 space-y-2">
              {canConfirm ? (
                <Button
                  fullWidth
                  size="sm"
                  loading={busyAction === "confirm"}
                  onClick={() => void runAction("confirm")}
                >
                  Confirm this order
                </Button>
              ) : null}
              {canProcess ? (
                <Button
                  fullWidth
                  size="sm"
                  loading={busyAction === "processing"}
                  onClick={() => void runAction("processing")}
                >
                  Start processing
                </Button>
              ) : null}
              {canShip ? (
                <Button fullWidth size="sm" onClick={() => setShipOpen(true)}>
                  Record shipment
                </Button>
              ) : null}
              {canDeliver ? (
                <Button
                  fullWidth
                  size="sm"
                  loading={busyAction === "deliver"}
                  onClick={() => void runAction("deliver")}
                >
                  Mark as delivered
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  fullWidth
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                >
                  {cancelRefunds ? "Reject order" : "Cancel order"}
                </Button>
              ) : null}

              {!canConfirm &&
              !canProcess &&
              !canShip &&
              !canDeliver &&
              !canCancel ? (
                <p className="rounded-xl bg-soft/60 px-3 py-3 text-[11px] leading-relaxed text-muted">
                  Nothing needs your attention on this order right now.
                </p>
              ) : null}
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                Reference
              </p>
              <p className="mt-1 break-all text-[11px] text-ink">
                {order.orderNumber}
              </p>
              {order.masterOrderNumber &&
              order.masterOrderNumber !== order.orderNumber ? (
                <>
                  <p className="mt-2 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                    Master order
                  </p>
                  <p className="mt-1 text-[11px] text-ink">
                    {order.masterOrderNumber}
                  </p>
                </>
              ) : null}
            </div>
          </section>

          {dispute ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                  Dispute
                </h2>
                <Badge tone={dispute.isOpen ? "amber" : "green"}>
                  {dispute.isOpen ? "Open" : "Resolved"}
                </Badge>
              </div>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                {dispute.reference}
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-ink">
                {dispute.subject}
              </p>
              {dispute.isOpen ? (
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  The customer&apos;s money stays in escrow until support
                  resolves this case.
                </p>
              ) : null}

              <p className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                Evidence
              </p>
              {dispute.evidence.length > 0 ? (
                <ul className="mt-1.5 space-y-1.5">
                  {dispute.evidence.map((item) => (
                    <li key={item._id} className="text-[11px]">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-pri hover:underline"
                        >
                          <Icon name="file-text" className="size-3" />
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-ink">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[11px] text-muted">
                  No evidence uploaded yet.
                </p>
              )}

              {dispute.isOpen ? (
                <Button
                  fullWidth
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setEvidenceOpen(true)}
                >
                  Upload evidence
                </Button>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl border border-pri/15 bg-well/60 p-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-pri">
              Need help?
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Disputes and refunds after delivery are handled by Routiq support
              so money movement stays auditable. Rejecting a paid order before
              you accept it refunds the customer automatically.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
            >
              Store contact details
              <Icon name="chevron-right" className="size-3" />
            </Link>
          </section>
        </div>
      </div>

      {shipDialogOpen ? (
        <ShipmentDialog
          order={order}
          onClose={closeShipment}
          onSaved={() => {
            closeShipment();
            reload();
          }}
        />
      ) : null}

      {cancelOpen ? (
        <CancelOrderDialog
          order={order}
          refunds={cancelRefunds}
          onClose={() => setCancelOpen(false)}
          onSaved={() => {
            setCancelOpen(false);
            reload();
          }}
        />
      ) : null}

      {evidenceOpen && dispute ? (
        <EvidenceDialog
          dispute={dispute}
          onClose={() => setEvidenceOpen(false)}
          onSaved={() => {
            setEvidenceOpen(false);
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deliverDialogOpen}
        onClose={closeDelivered}
        title="Mark this order delivered?"
        description="Confirm only after the customer has received the order. Delivery also closes the shipment, so it cannot be reversed from your side."
        confirmLabel="Mark delivered"
        tone="primary"
        onConfirm={async () => {
          await vendorPortalApi.updateOrderStatus(orderId, {
            status: "delivered",
          });
          toast({ title: "Order marked delivered", tone: "success" });
          closeDelivered();
          reload();
        }}
      >
        <p className="rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-[12px] text-muted">
          {orderReference(order)} · {formatNaira(order.total)}
        </p>
      </ConfirmDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all text-right text-ink">{value}</dd>
    </div>
  );
}

function ShipmentDialog({
  order,
  onClose,
  onSaved,
}: {
  order: ApiAdminOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorShipmentValues>({
    resolver: zodResolver(vendorShipmentSchema),
    defaultValues: {
      courierName: "",
      trackingNumber: "",
      trackingUrl: "",
      estimatedDeliveryAt: "",
      note: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await vendorPortalApi.shipOrder(order._id, {
        courierName: values.courierName.trim(),
        trackingNumber: values.trackingNumber.trim(),
        trackingUrl: values.trackingUrl.trim() || undefined,
        estimatedDeliveryAt: values.estimatedDeliveryAt || undefined,
        note: values.note.trim() || undefined,
      });
      toast({
        title: "Shipment recorded",
        description: "The order is now marked as shipped.",
        tone: "success",
      });
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, [
          "courierName",
          "trackingNumber",
          "trackingUrl",
          "estimatedDeliveryAt",
          "note",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The shipment could not be recorded.",
        );
      }
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Record shipment"
      description="Adding shipment details moves this order to shipped and tells the customer it is on the way."
      size="md"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="vendor-shipment-form"
            size="sm"
            loading={isSubmitting}
          >
            Save shipment
          </Button>
        </>
      }
    >
      <form
        id="vendor-shipment-form"
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <TextField
          label="Courier"
          placeholder="e.g. GIG Logistics"
          register={register("courierName")}
          error={errors.courierName?.message}
        />
        <TextField
          label="Tracking number"
          placeholder="Courier tracking reference"
          register={register("trackingNumber")}
          error={errors.trackingNumber?.message}
        />
        <TextField
          label="Tracking URL"
          optional
          type="url"
          placeholder="https://…"
          register={register("trackingUrl")}
          error={errors.trackingUrl?.message}
        />
        <TextField
          label="Estimated delivery"
          optional
          type="date"
          register={register("estimatedDeliveryAt")}
          error={errors.estimatedDeliveryAt?.message}
        />
        <TextareaField
          label="Note for the customer"
          optional
          rows={3}
          placeholder="Anything the customer should know about this delivery."
          register={register("note")}
          error={errors.note?.message}
        />

        {formError ? (
          <p role="alert" className="text-[12px] text-danger">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function CancelOrderDialog({
  order,
  refunds,
  onClose,
  onSaved,
}: {
  order: ApiAdminOrder;
  refunds: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorCancelOrderValues>({
    resolver: zodResolver(vendorCancelOrderSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await vendorPortalApi.updateOrderStatus(order._id, {
        status: "cancelled",
        reason: values.reason.trim(),
      });
      toast({
        title: refunds ? "Order rejected" : "Order cancelled",
        description: refunds
          ? "The customer's payment is being refunded automatically."
          : undefined,
        tone: "success",
      });
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "The order could not be cancelled.",
      );
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={refunds ? "Reject this order" : "Cancel this order"}
      description={
        refunds
          ? "The customer has paid, but you can still reject the order before accepting it. Their payment is refunded in full automatically."
          : "The order has not been paid. Cancelling it tells the customer you cannot fulfil it."
      }
      size="sm"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep order
          </Button>
          <Button
            type="submit"
            form="vendor-cancel-form"
            size="sm"
            variant="danger"
            loading={isSubmitting}
          >
            {refunds ? "Reject and refund" : "Cancel order"}
          </Button>
        </>
      }
    >
      <form id="vendor-cancel-form" onSubmit={onSubmit} className="space-y-3">
        <TextareaField
          label="Reason"
          rows={3}
          placeholder={
            refunds
              ? "Why can't you fulfil this order?"
              : "Why are you cancelling this order?"
          }
          register={register("reason")}
          error={errors.reason?.message}
        />
        {formError ? (
          <p role="alert" className="text-[12px] text-danger">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function EvidenceDialog({
  dispute,
  onClose,
  onSaved,
}: {
  dispute: VendorOrderDispute;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);

    if (label.trim().length < 3) {
      setError("Give the evidence a short label.");
      return;
    }

    if (!url) {
      setError("Upload the waybill or proof first.");
      return;
    }

    setSaving(true);

    try {
      await vendorPortalApi.addDisputeEvidence(dispute._id, {
        label: label.trim(),
        url,
        note: note.trim() || undefined,
      });
      toast({
        title: "Evidence added",
        description: "Routiq support can now review this file.",
        tone: "success",
      });
      onSaved();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "The evidence could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Upload dispute evidence"
      description={`Attach the waybill or delivery proof for ${dispute.reference}. Support uses it to decide where the held money goes.`}
      size="sm"
      dismissible={!saving}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={saving}>
            Add evidence
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FileUpload
          id="dispute-evidence-file"
          label="Waybill or proof"
          description="Photo or PDF of the waybill, receipt or delivery confirmation."
          purpose="dispute_evidence"
          value={url}
          onUploaded={(file) => {
            setUrl(file.url);
            if (!label.trim()) setLabel(file.originalName);
          }}
        />

        <label
          htmlFor="dispute-evidence-label"
          className="block text-[12px] font-semibold text-ink"
        >
          Label
        </label>
        <input
          id="dispute-evidence-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={160}
          placeholder="e.g. GIG waybill 00231"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
        />

        <label
          htmlFor="dispute-evidence-note"
          className="block text-[12px] font-semibold text-ink"
        >
          Note
          <span className="ml-1 font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="dispute-evidence-note"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          placeholder="Anything support should know about this file."
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
        />

        {error ? (
          <p role="alert" className="text-[12px] text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
