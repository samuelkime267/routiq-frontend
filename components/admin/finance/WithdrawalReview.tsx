"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useAdminSession } from "@/components/admin/AdminSession";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import ErrorState from "@/components/ui/ErrorState";
import { FilterBar, FilterDate, FilterSelect } from "@/components/ui/FilterBar";
import MetricCard from "@/components/ui/MetricCard";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { useServerTable } from "@/hooks/useServerTable";
import { ApiError, adminWithdrawalApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { cn } from "@/lib/cn";
import { formatNaira, formatNumber } from "@/lib/format";
import type { SortDirection } from "@/lib/pagination";
import { formatVendorDate } from "@/lib/vendorPortal";
import {
  withdrawalStatusLabel,
  withdrawalStatusTone,
  WITHDRAWAL_STATUS_OPTIONS,
} from "@/lib/vendorPortal";
import type {
  AdminBankAccount,
  AdminBankAccountListResult,
  AdminWithdrawal,
  AdminWithdrawalDecisionAction,
  AdminWithdrawalDecisionPayload,
  WithdrawalStatus,
} from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Largest amount" },
  { value: "amount:asc", label: "Smallest amount" },
  { value: "status:asc", label: "Status A–Z" },
];

type TabKey = "requests" | "accounts";

export default function WithdrawalReview() {
  const [tab, setTab] = useState<TabKey>("requests");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Financials"
        title="Vendor withdrawals"
        description="Review payout requests against the vendor ledger, confirm transfers and verify the accounts that receive money. A request is only paid once a payout reference is recorded."
        breadcrumbs={breadcrumbsFor("/finance/withdrawals")}
        actions={
          <Tabs
            variant="pill"
            ariaLabel="Withdrawal review sections"
            value={tab}
            onChange={(id) => setTab(id as TabKey)}
            items={[
              { id: "requests", label: "Requests" },
              { id: "accounts", label: "Payout accounts" },
            ]}
          />
        }
      />

      {tab === "requests" ? <WithdrawalRequests /> : <PayoutAccounts />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

function WithdrawalRequests() {
  const { toast } = useToast();
  const { permissions } = useAdminSession();
  const canManage = permissions.includes("withdrawals.manage");
  const [summary, setSummary] = useState<
    | {
        total: number;
        byStatus: Record<string, number>;
        amounts: Record<string, number>;
        reserved: number;
        paid: number;
      }
    | null
  >(null);
  const [review, setReview] = useState<AdminWithdrawal | null>(null);

  const table = useServerTable<AdminWithdrawal>({
    loader: async (query) => {
      const result = await adminWithdrawalApi.list({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);

      return { rows: result.withdrawals, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const columns: DataTableColumn<AdminWithdrawal>[] = [
    {
      id: "reference",
      header: "Request",
      primary: true,
      sortable: true,
      cell: (withdrawal) => {
        const vendor = vendorName(withdrawal);

        return (
          <button
            type="button"
            onClick={() => setReview(withdrawal)}
            className="block max-w-full text-left"
          >
            <span className="block truncate font-mono text-[11px] font-semibold text-ink hover:text-pri">
              {withdrawal.reference}
            </span>
            <span className="block truncate text-[10px] text-muted">
              {vendor ?? "Vendor"} · {withdrawal.bankSnapshot.bankName}
            </span>
          </button>
        );
      },
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      cell: (withdrawal) => (
        <span className="text-[12px] font-semibold text-ink">
          {formatNaira(withdrawal.amount)}
        </span>
      ),
    },
    {
      id: "account",
      header: "Payout account",
      hideOnMobile: true,
      cell: (withdrawal) => (
        <div className="text-[12px]">
          <p className="text-ink">
            {withdrawal.bankSnapshot.accountName}
          </p>
          <p className="font-mono text-[10px] text-muted">
            {withdrawal.bankSnapshot.accountNumber
              ? `••••${withdrawal.bankSnapshot.accountNumber.slice(-4)}`
              : "—"}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (withdrawal) => (
        <Badge tone={withdrawalStatusTone(withdrawal.status)}>
          {withdrawalStatusLabel(withdrawal.status)}
        </Badge>
      ),
    },
    {
      id: "requestedAt",
      header: "Requested",
      hideOnMobile: true,
      sortable: true,
      sortKey: "requestedAt",
      cell: (withdrawal) => (
        <span className="text-[12px] text-muted">
          {formatVendorDate(withdrawal.requestedAt)}
        </span>
      ),
    },
    {
      id: "payout",
      header: "Payout reference",
      hideOnMobile: true,
      cell: (withdrawal) => (
        <span className="font-mono text-[11px] text-muted">
          {withdrawal.payoutReference ?? "—"}
        </span>
      ),
    },
  ];

  const pending = summary?.byStatus.pending ?? 0;
  const approved = summary?.byStatus.approved ?? 0;
  const processing = summary?.byStatus.processing ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Awaiting review"
          value={formatNumber(pending)}
          hint="Requests that need a decision"
          icon="clock"
        />
        <MetricCard
          label="Approved / processing"
          value={formatNumber(approved + processing)}
          hint="Cleared for payout, not yet paid"
          icon="check-circle"
        />
        <MetricCard
          label="Reserved"
          value={formatNaira(summary?.reserved ?? 0)}
          hint="Held against vendor balances"
          icon="wallet"
        />
        <MetricCard
          label="Paid out"
          value={formatNaira(summary?.paid ?? 0)}
          hint={`${formatNumber(summary?.byStatus.paid ?? 0)} confirmed payouts`}
          icon="card"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search reference, vendor or payout reference"
              label="Search withdrawals"
              className="w-full lg:max-w-md"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter withdrawals by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                {
                  id: "",
                  label: "All",
                  count: summary?.total ?? table.meta.total,
                },
                ...WITHDRAWAL_STATUS_OPTIONS.map((option) => ({
                  id: option.value,
                  label: option.label,
                  count: summary?.byStatus[option.value] ?? 0,
                })),
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterDate
                label="Requested from"
                value={table.filters.createdFrom ?? ""}
                max={table.filters.createdTo || undefined}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <FilterDate
                label="Requested to"
                value={table.filters.createdTo ?? ""}
                min={table.filters.createdFrom || undefined}
                onChange={(value) => table.setFilter("createdTo", value)}
              />
              <FilterSelect
                label="Sort by"
                value={
                  table.sort
                    ? `${table.sort.key}:${table.sort.direction}`
                    : "createdAt:desc"
                }
                onChange={(value) => {
                  const [key, direction] = value.split(":");
                  table.setSorting(key, direction as SortDirection);
                }}
                options={sortOptions}
              />
            </FilterBar>
          </div>
        </div>

        <DataTable
          caption="Vendor withdrawal requests, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(withdrawal) => withdrawal._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={(withdrawal) => (
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5"
              onClick={() => setReview(withdrawal)}
            >
              {canManage && isOpen(withdrawal) ? "Review" : "Details"}
            </Button>
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No withdrawals match these filters"
              : "No withdrawal requests yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the status and date filters."
              : "Requests appear here as soon as a vendor asks to withdraw."
          }
          emptyAction={
            table.search || table.activeFilterCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  table.resetFilters();
                  table.setSearch("");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
          footer={
            <Pagination
              meta={table.meta}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="withdrawals"
              disabled={table.loading}
            />
          }
        />
      </div>

      {review ? (
        <ReviewDialog
          withdrawal={review}
          canManage={canManage}
          onClose={() => setReview(null)}
          onDecided={(message) => {
            toast({ title: message, tone: "success" });
            setReview(null);
            table.reload();
          }}
        />
      ) : null}
    </div>
  );
}

function ReviewDialog({
  withdrawal,
  canManage,
  onClose,
  onDecided,
}: {
  withdrawal: AdminWithdrawal;
  canManage: boolean;
  onClose: () => void;
  onDecided: (message: string) => void;
}) {
  const [action, setAction] = useState<AdminWithdrawalDecisionAction | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = availableActions(withdrawal.status);
  const needsReason = action === "reject";
  const needsReference = action === "paid";

  async function submit() {
    if (!action) return;

    if (needsReason && !reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    if (needsReference && !payoutReference.trim()) {
      setError(
        "Record the payout reference from the transfer before marking this paid.",
      );
      return;
    }

    setBusy(true);
    setError(null);

    const payload: AdminWithdrawalDecisionPayload = {
      action,
      reason: needsReason ? reason.trim() : undefined,
      payoutReference: needsReference ? payoutReference.trim() : undefined,
      adminNote: adminNote.trim() || undefined,
    };

    try {
      await adminWithdrawalApi.decide(withdrawal._id, payload);
      onDecided(decisionMessage(action));
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "The decision could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={withdrawal.reference}
      description={`${formatNaira(withdrawal.amount)} to ${withdrawal.bankSnapshot.bankName} · ${withdrawal.bankSnapshot.accountName}`}
      size="lg"
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Close
          </Button>
          {canManage && action ? (
            <Button size="sm" loading={busy} onClick={() => void submit()}>
              {actionLabel(action)}
            </Button>
          ) : null}
        </>
      }
    >
      <dl className="grid gap-2 text-[12px] sm:grid-cols-2">
        <Row label="Status" value={withdrawalStatusLabel(withdrawal.status)} />
        <Row label="Amount" value={formatNaira(withdrawal.amount)} />
        <Row label="Vendor" value={vendorName(withdrawal) ?? "Vendor"} />
        <Row label="Store" value={storeName(withdrawal) ?? "—"} />
        <Row
          label="Account"
          value={`${withdrawal.bankSnapshot.accountName} · ••••${withdrawal.bankSnapshot.accountNumber.slice(-4)}`}
          wide
        />
        <Row
          label="Balance before"
          value={formatNaira(withdrawal.balanceBefore)}
        />
        <Row
          label="Balance after"
          value={formatNaira(withdrawal.balanceAfter)}
        />
        <Row
          label="Requested"
          value={formatAdminDate(withdrawal.requestedAt)}
        />
        <Row
          label="Reviewed"
          value={
            withdrawal.reviewedAt
              ? formatAdminDate(withdrawal.reviewedAt)
              : "Not reviewed"
          }
        />
        {withdrawal.payoutReference ? (
          <Row label="Payout reference" value={withdrawal.payoutReference} wide />
        ) : null}
      </dl>

      {withdrawal.rejectionReason ? (
        <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger">
          {withdrawal.rejectionReason}
        </p>
      ) : null}

      {canManage && actions.length > 0 ? (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
            Decision
          </p>
          <div className="flex flex-wrap gap-2">
            {actions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAction(option === action ? null : option);
                  setError(null);
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition",
                  option === action
                    ? "border-pri bg-pri text-white"
                    : "border-line bg-white text-ink hover:border-pri/40",
                )}
              >
                {actionLabel(option)}
              </button>
            ))}
          </div>

          {needsReference ? (
            <label className="block">
              <span className="text-[11px] font-semibold text-ink">
                Payout reference
              </span>
              <input
                value={payoutReference}
                onChange={(event) => setPayoutReference(event.target.value)}
                placeholder="Bank transfer reference"
                className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-[12px] text-ink focus:border-pri focus:ring-2 focus:ring-pri/10 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-muted">
                Only mark a request paid after the transfer has actually
                settled.
              </span>
            </label>
          ) : null}

          {needsReason ? (
            <label className="block">
              <span className="text-[11px] font-semibold text-ink">
                Rejection reason
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                placeholder="Tell the vendor what needs fixing"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-[12px] text-ink focus:border-pri focus:ring-2 focus:ring-pri/10 focus:outline-none"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-[11px] font-semibold text-ink">
              Internal note (optional)
            </span>
            <input
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="Visible to other admins only"
              className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-[12px] text-ink focus:border-pri focus:ring-2 focus:ring-pri/10 focus:outline-none"
            />
          </label>

          {error ? (
            <p role="alert" className="text-[11px] text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          History
        </p>
        <ol className="mt-2 space-y-2">
          {withdrawal.history.length === 0 ? (
            <li className="text-[11px] text-muted">No history recorded.</li>
          ) : (
            [...withdrawal.history].reverse().map((entry) => (
              <li key={entry._id} className="flex gap-2.5 text-[11px]">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pri" />
                <div>
                  <p className="font-medium text-ink capitalize">
                    {entry.action.replace(/_/g, " ")}
                    <span className="ml-1 font-normal text-muted">
                      by {entry.actorRole}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted">
                    {formatVendorDate(entry.occurredAt)}
                  </p>
                  {entry.reason ? (
                    <p className="text-[10px] text-muted">{entry.reason}</p>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ol>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Payout accounts                                                            */
/* -------------------------------------------------------------------------- */

function PayoutAccounts() {
  const { toast } = useToast();
  const { permissions } = useAdminSession();
  const canManage = permissions.includes("withdrawals.manage");
  const { data, error, loading, reload } =
    useResource<AdminBankAccountListResult>(
      "admin-payout-accounts",
      () => adminWithdrawalApi.bankAccounts(),
      "We could not load payout accounts.",
    );
  const [rejecting, setRejecting] = useState<AdminBankAccount | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];

  async function verify(account: AdminBankAccount) {
    setBusyId(account._id);

    try {
      await adminWithdrawalApi.verifyBankAccount(account._id, {
        status: "verified",
      });
      toast({
        title: "Payout account verified",
        description: "The vendor can withdraw to this account.",
        tone: "success",
      });
      reload();
    } catch (requestError) {
      toast({
        title: "Could not verify the account",
        description:
          requestError instanceof ApiError
            ? requestError.message
            : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function rejectAccount() {
    if (!rejecting || !reason.trim()) return;

    setBusyId(rejecting._id);

    try {
      await adminWithdrawalApi.verifyBankAccount(rejecting._id, {
        status: "rejected",
        reason: reason.trim(),
      });
      toast({
        title: "Payout account rejected",
        description: "The vendor is asked to correct the account details.",
        tone: "success",
      });
      setRejecting(null);
      setReason("");
      reload();
    } catch (requestError) {
      toast({
        title: "Could not reject the account",
        description:
          requestError instanceof ApiError
            ? requestError.message
            : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[160px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Payout accounts unavailable"
        description={error}
        onRetry={reload}
      />
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-well text-pri">
          <Icon name="building" className="size-5" />
        </span>
        <h2 className="mt-3 text-[14px] font-semibold text-ink">
          No payout accounts yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted">
          Accounts appear here when vendors add them or when an approved store
          settlement account is promoted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <section
            key={account._id}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {account.bankName}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {account.accountName}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-ink">
                  ••••{account.accountNumber.slice(-4)}
                </p>
              </div>
              <Badge
                tone={
                  account.verificationStatus === "verified"
                    ? "green"
                    : account.verificationStatus === "rejected"
                      ? "red"
                      : "amber"
                }
              >
                {account.verificationStatus === "verified"
                  ? "Verified"
                  : account.verificationStatus === "rejected"
                    ? "Rejected"
                    : "Pending"}
              </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.1em] text-muted uppercase">
                  Vendor
                </dt>
                <dd className="mt-0.5 truncate text-ink">
                  {populated(account.vendor, "name") ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.1em] text-muted uppercase">
                  Store
                </dt>
                <dd className="mt-0.5 truncate text-ink">
                  {populated(account.store, "name") ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.1em] text-muted uppercase">
                  Source
                </dt>
                <dd className="mt-0.5 text-ink">
                  {account.source === "store_settlement"
                    ? "Store settlement"
                    : "Added by vendor"}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.1em] text-muted uppercase">
                  Added
                </dt>
                <dd className="mt-0.5 text-ink">
                  {formatAdminDate(account.createdAt)}
                </dd>
              </div>
            </dl>

            {account.rejectionReason ? (
              <p className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger">
                {account.rejectionReason}
              </p>
            ) : null}

            {canManage && account.verificationStatus !== "verified" ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <Button
                  size="sm"
                  loading={busyId === account._id}
                  onClick={() => void verify(account)}
                >
                  Verify account
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/5"
                  onClick={() => {
                    setRejecting(account);
                    setReason("");
                  }}
                >
                  Reject
                </Button>
                {populated(account.vendor, "_id") ? (
                  <Link
                    href={`/vendors/${populated(account.vendor, "_id")}`}
                    className="ml-auto text-[11px] font-semibold text-pri hover:underline"
                  >
                    Open vendor
                  </Link>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject this payout account?"
        description="The vendor sees the reason and can correct the details."
        size="sm"
        dismissible={!busyId}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejecting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!reason.trim()}
              loading={busyId === rejecting?._id}
              onClick={() => void rejectAccount()}
            >
              Reject account
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="text-[11px] font-semibold text-ink">Reason</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="e.g. Account name does not match the business records"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-[12px] text-ink focus:border-pri focus:ring-2 focus:ring-pri/10 focus:outline-none"
          />
        </label>
      </Modal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function Row({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3",
        wide && "sm:col-span-2",
      )}
    >
      <dt className="text-muted">{label}</dt>
      <dd className="break-all text-right text-ink">{value}</dd>
    </div>
  );
}

function populated(
  value: { _id: string; name: string } | string | null | undefined,
  key: "_id" | "name",
) {
  return value && typeof value === "object" ? value[key] : null;
}

function vendorName(withdrawal: AdminWithdrawal) {
  return populated(withdrawal.vendor, "name");
}

function storeName(withdrawal: AdminWithdrawal) {
  return populated(withdrawal.store, "name");
}

function isOpen(withdrawal: AdminWithdrawal) {
  return ["pending", "approved", "processing"].includes(withdrawal.status);
}

function availableActions(
  status: WithdrawalStatus,
): AdminWithdrawalDecisionAction[] {
  switch (status) {
    case "pending":
      return ["approve", "reject"];
    case "approved":
      return ["processing", "paid", "reject"];
    case "processing":
      return ["paid", "reject"];
    default:
      return [];
  }
}

function actionLabel(action: AdminWithdrawalDecisionAction) {
  switch (action) {
    case "approve":
      return "Approve request";
    case "processing":
      return "Mark processing";
    case "paid":
      return "Mark paid";
    case "reject":
      return "Reject request";
  }
}

function decisionMessage(action: AdminWithdrawalDecisionAction) {
  switch (action) {
    case "approve":
      return "Withdrawal approved";
    case "processing":
      return "Withdrawal moved to processing";
    case "paid":
      return "Withdrawal marked paid";
    case "reject":
      return "Withdrawal rejected";
  }
}
