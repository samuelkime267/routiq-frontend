"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useResource } from "@/hooks/useResource";
import { escrowAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira } from "@/lib/format";
import {
  ESCROW_RELEASE_LABELS,
  formatDisputeCategory,
  formatDisputeStatus,
  orderReference,
  partyName,
} from "@/lib/operations";
import type { AdminEscrowDetail } from "@/types/api";
import { DetailGrid, InfoRow, PageSkeleton, SectionCard } from "./shared";

const releaseTone = {
  released: "green",
  refunded: "blue",
  due: "amber",
  scheduled: "neutral",
} as const;

export default function EscrowDetail({ escrowId }: { escrowId: string }) {
  const { permissions } = useAdminSession();
  const { toast } = useToast();
  const { data, loading, refreshing, error, reload } =
    useResource<AdminEscrowDetail>(escrowId, () =>
      escrowAdminApi.get(escrowId),
    );

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [force, setForce] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const canRelease = permissions.includes("escrow.release");

  const submitRelease = async () => {
    setReleaseError(null);

    if (reason.trim().length < 5) {
      setReleaseError("Add a short reason (at least 5 characters).");
      return;
    }

    setReleasing(true);

    try {
      await escrowAdminApi.release(escrowId, {
        reason: reason.trim(),
        force,
      });

      toast({
        tone: "success",
        title: "Escrow released",
        description:
          "The vendor's available balance now includes this amount.",
      });

      setReleaseOpen(false);
      setReason("");
      setForce(false);
      void reload();
    } catch (releaseFailure) {
      setReleaseError(
        releaseFailure instanceof Error
          ? releaseFailure.message
          : "The escrow could not be released.",
      );
    } finally {
      setReleasing(false);
    }
  };

  if (loading) return <PageSkeleton label="Loading escrow record" />;

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Escrow record"
          eyebrow="Finance"
          breadcrumbs={breadcrumbsFor("/escrow")}
        />
        <ErrorState
          title="Could not load this escrow record"
          description={error ?? "This escrow record may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/escrow">
              Back to escrow
            </Button>
          }
        />
      </div>
    );
  }

  const { escrow, order, payment, customer, vendor, store, disputes, settlement, blockchain } =
    data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={orderReference(order ?? escrow.order)}
        eyebrow="Escrow record"
        description="Funds move when the inspection window closes, when the customer confirms receipt, or through an audited admin release."
        breadcrumbs={[
          ...breadcrumbsFor("/escrow"),
          { label: orderReference(order ?? escrow.order) },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" href="/escrow">
              Back to escrow
            </Button>
            {canRelease && escrow.status === "held" ? (
              <Button
                size="sm"
                onClick={() => {
                  setReleaseOpen((current) => !current);
                  setReleaseError(null);
                }}
              >
                Release funds
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={reload}
              loading={refreshing}
            >
              Refresh
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={escrow.status} />
            <Badge tone={releaseTone[settlement.releaseStatus]}>
              {ESCROW_RELEASE_LABELS[settlement.releaseStatus]}
            </Badge>
            <Badge tone="neutral">
              Held {formatAdminDate(escrow.heldAt)}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Amount held"
          value={formatNaira(settlement.amountHeld)}
          hint="Escrow liability"
          icon="wallet"
        />
        <MetricCard
          label="Available held"
          value={formatNaira(settlement.availableHeld)}
          hint="Held minus released and refunded"
          icon="lock"
        />
        <MetricCard
          label="Released"
          value={formatNaira(settlement.amountReleased)}
          hint={
            settlement.releasedAt
              ? formatAdminDate(settlement.releasedAt)
              : "Not released"
          }
          icon="check-circle"
        />
        <MetricCard
          label="Refunded"
          value={formatNaira(settlement.amountRefunded)}
          hint="Returned from escrow"
          icon="refresh"
        />
      </div>

      {releaseOpen ? (
        <section className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
          <h2 className="text-[13px] font-semibold text-ink">
            Release to vendor
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            The amount becomes withdrawable immediately. An unresolved dispute
            always blocks a release.
          </p>

          {releaseError ? (
            <Alert tone="error" className="mt-3">
              {releaseError}
            </Alert>
          ) : null}

          <label
            htmlFor="escrow-release-reason"
            className="mt-4 block text-[12px] font-semibold text-ink"
          >
            Reason
          </label>
          <textarea
            id="escrow-release-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this escrow being released?"
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
          />

          <label className="mt-3 flex items-center gap-2 text-[11.5px] text-ink">
            <input
              type="checkbox"
              checked={force}
              onChange={(event) => setForce(event.target.checked)}
              className="size-4 rounded border-line"
            />
            Release before the inspection window closes
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void submitRelease()}
              loading={releasing}
            >
              Confirm release
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReleaseOpen(false)}
              disabled={releasing}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      <DetailGrid>
        <div className="space-y-4">
          <SectionCard title="Settlement">
            <dl>
              <InfoRow
                label="Ledger status"
                value={<StatusBadge status={escrow.status} />}
              />
              <InfoRow
                label="Release status"
                value={
                  <Badge tone={releaseTone[settlement.releaseStatus]}>
                    {ESCROW_RELEASE_LABELS[settlement.releaseStatus]}
                  </Badge>
                }
              />
              <InfoRow
                label="Release due"
                value={
                  settlement.releaseDueAt
                    ? formatAdminDate(settlement.releaseDueAt)
                    : null
                }
              />
              <InfoRow
                label="Released at"
                value={
                  settlement.releasedAt
                    ? formatAdminDate(settlement.releasedAt)
                    : null
                }
              />
              <InfoRow label="Held at" value={formatAdminDate(escrow.heldAt)} />
              <InfoRow
                label="Created"
                value={formatAdminDate(escrow.createdAt)}
              />
            </dl>
          </SectionCard>

          <SectionCard title="Order">
            {order ? (
              <>
                <dl>
                  <InfoRow label="Order number" value={order.orderNumber} />
                  <InfoRow label="Master order" value={order.masterOrderNumber ?? null} />
                  <InfoRow label="Sub-order" value={order.subOrderNumber ?? null} />
                  <InfoRow
                    label="Order status"
                    value={<StatusBadge status={order.status} />}
                  />
                  <InfoRow
                    label="Payment status"
                    value={<StatusBadge status={order.paymentStatus} />}
                  />
                  <InfoRow label="Total" value={formatNaira(order.total)} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    href={`/orders/${order._id}`}
                  >
                    Open order
                  </Button>
                  {customer ? (
                    <Button
                      variant="outline"
                      size="sm"
                      href={`/customers/${customer._id}`}
                    >
                      Open customer
                    </Button>
                  ) : null}
                  {vendor ? (
                    <Button
                      variant="outline"
                      size="sm"
                      href={`/vendors/${vendor._id}`}
                    >
                      Open vendor
                    </Button>
                  ) : null}
                  {store ? (
                    <Button
                      variant="outline"
                      size="sm"
                      href={`/stores/${store._id}`}
                    >
                      Open store
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                The linked order no longer exists.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title={`Disputes (${disputes.length})`}
            description="Any dispute that references the linked order."
          >
            {disputes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                No disputes reference this order.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {disputes.map((dispute) => (
                  <li key={dispute._id}>
                    <Link
                      href={`/disputes/${dispute._id}`}
                      className="flex items-center justify-between gap-3 py-2.5 hover:text-pri"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-ink">
                          {dispute.subject}
                        </span>
                        <span className="text-[10px] text-muted">
                          {dispute.reference} ·{" "}
                          {formatDisputeCategory(dispute.category)}
                        </span>
                      </span>
                      <StatusBadge
                        status={dispute.status}
                        label={formatDisputeStatus(dispute.status)}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard
            title="Payment"
            action={
              payment ? (
                <Link
                  href={`/payments/${payment._id}`}
                  className="text-[11px] font-semibold text-pri hover:underline"
                >
                  Open transaction
                </Link>
              ) : undefined
            }
          >
            {payment ? (
              <dl>
                <InfoRow label="Reference" value={payment.reference} mono />
                <InfoRow
                  label="Status"
                  value={<StatusBadge status={payment.status} />}
                />
                <InfoRow label="Amount" value={formatNaira(payment.amount)} />
                <InfoRow
                  label="Vendor amount"
                  value={formatNaira(payment.vendorAmount)}
                />
                <InfoRow
                  label="Paid at"
                  value={payment.paidAt ? formatAdminDate(payment.paidAt) : null}
                />
              </dl>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                The linked payment no longer exists.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Parties">
            <dl>
              <InfoRow label="Customer" value={partyName(customer, "Unknown customer")} />
              <InfoRow label="Vendor" value={partyName(vendor, "Unknown vendor")} />
              <InfoRow label="Store" value={store?.name ?? null} />
            </dl>
          </SectionCard>

          <SectionCard title="Settlement rail">
            <Alert
              tone={blockchain.supported ? "success" : "info"}
              title={
                blockchain.supported
                  ? "Blockchain settlement available"
                  : "No blockchain settlement client"
              }
            >
              {blockchain.message ??
                "Escrow is recorded in the marketplace ledger only."}
            </Alert>
            <dl className="mt-3">
              <InfoRow label="Network" value={blockchain.network} />
              <InfoRow label="Reference" value={blockchain.reference} mono />
            </dl>
            <p className="mt-3 rounded-xl border border-line bg-soft/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
              This screen never releases or refunds funds. Those operations stay
              inside the audited payment and escrow settlement flow.
            </p>
          </SectionCard>
        </aside>
      </DetailGrid>
    </div>
  );
}
