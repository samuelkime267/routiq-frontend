"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterBar";
import { TextareaField } from "@/components/ui/FormField";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import VendorStatusDialog from "@/components/admin/vendors/VendorStatusDialog";
import { useResource } from "@/hooks/useResource";
import { useServerTable } from "@/hooks/useServerTable";
import { ApiError, vendorApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { applyApiFieldErrors } from "@/lib/form";
import { formatNaira, formatNumber } from "@/lib/format";
import { adminNoteSchema, type AdminNoteValues } from "@/lib/schemas/store";
import {
  formatBusinessType,
  formatStoreDocument,
  reviewActionPresentation,
  reviewActorName,
  storeStatusLabel,
} from "@/lib/vendors";
import type {
  ApiAdminNote,
  ApiOrder,
  ApiProduct,
  ApiStore,
  ApiStoreReview,
  ApiTransaction,
  ApiUser,
  VendorDetail,
  VendorVerificationResult,
} from "@/types/api";

type TabId =
  | "overview"
  | "store"
  | "products"
  | "orders"
  | "transactions"
  | "verification"
  | "notes";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "store", label: "Store" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "transactions", label: "Transactions" },
  { id: "verification", label: "Verification history" },
  { id: "notes", label: "Administrative notes" },
];

interface VendorProfileProps {
  vendorId: string;
}

/**
 * Vendor profile with the seven administrative tabs.
 *
 * The header record loads once; each collection tab owns its server table so
 * filters and pagination stay independent and rows are never sliced locally.
 */
