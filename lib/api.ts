import {
  getAccessToken,
  getStoredUser,
  saveAuth,
  saveUser,
  setAccessToken,
} from "./session";
import { buildQueryString } from "./pagination";
import type {
  AdminAuthResult,
  AdminDetailResult,
  AdminInvitationDetailResult,
  AdminInvitationListResult,
  AdminListResult,
  AdminOrderDetail,
  AdminOrderListResult,
  AdminOrderShipmentsResult,
  AdminOrderSubOrdersResult,
  AdminOrderTimelineResult,
  AdminPermission,
  AdminProfile,
  AdminRoleDetailResult,
  AdminRoleListResult,
  AdminShipmentDetail,
  AdminShipmentListResult,
  AdminShipmentTrackingResult,
  AdminProductDetail,
  AdminProductListResult,
  AdminStatus,
  AdminStoreDetail,
  AdminStoreHistoryResult,
  AdminStoreListResult,
  AdminDisputeDetail,
  AdminDisputeListResult,
  AdminEscrowDetail,
  AdminEscrowListResult,
  AdminTransactionDetail,
  AdminTransactionListResult,
  AdminUserDetail,
  AdminUserListResult,
  AdminUserOrdersResult,
  AdminUserTransactionsResult,
  ApiAdminNote,
  ApiAdminUser,
  ApiNotification,
  ApiProduct,
  ApiShipment,
  ApiStore,
  ApiUser,
  AuditLogDetailResult,
  AuditLogListResult,
  AuthResult,
  DashboardChartsResult,
  DashboardMetricsResult,
  DashboardOverview,
  DashboardPendingActionsResult,
  DashboardQuery,
  DashboardRecentActivityResult,
  DisputeCategory,
  DisputeStatus,
  FinancialOverviewResult,
  FinancialRevenueResult,
  MarketplaceCategoryDetailResult,
  MarketplaceCategoryListResult,
  MarketplaceCategoryProductsResult,
  MarketplaceCategoryQuery,
  MarketplaceFeaturedStoreListResult,
  MarketplaceProductDetailResult,
  MarketplaceProductListResult,
  MarketplaceProductQuery,
  MarketplaceRankedProductListResult,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  MarketplaceStoreDetailResult,
  MarketplaceStoreListResult,
  MarketplaceStoreProductsResult,
  MarketplaceStoreQuery,
  NotificationListResult,
  PendingProductListResult,
  PermissionCatalogue,
  PlatformSettingsResult,
  ProductFilterOptions,
  ReconciliationReport,
  ReconciliationResult,
  StoreDocumentType,
  StorePayload,
  StoreStatus,
  UpdatePlatformSettingsPayload,
  UploadPurpose,
  UploadedFile,
  VendorDetail,
  VendorListResult,
  VendorNotesResult,
  VendorOrdersResult,
  VendorProductsResult,
  VendorTransactionsResult,
  VendorVerificationResult,
} from "@/types/api";

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:2607/api/v1";

/**
 * Keep API calls first-party in local development. `*.localhost` apps count as
 * separate sites, so a cookie set on `localhost:2607` is third-party when the
 * page is on `vendor.localhost` and browsers like Brave will drop it.
 */
export function getApiUrl() {
  if (typeof window === "undefined") return CONFIGURED_API_URL;

  try {
    const url = new URL(CONFIGURED_API_URL);
    const pageHost = window.location.hostname;

    if (
      url.hostname === "localhost" &&
      pageHost !== "localhost" &&
      pageHost.endsWith(".localhost")
    ) {
      url.hostname = pageHost;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return CONFIGURED_API_URL;
  }
}

interface ApiErrorBody {
  message?: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function toFieldErrors(body: ApiErrorBody | null) {
  if (!Array.isArray(body?.errors)) return {};

  return body.errors.reduce<Record<string, string>>((accumulator, issue) => {
    if (!accumulator[issue.field]) accumulator[issue.field] = issue.message;
    return accumulator;
  }, {});
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: (ApiErrorBody & { data?: T }) | null = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const fieldErrors = toFieldErrors(body);
    const message =
      body?.message ||
      body?.errors?.[0]?.message ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, fieldErrors);
  }

  return (body?.data ?? body) as T;
}

