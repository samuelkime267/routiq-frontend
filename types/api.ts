export type UserRole = "user" | "vendor" | "admin";

export type AdminRole =
  | "SUPER_ADMIN"
  | "OPERATIONS_ADMIN"
  | "FINANCE_ADMIN"
  | "SUPPORT_ADMIN"
  | "CATALOG_ADMIN";

export type AdminStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type AdminPermission =
  | "dashboard.view"
  | "users.view"
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
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  isEmailVerified: boolean;
  profilePicture?: string | null;
  authProvider?: "local" | "google";
  suspensionReason?: string | null;
  suspendedAt?: string | null;
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

export interface AdminListEntry {
  admin: ApiAdminUser;
  permissions: AdminPermission[];
}

export interface AdminListResult {
  admins: AdminListEntry[];
  pagination: PaginationMeta;
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

export interface ApiProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "draft" | "pending" | "approved" | "rejected" | "archived";
  createdAt: string;
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
  | "vendor_reactivated";

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