export default function VendorProfile({ vendorId }: VendorProfileProps) {
  const { permissions } = useAdminSession();
  const { data, loading, refreshing, error, reload } =
    useResource<VendorDetail>(vendorId, () => vendorApi.get(vendorId));
  const [tab, setTab] = useState<TabId>("overview");
  const [statusOpen, setStatusOpen] = useState(false);

  const canManage = permissions.includes("vendors.manage");

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Vendor profile"
          eyebrow="Marketplace"
          breadcrumbs={breadcrumbsForVendor()}
        />
        <ErrorState
          title="Could not load this vendor"
          description={error ?? "This vendor may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/vendors">
              Back to vendors
            </Button>
          }
        />
      </div>
    );
  }

  const { vendor, store, history, metrics } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={vendor.name}
        eyebrow="Vendor profile"
        description={vendor.email}
        breadcrumbs={breadcrumbsForVendor(vendor.name)}
        actions={
          <>
            <Button variant="outline" size="sm" href="/vendors">
              Back to vendors
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={reload}
              loading={refreshing}
            >
              Refresh
            </Button>
            {canManage ? (
              <Button
                size="sm"
                variant={vendor.status === "suspended" ? "primary" : "danger"}
                onClick={() => setStatusOpen(true)}
              >
                {vendor.status === "suspended"
                  ? "Reactivate account"
                  : "Suspend account"}
              </Button>
            ) : null}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={vendor.status} />
            {store ? (
              <StatusBadge
                status={store.status}
                label={storeStatusLabel(store.status)}
              />
            ) : (
              <Badge tone="neutral">No store</Badge>
            )}
            <Badge tone="neutral">
              Joined {formatAdminDate(vendor.createdAt)}
            </Badge>
            {vendor.isEmailVerified ? (
              <Badge tone="green">Email verified</Badge>
            ) : (
              <Badge tone="amber">Email unverified</Badge>
            )}
          </div>
        }
      />

      <Tabs
        items={TABS}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        ariaLabel="Vendor profile sections"
      />

      <div>
        {tab === "overview" ? (
          <OverviewTab
            vendor={vendor}
            store={store}
            history={history}
            metrics={metrics}
          />
        ) : null}
        {tab === "store" ? <StoreTab store={store} /> : null}
        {tab === "products" ? <ProductsTab vendorId={vendorId} /> : null}
        {tab === "orders" ? <OrdersTab vendorId={vendorId} /> : null}
        {tab === "transactions" ? (
          <TransactionsTab vendorId={vendorId} />
        ) : null}
        {tab === "verification" ? (
          <VerificationTab vendorId={vendorId} />
        ) : null}
        {tab === "notes" ? (
          <NotesTab vendorId={vendorId} canManage={canManage} />
        ) : null}
      </div>

      {statusOpen ? (
        <VendorStatusDialog
          vendorId={vendor._id}
          vendorName={vendor.name}
          currentStatus={vendor.status}
          onClose={() => setStatusOpen(false)}
          onCompleted={reload}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

function OverviewTab({
  vendor,
  store,
  history,
  metrics,
}: {
  vendor: ApiUser;
  store: ApiStore | null;
  history: ApiStoreReview[];
  metrics: VendorDetail["metrics"];
}) {
  const timeline: TimelineItem[] = history.map((review) => {
    const presentation = reviewActionPresentation(review.action);

    return {
      id: review._id,
      title: presentation.label,
      description: review.reason ?? review.message ?? undefined,
      time: `${formatAdminDate(review.createdAt)} · ${reviewActorName(review)}`,
      icon: presentation.icon,
      tone: presentation.tone,
    };
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Products"
            value={formatNumber(metrics.products)}
            icon="package"
          />
          <MetricCard
            label="Orders"
            value={formatNumber(metrics.orders)}
            icon="shopping-bag"
          />
          <MetricCard
            label="Revenue"
            value={formatNaira(metrics.revenue)}
            icon="bar-chart"
          />
          <MetricCard
            label="Transactions"
            value={formatNaira(metrics.transactionVolume)}
            hint={`${formatNumber(metrics.transactions)} successful`}
            icon="wallet"
          />
        </div>

        <SectionCard title="Account details">
          <dl>
            <InfoRow label="Full name" value={vendor.name} />
            <InfoRow label="Email" value={vendor.email} />
            <InfoRow label="Username" value={vendor.username} />
            <InfoRow label="Role" value="Vendor" />
            <InfoRow label="Account status" value={<StatusBadge status={vendor.status} />} />
            <InfoRow
              label="Email verified"
              value={vendor.isEmailVerified ? "Yes" : "No"}
            />
            <InfoRow
              label="Sign-in method"
              value={vendor.authProvider === "google" ? "Google" : "Email & password"}
            />
            <InfoRow label="Joined" value={formatAdminDate(vendor.createdAt)} />
            {vendor.suspendedAt ? (
              <InfoRow
                label="Suspended"
                value={formatAdminDate(vendor.suspendedAt)}
              />
            ) : null}
          </dl>
          {vendor.suspensionReason ? (
            <p className="mt-3 rounded-xl border border-danger/20 bg-danger/[0.04] px-3.5 py-3 text-[12px] leading-relaxed text-ink">
              <span className="font-semibold text-danger">Suspension reason: </span>
              {vendor.suspensionReason}
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Verification history"
          description="The latest decisions recorded against this vendor's store."
        >
          <Timeline
            items={timeline}
            emptyLabel="No verification events have been recorded yet."
          />
        </SectionCard>
      </div>

      <aside className="space-y-4">
        <SectionCard
          title="Store"
          action={
            store ? (
              <Link
                href={`/stores/${store._id}`}
                className="text-[11px] font-semibold text-pri hover:underline"
              >
                Open review
              </Link>
            ) : undefined
          }
        >
          {store ? (
            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">{store.name}</p>
                <p className="text-[11px] text-muted">
                  {store.category || "Uncategorised"} ·{" "}
                  {formatBusinessType(store.businessType)}
                </p>
              </div>
              <StatusBadge
                status={store.status}
                label={storeStatusLabel(store.status)}
              />
              <dl>
                <InfoRow label="Legal name" value={store.legalBusinessName} />
                <InfoRow label="Submitted" value={formatAdminDate(store.submittedAt)} />
                <InfoRow
                  label="Last reviewed"
                  value={
                    store.reviewedAt ? formatAdminDate(store.reviewedAt) : null
                  }
                />
              </dl>
            </div>
          ) : (
            <EmptyState
              compact
              icon="store"
              title="No store yet"
              description="This vendor has not started store onboarding."
            />
          )}
        </SectionCard>

        <SectionCard title="Account risk">
          <div className="space-y-2 text-[12px] leading-relaxed text-muted">
            <p>
              Vendor and store status are independent. Suspending the vendor
              blocks sign-in; suspending the store blocks trading.
            </p>
            {store?.status === "approved" && vendor.status === "suspended" ? (
              <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[11px] text-[#8a5a00]">
                This vendor is suspended but their store is still approved.
                Consider suspending the store separately.
              </p>
            ) : null}
          </div>
        </SectionCard>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

function StoreTab({ store }: { store: ApiStore | null }) {
  if (!store) {
    return (
      <EmptyState
        icon="store"
        title="No store yet"
        description="This vendor has not submitted a store application. The vendor must complete onboarding before they can trade."
        action={
          <Button variant="outline" size="sm" href="/stores">
            Open store approvals
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <SectionCard
          title="Store identity"
          action={
            <Button variant="outline" size="sm" href={`/stores/${store._id}`}>
              Open full review
            </Button>
          }
        >
          <dl>
            <InfoRow label="Trading name" value={store.name} />
            <InfoRow label="Legal name" value={store.legalBusinessName} />
            <InfoRow label="Slug" value={store.slug} />
            <InfoRow label="Category" value={store.category} />
            <InfoRow label="Business type" value={formatBusinessType(store.businessType)} />
            <InfoRow label="Business email" value={store.email} />
            <InfoRow label="Phone" value={store.phoneNumber} />
            <InfoRow label="CAC number" value={store.cacRegistrationNumber} />
            <InfoRow label="TIN" value={store.tin} />
          </dl>
        </SectionCard>

        <SectionCard title="Address">
          <p className="text-[13px] leading-relaxed text-ink">
            {[
              store.address.street,
              store.address.lga,
              store.address.city,
              store.address.state,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="mt-1 text-[12px] text-muted">{store.address.country}</p>
        </SectionCard>

        <SectionCard
          title={`Documents (${store.documents.length})`}
          description="KYB evidence uploaded by the vendor."
        >
          {store.documents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-muted">
              No documents uploaded.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {store.documents.map((document) => (
                <li key={`${document.type}-${document.url}`}>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 py-2.5 hover:text-pri"
                  >
                    <span className="flex items-center gap-2 text-[12px] font-medium text-ink">
                      <Icon name="file-text" className="size-4 text-muted" />
                      {formatStoreDocument(document.type)}
                    </span>
                    <Icon
                      name="arrow-up-right"
                      className="size-4 text-muted"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <aside className="space-y-4">
        <SectionCard title="Status">
          <StatusBadge
            status={store.status}
            label={storeStatusLabel(store.status)}
          />
          <dl className="mt-3">
            <InfoRow label="Submitted" value={formatAdminDate(store.submittedAt)} />
            <InfoRow
              label="Last reviewed"
              value={store.reviewedAt ? formatAdminDate(store.reviewedAt) : null}
            />
          </dl>
          {store.rejectionReason ? (
            <p className="mt-3 rounded-xl border border-danger/20 bg-danger/[0.04] px-3 py-2 text-[11px] leading-relaxed text-ink">
              <span className="font-semibold text-danger">Rejection: </span>
              {store.rejectionReason}
            </p>
          ) : null}
          {store.suspensionReason ? (
            <p className="mt-3 rounded-xl border border-danger/20 bg-danger/[0.04] px-3 py-2 text-[11px] leading-relaxed text-ink">
              <span className="font-semibold text-danger">Suspension: </span>
              {store.suspensionReason}
            </p>
          ) : null}
        </SectionCard>

        <SectionCard title="Compliance">
          <dl>
            <InfoRow
              label="Terms accepted"
              value={store.compliance.termsAccepted ? "Yes" : "No"}
            />
            <InfoRow
              label="Data consent"
              value={store.compliance.dataProcessingConsent ? "Yes" : "No"}
            />
          </dl>
        </SectionCard>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

const productStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

function ProductsTab({ vendorId }: { vendorId: string }) {
  const table = useServerTable<ApiProduct>({
    loader: async (query) => {
      const result = await vendorApi.products(vendorId, {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.filters.status,
      });

      return { rows: result.products, pagination: result.pagination };
    },
  });

  const columns: DataTableColumn<ApiProduct>[] = [
    {
      id: "name",
      header: "Product",
      primary: true,
      cell: (product) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">
            {product.name}
          </p>
          <p className="truncate text-[11px] text-muted">{product.sku}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (product) => (
        <span className="text-[12px] text-ink">{product.category || "—"}</span>
      ),
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      cell: (product) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(product.price)}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      align: "right",
      hideOnMobile: true,
      cell: (product) => (
        <span className="text-[12px] text-ink">{formatNumber(product.stock)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (product) => <StatusBadge status={product.status} />,
    },
    {
      id: "createdAt",
      header: "Created",
      hideOnMobile: true,
      cell: (product) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(product.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <SearchInput
          value={table.searchInput}
          onChange={table.setSearch}
          placeholder="Search products by name, SKU or category"
          label="Search products"
          className="w-full sm:max-w-sm"
        />
        <FilterSelect
          label="Status"
          value={table.filters.status ?? ""}
          onChange={(value) => table.setFilter("status", value)}
          options={productStatusOptions}
        />
      </div>

      <DataTable
        caption="Products belonging to this vendor"
        columns={columns}
        rows={table.rows}
        getRowId={(product) => product._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        emptyTitle="No products yet"
        emptyDescription="This vendor has not listed any products, or none match the current filter."
        footer={
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="products"
            disabled={table.loading}
          />
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

const orderStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

function OrdersTab({ vendorId }: { vendorId: string }) {
  const table = useServerTable<ApiOrder>({
    loader: async (query) => {
      const result = await vendorApi.orders(vendorId, {
        page: query.page,
        limit: query.limit,
        status: query.filters.status,
      });

      return { rows: result.orders, pagination: result.pagination };
    },
  });

  const columns: DataTableColumn<ApiOrder>[] = [
    {
      id: "orderNumber",
      header: "Order",
      primary: true,
      cell: (order) => (
        <span className="text-[12px] font-semibold text-ink">
          {order.orderNumber}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (order) => <StatusBadge status={order.status} />,
    },
    {
      id: "paymentStatus",
      header: "Payment",
      hideOnMobile: true,
      cell: (order) => <StatusBadge status={order.paymentStatus} />,
    },
    {
      id: "items",
      header: "Items",
      align: "right",
      hideOnMobile: true,
      cell: (order) => (
        <span className="text-[12px] text-ink">
          {order.items.reduce((count, item) => count + item.quantity, 0)}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      cell: (order) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(order.total)}
        </span>
      ),
    },
    {
      id: "placedAt",
      header: "Placed",
      hideOnMobile: true,
      cell: (order) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(order.placedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[12px] text-muted">
          Orders fulfilled by this vendor, newest first.
        </p>
        <FilterSelect
          label="Status"
          value={table.filters.status ?? ""}
          onChange={(value) => table.setFilter("status", value)}
          options={orderStatusOptions}
        />
      </div>

      <DataTable
        caption="Orders belonging to this vendor"
        columns={columns}
        rows={table.rows}
        getRowId={(order) => order._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        emptyTitle="No orders yet"
        emptyDescription="This vendor has not received any orders, or none match the current filter."
        footer={
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="orders"
            disabled={table.loading}
          />
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

const transactionStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "successful", label: "Successful" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function TransactionsTab({ vendorId }: { vendorId: string }) {
  const table = useServerTable<ApiTransaction>({
    loader: async (query) => {
      const result = await vendorApi.transactions(vendorId, {
        page: query.page,
        limit: query.limit,
        status: query.filters.status,
      });

      return { rows: result.transactions, pagination: result.pagination };
    },
  });

  const columns: DataTableColumn<ApiTransaction>[] = [
    {
      id: "reference",
      header: "Reference",
      primary: true,
      cell: (transaction) => (
        <span className="font-mono text-[11px] font-semibold text-ink">
          {transaction.reference}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      cell: (transaction) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(transaction.amount)}
        </span>
      ),
    },
    {
      id: "platformFee",
      header: "Platform fee",
      align: "right",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatNaira(transaction.platformFee)}
        </span>
      ),
    },
    {
      id: "vendorAmount",
      header: "Vendor amount",
      align: "right",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-ink">
          {formatNaira(transaction.vendorAmount)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (transaction) => <StatusBadge status={transaction.status} />,
    },
    {
      id: "channel",
      header: "Channel",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] capitalize text-muted">
          {transaction.channel.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      id: "paidAt",
      header: "Paid",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {transaction.paidAt
            ? formatAdminDate(transaction.paidAt)
            : "Not paid"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[12px] text-muted">
          Payment attempts routed to this vendor.
        </p>
        <FilterSelect
          label="Status"
          value={table.filters.status ?? ""}
          onChange={(value) => table.setFilter("status", value)}
          options={transactionStatusOptions}
        />
      </div>

      <DataTable
        caption="Transactions belonging to this vendor"
        columns={columns}
        rows={table.rows}
        getRowId={(transaction) => transaction._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        emptyTitle="No transactions yet"
        emptyDescription="Payments linked to this vendor will appear here."
        footer={
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="transactions"
            disabled={table.loading}
          />
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verification                                                                */
/* -------------------------------------------------------------------------- */

function VerificationTab({ vendorId }: { vendorId: string }) {
  const [stores, setStores] = useState<VendorVerificationResult["stores"]>([]);
  const table = useServerTable<ApiStoreReview>({
    loader: async (query) => {
      const result = await vendorApi.verification(vendorId, {
        page: query.page,
        limit: query.limit,
      });

      setStores(result.stores);

      return { rows: result.history, pagination: result.pagination };
    },
  });

  const timeline: TimelineItem[] = table.rows.map((review) => {
    const presentation = reviewActionPresentation(review.action);

    return {
      id: review._id,
      title: presentation.label,
      description: review.reason ?? review.message ?? undefined,
      time: `${formatAdminDate(review.createdAt)} · ${reviewActorName(review)}`,
      icon: presentation.icon,
      tone: presentation.tone,
    };
  });

  return (
    <div className="space-y-4">
      {stores.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {stores.map((store) => (
            <div
              key={store._id}
              className="rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink">
                    {store.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    Submitted {formatAdminDate(store.submittedAt)}
                  </p>
                </div>
                <StatusBadge
                  status={store.status}
                  label={storeStatusLabel(store.status)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="mt-3"
                href={`/stores/${store._id}`}
              >
                Open store review
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <h2 className="text-[13px] font-semibold text-ink">
          Full verification history
        </h2>
        <p className="mt-0.5 text-[11px] text-muted">
          Every submission and administrative decision for this vendor&apos;s
          stores.
        </p>
        <Timeline
          items={timeline}
          className="mt-4"
          emptyLabel="No verification events have been recorded yet."
        />
        {table.error ? (
          <ErrorState
            compact
            title="Could not load verification history"
            description={table.error}
            onRetry={table.reload}
          />
        ) : null}
        {table.meta.total > 0 ? (
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="events"
            disabled={table.loading}
            className="mt-4"
          />
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

function NotesTab({
  vendorId,
  canManage,
}: {
  vendorId: string;
  canManage: boolean;
}) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const table = useServerTable<ApiAdminNote>({
    loader: async (query) => {
      const result = await vendorApi.notes(vendorId, {
        page: query.page,
        limit: query.limit,
      });

      return { rows: result.notes, pagination: result.pagination };
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminNoteValues>({
    resolver: zodResolver(adminNoteSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await vendorApi.addNote(vendorId, { body: values.body });
      toast({
        tone: "success",
        title: "Note added",
        description: "The note is visible to other administrators.",
      });
      reset();
      table.reload();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, ["body"]);
      } else {
        setFormError(
          error instanceof Error ? error.message : "The note could not be saved.",
        );
      }
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <h2 className="text-[13px] font-semibold text-ink">
          Administrative notes ({table.meta.total})
        </h2>
        <p className="mt-0.5 text-[11px] text-muted">
          Internal context for other administrators. Vendors never see these
          notes.
        </p>

        <div className="mt-4 space-y-3">
          {table.loading && table.rows.length === 0 ? (
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded-xl bg-well" />
              <div className="h-20 animate-pulse rounded-xl bg-well" />
            </div>
          ) : table.error ? (
            <ErrorState
              compact
              title="Could not load notes"
              description={table.error}
              onRetry={table.reload}
            />
          ) : table.rows.length === 0 ? (
            <EmptyState
              compact
              icon="file-text"
              title="No notes yet"
              description="Add the first note to record verification context or decisions."
            />
          ) : (
            table.rows.map((note) => (
              <article
                key={note._id}
                className="rounded-xl border border-line px-3.5 py-3"
              >
                <p className="text-[12px] leading-relaxed text-ink">{note.body}</p>
                <p className="mt-2 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                  {noteAuthorName(note)} · {formatAdminDate(note.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>

        {table.meta.total > 0 ? (
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="notes"
            disabled={table.loading}
            className="mt-4"
          />
        ) : null}
      </div>

      <aside>
        {canManage ? (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-line bg-white p-4 sm:p-5"
            noValidate
          >
            <h2 className="text-[13px] font-semibold text-ink">Add a note</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              Record something another reviewer will need later.
            </p>

            <TextareaField
              label="Note"
              rows={6}
              placeholder="What should the next reviewer know?"
              className="mt-3"
              error={errors.body?.message}
              register={register("body")}
            />

            {formError ? (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-[11px] font-medium text-danger"
              >
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="sm"
              fullWidth
              className="mt-3"
              loading={isSubmitting}
            >
              Save note
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center">
            <p className="text-[12px] font-semibold text-ink">
              Read-only access
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Your account can view notes but not add them. Ask a Super Admin
              for the vendor management permission.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

function breadcrumbsForVendor(name?: string) {
  return [
    { label: "Admin console", href: "/" },
    { label: "Marketplace" },
    { label: "Vendors", href: "/vendors" },
    { label: name ?? "Vendor" },
  ];
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== "—";

  return (
    <div className="flex flex-col gap-0.5 border-b border-line/70 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="text-[12px] break-words text-ink sm:text-right">
        {hasValue ? value : "—"}
      </dd>
    </div>
  );
}

function noteAuthorName(note: ApiAdminNote) {
  if (!note.author || typeof note.author === "string") return "Administrator";

  return note.author.name;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading vendor profile">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-well" />
      <div className="h-10 w-full animate-pulse rounded-full bg-well" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-well" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-well" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-well" />
      </div>
    </div>
  );
}
