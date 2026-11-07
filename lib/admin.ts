import type { AdminPermission, AdminRole, AdminStatus } from "@/types/api";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OPERATIONS_ADMIN: "Operations Admin",
  FINANCE_ADMIN: "Finance Admin",
  SUPPORT_ADMIN: "Support Admin",
  CATALOG_ADMIN: "Catalog Admin",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Full platform access and administrative control.",
  OPERATIONS_ADMIN: "Vendors, stores, orders and logistics.",
  FINANCE_ADMIN: "Transactions, escrow and financial reporting.",
  SUPPORT_ADMIN: "Customers, vendors and dispute resolution.",
  CATALOG_ADMIN: "Product catalog management and moderation.",
};

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  "dashboard.view": "Dashboard",
  "users.view": "View customers",
  "vendors.view": "View vendors",
  "vendors.manage": "Manage vendors",
  "stores.view": "View stores",
  "stores.approve": "Approve stores",
  "stores.reject": "Reject stores",
  "stores.suspend": "Suspend stores",
  "products.view": "View products",
  "products.moderate": "Moderate products",
  "orders.view": "View orders",
  "orders.manage": "Manage orders",
  "transactions.view": "View transactions",
  "escrow.view": "View escrow",
  "shipments.view": "View shipments",
  "shipments.manage": "Manage shipments",
  "disputes.view": "View disputes",
  "disputes.manage": "Manage disputes",
  "admins.view": "View admins",
  "admins.invite": "Invite admins",
  "admins.manage": "Manage admins",
  "roles.manage": "Manage roles",
  "audit_logs.view": "View audit logs",
  "settings.manage": "Manage settings",
};

export const formatAdminRole = (role?: string | null) =>
  role && role in ADMIN_ROLE_LABELS
    ? ADMIN_ROLE_LABELS[role as AdminRole]
    : "Admin";

export const formatAdminStatus = (status?: AdminStatus | null) => {
  if (!status) return "Unknown";

  return status.charAt(0) + status.slice(1).toLowerCase();
};

export const adminInitials = (name?: string | null) => {
  const parts = (name ?? "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "A";
};

export const formatAdminDate = (value?: string | null) => {
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
};
