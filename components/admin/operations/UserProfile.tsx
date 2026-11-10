"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { FilterSelect } from "@/components/ui/FilterBar";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useResource } from "@/hooks/useResource";
import { useServerTable } from "@/hooks/useServerTable";
import { disputeAdminApi, userAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira, formatNumber } from "@/lib/format";
import {
  formatDisputeCategory,
  formatDisputeStatus,
  formatPaymentChannel,
  formatUserRole,
  orderReference,
} from "@/lib/operations";
import type {
  AdminTransactionEntry,
  AdminUserDetail,
  ApiAdminNote,
  ApiAdminOrder,
  ApiDispute,
  DisputeCategory,
  DisputeStatus,
} from "@/types/api";
import { InfoRow, PageSkeleton, SectionCard } from "./shared";
import UserStatusDialog from "./UserStatusDialog";

type TabId = "overview" | "orders" | "transactions" | "disputes" | "notes";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "transactions", label: "Transactions" },
  { id: "disputes", label: "Disputes" },
  { id: "notes", label: "Admin notes" },
];

/** Deep links such as `/customers/:id?tab=orders` choose the initial tab. */
function initialTab(): TabId {
  if (typeof window === "undefined") return "overview";

  const requested = new URLSearchParams(window.location.search).get("tab");

  return requested && TABS.some((entry) => entry.id === requested)
    ? (requested as TabId)
    : "overview";
}

