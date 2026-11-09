"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import ShipmentCancelDialog from "@/components/admin/logistics/ShipmentCancelDialog";
import { useResource } from "@/hooks/useResource";
import { ApiError, shipmentAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
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
  orderStore,
  orderVendor,
} from "@/lib/orders";
import {
  SHIPMENT_EVENT_SOURCE_LABELS,
  isShipmentOverdue,
  providerStatusLabel,
  shipmentActions,
  shipmentCourierName,
  shipmentEventIcon,
  shipmentEventTone,
  shipmentStatusLabel,
  shipmentStatusTone,
} from "@/lib/shipments";
import type {
  AdminShipmentDetail as AdminShipmentDetailData,
  AdminShipmentTrackingResult,
  ApiShipment,
} from "@/types/api";

interface ShipmentDetailProps {
  shipmentId: string;
}

const TRACKING_PAGE_SIZE = 20;

export default function ShipmentDetail({ shipmentId }: ShipmentDetailProps) {
  const { permissions } = useAdminSession();
  const { toast } = useToast();
  const [trackingPage, setTrackingPage] = useState(1);
  const [busy, setBusy] = useState<"refresh" | "retry" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data, error, loading, reload } =
    useResource<AdminShipmentDetailData>(
      `admin-shipment-${shipmentId}`,
      () => shipmentAdminApi.get(shipmentId),
    );

  const tracking = useResource<AdminShipmentTrackingResult>(
    `admin-shipment-tracking-${shipmentId}-${trackingPage}`,
    () =>
      shipmentAdminApi.tracking(shipmentId, {
        page: trackingPage,
        limit: TRACKING_PAGE_SIZE,
      }),
  );

  const canManage = permissions.includes("shipments.manage");

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Shipment detail"
          eyebrow="Logistics"
          breadcrumbs={breadcrumbsForShipment()}
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-72 animate-pulse rounded-2xl border border-line bg-white" />
          <div className="h-72 animate-pulse rounded-2xl border border-line bg-white" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Shipment detail"
          eyebrow="Logistics"
          breadcrumbs={breadcrumbsForShipment()}
        />
        <ErrorState
          title="Could not load this shipment"
          description={error ?? "This shipment may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/logistics">
              Back to logistics
            </Button>
          }
        />
      </div>
    );
  }

  const { shipment, order, siblingShipments, provider } = data;
  const availability = shipmentActions(shipment);
  const overdue = isShipmentOverdue(shipment);
  const customer = order ? orderCustomer(order) : null;
  const vendor = order ? orderVendor(order) : null;
  const store = order ? orderStore(order) : null;

  async function runSync(action: "refresh" | "retry") {
    setBusy(action);

    try {
      const result = await shipmentAdminApi[action](shipmentId);

      toast({
        title:
          action === "refresh"
            ? "Shipment synchronised"
            : "Shipment retry completed",
        description: `${result.shipment.trackingNumber} is now ${shipmentStatusLabel(
          result.shipment.status,
        ).toLowerCase()}.`,
        tone: "success",
      });
      reload();
      tracking.reload();
    } catch (actionError) {
      toast({
        title:
          actionError instanceof ApiError
            ? actionError.message
            : "The provider operation failed.",
        description: "The provider error remains visible below.",
        tone: "error",
      });
      reload();
    } finally {
      setBusy(null);
    }
  }

  const events = tracking.data?.events ?? [];
  const trackingItems: TimelineItem[] = events.map((event) => ({
    id: `${event.key}-${event.occurredAt}`,
    title: providerStatusLabel(event.status ?? "Tracking update"),
    description: [event.message, event.location]
      .filter(Boolean)
      .join(" · ") || undefined,
    time: `${formatAdminDate(event.occurredAt)} · ${
      SHIPMENT_EVENT_SOURCE_LABELS[event.source] ?? event.source
    }`,
    icon: shipmentEventIcon(event),
    tone: shipmentEventTone(event),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={shipment.trackingNumber}
        eyebrow="Shipment"
        description={
          order
            ? `${orderReference(order)} · ${shipment.provider}`
            : shipment.provider
        }
        breadcrumbs={breadcrumbsForShipment(shipment.trackingNumber)}
        actions={
          <>
            <Button variant="outline" size="sm" href="/logistics">
              Back to logistics
            </Button>
            {canManage && availability.refresh ? (
              <Button
                variant="outline"
                size="sm"
                icon={<Icon name="refresh" />}
                loading={busy === "refresh"}
                onClick={() => void runSync("refresh")}
              >
                Refresh
              </Button>
            ) : null}
            {canManage && availability.retry ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Icon name="refresh" />}
                loading={busy === "retry"}
                onClick={() => void runSync("retry")}
              >
                Retry sync
              </Button>
            ) : null}
            {canManage && availability.cancel ? (
              <Button
                variant="danger"
                size="sm"
                icon={<Icon name="x" />}
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
            ) : null}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={shipmentStatusTone(shipment.status)}>
              {shipmentStatusLabel(shipment.status)}
            </Badge>
            <Badge tone="neutral">
              Provider: {providerStatusLabel(provider.status)}
            </Badge>
            {overdue ? <Badge tone="amber">Past ETA</Badge> : null}
            {shipment.providerError ? (
              <Badge tone="red">Provider error</Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {shipment.status === "failed" || shipment.failureReason ? (
            <Callout
              title="Delivery failed"
              body={
                shipment.failureReason ??
                "The courier could not complete this delivery."
              }
              meta={
                shipment.lastEventAt
                  ? `Last event ${formatAdminDate(shipment.lastEventAt)}`
                  : undefined
              }
            />
          ) : null}

          {shipment.providerError ? (
            <Callout
              title="Provider synchronisation error"
              body={shipment.providerError}
              meta={
                shipment.lastSyncAttemptAt
                  ? `Last attempt ${formatAdminDate(shipment.lastSyncAttemptAt)}`
                  : undefined
              }
            />
          ) : null}

          <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-semibold text-ink">
                  Tracking history
                </h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  Events reported by Shipbubble, newest first. Duplicate
                  provider deliveries are ignored.
                </p>
              </div>
              <Badge tone="neutral">
                {tracking.data?.pagination.total ?? 0} events
              </Badge>
            </div>

            <div className="mt-3">
              {tracking.error ? (
                <ErrorState
                  title="Could not load tracking"
                  description={tracking.error}
                  onRetry={tracking.reload}
                />
              ) : (
                <Timeline
                  items={trackingItems}
                  emptyLabel={
                    tracking.loading
                      ? "Loading tracking history…"
                      : "Shipbubble has not reported any tracking events yet."
                  }
                />
              )}
            </div>

            {tracking.data && tracking.data.pagination.total > TRACKING_PAGE_SIZE ? (
              <Pagination
                className="mt-3"
                meta={tracking.data.pagination}
                pageSize={TRACKING_PAGE_SIZE}
                onPageChange={setTrackingPage}
                itemLabel="events"
                disabled={tracking.loading || tracking.refreshing}
              />
            ) : null}
          </section>

          <Card
            title="Shipment record"
            description="Internal state is authoritative; the provider status is kept alongside it."
          >
            <dl>
              <InfoRow label="Tracking number" value={shipment.trackingNumber} />
              <InfoRow
                label="Internal status"
                value={
                  <Badge tone={shipmentStatusTone(shipment.status)}>
                    {shipmentStatusLabel(shipment.status)}
                  </Badge>
                }
              />
              <InfoRow
                label="Provider"
                value={`${provider.name}${
                  provider.orderId ? ` · ${provider.orderId}` : ""
                }`}
              />
              <InfoRow
                label="Provider status"
                value={providerStatusLabel(provider.status)}
              />
              <InfoRow
                label="Estimated delivery"
                value={
                  shipment.estimatedDeliveryAt
                    ? `${formatAdminDate(shipment.estimatedDeliveryAt)}${overdue ? " (overdue)" : ""}`
                    : null
                }
              />
              <InfoRow
                label="Delivered"
                value={
                  shipment.deliveredAt
                    ? formatAdminDate(shipment.deliveredAt)
                    : null
                }
              />
              <InfoRow
                label="Cancellation reason"
                value={shipment.cancelReason ?? null}
              />
              <InfoRow
                label="Created"
                value={formatAdminDate(shipment.createdAt)}
              />
              <InfoRow
                label="Last updated"
                value={formatAdminDate(shipment.updatedAt)}
              />
            </dl>
          </Card>

          <Card
            title="Provider diagnostics"
            description="Synchronisation metadata for troubleshooting. Provider credentials are never exposed."
          >
            <dl>
              <InfoRow label="Sync attempts" value={provider.syncAttempts} />
              <InfoRow
                label="Last synced"
                value={
                  provider.lastSyncedAt
                    ? formatAdminDate(provider.lastSyncedAt)
                    : null
                }
              />
              <InfoRow
                label="Last sync attempt"
                value={
                  provider.lastSyncAttemptAt
                    ? formatAdminDate(provider.lastSyncAttemptAt)
                    : null
                }
              />
              <InfoRow
                label="Last webhook"
                value={
                  shipment.lastWebhookAt
                    ? formatAdminDate(shipment.lastWebhookAt)
                    : null
                }
              />
              <InfoRow label="Last error" value={shipment.providerError ?? null} />
            </dl>

            <details className="mt-3 rounded-xl border border-line bg-well/40 px-3.5 py-3">
              <summary className="cursor-pointer text-[11px] font-semibold text-ink">
                Latest provider response
              </summary>
              <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-white p-3 text-[10px] leading-relaxed text-ink">
                {provider.response
                  ? JSON.stringify(provider.response, null, 2)
                  : "No provider response has been stored."}
              </pre>
            </details>
          </Card>
        </div>

        <aside className="space-y-4">
          {order ? (
            <section className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-semibold text-ink">Order</h2>
                <Link
                  href={`/orders/${order._id}`}
                  className="text-[11px] font-semibold text-pri hover:underline"
                >
                  Open order
                </Link>
              </div>
              <div className="mt-2.5 space-y-1">
                <p className="truncate text-[12px] font-semibold text-ink">
                  {orderReference(order)}
                </p>
                <p className="truncate text-[11px] text-muted">
                  Master {order.masterOrderNumber || order.orderNumber}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {formatNaira(order.total)}
                </p>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge tone={orderPaymentTone(order.paymentStatus)}>
                  {orderPaymentLabel(order.paymentStatus)}
                </Badge>
                <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
                  {fulfillmentLabel(order.fulfillmentStatus)}
                </Badge>
                <Badge tone="neutral">{orderStatusLabel(order.status)}</Badge>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">
              Customer & vendor
            </h2>
            <div className="mt-2.5 space-y-1">
              <p className="truncate text-[12px] font-semibold text-ink">
                {customer?.name ?? "Customer not loaded"}
              </p>
              <p className="truncate text-[11px] text-muted">
                {customer?.email ?? customer?.phone ?? "—"}
              </p>
              <p className="truncate text-[11px] text-muted">
                {[vendor?.name, store?.name].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>

            {order ? (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  Delivery address
                </p>
                <p className="mt-1 text-[12px] leading-relaxed whitespace-pre-line text-ink">
                  {order.shippingAddress
                    ? [
                        order.shippingAddress.recipientName,
                        order.shippingAddress.street,
                        [
                          order.shippingAddress.lga,
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                        ]
                          .filter(Boolean)
                          .join(", "),
                      ]
                        .filter(Boolean)
                        .join("\n")
                    : orderAddressLine(order) || "No address captured."}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Courier</h2>
            <div className="mt-2.5 space-y-1">
              <p className="truncate text-[12px] font-semibold text-ink">
                {shipmentCourierName(shipment)}
              </p>
              {shipment.courier?.trackingCode ? (
                <p className="truncate text-[11px] text-muted">
                  Code {shipment.courier.trackingCode}
                </p>
              ) : null}
              {shipment.courier?.phone ? (
                <p className="truncate text-[11px] text-muted">
                  {shipment.courier.phone}
                </p>
              ) : null}
              {shipment.courier?.trackingMessage ? (
                <p className="text-[11px] leading-relaxed text-muted">
                  {shipment.courier.trackingMessage}
                </p>
              ) : null}
              {shipment.trackingUrl ? (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
                >
                  Open provider tracking
                  <Icon name="arrow-up-right" className="size-3.5" />
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-ink">
                Sibling shipments
              </h2>
              <Badge tone="neutral">{siblingShipments.length}</Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              Other vendor sub-orders in the same checkout.
            </p>
            <div className="mt-2.5 space-y-2">
              {siblingShipments.length ? (
                siblingShipments.map((sibling) => (
                  <SiblingRow key={sibling._id} shipment={sibling} />
                ))
              ) : (
                <p className="text-[12px] text-muted">
                  This checkout has no other shipments.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {cancelOpen ? (
        <ShipmentCancelDialog
          shipmentId={shipment._id}
          trackingNumber={shipment.trackingNumber}
          onClose={() => setCancelOpen(false)}
          onCompleted={() => {
            reload();
            tracking.reload();
          }}
        />
      ) : null}
    </div>
  );
}

function breadcrumbsForShipment(trackingNumber?: string) {
  return [
    { label: "Admin console", href: "/" },
    { label: "Operations" },
    { label: "Logistics", href: "/logistics" },
    { label: trackingNumber ?? "Shipment" },
  ];
}

function SiblingRow({ shipment }: { shipment: ApiShipment }) {
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
      </p>
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
}: {
  title: string;
  body: string;
  meta?: string;
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
          {meta ? <p className="mt-1 text-[11px] text-muted">{meta}</p> : null}
        </div>
      </div>
    </section>
  );
}
