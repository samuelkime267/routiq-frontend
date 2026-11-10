import type {
  DisputeCategory,
  DisputeHistoryAction,
  DisputePriority,
  DisputeStatus,
  EscrowReleaseStatus,
  TransactionType,
  UserRole,
} from "@/types/api";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: "Customer",
  vendor: "Vendor",
  admin: "Administrator",
};

export const formatUserRole = (role?: string | null) =>
  role && role in USER_ROLE_LABELS
    ? USER_ROLE_LABELS[role as UserRole]
    : "Account";

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  payment: "Payment",
  refund: "Refund",
};

export const PAYMENT_CHANNEL_LABELS: Record<string, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  ussd: "USSD",
  wallet: "Wallet",
};

export const formatPaymentChannel = (channel?: string | null) =>
  channel ? (PAYMENT_CHANNEL_LABELS[channel] ?? channel) : "—";

export const ESCROW_RELEASE_LABELS: Record<EscrowReleaseStatus, string> = {
  released: "Released",
  refunded: "Refunded",
  due: "Release due",
  scheduled: "Scheduled",
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  AWAITING_INFORMATION: "Awaiting information",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const DISPUTE_STATUS_DESCRIPTIONS: Record<DisputeStatus, string> = {
  OPEN: "Raised but not yet picked up.",
  UNDER_REVIEW: "An administrator is investigating.",
  AWAITING_INFORMATION: "Waiting for the customer or vendor to respond.",
  RESOLVED: "A resolution has been recorded.",
  CLOSED: "Closed and no further action is expected.",
};

export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  payment: "Payment",
  order: "Order",
  delivery: "Delivery",
  product: "Product",
  vendor: "Vendor",
};

export const DISPUTE_PRIORITY_LABELS: Record<DisputePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const DISPUTE_HISTORY_LABELS: Record<DisputeHistoryAction, string> = {
  created: "Dispute raised",
  assigned: "Assigned",
  status_changed: "Status changed",
  note_added: "Internal note",
  information_requested: "Information requested",
  resolved: "Resolved",
  closed: "Closed",
};

export const formatDisputeStatus = (status?: string | null) => {
  if (!status) return "Unknown";
  return (
    DISPUTE_STATUS_LABELS[status as DisputeStatus] ??
    status.replace(/_/g, " ").toLowerCase()
  );
};

export const formatDisputeCategory = (category?: string | null) => {
  if (!category) return "Order";
  return (
    DISPUTE_CATEGORY_LABELS[category as DisputeCategory] ??
    category.charAt(0).toUpperCase() + category.slice(1)
  );
};

export const formatDisputePriority = (priority?: string | null) => {
  if (!priority) return "Medium";
  return (
    DISPUTE_PRIORITY_LABELS[priority as DisputePriority] ??
    priority.charAt(0).toUpperCase() + priority.slice(1)
  );
};

/** Name for a populated party or an id fallback. */
export function partyName(
  party:
    | string
    | { name?: string | null; email?: string | null }
    | null
    | undefined,
  fallback = "Unknown",
) {
  if (!party) return fallback;
  if (typeof party === "string") return party;
  return party.name ?? party.email ?? fallback;
}

export function orderReference(
  order:
    | string
    | { orderNumber?: string | null; _id?: string | null }
    | null
    | undefined,
) {
  if (!order) return "—";
  if (typeof order === "string") return order;
  return order.orderNumber ?? order._id ?? "—";
}

export function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return "No comparison";
  return `${value > 0 ? "+" : ""}${value}%`;
}

export function changeDirection(
  value?: number | null,
): "up" | "down" | "flat" {
  if (!value) return "flat";
  return value > 0 ? "up" : "down";
}