export default function UserProfile({ userId }: { userId: string }) {
  const { permissions } = useAdminSession();
  const { data, loading, refreshing, error, reload } =
    useResource<AdminUserDetail>(userId, () => userAdminApi.get(userId));
  const [tab, setTab] = useState<TabId>(initialTab);
  const [statusOpen, setStatusOpen] = useState(false);

  const canManage = permissions.includes("users.manage");

  if (loading) return <PageSkeleton label="Loading account" />;

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Account"
          eyebrow="Users"
          breadcrumbs={breadcrumbsFor("/customers")}
        />
        <ErrorState
          title="Could not load this account"
          description={error ?? "This account may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/customers">
              Back to users
            </Button>
          }
        />
      </div>
    );
  }

  const { user, store, metrics, recentOrders, recentTransactions, disputes, notes } =
    data;
  const isVendor = user.role === "vendor";
  const isAdmin = user.role === "admin";

  const breadcrumbs = [
    ...breadcrumbsFor("/customers"),
    { label: user.name },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={user.name}
        eyebrow="Account profile"
        description={user.email}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button variant="outline" size="sm" href="/customers">
              Back to users
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
            {canManage && !isAdmin ? (
              <Button
                size="sm"
                variant={user.status === "suspended" ? "primary" : "danger"}
                onClick={() => setStatusOpen(true)}
              >
                {user.status === "suspended"
                  ? "Reactivate account"
                  : "Suspend account"}
              </Button>
            ) : null}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={isVendor ? "lime" : isAdmin ? "teal" : "neutral"}>
              {formatUserRole(user.role)}
            </Badge>
            <StatusBadge status={user.status} />
            {user.isEmailVerified ? (
              <Badge tone="green">Email verified</Badge>
            ) : (
              <Badge tone="amber">Email unverified</Badge>
            )}
            <Badge tone="neutral">
              Joined {formatAdminDate(user.createdAt)}
            </Badge>
          </div>
        }
      />

      <Tabs
        items={TABS}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        ariaLabel="Account profile sections"
      />

      <div>
        {tab === "overview" ? (
          <OverviewTab
            user={user}
            store={store}
            metrics={metrics}
            recentOrders={recentOrders}
            recentTransactions={recentTransactions}
            disputes={disputes}
            notes={notes}
          />
        ) : null}
        {tab === "orders" ? (
          <OrdersTab
            userId={userId}
            defaultSide={isVendor ? "vendor" : "customer"}
            canSwitch={isVendor}
          />
        ) : null}
        {tab === "transactions" ? (
          <TransactionsTab
            userId={userId}
            defaultSide={isVendor ? "vendor" : "customer"}
            canSwitch={isVendor}
          />
        ) : null}
        {tab === "disputes" ? (
          <DisputesTab
            userId={userId}
            side={isVendor ? "vendor" : "customer"}
            canSwitch={isVendor}
          />
        ) : null}
        {tab === "notes" ? <NotesTab notes={notes} /> : null}
      </div>

      {statusOpen ? (
        <UserStatusDialog
          userId={user._id}
          userName={user.name}
          currentStatus={user.status}
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
  user,
  store,
  metrics,
  recentOrders,
  recentTransactions,
  disputes,
  notes,
}: {
  user: AdminUserDetail["user"];
  store: AdminUserDetail["store"];
  metrics: AdminUserDetail["metrics"];
  recentOrders: ApiAdminOrder[];
  recentTransactions: AdminTransactionEntry[];
  disputes: ApiDispute[];
  notes: ApiAdminNote[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Orders"
          value={formatNumber(metrics.orders)}
          hint={`${formatNumber(metrics.deliveredOrders)} delivered`}
          icon="shopping-bag"
        />
        <MetricCard
          label="Order value"
          value={formatNaira(metrics.orderValue)}
          icon="bar-chart"
        />
        <MetricCard
          label="Transactions"
          value={formatNumber(metrics.transactions)}
          hint={formatNaira(metrics.transactionValue)}
          icon="card"
        />
        <MetricCard
          label="Refunded"
          value={formatNaira(metrics.refundedValue)}
          hint={`${formatNumber(metrics.disputes)} disputes raised`}
          icon="wallet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <SectionCard title="Recent orders">
            {recentOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                No orders recorded for this account.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {recentOrders.map((order) => (
                  <li key={order._id}>
                    <Link
                      href={`/orders/${order._id}`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:text-pri"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-ink">
                          {order.orderNumber}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {formatAdminDate(order.createdAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={order.status} />
                        <span className="text-[12px] font-medium text-ink">
                          {formatNaira(order.total)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recent transactions">
            {recentTransactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                No transactions recorded for this account.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {recentTransactions.map((transaction) => (
                  <li key={transaction._id}>
                    <Link
                      href={`/payments/${transaction._id}`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:text-pri"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[11px] font-semibold text-ink">
                          {transaction.reference}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {orderReference(transaction.order)} ·{" "}
                          {formatPaymentChannel(transaction.channel)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={transaction.status} />
                        <span className="text-[12px] font-medium text-ink">
                          {formatNaira(transaction.amount)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Account details">
            <dl>
              <InfoRow label="Full name" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="Username" value={user.username} />
              <InfoRow label="Account type" value={formatUserRole(user.role)} />
              <InfoRow
                label="Status"
                value={<StatusBadge status={user.status} />}
              />
              <InfoRow
                label="Sign-in method"
                value={user.authProvider === "google" ? "Google" : "Email & password"}
              />
              <InfoRow
                label="Last sign-in"
                value={
                  user.lastLoginAt ? formatAdminDate(user.lastLoginAt) : null
                }
              />
              <InfoRow label="Joined" value={formatAdminDate(user.createdAt)} />
            </dl>
            {user.suspensionReason ? (
              <p className="mt-3 rounded-xl border border-danger/20 bg-danger/[0.04] px-3.5 py-3 text-[12px] leading-relaxed text-ink">
                <span className="font-semibold text-danger">
                  Suspension reason:{" "}
                </span>
                {user.suspensionReason}
              </p>
            ) : null}
          </SectionCard>

          {user.role === "vendor" ? (
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
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold text-ink">
                    {store.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {store.category || "Uncategorised"}
                  </p>
                  <StatusBadge
                    status={store.status}
                    label={store.status.replace(/_/g, " ")}
                  />
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
          ) : null}

          <SectionCard title="Support history">
            {disputes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                No disputes have been raised by or against this account.
              </p>
            ) : (
              <ul className="space-y-2">
                {disputes.map((dispute) => (
                  <li key={dispute._id}>
                    <Link
                      href={`/disputes/${dispute._id}`}
                      className="block rounded-xl border border-line px-3 py-2.5 transition hover:border-pri/30 hover:bg-well/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-semibold text-ink">
                          {dispute.subject}
                        </span>
                        <StatusBadge status={dispute.status} />
                      </div>
                      <p className="mt-1 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                        {formatDisputeCategory(dispute.category)} ·{" "}
                        {formatDisputeStatus(dispute.status)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {user.role === "vendor" && notes.length > 0 ? (
            <SectionCard title="Administrative notes">
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li
                    key={note._id}
                    className="rounded-xl border border-line px-3 py-2.5"
                  >
                    <p className="text-[12px] leading-relaxed text-ink">
                      {note.body}
                    </p>
                    <p className="mt-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                      {noteAuthor(note)} · {formatAdminDate(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

function OrdersTab({
  userId,
  defaultSide,
  canSwitch,
}: {
  userId: string;
  defaultSide: "customer" | "vendor";
  canSwitch: boolean;
}) {
  const table = useServerTable<ApiAdminOrder>({
    loader: async (query) => {
      const result = await userAdminApi.orders(userId, {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.filters.status,
        paymentStatus: query.filters.paymentStatus,
        side: (query.filters.side as "customer" | "vendor") || defaultSide,
      });

      return { rows: result.orders, pagination: result.pagination };
    },
    initialFilters: { side: defaultSide },
  });

  const columns: DataTableColumn<ApiAdminOrder>[] = [
    {
      id: "orderNumber",
      header: "Order",
      primary: true,
      cell: (order) => (
        <Link
          href={`/orders/${order._id}`}
          className="text-[12px] font-semibold text-ink hover:text-pri"
        >
          {order.orderNumber}
        </Link>
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
      id: "createdAt",
      header: "Placed",
      hideOnMobile: true,
      cell: (order) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(order.createdAt)}
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
          placeholder="Search by order number"
          label="Search orders"
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Status"
            value={table.filters.status ?? ""}
            onChange={(value) => table.setFilter("status", value)}
            options={[
              { value: "", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
          {canSwitch ? (
            <FilterSelect
              label="Relationship"
              value={table.filters.side ?? defaultSide}
              onChange={(value) => table.setFilter("side", value)}
              options={[
                { value: "vendor", label: "As vendor" },
                { value: "customer", label: "As customer" },
              ]}
            />
          ) : null}
        </div>
      </div>

      <DataTable
        caption="Orders belonging to this account"
        columns={columns}
        rows={table.rows}
        getRowId={(order) => order._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        emptyTitle="No orders found"
        emptyDescription="This account has no orders for the selected relationship and status."
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

function TransactionsTab({
  userId,
  defaultSide,
  canSwitch,
}: {
  userId: string;
  defaultSide: "customer" | "vendor";
  canSwitch: boolean;
}) {
  const table = useServerTable<AdminTransactionEntry>({
    loader: async (query) => {
      const result = await userAdminApi.transactions(userId, {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.filters.status,
        side: (query.filters.side as "customer" | "vendor") || defaultSide,
      });

      return { rows: result.transactions, pagination: result.pagination };
    },
    initialFilters: { side: defaultSide },
  });

  const columns: DataTableColumn<AdminTransactionEntry>[] = [
    {
      id: "reference",
      header: "Reference",
      primary: true,
      cell: (transaction) => (
        <Link
          href={`/payments/${transaction._id}`}
          className="font-mono text-[11px] font-semibold text-ink hover:text-pri"
        >
          {transaction.reference}
        </Link>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (transaction) => (
        <Badge tone={transaction.status === "refunded" ? "blue" : "neutral"}>
          {transaction.status === "refunded" ? "Refund" : "Payment"}
        </Badge>
      ),
    },
    {
      id: "order",
      header: "Order",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[11px] text-muted">
          {orderReference(transaction.order)}
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
      id: "status",
      header: "Status",
      cell: (transaction) => <StatusBadge status={transaction.status} />,
    },
    {
      id: "channel",
      header: "Channel",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatPaymentChannel(transaction.channel)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      hideOnMobile: true,
      cell: (transaction) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(transaction.createdAt)}
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
          placeholder="Search by reference or order number"
          label="Search transactions"
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Status"
            value={table.filters.status ?? ""}
            onChange={(value) => table.setFilter("status", value)}
            options={[
              { value: "", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "successful", label: "Successful" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
          {canSwitch ? (
            <FilterSelect
              label="Relationship"
              value={table.filters.side ?? defaultSide}
              onChange={(value) => table.setFilter("side", value)}
              options={[
                { value: "vendor", label: "As vendor" },
                { value: "customer", label: "As customer" },
              ]}
            />
          ) : null}
        </div>
      </div>

      <DataTable
        caption="Transactions belonging to this account"
        columns={columns}
        rows={table.rows}
        getRowId={(transaction) => transaction._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        emptyTitle="No transactions found"
        emptyDescription="This account has no transactions for the selected relationship and status."
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
/* Disputes                                                                    */
/* -------------------------------------------------------------------------- */

function DisputesTab({
  userId,
  side,
  canSwitch,
}: {
  userId: string;
  side: "customer" | "vendor";
  canSwitch: boolean;
}) {
  const [relationship, setRelationship] = useState(side);

  const table = useServerTable<ApiDispute>({
    loader: async (query) => {
      const result = await disputeAdminApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.filters.status as DisputeStatus,
        category: query.filters.category as DisputeCategory,
        [relationship === "vendor" ? "vendor" : "customer"]: userId,
      });

      return { rows: result.disputes, pagination: result.pagination };
    },
  });

  // Re-run when the relationship changes on a dual-role vendor account.
  useEffect(() => {
    table.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationship]);

  const columns: DataTableColumn<ApiDispute>[] = [
    {
      id: "subject",
      header: "Dispute",
      primary: true,
      cell: (dispute) => (
        <div className="min-w-0">
          <Link
            href={`/disputes/${dispute._id}`}
            className="block truncate text-[12px] font-semibold text-ink hover:text-pri"
          >
            {dispute.subject}
          </Link>
          <p className="truncate text-[10px] text-muted">{dispute.reference}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: (dispute) => (
        <span className="text-[12px] text-ink">
          {formatDisputeCategory(dispute.category)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (dispute) => (
        <StatusBadge
          status={dispute.status}
          label={formatDisputeStatus(dispute.status)}
        />
      ),
    },
    {
      id: "createdAt",
      header: "Raised",
      hideOnMobile: true,
      cell: (dispute) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(dispute.createdAt)}
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
          placeholder="Search disputes by reference or subject"
          label="Search disputes"
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Status"
            value={table.filters.status ?? ""}
            onChange={(value) => table.setFilter("status", value)}
            options={[
              { value: "", label: "All statuses" },
              { value: "OPEN", label: "Open" },
              { value: "UNDER_REVIEW", label: "Under review" },
              { value: "AWAITING_INFORMATION", label: "Awaiting information" },
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ]}
          />
          {canSwitch ? (
            <FilterSelect
              label="Relationship"
              value={relationship}
              onChange={(value) =>
                setRelationship(value as "customer" | "vendor")
              }
              options={[
                { value: "vendor", label: "As vendor" },
                { value: "customer", label: "As customer" },
              ]}
            />
          ) : null}
        </div>
      </div>

      <DataTable
        caption="Disputes involving this account"
        columns={columns}
        rows={table.rows}
        getRowId={(dispute) => dispute._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        emptyTitle="No disputes found"
        emptyDescription="This account has no disputes matching the current filters."
        footer={
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="disputes"
            disabled={table.loading}
          />
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

function NotesTab({ notes }: { notes: ApiAdminNote[] }) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon="file-text"
        title="No administrative notes"
        description="Notes recorded against vendor accounts appear here. Customers do not have a note history."
      />
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article
          key={note._id}
          className="rounded-2xl border border-line bg-white px-4 py-3.5"
        >
          <p className="text-[13px] leading-relaxed text-ink">{note.body}</p>
          <p className="mt-2 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
            {noteAuthor(note)} · {formatAdminDate(note.createdAt)}
          </p>
        </article>
      ))}
    </div>
  );
}

function noteAuthor(note: ApiAdminNote) {
  if (!note.author || typeof note.author === "string") return "Administrator";
  return note.author.name;
}
