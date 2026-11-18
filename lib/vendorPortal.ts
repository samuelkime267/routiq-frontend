import type { IconName } from "@/components/icons";
import type { StatusTone } from "@/lib/orders";
import { formatNaira, formatNumber } from "@/lib/format";
import type {
  NotificationType,
  ProductStatus,
  VendorBankAccount,
  VendorMetric,
  VendorWithdrawal,
  WithdrawalStatus,
} from "@/types/api";

export function vendorInitials(name?: string | null) {
  const parts = (name ?? "Vendor")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "V";
}

export function formatVendorDate(value?: string | null) {
  if (!value) return "Not yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVendorDay(value?: string | null) {
  if (!value) return "Not yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Compact relative time for notification rows. */
export function formatRelativeTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatVendorDay(value);
}

const NOTIFICATION_ICONS: Record<NotificationType, IconName> = {
  store_submitted: "store",
  store_approved: "check-circle",
  store_rejected: "alert-circle",
  store_information_requested: "help-circle",
  store_suspended: "lock",
  store_reactivated: "check-circle",
  vendor_suspended: "lock",
  vendor_reactivated: "check-circle",
  product_approved: "tag",
  product_rejected: "alert-circle",
  product_suspended: "lock",
  product_restored: "refresh",
  order_created: "shopping-bag",
  order_status_updated: "truck",
  withdrawal_submitted: "wallet",
  withdrawal_approved: "check-circle",
  withdrawal_rejected: "alert-circle",
  withdrawal_paid: "wallet",
  bank_account_verified: "building",
  bank_account_rejected: "alert-circle",
};

export function notificationIcon(type?: NotificationType | null): IconName {
  return type ? (NOTIFICATION_ICONS[type] ?? "bell") : "bell";
}

export function notificationTone(
  type?: NotificationType | null,
): "teal" | "lime" | "amber" | "red" {
  if (!type) return "teal";
  if (type.endsWith("_rejected") || type.endsWith("_suspended")) return "red";
  if (type.endsWith("_approved") || type.endsWith("_paid")) return "lime";
  if (
    type.endsWith("_submitted") ||
    type.endsWith("_requested") ||
    type === "order_created"
  ) {
    return "amber";
  }

  return "teal";
}

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  processing: "Processing payout",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const WITHDRAWAL_STATUS_OPTIONS = (
  Object.entries(WITHDRAWAL_STATUS_LABELS) as [WithdrawalStatus, string][]
).map(([value, label]) => ({ value, label }));

const WITHDRAWAL_TONES: Record<WithdrawalStatus, StatusTone> = {
  pending: "amber",
  approved: "blue",
  processing: "amber",
  paid: "green",
  rejected: "red",
  cancelled: "neutral",
};

export function withdrawalStatusLabel(status?: WithdrawalStatus | null) {
  return status ? (WITHDRAWAL_STATUS_LABELS[status] ?? status) : "Unknown";
}

export function withdrawalStatusTone(
  status?: WithdrawalStatus | null,
): StatusTone {
  return status ? (WITHDRAWAL_TONES[status] ?? "neutral") : "neutral";
}

/** Only a pending request can be withdrawn by the vendor. */
export function canCancelWithdrawal(withdrawal: VendorWithdrawal) {
  return withdrawal.status === "pending";
}

export const BANK_VERIFICATION_LABELS: Record<
  VendorBankAccount["verificationStatus"],
  string
> = {
  pending: "Awaiting verification",
  verified: "Verified",
  rejected: "Rejected",
};

const BANK_VERIFICATION_TONES: Record<
  VendorBankAccount["verificationStatus"],
  StatusTone
> = {
  pending: "amber",
  verified: "green",
  rejected: "red",
};

export function bankVerificationLabel(
  status: VendorBankAccount["verificationStatus"],
) {
  return BANK_VERIFICATION_LABELS[status] ?? status;
}

export function bankVerificationTone(
  status: VendorBankAccount["verificationStatus"],
): StatusTone {
  return BANK_VERIFICATION_TONES[status] ?? "neutral";
}

export function maskAccountNumber(accountNumber: string) {
  if (accountNumber.length < 4) return accountNumber;

  return `${"•".repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`;
}

export function withdrawalBankLine(withdrawal: VendorWithdrawal) {
  return [
    withdrawal.bankSnapshot.bankName,
    maskAccountNumber(withdrawal.bankSnapshot.accountNumber),
  ]
    .filter(Boolean)
    .join(" · ");
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

const METRIC_ICONS: Record<string, IconName> = {
  grossSales: "bar-chart",
  netEarnings: "wallet",
  pendingEarnings: "clock",
  availableBalance: "wallet",
  orders: "shopping-bag",
  lowStock: "package",
};

export function vendorMetricIcon(metric: VendorMetric): IconName {
  return METRIC_ICONS[metric.key] ?? "activity";
}

export function formatVendorMetricValue(metric: VendorMetric) {
  return metric.format === "currency"
    ? formatNaira(metric.value)
    : formatNumber(metric.value);
}

const PENDING_ICONS: Record<string, IconName> = {
  confirm_orders: "shopping-bag",
  ship_orders: "truck",
  withdrawals: "wallet",
};

export function vendorPendingIcon(key: string): IconName {
  return PENDING_ICONS[key] ?? "clock";
}

export const PENDING_TONES: Record<
  "high" | "medium" | "low",
  "red" | "amber" | "neutral"
> = {
  high: "red",
  medium: "amber",
  low: "neutral",
};

/** Product statuses where catalogue writes are allowed at all. */
export function productIsEditable(status: ProductStatus) {
  return status !== "suspended" && status !== "archived";
}

export function productCanBeDeleted(status: ProductStatus) {
  return status === "draft" || status === "rejected" || status === "archived";
}

/**
 * Newly created listings, or listings whose content changed after approval,
 * need a fresh moderation pass before they can be published.
 */
export function productNeedsReview(status: ProductStatus) {
  return status === "draft" || status === "rejected" || status === "pending";
}

export const FINANCE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const VENDOR_ORDER_STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export const VENDOR_PAYMENT_FILTERS = [
  { value: "", label: "Any payment" },
  { value: "pending", label: "Payment pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Payment failed" },
  { value: "refunded", label: "Refunded" },
];

export const INVENTORY_FILTERS = [
  { value: "", label: "All stock levels" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock (≤5)" },
  { value: "out_of_stock", label: "Out of stock" },
];
