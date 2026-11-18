"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";
import { TextField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { ApiError, vendorPortalApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { cn } from "@/lib/cn";
import {
  vendorBankAccountSchema,
  type VendorBankAccountValues,
} from "@/lib/schemas/vendorFinance";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import {
  bankVerificationLabel,
  bankVerificationTone,
  formatVendorDay,
  maskAccountNumber,
} from "@/lib/vendorPortal";
import type {
  VendorBankAccount,
  VendorBankAccountListResult,
} from "@/types/api";

export default function VendorBankAccounts() {
  const { toast } = useToast();
  const { data, error, loading, reload } =
    useResource<VendorBankAccountListResult>(
      "vendor-bank-accounts",
      () => vendorPortalApi.bankAccounts(),
      "We could not load your bank accounts.",
    );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VendorBankAccount | null>(null);
  const [deleting, setDeleting] = useState<VendorBankAccount | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];

  async function makeDefault(account: VendorBankAccount) {
    setBusyId(account._id);

    try {
      await vendorPortalApi.setDefaultBankAccount(account._id);
      toast({ title: "Default payout account updated", tone: "success" });
      reload();
    } catch (requestError) {
      toast({
        title: "Could not change the default account",
        description:
          requestError instanceof ApiError
            ? requestError.message
            : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Bank accounts"
        description="Where Routiq pays your withdrawals. Your store's settlement account is verified during KYB review; accounts you add here need verification before they can receive payouts."
        breadcrumbs={vendorBreadcrumbs("/finance/bank-accounts", [
          { label: "Finance", href: "/finance" },
          { label: "Bank accounts" },
        ])}
        actions={
          <>
            <Button
              size="sm"
              icon={<Icon name="plus" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add bank account
            </Button>
            <Button
              href="/finance/withdrawals"
              variant="outline"
              size="sm"
              icon={<Icon name="wallet" />}
            >
              Withdrawals
            </Button>
          </>
        }
        meta={
          data ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={data.hasVerifiedAccount ? "green" : "amber"}>
                {data.hasVerifiedAccount
                  ? "Verified account ready"
                  : "Verification needed"}
              </Badge>
              <Badge tone="neutral">
                {accounts.length} account{accounts.length === 1 ? "" : "s"}
              </Badge>
            </div>
          ) : undefined
        }
      />

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-[186px] rounded-2xl" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState
          title="Bank accounts unavailable"
          description={error}
          onRetry={reload}
        />
      ) : (
        <>
          {error ? (
            <Alert tone="error" title="Could not refresh your bank accounts">
              {error} Showing the last successful snapshot.
            </Alert>
          ) : null}

          {!data?.hasVerifiedAccount ? (
            <Alert tone="info" title="No verified account yet">
              You can request a withdrawal only to a verified account. Accounts
              you add stay pending until Routiq verifies them; your settlement
              account is verified automatically once your store is approved.
            </Alert>
          ) : null}

          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-well text-pri">
                <Icon name="building" className="size-5" />
              </span>
              <h2 className="mt-3 text-[14px] font-semibold text-ink">
                No payout accounts yet
              </h2>
              <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted">
                Add the Nigerian bank account you want withdrawals paid into. It
                will be reviewed before the first payout.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Add bank account
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map((account) => {
                const isSettlement = account.source === "store_settlement";

                return (
                  <section
                    key={account._id}
                    className={cn(
                      "rounded-2xl border bg-white p-5",
                      account.isDefault ? "border-pri/30" : "border-line",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-well text-pri">
                          <Icon name="building" className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">
                            {account.bankName}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {account.accountName}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-ink">
                            {maskAccountNumber(account.accountNumber)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {account.isDefault ? (
                          <Badge tone="teal">Default</Badge>
                        ) : null}
                        <Badge
                          tone={bankVerificationTone(
                            account.verificationStatus,
                          )}
                        >
                          {bankVerificationLabel(account.verificationStatus)}
                        </Badge>
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-lg bg-soft/50 px-2.5 py-2">
                        <dt className="text-[9px] font-semibold tracking-[0.1em] text-muted uppercase">
                          Source
                        </dt>
                        <dd className="mt-0.5 text-ink">
                          {isSettlement
                            ? "Store settlement"
                            : "Added by you"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-soft/50 px-2.5 py-2">
                        <dt className="text-[9px] font-semibold tracking-[0.1em] text-muted uppercase">
                          Added
                        </dt>
                        <dd className="mt-0.5 text-ink">
                          {formatVendorDay(account.createdAt)}
                        </dd>
                      </div>
                    </dl>

                    {account.verificationStatus === "rejected" &&
                    account.rejectionReason ? (
                      <p className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger">
                        {account.rejectionReason}
                      </p>
                    ) : null}

                    {account.verifiedAt ? (
                      <p className="mt-2 text-[10px] text-muted">
                        Verified {formatVendorDay(account.verifiedAt)}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      {!account.isDefault ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={busyId === account._id}
                          onClick={() => void makeDefault(account)}
                        >
                          Make default
                        </Button>
                      ) : null}
                      {!isSettlement ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(account);
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger/5"
                            onClick={() => setDeleting(account)}
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted">
                          Comes from your verified store application and cannot
                          be edited here.
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {formOpen ? (
        <BankAccountDialog
          account={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditing(null);
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this payout account?"
        description="You cannot remove an account that has already been used for a withdrawal. In that case it is archived and hidden from new requests."
        confirmLabel="Remove account"
        cancelLabel="Keep account"
        tone="danger"
        onConfirm={async () => {
          if (!deleting) return;

          const result = await vendorPortalApi.deleteBankAccount(deleting._id);
          toast({
            title: result.archived ? "Account archived" : "Account removed",
            description: result.archived
              ? "Past withdrawals keep their bank snapshot, so the account is kept for records."
              : "The account is no longer on your payout profile.",
            tone: "success",
          });
          setDeleting(null);
          reload();
        }}
      >
        {deleting ? (
          <p className="rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-[12px] text-muted">
            {deleting.bankName} · {maskAccountNumber(deleting.accountNumber)} ·{" "}
            {deleting.accountName}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

function BankAccountDialog({
  account,
  onClose,
  onSaved,
}: {
  account: VendorBankAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorBankAccountValues>({
    resolver: zodResolver(vendorBankAccountSchema),
    defaultValues: {
      bankName: account?.bankName ?? "",
      bankCode: account?.bankCode ?? "",
      accountName: account?.accountName ?? "",
      accountNumber: account?.accountNumber ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      if (account) {
        await vendorPortalApi.updateBankAccount(account._id, values);
      } else {
        await vendorPortalApi.createBankAccount(values);
      }

      toast({
        title: account ? "Bank account updated" : "Bank account added",
        description:
          account &&
          (values.accountNumber !== account.accountNumber ||
            values.bankCode !== account.bankCode ||
            values.accountName !== account.accountName)
            ? "Because the account details changed, verification starts again."
            : "Routiq reviews new accounts before they can receive payouts.",
        tone: "success",
      });
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, [
          "bankName",
          "bankCode",
          "accountName",
          "accountNumber",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The bank account could not be saved.",
        );
      }
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={account ? "Edit payout account" : "Add payout account"}
      description="Only Nigerian bank accounts in your business or trading name should be used."
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
            form="vendor-bank-account-form"
            size="sm"
            loading={isSubmitting}
          >
            {account ? "Save changes" : "Add account"}
          </Button>
        </>
      }
    >
      <form
        id="vendor-bank-account-form"
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <TextField
          label="Bank name"
          placeholder="e.g. Guaranty Trust Bank"
          register={register("bankName")}
          error={errors.bankName?.message}
        />
        <TextField
          label="Bank code"
          placeholder="e.g. 058"
          inputMode="numeric"
          hint="The 3–6 digit NIBSS code for the bank."
          register={register("bankCode")}
          error={errors.bankCode?.message}
        />
        <TextField
          label="Account name"
          placeholder="Name exactly as it appears on the account"
          register={register("accountName")}
          error={errors.accountName?.message}
        />
        <TextField
          label="Account number"
          placeholder="10-digit NUBAN"
          inputMode="numeric"
          maxLength={10}
          register={register("accountNumber")}
          error={errors.accountNumber?.message}
        />

        {formError ? (
          <p role="alert" className="text-[12px] text-danger">
            {formError}
          </p>
        ) : null}

        <p className="text-[10px] leading-relaxed text-muted">
          Bank name resolution is not automatic, so Routiq verifies new account
          details manually before paying out.
        </p>
      </form>
    </Modal>
  );
}
