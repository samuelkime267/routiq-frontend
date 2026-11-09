import type { IconName } from "@/components/icons";
import type {
  ApiAdminOrder,
  ApiEscrow,
  ApiOrderParty,
  ApiOrderStoreSummary,
  ApiOrderTimelineEvent,
  ApiPayment,
  ApiShipment,
  FulfillmentStatus,
  OrderPaymentStatus,
  OrderStatus,
  OrderTimelineEventType,
} from "@/types/api";

export type StatusTone =
  | "neutral"
  | "teal"
  | "lime"
  | "amber"
  | "green"
  | "red"
  | "blue";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_OPTIONS = (
  Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]
).map(([value, label]) => ({ value, label }));

export const ORDER_PAYMENT_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

export const ORDER_PAYMENT_OPTIONS = (
  Object.entries(ORDER_PAYMENT_LABELS) as [OrderPaymentStatus, string][]
).map(([value, label]) => ({ value, label }));

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  unfulfilled: "Unfulfilled",
  processing: "Processing",
  shipped: "In fulfilment",
  delivered: "Delivered",
  failed: "Delivery failed",
  cancelled: "Cancelled",
};

export const FULFILLMENT_OPTIONS = (
  Object.entries(FULFILLMENT_STATUS_LABELS) as [FulfillmentStatus, string][]
).map(([value, label]) => ({ value, label }));

const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
  pending: "amber",
  confirmed: "blue",
  processing: "amber",
  shipped: "blue",
  delivered: "green",
  cancelled: "red",
  refunded: "blue",
};

const PAYMENT_STATUS_TONES: Record<OrderPaymentStatus, StatusTone> = {
  pending: "amber",
  paid: "green",
  failed: "red",
  refunded: "blue",
};

const FULFILLMENT_TONES: Record<FulfillmentStatus, StatusTone> = {
  unfulfilled: "neutral",
  processing: "amber",
  shipped: "blue",
  delivered: "green",
  failed: "red",
  cancelled: "red",
};

export function orderStatusLabel(status?: OrderStatus | null) {
  return status ? (ORDER_STATUS_LABELS[status] ?? status) : "Unknown";
}

export function orderStatusTone(status?: OrderStatus | null): StatusTone {
  return status ? (ORDER_STATUS_TONES[status] ?? "neutral") : "neutral";
}

export function orderPaymentLabel(status?: OrderPaymentStatus | null) {
  return status ? (ORDER_PAYMENT_LABELS[status] ?? status) : "Unknown";
}

export function orderPaymentTone(
  status?: OrderPaymentStatus | null,
): StatusTone {
  return status ? (PAYMENT_STATUS_TONES[status] ?? "neutral") : "neutral";
}

export function fulfillmentLabel(status?: FulfillmentStatus | null) {
  return status ? (FULFILLMENT_STATUS_LABELS[status] ?? status) : "Unknown";
}

export function fulfillmentTone(
  status?: FulfillmentStatus | null,
): StatusTone {
  return status ? (FULFILLMENT_TONES[status] ?? "neutral") : "neutral";
}

export function orderCustomer(order: ApiAdminOrder): ApiOrderParty | null {
  if (order.customerSummary) return order.customerSummary;
  return order.customer && typeof order.customer !== "string"
    ? order.customer
    : null;
}

export function orderVendor(order: ApiAdminOrder): ApiOrderParty | null {
  if (order.vendorSummary) return order.vendorSummary;
  return order.vendor && typeof order.vendor !== "string" ? order.vendor : null;
}

export function orderStore(
  order: ApiAdminOrder,
): ApiOrderStoreSummary | null {
  if (order.storeSummary) return order.storeSummary;
  return order.store && typeof order.store !== "string" ? order.store : null;
}

/** Human label for the vendor-specific record shown in a directory row. */
export function orderReference(order: ApiAdminOrder) {
  return order.subOrderNumber || order.orderNumber;
}

export function orderMasterReference(order: ApiAdminOrder) {
  return order.masterOrderNumber || order.orderNumber;
}

/**
 * A vendor sub-order has at most one shipment. Detail responses attach them,
 * list rows expose the latest one, so both shapes resolve here.
 */
export function orderShipment(order: ApiAdminOrder): ApiShipment | null {
  if (order.shipments?.length) return order.shipments[0];
  return order.latestShipment ?? null;
}

export function orderAddressLine(order: ApiAdminOrder) {
  const address = order.shippingAddress;

  if (address) {
    return [address.city ?? order.shippingCity, address.state ?? order.shippingState]
      .filter(Boolean)
      .join(", ");
  }

  return [order.shippingCity, order.shippingState].filter(Boolean).join(", ");
}

export function paymentRecordLabel(payment: ApiPayment) {
  const labels: Record<ApiPayment["status"], string> = {
    pending: "Payment pending",
    successful: "Payment successful",
    failed: "Payment failed",
    refunded: "Payment refunded",
  };

  return labels[payment.status] ?? payment.status;
}

export function paymentRecordTone(payment: ApiPayment): StatusTone {
  const tones: Record<ApiPayment["status"], StatusTone> = {
    pending: "amber",
    successful: "green",
    failed: "red",
    refunded: "blue",
  };

  return tones[payment.status] ?? "neutral";
}

export function escrowStatusLabel(escrow: ApiEscrow) {
  const labels: Record<ApiEscrow["status"], string> = {
    held: "Held in escrow",
    released: "Released to vendor",
    refunded: "Refunded to customer",
  };

  return labels[escrow.status] ?? escrow.status;
}

export const TIMELINE_EVENT_LABELS: Record<OrderTimelineEventType, string> = {
  created: "Order created",
  payment_confirmed: "Payment confirmed",
  vendor_notified: "Vendor notified",
  processing: "Processing",
  shipment_created: "Shipment created",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  completed: "Order completed",
  cancelled: "Order cancelled",
  refunded: "Order refunded",
};

const TIMELINE_ICONS: Record<OrderTimelineEventType, IconName> = {
  created: "shopping-bag",
  payment_confirmed: "wallet",
  vendor_notified: "bell",
  processing: "package",
  shipment_created: "truck",
  picked_up: "inbox",
  in_transit: "truck",
  delivered: "check-circle",
  completed: "check-circle",
  cancelled: "x",
  refunded: "refresh",
};

const TIMELINE_TONES: Record<
  OrderTimelineEventType,
  "teal" | "lime" | "amber" | "neutral" | "danger"
> = {
  created: "teal",
  payment_confirmed: "lime",
  vendor_notified: "neutral",
  processing: "amber",
  shipment_created: "teal",
  picked_up: "teal",
  in_transit: "teal",
  delivered: "lime",
  completed: "lime",
  cancelled: "danger",
  refunded: "neutral",
};

export function timelineEventPresentation(event: ApiOrderTimelineEvent) {
  return {
    label: event.label || TIMELINE_EVENT_LABELS[event.type] || event.type,
    icon: TIMELINE_ICONS[event.type] ?? "clock",
    tone: TIMELINE_TONES[event.type] ?? "neutral",
  };
}