const HANDOFF_PARAM = "handoff";

/**
 * After signing in on the auth host, the role app receives a short-lived
 * access token in the URL fragment. Exchange it for a first-party refresh
 * cookie on this host, then remove the token from the address bar.
 */
async function adoptHandoffSession() {
  if (typeof window === "undefined") return;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return;

  const handoffToken = new URLSearchParams(hash).get(HANDOFF_PARAM);
  if (!handoffToken) return;

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );

  try {
    const response = await fetch(`${getApiUrl()}/auth/handoff`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${handoffToken}`,
      },
    });
    const result = await parseResponse<{
      user: ApiUser;
      token: { accessToken: string };
    }>(response);

    saveAuth(result.token.accessToken, result.user);
  } catch {
    // The handoff token was expired or already used. Guards will redirect to
    // the login screen if the user still has no session.
  }
}

let sessionBootstrap: Promise<void> | null = null;

export function ensureSessionBootstrap() {
  if (typeof window === "undefined") return Promise.resolve();

  if (!sessionBootstrap) sessionBootstrap = adoptHandoffSession();

  return sessionBootstrap;
}

export const SESSION_EXPIRED_EVENT = "routiq:session-expired";

export function notifySessionExpired() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

interface FetchOptions {
  auth?: boolean;
  token?: string | null;
  retry?: boolean;
  refreshPath?: string;
}

const DEFAULT_REFRESH_PATH = "/auth/refresh-token";
const refreshPromises = new Map<string, Promise<string>>();

async function refreshAccessToken(
  path = DEFAULT_REFRESH_PATH,
): Promise<string> {
  const existing = refreshPromises.get(path);
  if (existing) return existing;

  const promise = (async () => {
    const response = await fetch(`${getApiUrl()}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const data = await parseResponse<{ accessToken: string }>(response);
    setAccessToken(data.accessToken);

    return data.accessToken;
  })();

  refreshPromises.set(path, promise);

  try {
    return await promise;
  } finally {
    refreshPromises.delete(path);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: FetchOptions = {},
): Promise<T> {
  const {
    auth = true,
    token,
    retry = true,
    refreshPath = DEFAULT_REFRESH_PATH,
  } = options;

  await ensureSessionBootstrap();

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = token ?? (auth ? getAccessToken() : null);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && auth && retry) {
    try {
      const refreshedToken = await refreshAccessToken(refreshPath);
      headers.set("Authorization", `Bearer ${refreshedToken}`);

      const retried = await fetch(`${getApiUrl()}${path}`, {
        ...init,
        headers,
        credentials: "include",
      });

      return parseResponse<T>(retried);
    } catch {
      // The original 401 below gives the caller the accurate failure.
      notifySessionExpired();
    }
  }

  return parseResponse<T>(response);
}

export async function loadCurrentUser() {
  const user = await userApi.me();
  saveUser(user);

  return user;
}

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthResult>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),

  register: (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: "user" | "vendor";
  }) =>
    apiFetch<AuthResult>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),

  logout: () => apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" }),

  sendVerificationEmail: () =>
    apiFetch<{ success: boolean }>("/auth/verify-email", { method: "POST" }),

  verifyEmail: (token: string) =>
    apiFetch<{ success: boolean }>(
      `/auth/verify-email/${encodeURIComponent(token)}`,
    ),

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      { auth: false },
    ),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ success: boolean }>(
      `/auth/reset-password/${encodeURIComponent(token)}`,
      { method: "POST", body: JSON.stringify({ password }) },
      { auth: false },
    ),
};

export const ADMIN_REFRESH_PATH = "/auth/admin/refresh";

