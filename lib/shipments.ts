import type { IconName } from "@/components/icons";
import type {
  ApiAdminOrder,
  ApiShipment,
  ApiShipmentEvent,
  ShipmentStatus,
} from "@/types/api";
import type { StatusTone } from "@/lib/orders";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  failed: "Delivery failed",
  cancelled: "Cancelled",
};

export const SHIPMENT_STATUS_OPTIONS = (
  Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][]
).map(([value, label]) => ({ value, label }));

const SHIPMENT_STATUS_TONES: Record<ShipmentStatus, StatusTone> = {
  pending: "amber",
  confirmed: "blue",
  picked_up: "teal",
  in_transit: "blue",
  delivered: "green",
  failed: "red",
  cancelled: "neutral",
};

export function shipmentStatusLabel(status?: ShipmentStatus | null) {
  return status ? (SHIPMENT_STATUS_LABELS[status] ?? status) : "Unknown";
}

export function shipmentStatusTone(status?: ShipmentStatus | null): StatusTone {
  return status ? (SHIPMENT_STATUS_TONES[status] ?? "neutral") : "neutral";
}

/** Provider statuses are shown verbatim, only formatted for reading. */
export function providerStatusLabel(value?: string | null) {
  if (!value) return "Not reported";

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function shipmentOrder(shipment: ApiShipment): ApiAdminOrder | null {
  return shipment.order && typeof shipment.order !== "string"
    ? shipment.order
    : null;
}

export function shipmentCourierName(shipment: ApiShipment) {
  return shipment.courier?.name ?? "Courier not assigned";
}

export function isTerminalShipment(status: ShipmentStatus) {
  return status === "delivered" || status === "cancelled";
}

export function isShipmentOverdue(
  shipment: ApiShipment,
  now = Date.now(),
): boolean {
  if (
    !shipment.estimatedDeliveryAt ||
    ["delivered", "cancelled", "failed"].includes(shipment.status)
  ) {
    return false;
  }

  const eta = new Date(shipment.estimatedDeliveryAt).getTime();

  return !Number.isNaN(eta) && eta < now;
}

/**
 * Action availability mirrors the server guards so the console does not offer
 * operations the backend will reject. The server remains authoritative.
 */
export function shipmentActions(shipment: ApiShipment) {
  const terminal = isTerminalShipment(shipment.status);

  return {
    refresh: Boolean(shipment.providerOrderId) && !terminal,
    retry:
      Boolean(shipment.providerError) ||
      (shipment.status === "failed" && !terminal),
    cancel:
      Boolean(shipment.providerOrderId) &&
      shipment.provider === "shipbubble" &&
      !terminal &&
      !["picked_up", "in_transit", "failed"].includes(shipment.status),
  };
}

const SHIPMENT_EVENT_ICONS: Record<string, IconName> = {
  pending: "clock",
  confirmed: "check-circle",
  picked_up: "inbox",
  in_transit: "truck",
  completed: "check-circle",
  delivered: "check-circle",
  cancelled: "x",
  canceled: "x",
  failed: "alert-circle",
  delivery_failed: "alert-circle",
};

export function shipmentEventIcon(event: ApiShipmentEvent): IconName {
  const normalized = (event.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return SHIPMENT_EVENT_ICONS[normalized] ?? "map-pin";
}

export function shipmentEventTone(
  event: ApiShipmentEvent,
): "teal" | "lime" | "amber" | "neutral" | "danger" {
  const normalized = (event.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["completed", "delivered"].includes(normalized)) return "lime";
  if (["failed", "delivery_failed"].includes(normalized)) return "danger";
  if (["cancelled", "canceled"].includes(normalized)) return "neutral";
  if (normalized === "in_transit") return "teal";

  return "amber";
}

export const SHIPMENT_EVENT_SOURCE_LABELS: Record<
  ApiShipmentEvent["source"],
  string
> = {
  provider: "Provider sync",
  webhook: "Webhook",
  system: "System",
};
