import type {
  AdminInvitationStatus,
  AdminPermission,
  AdminStatus,
} from "@/types/api";

/**
 * Built-in role presentation. Custom roles created through the API are not in
 * these maps, so `formatAdminRole` falls back to humanising the stored key.
 */
export const ADMIN_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  OPERATIONS_ADMIN: "Operations Admin",
  FINANCE_ADMIN: "Finance Admin",
  SUPPORT_ADMIN: "Support Admin",
  CATALOG_ADMIN: "Catalog Admin",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: "Full platform access and administrative control.",
  OPERATIONS_ADMIN: "Vendors, stores, orders and logistics.",
  FINANCE_ADMIN: "Transactions, escrow and financial reporting.",
  SUPPORT_ADMIN: "Customers, vendors and dispute resolution.",
  CATALOG_ADMIN: "Product catalog management and moderation.",
};

export const ADMIN_ROLE_ORDER = [
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "CATALOG_ADMIN",
];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  "dashboard.view": "Dashboard",
  "users.view": "View users",
  "users.manage": "Manage user accounts",
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
  "financials.view": "View financial reports",
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

export const INVITATION_STATUS_LABELS: Record<AdminInvitationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
  EXPIRED: "Expired",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  admin: "Administrator",
  admin_role: "Admin role",
  invitation: "Invitation",
  user: "User",
  vendor: "Vendor",
  store: "Store",
  product: "Product",
  order: "Order",
  payment: "Payment",
  escrow: "Escrow",
  shipment: "Shipment",
  dispute: "Dispute",
  settings: "Settings",
  platform: "Platform",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "admin.login": "Admin signed in",
  "admin.invited": "Administrator invited",
  "admin.invitation_resent": "Invitation resent",
  "admin.invitation_revoked": "Invitation revoked",
  "admin.invitation_accepted": "Invitation accepted",
  "admin.role_changed": "Admin role changed",
  "admin.status_changed": "Admin status changed",
  "admin.permissions_changed": "Admin permissions changed",
  "admin.profile_updated": "Admin profile updated",
  "admin.password_reset": "Admin password reset",
  "admin_role.created": "Admin role created",
  "admin_role.updated": "Admin role updated",
  "admin_role.deleted": "Admin role deleted",
  "user.status_changed": "User status changed",
  "user.role_changed": "User role changed",
  "vendor.status_changed": "Vendor status changed",
  "vendor.note_added": "Vendor note added",
  "store.approved": "Store approved",
  "store.rejected": "Store rejected",
  "store.information_requested": "Store information requested",
  "store.suspended": "Store suspended",
  "store.reactivated": "Store reactivated",
  "product.approved": "Product approved",
  "product.rejected": "Product rejected",
  "product.suspended": "Product suspended",
  "product.restored": "Product restored",
  "shipment.refreshed": "Shipment refreshed",
  "shipment.retried": "Shipment sync retried",
  "shipment.cancelled": "Shipment cancelled",
  "dispute.assigned": "Dispute assigned",
  "dispute.status_changed": "Dispute status changed",
  "dispute.note_added": "Dispute note added",
  "dispute.resolved": "Dispute resolved",
  "settings.updated": "Platform settings updated",
};

export const humanizeAdminKey = (value?: string | null) => {
  if (!value) return "Admin";

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const formatAdminRole = (role?: string | null) =>
  role ? (ADMIN_ROLE_LABELS[role] ?? humanizeAdminKey(role)) : "Admin";

export const adminRoleDescription = (role?: string | null) =>
  (role && ADMIN_ROLE_DESCRIPTIONS[role]) ||
  "Custom role. Its access is defined by the permissions selected for it.";

export const formatAdminStatus = (status?: AdminStatus | null) => {
  if (!status) return "Unknown";

  return status.charAt(0) + status.slice(1).toLowerCase();
};

export const formatInvitationStatus = (
  status?: AdminInvitationStatus | null,
) => (status ? INVITATION_STATUS_LABELS[status] ?? humanizeAdminKey(status) : "Unknown");

export const formatAuditAction = (action: string) =>
  AUDIT_ACTION_LABELS[action] ?? humanizeAdminKey(action.replace(/\./g, " "));

export const formatAuditEntity = (entity: string) =>
  AUDIT_ENTITY_LABELS[entity] ?? humanizeAdminKey(entity);

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

export const relativeExpiry = (value?: string | null) => {
  if (!value) return "No expiry";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";

  const diff = date.getTime() - Date.now();
  const hours = Math.round(Math.abs(diff) / 3_600_000);

  if (diff <= 0) {
    return hours < 24 ? `Expired ${hours}h ago` : `Expired ${Math.round(hours / 24)}d ago`;
  }

  return hours < 48
    ? `Expires in ${Math.max(hours, 1)}h`
    : `Expires in ${Math.round(hours / 24)}d`;
};