export const adminAuthApi = {
  login: (payload: { email: string; password: string }) =>
    apiFetch<AdminAuthResult>(
      "/auth/admin/login",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),

  logout: () =>
    apiFetch<{ success: boolean }>(
      "/auth/admin/logout",
      { method: "POST" },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  me: () =>
    apiFetch<AdminProfile>(
      "/auth/admin/me",
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean }>(
      "/auth/admin/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      { auth: false },
    ),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ success: boolean }>(
      `/auth/admin/reset-password/${encodeURIComponent(token)}`,
      { method: "POST", body: JSON.stringify({ password }) },
      { auth: false },
    ),

  acceptInvitation: (token: string, password: string) =>
    apiFetch<AdminAuthResult>(
      "/auth/admin/accept-invitation",
      { method: "POST", body: JSON.stringify({ token, password }) },
      {
        auth: false,
      },
    ),
};

export const userApi = {
  me: () => apiFetch<ApiUser>("/user/me"),
};

export type AdminListQuery = {
  role?: string;
  status?: string;
  invitationStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type AdminInvitationListQuery = {
  status?: string;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type AdminRoleListQuery = {
  search?: string;
  system?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type AuditLogListQuery = {
  search?: string;
  admin?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export interface AdminStatusUpdateResult {
  admin: ApiAdminUser;
  permissions: AdminPermission[];
}

const adminOptions = { refreshPath: ADMIN_REFRESH_PATH };

export const adminApi = {
  // Directory and account lifecycle.
  admins: (query: AdminListQuery = {}) =>
    apiFetch<AdminListResult>(
      `/admins${buildQueryString(query)}`,
      {},
      adminOptions,
    ),

  getAdmin: (id: string) =>
    apiFetch<AdminDetailResult>(
      `/admins/${encodeURIComponent(id)}`,
      {},
      adminOptions,
    ),

  inviteAdmin: (payload: {
    name: string;
    email: string;
    adminRole: string;
    reason?: string;
  }) =>
    apiFetch<AdminStatusUpdateResult>(
      "/admins/invitations",
      { method: "POST", body: JSON.stringify(payload) },
      adminOptions,
    ),

  updateAdminStatus: (id: string, adminStatus: AdminStatus, reason?: string) =>
    apiFetch<AdminStatusUpdateResult>(
      `/admins/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ adminStatus, reason }) },
      adminOptions,
    ),

  updateAdminRole: (id: string, adminRole: string, reason?: string) =>
    apiFetch<AdminStatusUpdateResult>(
      `/admins/${encodeURIComponent(id)}/role`,
      { method: "PATCH", body: JSON.stringify({ adminRole, reason }) },
      adminOptions,
    ),

  updateAdminPermissions: (
    id: string,
    payload: {
      grants: AdminPermission[];
      revocations: AdminPermission[];
      reason?: string;
    },
  ) =>
    apiFetch<AdminStatusUpdateResult>(
      `/admins/${encodeURIComponent(id)}/permissions`,
      { method: "PATCH", body: JSON.stringify(payload) },
      adminOptions,
    ),

  // Invitations.
  invitations: (query: AdminInvitationListQuery = {}) =>
    apiFetch<AdminInvitationListResult>(
      `/admins/invitations${buildQueryString(query)}`,
      {},
      adminOptions,
    ),

  invitation: (id: string) =>
    apiFetch<AdminInvitationDetailResult>(
      `/admins/invitations/${encodeURIComponent(id)}`,
      {},
      adminOptions,
    ),

  resendInvitation: (id: string) =>
    apiFetch<{ invitation: AdminInvitationDetailResult["invitation"] }>(
      `/admins/invitations/${encodeURIComponent(id)}/resend`,
      { method: "POST" },
      adminOptions,
    ),

  revokeInvitation: (id: string, reason?: string) =>
    apiFetch<{ invitation: AdminInvitationDetailResult["invitation"] }>(
      `/admins/invitations/${encodeURIComponent(id)}/revoke`,
      { method: "POST", body: JSON.stringify({ reason }) },
      adminOptions,
    ),

  // Roles and permission catalogue.
  roles: (query: AdminRoleListQuery = {}) =>
    apiFetch<AdminRoleListResult>(
      `/admin-roles${buildQueryString(query)}`,
      {},
      adminOptions,
    ),

  role: (id: string) =>
    apiFetch<AdminRoleDetailResult>(
      `/admin-roles/${encodeURIComponent(id)}`,
      {},
      adminOptions,
    ),

  createRole: (payload: {
    key: string;
    label: string;
    description?: string;
    permissions: AdminPermission[];
    reason?: string;
  }) =>
    apiFetch<AdminRoleDetailResult>(
      "/admin-roles",
      { method: "POST", body: JSON.stringify(payload) },
      adminOptions,
    ),

  updateRole: (
    id: string,
    payload: {
      label?: string;
      description?: string;
      permissions?: AdminPermission[];
      reason?: string;
    },
  ) =>
    apiFetch<AdminRoleDetailResult>(
      `/admin-roles/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      adminOptions,
    ),

  deleteRole: (id: string, reason?: string) =>
    apiFetch<{ deleted: boolean; key: string }>(
      `/admin-roles/${encodeURIComponent(id)}`,
      { method: "DELETE", body: JSON.stringify({ reason }) },
      adminOptions,
    ),

  permissions: () =>
    apiFetch<PermissionCatalogue>("/permissions", {}, adminOptions),

  // Append-only audit trail (read only).
  auditLogs: (query: AuditLogListQuery = {}) =>
    apiFetch<AuditLogListResult>(
      `/audit-logs${buildQueryString(query)}`,
      {},
      adminOptions,
    ),

  auditLog: (id: string) =>
    apiFetch<AuditLogDetailResult>(
      `/audit-logs/${encodeURIComponent(id)}`,
      {},
      adminOptions,
    ),

  // Platform settings and own profile.
  settings: () => apiFetch<PlatformSettingsResult>("/settings", {}, adminOptions),

  updateSettings: (payload: UpdatePlatformSettingsPayload) =>
    apiFetch<{
      settings: PlatformSettingsResult["settings"];
      changedGroups: string[];
    }>(
      "/settings",
      { method: "PATCH", body: JSON.stringify(payload) },
      adminOptions,
    ),

  profile: () => apiFetch<AdminProfile>("/settings/profile", {}, adminOptions),

  updateProfile: (payload: {
    name?: string;
    phone?: string | null;
    profilePicture?: string | null;
    reason?: string;
  }) =>
    apiFetch<AdminProfile>(
      "/settings/profile",
      { method: "PATCH", body: JSON.stringify(payload) },
      adminOptions,
    ),

  // Convenience aliases for code that still calls the legacy paths.
  inviteAdminLegacy: (payload: {
    name: string;
    email: string;
    adminRole: string;
    reason?: string;
  }) =>
    apiFetch<AdminStatusUpdateResult>(
      "/admin/admins/invite",
      { method: "POST", body: JSON.stringify(payload) },
      adminOptions,
    ),
};

const dashboardQueryString = (query: DashboardQuery) =>
  buildQueryString({
    range: query.range,
    from: query.from,
    to: query.to,
    limit: query.limit,
  });

export const dashboardApi = {
  overview: (query: DashboardQuery = {}) =>
    apiFetch<DashboardOverview>(
      `/admin/dashboard/overview${dashboardQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  metrics: (query: DashboardQuery = {}) =>
    apiFetch<DashboardMetricsResult>(
      `/admin/dashboard/metrics${dashboardQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  charts: (query: DashboardQuery = {}) =>
    apiFetch<DashboardChartsResult>(
      `/admin/dashboard/charts${dashboardQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  pendingActions: () =>
    apiFetch<DashboardPendingActionsResult>(
      "/admin/dashboard/pending-actions",
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  recentActivity: (query: DashboardQuery = {}) =>
    apiFetch<DashboardRecentActivityResult>(
      `/admin/dashboard/recent-activity${dashboardQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export type VendorListQuery = {
  search?: string;
  status?: string;
  storeStatus?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type VendorResourceQuery = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export const vendorApi = {
  list: (query: VendorListQuery = {}) =>
    apiFetch<VendorListResult>(
      `/vendors${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (id: string) =>
    apiFetch<VendorDetail>(
      `/vendors/${encodeURIComponent(id)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  products: (id: string, query: VendorResourceQuery = {}) =>
    apiFetch<VendorProductsResult>(
      `/vendors/${encodeURIComponent(id)}/products${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  orders: (id: string, query: VendorResourceQuery = {}) =>
    apiFetch<VendorOrdersResult>(
      `/vendors/${encodeURIComponent(id)}/orders${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  transactions: (id: string, query: VendorResourceQuery = {}) =>
    apiFetch<VendorTransactionsResult>(
      `/vendors/${encodeURIComponent(id)}/transactions${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  verification: (id: string, query: VendorResourceQuery = {}) =>
    apiFetch<VendorVerificationResult>(
      `/vendors/${encodeURIComponent(id)}/verification${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  notes: (id: string, query: VendorResourceQuery = {}) =>
    apiFetch<VendorNotesResult>(
      `/vendors/${encodeURIComponent(id)}/notes${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  addNote: (id: string, payload: { body: string; storeId?: string }) =>
    apiFetch<{ note: ApiAdminNote }>(
      `/vendors/${encodeURIComponent(id)}/notes`,
      { method: "POST", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  updateStatus: (
    id: string,
    payload: { status: "active" | "suspended"; reason?: string },
  ) =>
    apiFetch<{ vendor: ApiUser }>(
      `/vendors/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export type AdminStoreListQuery = {
  status?: string;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export const storeAdminApi = {
  list: (query: AdminStoreListQuery = {}) =>
    apiFetch<AdminStoreListResult>(
      `/stores${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (storeId: string) =>
    apiFetch<AdminStoreDetail>(
      `/stores/${encodeURIComponent(storeId)}/admin`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  history: (storeId: string, query: VendorResourceQuery = {}) =>
    apiFetch<AdminStoreHistoryResult>(
      `/stores/${encodeURIComponent(storeId)}/admin/history${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  approve: (storeId: string, note?: string) =>
    apiFetch<{ store: ApiStore }>(
      `/stores/${encodeURIComponent(storeId)}/admin/approve`,
      { method: "POST", body: JSON.stringify({ note }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  reject: (storeId: string, reason: string) =>
    apiFetch<{ store: ApiStore }>(
      `/stores/${encodeURIComponent(storeId)}/admin/reject`,
      { method: "POST", body: JSON.stringify({ reason }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  requestInformation: (storeId: string, message: string) =>
    apiFetch<{ store: ApiStore }>(
      `/stores/${encodeURIComponent(storeId)}/admin/request-information`,
      { method: "POST", body: JSON.stringify({ message }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  suspend: (storeId: string, reason: string) =>
    apiFetch<{ store: ApiStore }>(
      `/stores/${encodeURIComponent(storeId)}/admin/suspend`,
      { method: "POST", body: JSON.stringify({ reason }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  reactivate: (storeId: string, note?: string) =>
    apiFetch<{ store: ApiStore }>(
      `/stores/${encodeURIComponent(storeId)}/admin/reactivate`,
      { method: "POST", body: JSON.stringify({ note }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export type AdminProductListQuery = {
  status?: string;
  publicationStatus?: string;
  category?: string;
  vendor?: string;
  store?: string;
  minPrice?: number;
  maxPrice?: number;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export const productAdminApi = {
  list: (query: AdminProductListQuery = {}) =>
    apiFetch<AdminProductListResult>(
      `/products${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  pending: (query: AdminProductListQuery = {}) =>
    apiFetch<PendingProductListResult>(
      `/products/pending${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (productId: string) =>
    apiFetch<AdminProductDetail>(
      `/products/${encodeURIComponent(productId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  filters: () =>
    apiFetch<ProductFilterOptions>(
      "/products/filters",
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  approve: (productId: string, note?: string) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/${encodeURIComponent(productId)}/admin/approve`,
      { method: "POST", body: JSON.stringify({ note }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  reject: (productId: string, reason: string) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/${encodeURIComponent(productId)}/admin/reject`,
      { method: "POST", body: JSON.stringify({ reason }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  suspend: (productId: string, reason: string) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/${encodeURIComponent(productId)}/admin/suspend`,
      { method: "POST", body: JSON.stringify({ reason }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  restore: (productId: string, note?: string) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/${encodeURIComponent(productId)}/admin/restore`,
      { method: "POST", body: JSON.stringify({ note }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export type AdminOrderListQuery = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  customer?: string;
  vendor?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type AdminOrderCollectionQuery = {
  status?: string;
  paymentStatus?: string;
  vendor?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type AdminShipmentListQuery = {
  search?: string;
  status?: string;
  provider?: string;
  order?: string;
  vendor?: string;
  store?: string;
  customer?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export const orderAdminApi = {
  list: (query: AdminOrderListQuery = {}) =>
    apiFetch<AdminOrderListResult>(
      `/orders${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (orderId: string) =>
    apiFetch<AdminOrderDetail>(
      `/orders/${encodeURIComponent(orderId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  timeline: (orderId: string, query: { type?: string; page?: number; limit?: number } = {}) =>
    apiFetch<AdminOrderTimelineResult>(
      `/orders/${encodeURIComponent(orderId)}/timeline${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  subOrders: (orderId: string, query: AdminOrderCollectionQuery = {}) =>
    apiFetch<AdminOrderSubOrdersResult>(
      `/orders/${encodeURIComponent(orderId)}/sub-orders${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  shipments: (orderId: string, query: AdminOrderCollectionQuery = {}) =>
    apiFetch<AdminOrderShipmentsResult>(
      `/orders/${encodeURIComponent(orderId)}/shipments${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export const shipmentAdminApi = {
  list: (query: AdminShipmentListQuery = {}) =>
    apiFetch<AdminShipmentListResult>(
      `/shipments${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (shipmentId: string) =>
    apiFetch<AdminShipmentDetail>(
      `/shipments/${encodeURIComponent(shipmentId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  tracking: (shipmentId: string, query: { page?: number; limit?: number } = {}) =>
    apiFetch<AdminShipmentTrackingResult>(
      `/shipments/${encodeURIComponent(shipmentId)}/tracking${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  refresh: (shipmentId: string) =>
    apiFetch<{ shipment: ApiShipment }>(
      `/shipments/${encodeURIComponent(shipmentId)}/admin/refresh`,
      { method: "POST" },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  retry: (shipmentId: string) =>
    apiFetch<{ shipment: ApiShipment }>(
      `/shipments/${encodeURIComponent(shipmentId)}/admin/retry`,
      { method: "POST" },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  cancel: (shipmentId: string, reason?: string) =>
    apiFetch<{ shipment: ApiShipment }>(
      `/shipments/${encodeURIComponent(shipmentId)}/admin/cancel`,
      { method: "POST", body: JSON.stringify({ reason }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export const storeApi = {
  mine: () => apiFetch<{ stores: ApiStore[] }>("/stores/me"),

  get: (id: string) => apiFetch<{ store: ApiStore }>(`/stores/${id}`),

  create: (payload: StorePayload) =>
    apiFetch<{ store: ApiStore }>("/stores", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: StorePayload) =>
    apiFetch<{ store: ApiStore }>(`/stores/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export type NotificationListQuery = {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
};

export const notificationApi = {
  list: (query: NotificationListQuery = {}) =>
    apiFetch<NotificationListResult>(
      `/notifications${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  markRead: (id: string) =>
    apiFetch<{ notification: ApiNotification }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  markAllRead: () =>
    apiFetch<{ updated: number }>(
      "/notifications/read-all",
      { method: "PATCH" },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

export type { StoreStatus };

/**
 * Public marketplace data. `auth: false` keeps catalogue browsing anonymous
 * even when a customer or administrator is signed in, so the dual-mode
 * `/products` and `/stores` endpoints return the public contract.
 */
export const marketplaceApi = {
  products: (query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceProductListResult>(
      `/products${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  product: (productId: string) =>
    apiFetch<MarketplaceProductDetailResult>(
      `/products/${encodeURIComponent(productId)}`,
      {},
      { auth: false },
    ),

  featuredProducts: (query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceProductListResult>(
      `/products/featured${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  popularProducts: (query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceRankedProductListResult>(
      `/products/popular${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  trendingProducts: (query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceRankedProductListResult>(
      `/products/trending${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  newArrivals: (query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceProductListResult>(
      `/products/new-arrivals${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  onSale: (query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceProductListResult>(
      `/products/on-sale${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  categories: (query: MarketplaceCategoryQuery = {}) =>
    apiFetch<MarketplaceCategoryListResult>(
      `/categories${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  category: (categoryId: string) =>
    apiFetch<MarketplaceCategoryDetailResult>(
      `/categories/${encodeURIComponent(categoryId)}`,
      {},
      { auth: false },
    ),

  categoryProducts: (
    categoryId: string,
    query: MarketplaceProductQuery = {},
  ) =>
    apiFetch<MarketplaceCategoryProductsResult>(
      `/categories/${encodeURIComponent(categoryId)}/products${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  stores: (query: MarketplaceStoreQuery = {}) =>
    apiFetch<MarketplaceStoreListResult>(
      `/stores${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  store: (storeId: string) =>
    apiFetch<MarketplaceStoreDetailResult>(
      `/stores/${encodeURIComponent(storeId)}`,
      {},
      { auth: false },
    ),

  featuredStores: (query: MarketplaceStoreQuery = {}) =>
    apiFetch<MarketplaceFeaturedStoreListResult>(
      `/stores/featured${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  storeProducts: (storeId: string, query: MarketplaceProductQuery = {}) =>
    apiFetch<MarketplaceStoreProductsResult>(
      `/stores/${encodeURIComponent(storeId)}/products${buildQueryString(query)}`,
      {},
      { auth: false },
    ),

  search: (query: MarketplaceSearchQuery) =>
    apiFetch<MarketplaceSearchResult>(
      `/search${buildQueryString({
        query: query.query ?? query.q,
        category: query.category,
        type: query.type,
        sortBy: query.sortBy,
        page: query.page,
        limit: query.limit,
      })}`,
      {},
      { auth: false },
    ),
};

export const uploadApi = {
  file: (
    file: File,
    purpose: UploadPurpose,
    documentType?: StoreDocumentType,
  ) => {
    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);
    if (documentType) body.append("documentType", documentType);

    return apiFetch<UploadedFile>("/uploads", { method: "POST", body });
  },
};

export function getCachedUser() {
  return getStoredUser();
}

/* -------------------------------------------------------------------------- */
/* User management                                                            */
/* -------------------------------------------------------------------------- */

export type AdminUserListQuery = {
  search?: string;
  role?: string;
  type?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type AdminUserCollectionQuery = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  side?: "customer" | "vendor";
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
};

export const userAdminApi = {
  list: (query: AdminUserListQuery = {}) =>
    apiFetch<AdminUserListResult>(
      `/users${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (userId: string) =>
    apiFetch<AdminUserDetail>(
      `/users/${encodeURIComponent(userId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  orders: (userId: string, query: AdminUserCollectionQuery = {}) =>
    apiFetch<AdminUserOrdersResult>(
      `/users/${encodeURIComponent(userId)}/orders${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  transactions: (userId: string, query: AdminUserCollectionQuery = {}) =>
    apiFetch<AdminUserTransactionsResult>(
      `/users/${encodeURIComponent(userId)}/transactions${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  updateStatus: (
    userId: string,
    payload: { status: "active" | "suspended"; reason?: string },
  ) =>
    apiFetch<{ user: ApiUser }>(
      `/users/${encodeURIComponent(userId)}/admin/status`,
      { method: "PATCH", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

/* -------------------------------------------------------------------------- */
/* Transactions                                                               */
/* -------------------------------------------------------------------------- */

export type AdminTransactionListQuery = {
  search?: string;
  type?: string;
  status?: string;
  channel?: string;
  customer?: string;
  vendor?: string;
  order?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export const transactionAdminApi = {
  list: (query: AdminTransactionListQuery = {}) =>
    apiFetch<AdminTransactionListResult>(
      `/transactions${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (transactionId: string) =>
    apiFetch<AdminTransactionDetail>(
      `/transactions/${encodeURIComponent(transactionId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

/* -------------------------------------------------------------------------- */
/* Escrow                                                                     */
/* -------------------------------------------------------------------------- */

export type AdminEscrowListQuery = {
  search?: string;
  status?: string;
  customer?: string;
  vendor?: string;
  order?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export const escrowAdminApi = {
  list: (query: AdminEscrowListQuery = {}) =>
    apiFetch<AdminEscrowListResult>(
      `/escrow${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (escrowId: string) =>
    apiFetch<AdminEscrowDetail>(
      `/escrow/${encodeURIComponent(escrowId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

/* -------------------------------------------------------------------------- */
/* Financial reporting                                                        */
/* -------------------------------------------------------------------------- */

export const financialAdminApi = {
  overview: (query: DashboardQuery = {}) =>
    apiFetch<FinancialOverviewResult>(
      `/financials/admin/overview${dashboardQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  revenue: (query: DashboardQuery = {}) =>
    apiFetch<FinancialRevenueResult>(
      `/financials/admin/revenue${dashboardQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  reconciliation: (
    query: DashboardQuery & {
      result?: ReconciliationResult | "";
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiFetch<ReconciliationReport>(
      `/financials/admin/reconciliation${buildQueryString({
        range: query.range,
        from: query.from,
        to: query.to,
        result: query.result,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page,
        limit: query.limit,
      })}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

/* -------------------------------------------------------------------------- */
/* Disputes                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminDisputeListQuery = {
  search?: string;
  status?: DisputeStatus | "";
  category?: DisputeCategory | "";
  priority?: string;
  assignedTo?: string;
  customer?: string;
  vendor?: string;
  order?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export const disputeAdminApi = {
  list: (query: AdminDisputeListQuery = {}) =>
    apiFetch<AdminDisputeListResult>(
      `/disputes${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (disputeId: string) =>
    apiFetch<AdminDisputeDetail>(
      `/disputes/${encodeURIComponent(disputeId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  assign: (
    disputeId: string,
    payload: { adminId?: string; note?: string } = {},
  ) =>
    apiFetch<{ dispute: unknown }>(
      `/disputes/${encodeURIComponent(disputeId)}/admin/assign`,
      { method: "POST", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  updateStatus: (
    disputeId: string,
    payload: {
      status: DisputeStatus;
      note?: string;
      message?: string;
      resolution?: string;
    },
  ) =>
    apiFetch<{ dispute: unknown }>(
      `/disputes/${encodeURIComponent(disputeId)}/admin/status`,
      { method: "PATCH", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  addNote: (disputeId: string, body: string) =>
    apiFetch<{ dispute: unknown }>(
      `/disputes/${encodeURIComponent(disputeId)}/admin/notes`,
      { method: "POST", body: JSON.stringify({ body }) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  resolve: (
    disputeId: string,
    payload: { resolution: string; note?: string },
  ) =>
    apiFetch<{ dispute: unknown }>(
      `/disputes/${encodeURIComponent(disputeId)}/admin/resolve`,
      { method: "POST", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};
