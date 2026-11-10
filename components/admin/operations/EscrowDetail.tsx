"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
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
  const { data, loading, refreshing, error, reload } =
    useResource<AdminEscrowDetail>(escrowId, () =>
      escrowAdminApi.get(escrowId),
    );

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
        description="Read-only monitoring record. Funds are moved only by the existing payment and escrow settlement rules."
        breadcrumbs={[
          ...breadcrumbsFor("/escrow"),
          { label: orderReference(order ?? escrow.order) },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" href="/escrow">
              Back to escrow
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
