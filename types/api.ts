export type UserRole = "user" | "vendor" | "admin";

/**
 * Built-in role keys are documented, but the API also stores administrator
 * created roles, so the type stays open to any registry key.
 */
export type AdminRole = string;

export type AdminStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type AdminInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type AdminPermission =
  | "dashboard.view"
  | "users.view"
  | "users.manage"
  | "vendors.view"
  | "vendors.manage"
  | "stores.view"
  | "stores.approve"
  | "stores.reject"
  | "stores.suspend"
  | "products.view"
  | "products.moderate"
  | "orders.view"
  | "orders.manage"
  | "transactions.view"
  | "escrow.view"
  | "financials.view"
  | "shipments.view"
  | "shipments.manage"
  | "disputes.view"
  | "disputes.manage"
  | "admins.view"
  | "admins.invite"
  | "admins.manage"
  | "roles.manage"
  | "audit_logs.view"
  | "settings.manage";

export interface ApiUser {
  _id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  isEmailVerified: boolean;
  profilePicture?: string | null;
  authProvider?: "local" | "google";
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiAdminUser extends ApiUser {
  role: "admin";
  adminRole: AdminRole;
  adminStatus: AdminStatus;
  permissionGrants?: AdminPermission[];
  permissionRevocations?: AdminPermission[];
  invitedAt?: string | null;
  invitedBy?: string | null;
  lastLoginAt?: string | null;
}

export interface AdminAuthResult {
  user: ApiAdminUser;
  token: { accessToken: string; refreshToken?: string };
  permissions: AdminPermission[];
}

export interface AdminProfile {
  user: ApiAdminUser;
  permissions: AdminPermission[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminInvitationSummary {
  _id: string;
  status: AdminInvitationStatus;
  adminRole: string;
  expiresAt: string | null;
  lastSentAt: string | null;
  acceptedAt: string | null;
  sendCount: number;
}

export interface AdminListEntry {
  admin: ApiAdminUser;
  permissions: AdminPermission[];
  invitation?: AdminInvitationSummary | null;
  invitationCount?: number;
}

export interface AdminListSummary {
  total: number;
  active: number;
  invited: number;
  suspended: number;
  deactivated: number;
}

export interface AdminListResult {
  admins: AdminListEntry[];
  summary?: AdminListSummary;
  pagination: PaginationMeta;
}

export interface AdminInvitation {
  _id: string;
  admin: string | ApiAdminUser | null;
  name: string;
  email: string;
  adminRole: string;
  status: AdminInvitationStatus;
  expiresAt: string | null;
  invitedBy:
    | string
    | { _id: string; name: string; email: string; adminRole?: string }
    | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  revokedBy:
    | string
    | { _id: string; name: string; email: string; adminRole?: string }
    | null;
  lastSentAt: string | null;
  sendCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  isExpired: boolean;
}

export interface AdminInvitationListResult {
  invitations: AdminInvitation[];
  summary: Record<AdminInvitationStatus, number>;
  pagination: PaginationMeta;
}

export interface AdminInvitationDetailResult {
  invitation: AdminInvitation;
  admin: ApiAdminUser | null;
}

export interface AdminAuditEntry {
  _id: string;
  actor: string | null;
  actorName?: string;
  actorEmail?: string | null;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  previousState: unknown;
  newState: unknown;
  reason: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  createdAt: string;
}

export interface AdminDetailResult {
  admin: ApiAdminUser;
  permissions: AdminPermission[];
  invitation: AdminInvitation | null;
  invitations: AdminInvitation[];
  auditLogs?: AdminAuditEntry[];
}

export interface AdminRoleDefinition {
  _id: string;
  key: string;
  label: string;
  description: string;
  permissions: AdminPermission[];
  system: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  adminCount?: number;
}

export interface AdminRoleListResult {
  roles: AdminRoleDefinition[];
  summary: { total: number; system: number; custom: number };
  pagination: PaginationMeta;
}

export interface AdminRoleDetailResult {
  role: AdminRoleDefinition;
}

export interface PermissionCatalogueEntry {
  key: AdminPermission;
  label: string;
}

export interface PermissionCatalogue {
  permissions: PermissionCatalogueEntry[];
  groups: Array<{ label: string; permissions: PermissionCatalogueEntry[] }>;
}

export type AuditEntityType =
  | "admin"
  | "admin_role"
  | "invitation"
  | "user"
  | "vendor"
  | "store"
  | "product"
  | "order"
  | "payment"
  | "escrow"
  | "shipment"
  | "dispute"
  | "settings"
  | "platform";

export interface AuditLogEntry extends AdminAuditEntry {
  entityType: AuditEntityType;
}

export interface AuditLogListResult {
  logs: AuditLogEntry[];
  summary: {
    total: number;
    entityTypes: Array<{ _id: string; count: number }>;
    actions: Array<{ _id: string; count: number }>;
  };
  pagination: PaginationMeta;
}

export interface AuditLogDetailResult {
  log: AuditLogEntry;
}

export interface PlatformSettings {
  marketplace: {
    name: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string | null;
    currency: "NGN";
    timezone: "Africa/Lagos";
  };
  commission: {
    ratePercent: number;
    note: string;
    appliesToRecordedPayments: false;
  };
  productCategories: string[];
  storeApproval: {
    requireManualReview: boolean;
    autoApproveVerifiedStores: boolean;
    reviewSlaHours: number;
  };
  shipping: {
    provider: "shipbubble";
    defaultDeliveryFee: number;
    freeShippingThreshold: number | null;
    estimatedDeliveryDays: number;
  };
  notifications: {
    emailEnabled: boolean;
    adminDailyDigest: boolean;
    vendorAlerts: boolean;
    disputeAlerts: boolean;
    storeSubmissionAlerts: boolean;
  };
  security: {
    invitationExpiryHours: number;
    passwordResetExpiryMinutes: number;
    auditRetentionDays: number;
    requireReasonForDestructiveActions: boolean;
  };
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface PlatformSettingsResult {
  settings: PlatformSettings;
  financialPolicy: {
    commissionSnapshot: boolean;
    escrowManagedBy: string;
    note: string;
  };
}

export interface UpdatePlatformSettingsPayload {
  marketplace?: Partial<PlatformSettings["marketplace"]>;
  commission?: Partial<Omit<PlatformSettings["commission"], "appliesToRecordedPayments">>;
  productCategories?: string[];
  storeApproval?: Partial<PlatformSettings["storeApproval"]>;
  shipping?: Partial<PlatformSettings["shipping"]>;
  notifications?: Partial<PlatformSettings["notifications"]>;
  security?: Partial<PlatformSettings["security"]>;
  reason?: string;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: ApiUser;
  token: AuthTokenPair;
}

export type BusinessType =
  | "individual"
  | "sole_proprietorship"
  | "partnership"
  | "limited_company"
  | "other";

export type StoreStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "closed";

export type StoreDocumentType =
  | "cac_certificate"
  | "business_name_certificate"
  | "tin_certificate"
  | "utility_bill"
  | "government_id"
  | "bank_statement"
  | "other";

export type IdType =
  | "nin"
  | "bvn"
  | "passport"
  | "drivers_license"
  | "voters_card";

export type OperatingDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type UploadPurpose =
  | "store_document"
  | "store_logo"
  | "store_cover"
  | "profile_picture";

export interface UploadedFile {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  originalName: string;
  purpose: UploadPurpose;
  documentType: StoreDocumentType | null;
}

export interface StoreAddress {
  street: string;
  city: string;
  lga: string;
  state: string;
  country: string;
  landmark?: string | null;
  postalCode?: string | null;
}

export interface OperatingHour {
  day: OperatingDay;
  isOpen: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}

export interface StoreRepresentative {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idType: IdType;
  idNumber: string;
  nin?: string | null;
  bvn?: string | null;
}

export interface SettlementAccount {
  bankName: string;
  bankCode: string;
  accountName: string;
  accountNumber: string;
}

export interface StoreDocument {
  type: StoreDocumentType;
  url: string;
  name?: string | null;
}

export interface ApiStore {
  _id: string;
  owner: string | { _id: string; name: string; email: string; role: UserRole };
  name: string;
  legalBusinessName: string;
  slug: string;
  email: string;
  phoneNumber: string;
  description?: string | null;
  businessType: BusinessType;
  category: string;
  cacRegistrationNumber?: string | null;
  tin?: string | null;
  scumlNumber?: string | null;
  businessRegistrationDate?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  featured?: boolean;
  status: StoreStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  address: StoreAddress;
  location: { type: "Point"; coordinates: [number, number] };
  operatingHours: OperatingHour[];
  pickupInstructions?: string | null;
  representative: StoreRepresentative;
  settlementAccount: SettlementAccount;
  documents: StoreDocument[];
  compliance: {
    termsAccepted: boolean;
    dataProcessingConsent: boolean;
    acceptedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface StorePayload {
  name: string;
  legalBusinessName: string;
  slug?: string;
  email: string;
  phoneNumber: string;
  description?: string;
  businessType: BusinessType;
  category: string;
  cacRegistrationNumber?: string;
  tin?: string;
  scumlNumber?: string;
  businessRegistrationDate?: string;
  logo?: string;
  coverImage?: string;
  address: StoreAddress;
  location: { type: "Point"; coordinates: [number, number] };
  operatingHours: OperatingHour[];
  pickupInstructions?: string;
  representative: StoreRepresentative;
  settlementAccount: SettlementAccount;
  documents: StoreDocument[];
  compliance: { termsAccepted: true; dataProcessingConsent: true };
}

/* -------------------------------------------------------------------------- */
/* Admin dashboard                                                            */
/* -------------------------------------------------------------------------- */

export type DashboardRangeKey = "today" | "7d" | "30d" | "90d" | "custom";

export interface DashboardRangeDTO {
  key: DashboardRangeKey;
  label: string;
  /** Inclusive start (ISO instant). */
  start: string;
  /** Exclusive end (ISO instant), clamped to the request time. */
  end: string;
  granularity: "hour" | "day";
  timezone: string;
}

export type DashboardMetricKey =
  | "totalUsers"
  | "totalVendors"
  | "activeVendors"
  | "totalStores"
  | "pendingStoreApprovals"
  | "totalProducts"
  | "pendingProductApprovals"
  | "totalOrders"
  | "grossMerchandiseValue"
  | "marketplaceRevenue"
  | "escrowBalance"
  | "unresolvedDisputes";

export interface DashboardMetric {
  key: DashboardMetricKey;
  label: string;
  description: string;
  basis: "all_time" | "range";
  format: "number" | "currency";
  value: number;
  previousValue?: number;
  /** `null` when there is no comparable previous period. */
  changePct?: number | null;
}

export type DashboardSeriesKey =
  | "orders"
  | "salesVolume"
  | "marketplaceRevenue"
  | "vendorRegistrations"
  | "storeApprovals";

export interface DashboardPoint {
  key: string;
  label: string;
  value: number;
}

export interface DashboardSeries {
  key: DashboardSeriesKey;
  label: string;
  description: string;
  kind: "count" | "currency";
  total: number;
  points: DashboardPoint[];
}

export type DashboardPendingActionKey =
  | "store_approvals"
  | "product_moderation"
  | "delayed_orders"
  | "failed_shipments"
  | "unresolved_disputes"
  | "payment_issues";

export interface DashboardPendingAction {
  key: DashboardPendingActionKey;
  label: string;
  description: string;
  count: number;
  oldestAt: string | null;
  href: string;
  severity: "high" | "medium" | "low";
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  channel: "marketplace" | "administration";
  title: string;
  description: string | null;
  actorName: string;
  actorRole: string;
  subjectType: string;
  subjectLabel: string | null;
  href: string | null;
  createdAt: string;
}

export interface DashboardOverview {
  range: DashboardRangeDTO;
  metrics: DashboardMetric[];
  charts: DashboardSeries[];
  pendingActions: DashboardPendingAction[];
  recentActivity: DashboardActivityItem[];
  generatedAt: string;
}

export interface DashboardMetricsResult {
  range: DashboardRangeDTO;
  metrics: DashboardMetric[];
  generatedAt: string;
}

export interface DashboardChartsResult {
  range: DashboardRangeDTO;
  series: DashboardSeries[];
  generatedAt: string;
}

export interface DashboardPendingActionsResult {
  items: DashboardPendingAction[];
  total: number;
  generatedAt: string;
}

export interface DashboardRecentActivityResult {
  range: DashboardRangeDTO | null;
  items: DashboardActivityItem[];
  generatedAt: string;
}

export interface DashboardQuery {
  range?: DashboardRangeKey;
  from?: string;
  to?: string;
  limit?: number;
}

/* -------------------------------------------------------------------------- */
/* Vendors, stores and verification                                           */
/* -------------------------------------------------------------------------- */

export type StoreReviewAction =
  | "submitted"
  | "resubmitted"
  | "approved"
  | "rejected"
  | "information_requested"
  | "suspended"
  | "reactivated"
  | "closed";

export interface ApiStoreReview {
  _id: string;
  store: string;
  action: StoreReviewAction;
  fromStatus: StoreStatus | null;
  toStatus: StoreStatus | null;
  reason?: string | null;
  message?: string | null;
  actor?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        adminRole?: AdminRole;
      }
    | null;
  actorRole: "admin" | "vendor" | "system";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreReadiness {
  ready: boolean;
  missing: string[];
}

export interface VendorStoreSummary {
  _id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  category: string;
  businessType: BusinessType;
  logo?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export interface VendorMetrics {
  products: number;
  orders: number;
  revenue: number;
}

export interface VendorListEntry {
  vendor: ApiUser;
  store: VendorStoreSummary | null;
  metrics: VendorMetrics;
}

export interface VendorListResult {
  vendors: VendorListEntry[];
  pagination: PaginationMeta;
}

export interface VendorDetail {
  vendor: ApiUser;
  store: ApiStore | null;
  history: ApiStoreReview[];
  metrics: VendorMetrics & {
    transactions: number;
    transactionVolume: number;
  };
}

export type AdminStoreSummary = Record<StoreStatus, number>;

export interface AdminStoreListResult {
  stores: ApiStore[];
  summary: AdminStoreSummary;
  pagination: PaginationMeta;
}

export interface AdminStoreMetrics {
  products: number;
  orders: number;
  orderRevenue: number;
  transactions: number;
  transactionVolume: number;
}

export interface AdminStoreDetail {
  store: ApiStore;
  history: ApiStoreReview[];
  readiness: StoreReadiness;
  metrics: AdminStoreMetrics;
}

export interface AdminStoreHistoryResult {
  history: ApiStoreReview[];
  pagination: PaginationMeta;
}

export type ProductStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "archived";

export type ProductPublicationStatus = "unpublished" | "published";

export type ProductReviewAction =
  | "submitted"
  | "approved"
  | "rejected"
  | "suspended"
  | "restored";

export interface ApiProductVendorSummary {
  _id: string;
  name: string;
  email: string;
  username?: string | null;
  status?: ApiUser["status"];
  profilePicture?: string | null;
}

export interface ApiProductStoreSummary {
  _id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  category?: string;
  logo?: string | null;
}

export interface ApiProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  featured?: boolean;
  status: ProductStatus;
  publicationStatus: ProductPublicationStatus;
  vendor?: string | ApiProductVendorSummary;
  store?: string | ApiProductStoreSummary;
  rejectionReason?: string | null;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  previousStatus?: ProductStatus | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiProductReview {
  _id: string;
  product: string;
  action: ProductReviewAction;
  fromStatus: ProductStatus | null;
  toStatus: ProductStatus | null;
  reason?: string | null;
  message?: string | null;
  actor?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        adminRole?: AdminRole;
      }
    | null;
  actorRole: "admin" | "vendor" | "system";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export type AdminProductSummary = Record<ProductStatus, number>;
export type AdminProductPublicationSummary = Record<
  ProductPublicationStatus,
  number
>;

export interface AdminProductListResult {
  products: ApiProduct[];
  summary: AdminProductSummary;
  publicationSummary: AdminProductPublicationSummary;
  pagination: PaginationMeta;
}

export interface PendingProductListResult {
  products: ApiProduct[];
  summary: AdminProductSummary;
  pagination: PaginationMeta;
}

export interface AdminProductDetail {
  product: ApiProduct;
  history: ApiProductReview[];
}

export interface ProductFilterOptions {
  categories: string[];
  vendors: Array<{ value: string; label: string; email?: string }>;
  stores: Array<{
    value: string;
    label: string;
    vendor?: string | null;
    category?: string | null;
  }>;
}

export interface VendorProductsResult {
  products: ApiProduct[];
  pagination: PaginationMeta;
}

export interface ApiOrderItem {
  product: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ApiOrder {
  _id: string;
  orderNumber: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  total: number;
  items: ApiOrderItem[];
  placedAt: string;
  createdAt: string;
}

export interface VendorOrdersResult {
  orders: ApiOrder[];
  pagination: PaginationMeta;
}

export interface ApiTransaction {
  _id: string;
  reference: string;
  amount: number;
  platformFee: number;
  vendorAmount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  channel: "card" | "bank_transfer" | "ussd" | "wallet";
  paidAt?: string | null;
  createdAt: string;
}

export interface VendorTransactionsResult {
  transactions: ApiTransaction[];
  pagination: PaginationMeta;
}

export interface VendorVerificationResult {
  history: ApiStoreReview[];
  stores: Array<{
    _id: string;
    name: string;
    status: StoreStatus;
    submittedAt?: string | null;
    reviewedAt?: string | null;
  }>;
  pagination: PaginationMeta;
}

export interface ApiAdminNote {
  _id: string;
  vendor: string;
  store?:
    | string
    | { _id: string; name: string; status: StoreStatus }
    | null;
  body: string;
  author:
    | string
    | { _id: string; name: string; email: string; adminRole?: AdminRole };
  createdAt: string;
  updatedAt?: string;
}

export interface VendorNotesResult {
  notes: ApiAdminNote[];
  pagination: PaginationMeta;
}

export type NotificationType =
  | "store_submitted"
  | "store_approved"
  | "store_rejected"
  | "store_information_requested"
  | "store_suspended"
  | "store_reactivated"
  | "vendor_suspended"
  | "vendor_reactivated"
  | "product_approved"
  | "product_rejected"
  | "product_suspended"
  | "product_restored";

export interface ApiNotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  readAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResult {
  notifications: ApiNotification[];
  unread: number;
  pagination: PaginationMeta;
}

/* -------------------------------------------------------------------------- */
/* Orders and logistics                                                       */
/* -------------------------------------------------------------------------- */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

export type ShipmentStatus =
  | "pending"
  | "confirmed"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export type OrderTimelineEventType =
  | "created"
  | "payment_confirmed"
  | "vendor_notified"
  | "processing"
  | "shipment_created"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export interface ApiOrderParty {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  phone?: string | null;
  profilePicture?: string | null;
  status?: string;
}

export interface ApiOrderStoreSummary {
  _id: string;
  name: string;
  slug?: string;
  status?: string;
  category?: string | null;
  logo?: string | null;
}

export interface ApiOrderAddress {
  recipientName?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  lga?: string | null;
  state?: string | null;
  country?: string | null;
  landmark?: string | null;
}

export interface ApiOrderEvent {
  _id?: string;
  type: OrderTimelineEventType;
  occurredAt: string;
  description?: string | null;
  source?: string;
}

export interface ApiShipmentEvent {
  key: string;
  status?: string | null;
  message?: string | null;
  location?: string | null;
  occurredAt: string;
  source: "provider" | "webhook" | "system";
  receivedAt?: string | null;
}

export interface ApiShipmentCourier {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  trackingCode?: string | null;
  trackingMessage?: string | null;
}

export interface ApiShipment {
  _id: string;
  order: ApiAdminOrder | string;
  trackingNumber: string;
  providerOrderId?: string | null;
  provider: string;
  status: ShipmentStatus;
  providerStatus?: string | null;
  failureReason?: string | null;
  estimatedDeliveryAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  lastEventAt?: string | null;
  trackingUrl?: string | null;
  courier?: ApiShipmentCourier | null;
  events?: ApiShipmentEvent[];
  providerResponse?: unknown;
  providerError?: string | null;
  lastSyncedAt?: string | null;
  lastSyncAttemptAt?: string | null;
  syncAttempts?: number;
  lastWebhookAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPayment {
  _id: string;
  reference: string;
  order: string;
  customer?: string;
  store?: string;
  vendor?: string;
  amount: number;
  platformFee: number;
  vendorAmount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  channel: "card" | "bank_transfer" | "ussd" | "wallet";
  paidAt?: string | null;
  failedReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiEscrow {
  _id: string;
  order: string;
  payment: string;
  store: string;
  vendor: string;
  amountHeld: number;
  amountReleased: number;
  amountRefunded: number;
  status: "held" | "released" | "refunded";
  heldAt?: string | null;
  releaseDueAt?: string | null;
  releasedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * An order row. Orders are vendor-specific fulfilment records; when a checkout
 * spans vendors the `masterOrderNumber` groups them. List rows also carry the
 * derived `fulfillmentStatus` and a denormalised party summary, while detail
 * rows expose the populated `customer`, `vendor` and `store` documents.
 */
export interface ApiAdminOrder {
  _id: string;
  orderNumber: string;
  masterOrderNumber?: string | null;
  subOrderNumber?: string | null;
  customer: ApiOrderParty | string;
  vendor: ApiOrderParty | string;
  store: ApiOrderStoreSummary | string;
  customerSummary?: ApiOrderParty | null;
  vendorSummary?: ApiOrderParty | null;
  storeSummary?: ApiOrderStoreSummary | null;
  items: ApiOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  discountCode?: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingAddress?: ApiOrderAddress | null;
  timeline?: ApiOrderEvent[];
  placedAt?: string | null;
  expectedDeliveryAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  fulfillmentStatus: FulfillmentStatus;
  shipmentCount?: number;
  shipmentStatuses?: ShipmentStatus[];
  latestShipment?: ApiShipment | null;
  shipments?: ApiShipment[];
  payment?: ApiPayment | null;
  escrow?: ApiEscrow | null;
}

export interface ApiOrderTimelineEvent {
  id: string;
  type: OrderTimelineEventType;
  label: string;
  description: string | null;
  occurredAt: string;
  orderId: string;
  orderNumber: string;
  subOrderNumber: string | null;
  reference: string | null;
}

export interface ApiOrderGroupSummary {
  masterOrderNumber: string | null;
  orderCount: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  createdAt: string | null;
  customer: ApiOrderParty | string | null;
  shippingAddress: ApiOrderAddress | null;
  statusCounts: Record<string, number>;
  paymentStatusCounts: Record<string, number>;
}

export interface AdminOrderListResult {
  orders: ApiAdminOrder[];
  summary: Record<string, number>;
  paymentSummary: Record<string, number>;
  fulfillmentSummary: Record<string, number>;
  shipmentSummary: Record<string, number>;
  pagination: PaginationMeta;
}

export interface AdminOrderDetail {
  order: ApiAdminOrder;
  masterOrderNumber: string;
  summary: ApiOrderGroupSummary;
  subOrders: ApiAdminOrder[];
  payments: ApiPayment[];
  escrows: ApiEscrow[];
  shipments: ApiShipment[];
  timeline: ApiOrderTimelineEvent[];
}

export interface AdminOrderTimelineResult {
  events: ApiOrderTimelineEvent[];
  pagination: PaginationMeta;
}

export interface AdminOrderSubOrdersResult {
  subOrders: ApiAdminOrder[];
  pagination: PaginationMeta;
}

export interface AdminOrderShipmentsResult {
  shipments: ApiShipment[];
  pagination: PaginationMeta;
}

export interface AdminShipmentListResult {
  shipments: ApiShipment[];
  summary: Record<string, number>;
  pagination: PaginationMeta;
}

export interface ApiShipmentProviderInfo {
  name: string;
  orderId: string | null;
  status: string | null;
  lastSyncedAt: string | null;
  lastSyncAttemptAt: string | null;
  syncAttempts: number;
  error: string | null;
  response: unknown;
}

export interface AdminShipmentDetail {
  shipment: ApiShipment;
  order: ApiAdminOrder | null;
  siblingShipments: ApiShipment[];
  provider: ApiShipmentProviderInfo;
}

export interface AdminShipmentTrackingResult {
  events: ApiShipmentEvent[];
  shipment: {
    id: string;
    trackingNumber: string;
    status: ShipmentStatus;
    providerStatus: string | null;
    failureReason: string | null;
    estimatedDeliveryAt: string | null;
    deliveredAt: string | null;
    courier: ApiShipmentCourier | null;
    lastEventAt: string | null;
  };
  pagination: PaginationMeta;
}

/* -------------------------------------------------------------------------- */
/* User management, financial operations and disputes                         */
/* -------------------------------------------------------------------------- */

export interface ApiOrderReference {
  _id: string;
  orderNumber: string;
  masterOrderNumber?: string | null;
  subOrderNumber?: string | null;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  total?: number;
  createdAt?: string;
}

export interface AdminUserMetrics {
  orders: number;
  customerOrders: number;
  vendorOrders: number;
  transactionValue: number;
  customerSpend: number;
  vendorProceeds: number;
  disputes: number;
}

export interface AdminUserListEntry extends ApiUser {
  metrics: AdminUserMetrics;
}

export interface AdminUserListResult {
  users: AdminUserListEntry[];
  summary: {
    roles: Record<string, number>;
    statuses: Record<string, number>;
    total: number;
  };
  pagination: PaginationMeta;
}

export interface AdminUserDetail {
  user: ApiUser & {
    adminRole?: AdminRole | null;
    adminStatus?: AdminStatus | null;
    lastLoginAt?: string | null;
  };
  store: ApiStore | null;
  metrics: {
    orders: number;
    orderValue: number;
    deliveredOrders: number;
    transactions: number;
    transactionValue: number;
    refundedValue: number;
    disputes: number;
  };
  recentOrders: ApiAdminOrder[];
  recentTransactions: AdminTransactionEntry[];
  disputes: ApiDispute[];
  notes: ApiAdminNote[];
}

export interface AdminUserCollectionQuery {
  search?: string;
  status?: string;
  paymentStatus?: string;
  side?: "customer" | "vendor";
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserOrdersResult {
  side: "customer" | "vendor";
  orders: ApiAdminOrder[];
  pagination: PaginationMeta;
}

export interface AdminUserTransactionsResult {
  side: "customer" | "vendor";
  transactions: AdminTransactionEntry[];
  pagination: PaginationMeta;
}

export type TransactionType = "payment" | "refund";

export interface AdminTransactionEntry
  extends Omit<ApiPayment, "order" | "customer" | "vendor" | "store"> {
  order: ApiOrderReference | string | null;
  customer?: ApiUser | string | null;
  vendor?: ApiUser | string | null;
  store?: ApiStore | string | null;
  transactionType: TransactionType;
  escrow?: AdminEscrowEntry | null;
}

export interface AdminTransactionListResult {
  transactions: AdminTransactionEntry[];
  summary: {
    total: number;
    statusCounts: Record<string, number>;
    successfulVolume: number;
    refundedVolume: number;
    platformFees: number;
  };
  pagination: PaginationMeta;
}

export interface AdminTransactionDetail {
  transaction: AdminTransactionEntry;
  escrow: ApiEscrow | null;
  disputes: ApiDispute[];
  verification: {
    source: string;
    providerConfigured: boolean;
    providerReference: string | null;
    message: string;
  };
}

export type EscrowReleaseStatus = "released" | "refunded" | "due" | "scheduled";

export interface AdminEscrowEntry
  extends Omit<ApiEscrow, "order" | "payment" | "store" | "vendor"> {
  order:
    | (ApiOrderReference & {
        customer?: ApiUser | string | null;
        vendor?: ApiUser | string | null;
        store?: ApiStore | string | null;
      })
    | string
    | null;
  payment: ApiPayment | string | null;
  store?: ApiStore | string | null;
  vendor?: ApiUser | string | null;
  availableHeld: number;
  releaseStatus: EscrowReleaseStatus;
  dispute: ApiDispute | null;
  blockchain: {
    supported: boolean;
    reference: string | null;
    network: string | null;
    message?: string;
  };
}

export interface AdminEscrowListResult {
  escrows: AdminEscrowEntry[];
  summary: {
    total: number;
    statusCounts: Record<string, number>;
    heldBalance: number;
    releasedVolume: number;
    refundedVolume: number;
  };
  pagination: PaginationMeta;
}

export interface AdminEscrowDetail {
  escrow: AdminEscrowEntry;
  order: ApiAdminOrder | null;
  payment: ApiPayment | null;
  customer: ApiUser | null;
  vendor: ApiUser | null;
  store: ApiStore | null;
  disputes: ApiDispute[];
  settlement: {
    amountHeld: number;
    amountReleased: number;
    amountRefunded: number;
    availableHeld: number;
    releaseDueAt: string | null;
    releasedAt: string | null;
    releaseStatus: EscrowReleaseStatus;
  };
  blockchain: {
    supported: boolean;
    reference: string | null;
    network: string | null;
    message: string;
  };
}

export interface FinancialTotals {
  gmv: number;
  paymentVolume: number;
  commission: number;
  refundVolume: number;
  refundedCommission: number;
  settlementVolume: number;
  netRevenue: number;
  escrowBalance: number;
  orders: number;
  successfulPayments: number;
  refunds: number;
  releases: number;
}

export type FinancialChangeKey =
  | "gmv"
  | "paymentVolume"
  | "commission"
  | "refundVolume"
  | "settlementVolume"
  | "netRevenue";

export interface FinancialOverviewResult {
  range: DashboardRangeDTO;
  totals: FinancialTotals;
  previous: FinancialTotals;
  change: Record<FinancialChangeKey, number | null>;
  definitions: Record<string, string>;
  escrowBasis: "all_time";
  generatedAt: string;
}

export interface FinancialSeriesPoint {
  key: string;
  label: string;
  value: number;
  count: number;
}

export interface RevenueVendorRow {
  vendorId: string | null;
  name: string;
  email: string | null;
  stores: string[];
  commission: number;
  refundedCommission: number;
  netRevenue: number;
  paymentVolume: number;
  payments: number;
}

export interface FinancialRevenueResult {
  range: DashboardRangeDTO;
  totals: FinancialTotals;
  series: {
    commission: FinancialSeriesPoint[];
    refunds: FinancialSeriesPoint[];
  };
  vendors: RevenueVendorRow[];
  platform: {
    commission: number;
    refundedCommission: number;
    netRevenue: number;
  };
  generatedAt: string;
}

export type ReconciliationResult =
  | "matched"
  | "missing"
  | "amount_mismatch"
  | "status_mismatch";

export interface ReconciliationRecord {
  _id: string;
  reference: string;
  amount: number;
  platformFee: number;
  vendorAmount: number;
  currency: string;
  status: ApiPayment["status"];
  channel: ApiPayment["channel"];
  paidAt?: string | null;
  createdAt: string;
  result: ReconciliationResult;
  escrow: ApiEscrow | null;
  order: ApiOrderReference | null;
  customer: ApiUser | null;
  vendor: ApiUser | null;
  stores: string[];
  expectedEscrowAmount?: number | null;
  recordedEscrowAmount?: number | null;
}

export interface ReconciliationReport {
  range: DashboardRangeDTO;
  records: ReconciliationRecord[];
  summary: Record<ReconciliationResult, number> & {
    total: number;
    unresolved: number;
  };
  pagination: PaginationMeta;
  externalVerification: {
    configured: boolean;
    provider: string | null;
    checkedAt: string | null;
    source: "internal_ledger_only";
    message: string;
  };
  generatedAt: string;
}

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "AWAITING_INFORMATION"
  | "RESOLVED"
  | "CLOSED";

export type DisputeCategory =
  | "payment"
  | "order"
  | "delivery"
  | "product"
  | "vendor";

export type DisputePriority = "low" | "medium" | "high";

export interface ApiDisputeEvidence {
  _id: string;
  label: string;
  url?: string | null;
  note?: string | null;
  addedBy?: string | ApiUser | null;
  createdAt: string;
}

export interface ApiDisputeNote {
  _id: string;
  body: string;
  author: string | ApiUser;
  createdAt: string;
}

export type DisputeHistoryAction =
  | "created"
  | "assigned"
  | "status_changed"
  | "note_added"
  | "information_requested"
  | "resolved"
  | "closed";

export interface ApiDisputeHistoryEntry {
  _id: string;
  action: DisputeHistoryAction;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  actor?: string | ApiUser | null;
  createdAt: string;
}

export interface ApiDispute {
  _id: string;
  reference: string;
  order: ApiOrderReference | string | null;
  raisedBy: ApiUser | string | null;
  vendor: ApiUser | string | null;
  store: ApiStore | string | null;
  type: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  subject: string;
  description?: string | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  assignedTo?: ApiUser | string | null;
  assignedBy?: ApiUser | string | null;
  assignedAt?: string | null;
  informationRequest?: string | null;
  evidence: ApiDisputeEvidence[];
  notes: ApiDisputeNote[];
  history: ApiDisputeHistoryEntry[];
  isOpen?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminDisputeListResult {
  disputes: ApiDispute[];
  summary: {
    statuses: Record<string, number>;
    total: number;
  };
  pagination: PaginationMeta;
}

export interface AdminDisputeDetail {
  dispute: ApiDispute;
  order: ApiOrderReference | ApiAdminOrder | null;
  customer: ApiUser | null;
  vendor: ApiUser | null;
  store: ApiStore | null;
  assignment: {
    assignedTo: ApiUser | null;
    assignedBy: ApiUser | null;
    assignedAt: string | null;
  };
  history: ApiDisputeHistoryEntry[];
  notes: ApiDisputeNote[];
  evidence: ApiDisputeEvidence[];
  financials: {
    orderTotal: number | null;
    escrowModified: boolean;
    note: string;
  };
}

/* -------------------------------------------------------------------------- */
/* Public marketplace                                                         */
/* -------------------------------------------------------------------------- */

export type PublicProductAvailability = "in_stock" | "out_of_stock";
export type PublicProductSortField =
  | "createdAt"
  | "price"
  | "name"
  | "featured";
export type PublicStoreSortField = "name" | "createdAt" | "productCount";
export type PublicCategorySortField = "name" | "productCount";
export type MarketplaceSearchType = "all" | "products" | "stores";
export type MarketplaceSearchSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc";

export interface MarketplaceProductStoreSummary {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  category: string;
}

export interface MarketplaceProductVendorSummary {
  _id: string;
  name: string;
}

export interface MarketplaceProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  images: string[];
  price: number;
  compareAtPrice?: number | null;
  discountPercent: number;
  currency: "NGN";
  stock: number;
  inStock: boolean;
  category: string;
  store: MarketplaceProductStoreSummary | null;
  vendor: MarketplaceProductVendorSummary | null;
  featured: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MarketplaceStoreAddress {
  street?: string | null;
  city?: string | null;
  lga?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface MarketplaceStore {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  category: string;
  address: MarketplaceStoreAddress | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  operatingHours: Array<{
    day: string;
    isOpen: boolean;
    openingTime?: string | null;
    closingTime?: string | null;
  }>;
  pickupInstructions?: string | null;
  productCount: number;
  featured: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MarketplaceCategory {
  key: string;
  name: string;
  productCount: number;
  storeCount: number;
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

export type MarketplaceProductQuery = {
  search?: string;
  category?: string;
  store?: string;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: PublicProductAvailability;
  sortBy?: PublicProductSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type MarketplaceStoreQuery = {
  search?: string;
  category?: string;
  state?: string;
  city?: string;
  lga?: string;
  sortBy?: PublicStoreSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type MarketplaceCategoryQuery = {
  search?: string;
  sortBy?: PublicCategorySortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export interface MarketplaceSearchQuery {
  query?: string;
  q?: string;
  category?: string;
  type?: MarketplaceSearchType;
  sortBy?: MarketplaceSearchSort;
  page?: number;
  limit?: number;
}

export interface MarketplaceProductListResult {
  products: MarketplaceProduct[];
  pagination: PaginationMeta;
}

export interface MarketplaceStoreListResult {
  stores: MarketplaceStore[];
  pagination: PaginationMeta;
}

export interface MarketplaceCategoryListResult {
  categories: MarketplaceCategory[];
  pagination: PaginationMeta;
}

export interface MarketplaceRankedProductListResult
  extends MarketplaceProductListResult {
  ranking: {
    basis: "sales" | "newest";
    windowDays: number | null;
    label: string;
  };
}

export interface MarketplaceFeaturedStoreListResult
  extends MarketplaceStoreListResult {
  ranking: {
    basis: "featured" | "newest";
    label: string;
  };
}

export interface MarketplaceProductDetailResult {
  product: MarketplaceProduct;
  related: MarketplaceProduct[];
}

export interface MarketplaceStoreDetailResult {
  store: MarketplaceStore;
}

export interface MarketplaceCategoryDetailResult {
  category: MarketplaceCategory;
}

export interface MarketplaceCategoryProductsResult
  extends MarketplaceProductListResult {
  category: MarketplaceCategory;
}

export interface MarketplaceStoreProductsResult
  extends MarketplaceProductListResult {
  store: MarketplaceStore;
}

export interface MarketplaceSearchResult {
  query: string;
  type: MarketplaceSearchType;
  category: string | null;
  sortBy: MarketplaceSearchSort;
  products?: MarketplaceProductListResult;
  stores?: MarketplaceStoreListResult;
}
