"use client";

import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import { FilterBar, FilterDate, FilterSelect } from "@/components/ui/FilterBar";
import { SelectField, TextField, TextareaField } from "@/components/ui/FormField";
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
import { ApiError, vendorPortalApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { formatNaira, formatNumber } from "@/lib/format";
import type { SortDirection } from "@/lib/pagination";
import {
  vendorWithdrawalSchema,
  type VendorWithdrawalValues,
} from "@/lib/schemas/vendorFinance";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import {
  canCancelWithdrawal,
  formatVendorDate,
  maskAccountNumber,
  WITHDRAWAL_STATUS_OPTIONS,
  withdrawalBankLine,
  withdrawalStatusLabel,
  withdrawalStatusTone,
} from "@/lib/vendorPortal";
import type {
  VendorBankAccountListResult,
  VendorWithdrawal,
  VendorWithdrawalListResult,
} from "@/types/api";

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "amount:desc", label: "Largest amount" },
  { value: "amount:asc", label: "Smallest amount" },
  { value: "paidAt:desc", label: "Recently paid" },
];

export default function VendorWithdrawals() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<
    VendorWithdrawalListResult["summary"] | null
  >(null);
  const [balance, setBalance] = useState<
    VendorWithdrawalListResult["balance"] | null
  >(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selected, setSelected] = useState<VendorWithdrawal | null>(null);
  const [cancelling, setCancelling] = useState<VendorWithdrawal | null>(null);

  const accounts = useResource<VendorBankAccountListResult>(
    "vendor-bank-accounts",
    () => vendorPortalApi.bankAccounts(),
    "We could not load your bank accounts.",
  );

  const verifiedAccounts = useMemo(
    () =>
      (accounts.data?.accounts ?? []).filter(
        (account) => account.verificationStatus === "verified",
      ),
    [accounts.data],
  );

  const table = useServerTable<VendorWithdrawal>({
    loader: async (query) => {
      const result = await vendorPortalApi.withdrawals({
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
      setBalance(result.balance);

      return { rows: result.withdrawals, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const available = balance?.availableBalance ?? 0;
  const canRequest = available >= 1_000;
  const hasVerifiedAccount = verifiedAccounts.length > 0;

  const columns: DataTableColumn<VendorWithdrawal>[] = [
    {
      id: "reference",
      header: "Reference",
      primary: true,
      sortable: true,
      cell: (withdrawal) => (
        <button
          type="button"
          onClick={() => setSelected(withdrawal)}
          className="block max-w-full text-left"
        >
          <span className="block truncate font-mono text-[11px] font-semibold text-ink hover:text-pri">
            {withdrawal.reference}
          </span>
          <span className="block truncate text-[10px] text-muted">
            {withdrawalBankLine(withdrawal)}
          </span>
        </button>
      ),
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
      id: "status",
      header: "Status",
      sortable: true,
      cell: (withdrawal) => (
        <div className="space-y-1">
          <Badge tone={withdrawalStatusTone(withdrawal.status)}>
            {withdrawalStatusLabel(withdrawal.status)}
          </Badge>
          {withdrawal.status === "rejected" && withdrawal.rejectionReason ? (
            <p className="max-w-[180px] truncate text-[10px] text-danger">
              {withdrawal.rejectionReason}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "paidAt",
      header: "Paid",
      hideOnMobile: true,
      sortable: true,
      sortKey: "paidAt",
      cell: (withdrawal) => (
        <span className="text-[12px] text-muted">
          {withdrawal.paidAt ? formatVendorDate(withdrawal.paidAt) : "—"}
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Withdrawals"
        description="Request a payout of your settled balance. Requests are reserved immediately, reviewed by Routiq, and only marked paid after the payout is confirmed."
        breadcrumbs={vendorBreadcrumbs("/finance/withdrawals", [
          { label: "Finance", href: "/finance" },
          { label: "Withdrawals" },
        ])}
        actions={
          <>
            <Button
              size="sm"
              icon={<Icon name="wallet" />}
              disabled={!canRequest || !hasVerifiedAccount}
              onClick={() => setRequestOpen(true)}
            >
              Request withdrawal
            </Button>
            <Button
              href="/finance/bank-accounts"
              variant="outline"
              size="sm"
              icon={<Icon name="building" />}
            >
              Bank accounts
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              {formatNumber(summary?.total ?? table.meta.total)} requests
            </Badge>
            {(summary?.reserved ?? 0) > 0 ? (
              <Badge tone="amber">
                {formatNaira(summary?.reserved ?? 0)} reserved
              </Badge>
            ) : null}
            <Badge tone="green">
              {formatNaira(summary?.paid ?? 0)} paid out
            </Badge>
          </div>
        }
      />

      {!accounts.loading && !hasVerifiedAccount ? (
        <Alert tone="info" title="Add a verified bank account first">
          Withdrawals are paid only to verified accounts.{" "}
          <a
            href="/finance/bank-accounts"
            className="font-semibold underline underline-offset-2"
          >
            Add or verify a bank account
          </a>
          .
        </Alert>
      ) : null}

      <section
        aria-label="Withdrawal balance"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {!balance
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[116px] rounded-2xl" />
            ))
          : [
              {
                label: "Available balance",
                value: balance.availableBalance,
                hint: "Validated on the server",
                icon: "wallet" as const,
              },
              {
                label: "Reserved",
                value: balance.reserved,
                hint: "Open requests awaiting payout",
                icon: "clock" as const,
              },
              {
                label: "Settled earnings",
                value: balance.settledEarnings,
                hint: "Released from escrow",
                icon: "check-circle" as const,
              },
              {
                label: "Withdrawn",
                value: balance.withdrawn,
                hint: "Confirmed payouts",
                icon: "wallet" as const,
              },
            ].map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={formatNaira(item.value)}
                hint={item.hint}
                icon={item.icon}
              />
            ))}
      </section>

      {balance && balance.settledEarnings === 0 ? (
        <Alert tone="info" title="Nothing has settled yet">
          Escrow is released after an order is delivered and its hold period
          ends. Until then, earnings show as pending on your finance page.
        </Alert>
      ) : null}

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search reference, bank or payout reference"
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
          caption="Your withdrawal requests, sorted and paginated by the server"
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
            <div className="flex items-center justify-end gap-1">
              {canCancelWithdrawal(withdrawal) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2.5"
                  onClick={() => setCancelling(withdrawal)}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="px-2.5"
                onClick={() => setSelected(withdrawal)}
              >
                Details
              </Button>
            </div>
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No withdrawals match these filters"
              : "No withdrawal requests yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the status and date filters."
              : "Request a payout when your settled balance is at least ₦1,000."
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
            ) : (
              <Button
                size="sm"
                disabled={!canRequest || !hasVerifiedAccount}
                onClick={() => setRequestOpen(true)}
              >
                Request withdrawal
              </Button>
            )
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

      {requestOpen ? (
        <RequestWithdrawalDialog
          available={available}
          accounts={verifiedAccounts.map((account) => ({
            value: account._id,
            label: `${account.bankName} · ${maskAccountNumber(account.accountNumber)}${
              account.isDefault ? " (default)" : ""
            }`,
          }))}
          onClose={() => setRequestOpen(false)}
          onSaved={() => {
            setRequestOpen(false);
            table.reload();
          }}
        />
      ) : null}

      {selected ? (
        <WithdrawalDetailModal
          withdrawal={selected}
          onClose={() => setSelected(null)}
          onCancel={() => {
            setCancelling(selected);
            setSelected(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel this withdrawal request?"
        description="Only requests awaiting review can be cancelled. The reserved amount returns to your available balance."
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        tone="danger"
        onConfirm={async () => {
          if (!cancelling) return;

          await vendorPortalApi.cancelWithdrawal(cancelling._id);
          toast({
            title: "Withdrawal request cancelled",
            description: "The reserved amount is available again.",
            tone: "success",
          });
          setCancelling(null);
          table.reload();
        }}
      >
        {cancelling ? (
          <p className="rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-[12px] text-muted">
            {cancelling.reference} · {formatNaira(cancelling.amount)} ·{" "}
            {withdrawalBankLine(cancelling)}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

function RequestWithdrawalDialog({
  available,
  accounts,
  onClose,
  onSaved,
}: {
  available: number;
  accounts: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `wd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VendorWithdrawalValues>({
    resolver: zodResolver(vendorWithdrawalSchema),
    defaultValues: {
      amount: Math.min(available, 50_000),
      bankAccountId: accounts[0]?.value ?? "",
      note: "",
    },
  });

  const amount = watch("amount") || 0;
  const exceeds = amount > available;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    if (values.amount > available) {
      setError("amount", {
        type: "manual",
        message: `You can withdraw at most ${formatNaira(available)} right now.`,
      });
      return;
    }

    try {
      const result = await vendorPortalApi.createWithdrawal({
        amount: values.amount,
        bankAccountId: values.bankAccountId,
        idempotencyKey: idempotencyKey.current,
        note: values.note.trim() || undefined,
      });

      toast({
        title: result.created === false ? "Request already submitted" : "Withdrawal requested",
        description:
          result.created === false
            ? "This request was already recorded, so nothing was reserved twice."
            : "The amount is reserved while Routiq reviews the payout.",
        tone: "success",
      });
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, [
          "amount",
          "bankAccountId",
          "note",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The withdrawal request could not be created.",
        );
      }
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Request a withdrawal"
      description="The amount is reserved from your settled balance as soon as the request is accepted."
      size="md"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="vendor-withdrawal-form"
            size="sm"
            loading={isSubmitting}
            disabled={exceeds}
          >
            Request {amount > 0 ? formatNaira(amount) : "withdrawal"}
          </Button>
        </>
      }
    >
      <form
        id="vendor-withdrawal-form"
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <div className="rounded-xl border border-pri/15 bg-well px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
            Available to withdraw
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-tight text-pri">
            {formatNaira(available)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            Includes no reserved amounts; those are already deducted.
          </p>
        </div>

        {accounts.length === 0 ? (
          <Alert tone="error" title="No verified bank account">
            Verify a bank account before requesting a withdrawal.
          </Alert>
        ) : (
          <SelectField
            label="Pay out to"
            register={register("bankAccountId")}
            error={errors.bankAccountId?.message}
            options={accounts}
          />
        )}

        <TextField
          label="Amount (₦)"
          type="number"
          min={1_000}
          max={available}
          step={1}
          inputMode="numeric"
          hint={`Minimum ₦1,000 · maximum ${formatNaira(available)}`}
          register={register("amount", { valueAsNumber: true })}
          error={
            errors.amount?.message ??
            (exceeds
              ? `You can withdraw at most ${formatNaira(available)} right now.`
              : undefined)
          }
        />

        <TextareaField
          label="Note"
          optional
          rows={2}
          placeholder="Anything the finance team should know."
          register={register("note")}
          error={errors.note?.message}
        />

        {formError ? (
          <p role="alert" className="text-[12px] text-danger">
            {formError}
          </p>
        ) : null}

        <p className="text-[10px] leading-relaxed text-muted">
          Requests are reviewed before payout. Rejections release the reserved
          amount back to your balance.
        </p>
      </form>
    </Modal>
  );
}

function WithdrawalDetailModal({
  withdrawal,
  onClose,
  onCancel,
}: {
  withdrawal: VendorWithdrawal;
  onClose: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Withdrawal detail"
      description={withdrawal.reference}
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {canCancelWithdrawal(withdrawal) ? (
            <Button variant="danger" size="sm" onClick={onCancel}>
              Cancel request
            </Button>
          ) : null}
        </>
      }
    >
      <dl className="space-y-2 text-[12px]">
        <Row
          label="Status"
          value={
            <Badge tone={withdrawalStatusTone(withdrawal.status)}>
              {withdrawalStatusLabel(withdrawal.status)}
            </Badge>
          }
        />
        <Row label="Amount" value={formatNaira(withdrawal.amount)} />
        <Row label="Bank" value={withdrawal.bankSnapshot.bankName} />
        <Row
          label="Account"
          value={`${withdrawal.bankSnapshot.accountName} · ${maskAccountNumber(
            withdrawal.bankSnapshot.accountNumber,
          )}`}
        />
        <Row label="Requested" value={formatVendorDate(withdrawal.requestedAt)} />
        <Row
          label="Balance before"
          value={formatNaira(withdrawal.balanceBefore)}
        />
        <Row
          label="Balance after"
          value={formatNaira(withdrawal.balanceAfter)}
        />
        {withdrawal.payoutReference ? (
          <Row
            label="Payout reference"
            value={withdrawal.payoutReference}
          />
        ) : null}
        {withdrawal.paidAt ? (
          <Row label="Paid" value={formatVendorDate(withdrawal.paidAt)} />
        ) : null}
      </dl>

      {withdrawal.rejectionReason ? (
        <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger">
          {withdrawal.rejectionReason}
        </p>
      ) : null}

      {withdrawal.adminNote ? (
        <p className="mt-3 rounded-xl border border-line bg-soft/50 px-3 py-2 text-[11px] text-muted">
          {withdrawal.adminNote}
        </p>
      ) : null}

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          History
        </p>
        <ol className="mt-2 space-y-2.5">
          {[...withdrawal.history].reverse().map((entry) => (
            <li key={entry._id} className="flex gap-2.5">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-pri" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-ink capitalize">
                  {entry.action.replace(/_/g, " ")}
                  {entry.actorRole !== "system" ? (
                    <span className="ml-1 text-[10px] font-normal text-muted">
                      by {entry.actorRole}
                    </span>
                  ) : null}
                </p>
                <p className="text-[10px] text-muted">
                  {formatVendorDate(entry.occurredAt)}
                </p>
                {entry.reason ? (
                  <p className="mt-0.5 text-[11px] text-muted">{entry.reason}</p>
                ) : null}
              </div>
            </li>
          ))}
          {withdrawal.history.length === 0 ? (
            <li className="text-[11px] text-muted">No history recorded.</li>
          ) : null}
        </ol>
      </div>
    </Modal>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all text-right text-ink">{value}</dd>
    </div>
  );
}
