import type { IconName } from "@/components/icons";
import type {
  DashboardMetric,
  DashboardMetricKey,
  DashboardPendingAction,
} from "@/types/api";
import { formatNaira, formatNumber } from "@/lib/format";

/** Icons keep the twelve metric cards scannable without extra copy. */
export const METRIC_ICONS: Record<DashboardMetricKey, IconName> = {
  totalUsers: "users",
  totalVendors: "user",
  activeVendors: "check-circle",
  totalStores: "store",
  pendingStoreApprovals: "clock",
  totalProducts: "package",
  pendingProductApprovals: "sliders",
  totalOrders: "shopping-bag",
  grossMerchandiseValue: "bar-chart",
  marketplaceRevenue: "wallet",
  escrowBalance: "lock",
  unresolvedDisputes: "message-square",
};

/** Metric cards link to the module that owns the underlying records. */
export const METRIC_LINKS: Partial<Record<DashboardMetricKey, string>> = {
  totalUsers: "/customers",
  totalVendors: "/vendors",
  activeVendors: "/vendors?status=active",
  totalStores: "/vendors?status=approved",
  pendingStoreApprovals: "/vendors?status=pending",
  totalProducts: "/products",
  pendingProductApprovals: "/products?status=pending",
  totalOrders: "/orders",
  grossMerchandiseValue: "/reports",
  marketplaceRevenue: "/payments",
  escrowBalance: "/escrow",
  unresolvedDisputes: "/disputes?status=open",
};

export function formatMetricValue(metric: DashboardMetric) {
  return metric.format === "currency"
    ? formatNaira(metric.value)
    : formatNumber(metric.value);
}

/** Short basis copy shown under each metric card. */
export function metricBasisLabel(metric: DashboardMetric) {
  return metric.basis === "range" ? "Selected period" : "All time";
}

export const PENDING_TONES: Record<
  DashboardPendingAction["severity"],
  "red" | "amber" | "neutral"
> = {
  high: "red",
  medium: "amber",
  low: "neutral",
};

export const PENDING_ICONS: Record<
  DashboardPendingAction["key"],
  IconName
> = {
  store_approvals: "store",
  product_moderation: "package",
  delayed_orders: "clock",
  failed_shipments: "truck",
  unresolved_disputes: "message-square",
  payment_issues: "card",
};

interface ActivityMeta {
  icon: IconName;
  tone: "teal" | "lime" | "amber" | "neutral" | "danger";
}

const ACTIVITY_META: Record<string, ActivityMeta> = {
  vendor_registered: { icon: "user", tone: "lime" },
  store_submitted: { icon: "store", tone: "teal" },
  store_approved: { icon: "check-circle", tone: "teal" },
  store_rejected: { icon: "x", tone: "danger" },
  product_approved: { icon: "package", tone: "teal" },
  product_rejected: { icon: "package", tone: "danger" },
  order_created: { icon: "shopping-bag", tone: "amber" },
  payment_confirmed: { icon: "wallet", tone: "lime" },
  shipment_updated: { icon: "truck", tone: "neutral" },
  dispute_created: { icon: "message-square", tone: "danger" },
  admin_action: { icon: "shield", tone: "teal" },
};

export function activityMeta(type: string): ActivityMeta {
  return ACTIVITY_META[type] ?? { icon: "activity", tone: "neutral" };
}
