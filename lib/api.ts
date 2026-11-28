import {
  getAccessToken,
  getStoredUser,
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
  AddressPayload,
  AdminOrderDetail,
  AdminOrderListResult,
  AdminOrderRefundResult,
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
  AdminBankAccount,
  AdminBankAccountListResult,
  AdminWithdrawal,
  AdminWithdrawalDecisionPayload,
  AdminWithdrawalListResult,
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
  CheckoutItemPayload,
  CheckoutQuoteResult,
  CheckoutStateResult,
  CheckoutSummary,
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
  MarketplaceCategoryOptionListResult,
  MarketplaceCategoryProductsResult,
  MarketplaceCategoryQuery,
  MarketplaceCart,
  MarketplaceFeaturedStoreListResult,
  MarketplaceAddress,
  MarketplaceAddressListResult,
  MarketplaceOrderDetailResult,
  MarketplaceOrderGroupListResult,
  CustomerDisputeType,
  MarketplaceDisputeSummary,
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
  PaymentMethodsResult,
  PaymentVerificationResult,
  PendingProductListResult,
  PlaceCheckoutPayload,
  PlaceCheckoutResult,
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
  VendorBankAccount,
  VendorBankAccountListResult,
  VendorDashboard,
  VendorDetail,
  VendorFinanceResult,
  VendorListResult,
  VendorNotesResult,
  VendorOrderDetailResult,
  VendorOrderListResult,
  VendorOrdersResult,
  VendorProductDetailResult,
  VendorProductListResult,
  VendorProductsResult,
  VendorSettingsSnapshot,
  VendorTransactionListResult,
  VendorTransactionsResult,
  VendorVerificationResult,
  VendorWithdrawal,
  VendorWithdrawalListResult,
  VendorWithdrawalResult,
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
  /** Raw `data` block from an error response, when the API sends one. */
  data: unknown;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
    data: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.data = data;
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

    throw new ApiError(message, response.status, fieldErrors, body?.data ?? null);
  }

  return (body?.data ?? body) as T;
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

  /**
   * Requests a full refund through Paystack. The refund is confirmed by the
   * provider webhook or by `syncRefund`, never by the UI alone.
   */
  refund: (orderId: string, input: { reason: string }) =>
    apiFetch<AdminOrderRefundResult>(
      `/orders/${encodeURIComponent(orderId)}/admin/refund`,
      { method: "POST", body: JSON.stringify(input) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  syncRefund: (orderId: string) =>
    apiFetch<AdminOrderRefundResult>(
      `/orders/${encodeURIComponent(orderId)}/admin/refund/sync`,
      { method: "POST" },
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

/* -------------------------------------------------------------------------- */
/* Vendor portal                                                              */
/* -------------------------------------------------------------------------- */

export type VendorProductListQuery = {
  search?: string;
  status?: string;
  publicationStatus?: string;
  category?: string;
  inventory?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type VendorProductPayload = {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  images?: string[];
};

export type VendorOrderListQuery = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type VendorTransactionListQuery = {
  search?: string;
  type?: string;
  status?: string;
  channel?: string;
  order?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type VendorWithdrawalListQuery = {
  search?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type VendorBankAccountPayload = {
  bankName: string;
  bankCode: string;
  accountName: string;
  accountNumber: string;
  isDefault?: boolean;
};

/**
 * Vendor self-service API.
 *
 * Every endpoint resolves the vendor from the access token, so no call takes a
 * vendor id. Vendor calls refresh through the standard customer/vendor path,
 * not the admin one.
 */
export const vendorPortalApi = {
  settings: () => apiFetch<VendorSettingsSnapshot>("/vendors/me"),

  updateSettings: (payload: {
    profile?: {
      name?: string;
      phone?: string | null;
      profilePicture?: string | null;
    };
    storefront?: {
      description?: string | null;
      phoneNumber?: string;
      logo?: string | null;
      coverImage?: string | null;
    };
    operations?: {
      pickupInstructions?: string | null;
      operatingHours?: Array<{
        day: string;
        isOpen: boolean;
        openingTime?: string | null;
        closingTime?: string | null;
      }>;
    };
  }) =>
    apiFetch<VendorSettingsSnapshot>("/vendors/me/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  dashboard: (query: { range?: string; from?: string; to?: string } = {}) =>
    apiFetch<VendorDashboard>(
      `/vendors/me/dashboard${buildQueryString(query)}`,
    ),

  finance: (query: { range?: string; from?: string; to?: string } = {}) =>
    apiFetch<VendorFinanceResult>(
      `/vendors/me/finance${buildQueryString(query)}`,
    ),

  products: (query: VendorProductListQuery = {}) =>
    apiFetch<VendorProductListResult>(
      `/products/vendor${buildQueryString(query)}`,
    ),

  product: (productId: string) =>
    apiFetch<VendorProductDetailResult>(
      `/products/vendor/${encodeURIComponent(productId)}`,
    ),

  createProduct: (payload: VendorProductPayload) =>
    apiFetch<{ product: ApiProduct }>("/products/vendor", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (productId: string, payload: VendorProductPayload) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/vendor/${encodeURIComponent(productId)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),

  updateStock: (
    productId: string,
    payload: { stock?: number; delta?: number },
  ) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/vendor/${encodeURIComponent(productId)}/stock`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),

  submitProduct: (productId: string) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/vendor/${encodeURIComponent(productId)}/submit`,
      { method: "POST" },
    ),

  setProductPublication: (productId: string, publish: boolean) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/vendor/${encodeURIComponent(productId)}/publication`,
      { method: "PATCH", body: JSON.stringify({ publish }) },
    ),

  archiveProduct: (productId: string) =>
    apiFetch<{ product: ApiProduct }>(
      `/products/vendor/${encodeURIComponent(productId)}/archive`,
      { method: "POST" },
    ),

  deleteProduct: (productId: string) =>
    apiFetch<{ deleted: boolean; archived: boolean }>(
      `/products/vendor/${encodeURIComponent(productId)}`,
      { method: "DELETE" },
    ),

  orders: (query: VendorOrderListQuery = {}) =>
    apiFetch<VendorOrderListResult>(`/orders/vendor${buildQueryString(query)}`),

  order: (orderId: string) =>
    apiFetch<VendorOrderDetailResult>(
      `/orders/vendor/${encodeURIComponent(orderId)}`,
    ),

  updateOrderStatus: (
    orderId: string,
    payload: {
      status: "confirmed" | "processing" | "delivered" | "cancelled";
      reason?: string;
    },
  ) =>
    apiFetch<{ order: unknown }>(
      `/orders/vendor/${encodeURIComponent(orderId)}/status`,
      { method: "POST", body: JSON.stringify(payload) },
    ),

  shipOrder: (
    orderId: string,
    payload: {
      note?: string;
    } = {},
  ) =>
    apiFetch<{ order: unknown; shipment: unknown }>(
      `/orders/vendor/${encodeURIComponent(orderId)}/shipment`,
      { method: "POST", body: JSON.stringify(payload) },
    ),

  /**
   * Links an uploaded file (waybill photo/PDF) to an open dispute. Upload the
   * file first with `uploadApi.file(file, "dispute_evidence")`.
   */
  addDisputeEvidence: (
    disputeId: string,
    payload: { label: string; url: string; note?: string },
  ) =>
    apiFetch<{ dispute: unknown }>(
      `/disputes/vendor/${encodeURIComponent(disputeId)}/evidence`,
      { method: "POST", body: JSON.stringify(payload) },
    ),

  transactions: (query: VendorTransactionListQuery = {}) =>
    apiFetch<VendorTransactionListResult>(
      `/transactions/vendor${buildQueryString(query)}`,
    ),

  withdrawals: (query: VendorWithdrawalListQuery = {}) =>
    apiFetch<VendorWithdrawalListResult>(
      `/withdrawals/vendor${buildQueryString(query)}`,
    ),

  withdrawal: (withdrawalId: string) =>
    apiFetch<{ withdrawal: VendorWithdrawal }>(
      `/withdrawals/vendor/${encodeURIComponent(withdrawalId)}`,
    ),

  createWithdrawal: (payload: {
    amount: number;
    bankAccountId: string;
    idempotencyKey?: string;
    note?: string;
  }) =>
    apiFetch<VendorWithdrawalResult>("/withdrawals/vendor", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelWithdrawal: (withdrawalId: string, reason?: string) =>
    apiFetch<VendorWithdrawalResult>(
      `/withdrawals/vendor/${encodeURIComponent(withdrawalId)}/cancel`,
      { method: "POST", body: JSON.stringify({ reason }) },
    ),

  bankAccounts: () =>
    apiFetch<VendorBankAccountListResult>("/vendors/me/bank-accounts"),

  createBankAccount: (payload: VendorBankAccountPayload) =>
    apiFetch<{ account: VendorBankAccount }>("/vendors/me/bank-accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateBankAccount: (
    accountId: string,
    payload: Partial<VendorBankAccountPayload>,
  ) =>
    apiFetch<{ account: VendorBankAccount }>(
      `/vendors/me/bank-accounts/${encodeURIComponent(accountId)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),

  setDefaultBankAccount: (accountId: string) =>
    apiFetch<{ account: VendorBankAccount }>(
      `/vendors/me/bank-accounts/${encodeURIComponent(accountId)}/default`,
      { method: "POST" },
    ),

  deleteBankAccount: (accountId: string) =>
    apiFetch<{ deleted: boolean; archived: boolean }>(
      `/vendors/me/bank-accounts/${encodeURIComponent(accountId)}`,
      { method: "DELETE" },
    ),
};

/**
 * Vendor notifications share the generic notification API, but refresh through
 * the vendor/customer path rather than the admin one.
 */export const vendorNotificationApi = {
  list: (query: { unreadOnly?: boolean; page?: number; limit?: number } = {}) =>
    apiFetch<NotificationListResult>(
      `/notifications${buildQueryString(query)}`,
    ),

  markRead: (id: string) =>
    apiFetch<{ notification: ApiNotification }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
    ),

  markAllRead: () =>
    apiFetch<{ updated: number }>("/notifications/read-all", {
      method: "PATCH",
    }),
};

export type AdminWithdrawalListQuery = {
  status?: string;
  scope?: "open" | "settled";
  vendor?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

/**
 * Withdrawal review belongs to finance. Every call refreshes through the admin
 * session path so an expired console token is renewed, not rejected.
 */
export const adminWithdrawalApi = {
  list: (query: AdminWithdrawalListQuery = {}) =>
    apiFetch<AdminWithdrawalListResult>(
      `/withdrawals/admin${buildQueryString(query)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  get: (withdrawalId: string) =>
    apiFetch<{ withdrawal: AdminWithdrawal }>(
      `/withdrawals/admin/${encodeURIComponent(withdrawalId)}`,
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  decide: (
    withdrawalId: string,
    payload: AdminWithdrawalDecisionPayload,
  ) =>
    apiFetch<{ withdrawal: AdminWithdrawal }>(
      `/withdrawals/admin/${encodeURIComponent(withdrawalId)}/decision`,
      { method: "POST", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  bankAccounts: () =>
    apiFetch<AdminBankAccountListResult>(
      "/withdrawals/admin/bank-accounts",
      {},
      { refreshPath: ADMIN_REFRESH_PATH },
    ),

  verifyBankAccount: (
    accountId: string,
    payload: { status: "verified" | "rejected"; reason?: string },
  ) =>
    apiFetch<{ account: AdminBankAccount }>(
      `/withdrawals/admin/bank-accounts/${encodeURIComponent(accountId)}/verify`,
      { method: "POST", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};

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

  /** Fixed list vendors choose from when listing a product. */
  categoryOptions: () =>
    apiFetch<MarketplaceCategoryOptionListResult>(
      "/categories/options",
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

export const cartApi = {
  get: () => apiFetch<MarketplaceCart>("/cart"),

  replace: (payload: {
    items: { productId: string; quantity: number }[];
  }) =>
    apiFetch<MarketplaceCart>("/cart", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  merge: (payload: {
    items: { productId: string; quantity: number }[];
  }) =>
    apiFetch<MarketplaceCart>("/cart/merge", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const addressApi = {
  list: () => apiFetch<MarketplaceAddressListResult>("/addresses"),

  create: (payload: AddressPayload) =>
    apiFetch<{ address: MarketplaceAddress }>("/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (addressId: string, payload: Partial<AddressPayload>) =>
    apiFetch<{ address: MarketplaceAddress }>(
      `/addresses/${encodeURIComponent(addressId)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),

  remove: (addressId: string) =>
    apiFetch<{ deleted: boolean; promotedAddressId: string | null }>(
      `/addresses/${encodeURIComponent(addressId)}`,
      { method: "DELETE" },
    ),

  setDefault: (addressId: string) =>
    apiFetch<{ address: MarketplaceAddress }>(
      `/addresses/${encodeURIComponent(addressId)}/default`,
      { method: "POST" },
    ),
};

export interface CheckoutQuoteRequest {
  items: CheckoutItemPayload[];
  addressId?: string;
  deliverySelections?: Record<string, string>;
}

export const checkoutApi = {
  quote: (payload: CheckoutQuoteRequest) =>
    apiFetch<CheckoutQuoteResult>("/checkout/quote", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  place: (payload: PlaceCheckoutPayload) =>
    apiFetch<PlaceCheckoutResult>("/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  state: (masterOrderNumber: string) =>
    apiFetch<CheckoutStateResult>(
      `/checkout/${encodeURIComponent(masterOrderNumber)}`,
    ),
};

export const paymentApi = {
  methods: () =>
    apiFetch<PaymentMethodsResult>(
      "/payments/methods",
      {},
      { auth: false },
    ),

  /** Confirmation is always server-to-server; the browser cannot self-assert. */
  verify: (masterOrderNumber: string) =>
    apiFetch<{ payment: PaymentVerificationResult }>(
      `/payments/verify/${encodeURIComponent(masterOrderNumber)}`,
      { method: "POST" },
    ),

  retry: (masterOrderNumber: string) =>
    apiFetch<{
      masterOrderNumber: string;
      summary: CheckoutSummary;
      payment: PlaceCheckoutResult["payment"];
    }>(`/payments/retry/${encodeURIComponent(masterOrderNumber)}`, {
      method: "POST",
    }),
};

export type CustomerOrderListQuery = {
  status?: string;
  page?: number;
  limit?: number;
};

export const customerOrderApi = {
  list: (query: CustomerOrderListQuery = {}) =>
    apiFetch<MarketplaceOrderGroupListResult>(
      `/orders/customer${buildQueryString(query)}`,
    ),

  get: (reference: string) =>
    apiFetch<MarketplaceOrderDetailResult>(
      `/orders/customer/${encodeURIComponent(reference)}`,
    ),

  /**
   * Customer acknowledgement that the parcel arrived. Releases the vendor's
   * escrow immediately instead of waiting out the inspection window.
   */
  confirmReceipt: (orderId: string) =>
    apiFetch<{
      orderId: string;
      status: string;
      deliveredAt: string | null;
      released: boolean;
      releaseBlockedBy: string | null;
    }>(
      `/orders/customer/${encodeURIComponent(orderId)}/confirm-receipt`,
      { method: "POST" },
    ),

  /**
   * Cancels a paid order before the vendor accepts it. The API refunds the
   * payment automatically; the returned `refund.state` says whether the money
   * already moved or is still pending with Paystack.
   */
  cancel: (orderId: string, input: { reason?: string } = {}) =>
    apiFetch<{
      orderId: string;
      status: string;
      paymentStatus: string;
      cancelledAt: string | null;
      alreadyCancelled: boolean;
      refund: {
        state: string;
        refundStatus: string;
        amount: number;
      } | null;
    }>(`/orders/customer/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  /**
   * Opens a dispute for a shipped order, or a delivered one inside the 48-hour
   * window. An open dispute freezes the vendor's escrow until support resolves it.
   */
  createDispute: (
    orderId: string,
    input: { type: CustomerDisputeType; subject: string; description: string },
  ) =>
    apiFetch<{
      dispute: MarketplaceDisputeSummary & { isOpen: boolean };
      orderId: string;
      orderNumber: string;
      windowEndsAt: string | null;
    }>(`/disputes/customer/${encodeURIComponent(orderId)}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
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

  /**
   * Administrative release. `reason` is required by the API and is written to
   * the audit trail. An unresolved dispute always blocks the release.
   */
  release: (
    escrowId: string,
    input: { reason: string; force?: boolean },
  ) =>
    apiFetch<{
      _id: string;
      status: string;
      amountHeld: number;
      amountReleased: number;
      releasedAt: string | null;
    }>(
      `/escrow/${encodeURIComponent(escrowId)}/admin/release`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
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
    payload: {
      outcome: "release" | "refund";
      resolution: string;
      note?: string;
    },
  ) =>
    apiFetch<{ dispute: unknown }>(
      `/disputes/${encodeURIComponent(disputeId)}/admin/resolve`,
      { method: "POST", body: JSON.stringify(payload) },
      { refreshPath: ADMIN_REFRESH_PATH },
    ),
};
