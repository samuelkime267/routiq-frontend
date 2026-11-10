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
import { transactionAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira } from "@/lib/format";
import {
  formatDisputeCategory,
  formatDisputeStatus,
  formatPaymentChannel,
  orderReference,
  partyName,
} from "@/lib/operations";
import type { AdminTransactionDetail } from "@/types/api";
import { DetailGrid, InfoRow, PageSkeleton, SectionCard } from "./shared";

export default function TransactionDetail({
  transactionId,
}: {
  transactionId: string;
}) {
  const { data, loading, refreshing, error, reload } =
    useResource<AdminTransactionDetail>(transactionId, () =>
      transactionAdminApi.get(transactionId),
    );

  if (loading) return <PageSkeleton label="Loading transaction" />;

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Transaction"
          eyebrow="Finance"
          breadcrumbs={breadcrumbsFor("/payments")}
        />
        <ErrorState
          title="Could not load this transaction"
          description={error ?? "This transaction may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/payments">
              Back to transactions
            </Button>
          }
        />
      </div>
    );
  }

  const { transaction, escrow, disputes, verification } = data;
  const order =
    transaction.order && typeof transaction.order === "object"
      ? transaction.order
      : null;
  const isRefund = transaction.transactionType === "refund";

  return (
    <div className="space-y-5">
      <PageHeader
        title={transaction.reference}
        eyebrow={isRefund ? "Refund record" : "Payment record"}
        description={`${orderReference(transaction.order)} · ${formatPaymentChannel(
          transaction.channel,
        )}`}
        breadcrumbs={[...breadcrumbsFor("/payments"), { label: transaction.reference }]}
        actions={
          <>
            <Button variant="outline" size="sm" href="/payments">
              Back to transactions
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
            <Badge tone={isRefund ? "blue" : "teal"}>
              {isRefund ? "Refund" : "Payment"}
            </Badge>
            <StatusBadge status={transaction.status} />
            <Badge tone="neutral">
              Created {formatAdminDate(transaction.createdAt)}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Amount"
          value={formatNaira(transaction.amount)}
          hint={`${transaction.currency} · ${formatPaymentChannel(transaction.channel)}`}
          icon="card"
        />
        <MetricCard
          label="Platform fee"
          value={formatNaira(transaction.platformFee)}
          hint="Commission stored on this payment"
          icon="bar-chart"
        />
        <MetricCard
          label="Vendor amount"
          value={formatNaira(transaction.vendorAmount)}
          hint="Expected escrow contribution"
          icon="wallet"
        />
        <MetricCard
          label="Paid"
          value={transaction.paidAt ? formatAdminDate(transaction.paidAt) : "Not paid"}
          hint={transaction.failedReason ?? "No failure recorded"}
          icon="clock"
        />
      </div>

      <DetailGrid>
        <div className="space-y-4">
          <SectionCard title="Transaction">
            <dl>
              <InfoRow label="Reference" value={transaction.reference} mono />
              <InfoRow
                label="Type"
                value={isRefund ? "Refund" : "Payment"}
              />
              <InfoRow
                label="Status"
                value={<StatusBadge status={transaction.status} />}
              />
              <InfoRow label="Channel" value={formatPaymentChannel(transaction.channel)} />
              <InfoRow label="Amount" value={formatNaira(transaction.amount)} />
              <InfoRow label="Platform fee" value={formatNaira(transaction.platformFee)} />
              <InfoRow label="Vendor amount" value={formatNaira(transaction.vendorAmount)} />
              <InfoRow label="Currency" value={transaction.currency} />
              <InfoRow
                label="Paid at"
                value={transaction.paidAt ? formatAdminDate(transaction.paidAt) : null}
              />
              <InfoRow
                label="Created"
                value={formatAdminDate(transaction.createdAt)}
              />
              {transaction.failedReason ? (
                <InfoRow label="Failure" value={transaction.failedReason} />
              ) : null}
            </dl>
          </SectionCard>

          <SectionCard
            title="Order"
            action={
              order ? (
                <Link
                  href={`/orders/${order._id}`}
                  className="text-[11px] font-semibold text-pri hover:underline"
                >
                  Open order
                </Link>
              ) : undefined
            }
          >
            {order ? (
              <dl>
                <InfoRow label="Order number" value={order.orderNumber} />
                <InfoRow
                  label="Master order"
                  value={order.masterOrderNumber ?? null}
                />
                <InfoRow label="Sub-order" value={order.subOrderNumber ?? null} />
                <InfoRow
                  label="Order status"
                  value={order.status ? <StatusBadge status={order.status} /> : null}
                />
                <InfoRow
                  label="Order total"
                  value={order.total !== undefined ? formatNaira(order.total) : null}
                />
                <InfoRow
                  label="Placed"
                  value={order.createdAt ? formatAdminDate(order.createdAt) : null}
                />
              </dl>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                This transaction is not linked to an order record.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Parties">
            <dl>
              <InfoRow
                label="Customer"
                value={partyName(transaction.customer, "Unknown customer")}
              />
              <InfoRow
                label="Vendor"
                value={partyName(transaction.vendor, "Unknown vendor")}
              />
              <InfoRow
                label="Store"
                value={
                  transaction.store && typeof transaction.store === "object"
                    ? transaction.store.name
                    : null
                }
              />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {transaction.customer && typeof transaction.customer === "object" ? (
                <Button
                  variant="outline"
                  size="sm"
                  href={`/customers/${transaction.customer._id}`}
                >
                  Open customer
                </Button>
              ) : null}
              {transaction.vendor && typeof transaction.vendor === "object" ? (
                <Button
                  variant="outline"
                  size="sm"
                  href={`/vendors/${transaction.vendor._id}`}
                >
                  Open vendor
                </Button>
              ) : null}
              {transaction.store && typeof transaction.store === "object" ? (
                <Button
                  variant="outline"
                  size="sm"
                  href={`/stores/${transaction.store._id}`}
                >
                  Open store
                </Button>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title={`Related disputes (${disputes.length})`}
            description="Open or under-review disputes linked to this order."
          >
            {disputes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                No open disputes reference this order.
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
            title="Escrow"
            action={
              escrow ? (
                <Link
                  href={`/escrow/${escrow._id}`}
                  className="text-[11px] font-semibold text-pri hover:underline"
                >
                  Open record
                </Link>
              ) : undefined
            }
          >
            {escrow ? (
              <>
                <dl>
                  <InfoRow
                    label="Status"
                    value={<StatusBadge status={escrow.status} />}
                  />
                  <InfoRow label="Held" value={formatNaira(escrow.amountHeld)} />
                  <InfoRow
                    label="Released"
                    value={formatNaira(escrow.amountReleased)}
                  />
                  <InfoRow
                    label="Refunded"
                    value={formatNaira(escrow.amountRefunded)}
                  />
                  <InfoRow
                    label="Held at"
                    value={escrow.heldAt ? formatAdminDate(escrow.heldAt) : null}
                  />
                </dl>
                <p className="mt-3 rounded-xl border border-line bg-soft/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  Escrow balances are a liability until released. They are not
                  realised revenue.
                </p>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                No escrow record exists for this payment.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Verification">
            <Alert
              tone={verification.providerConfigured ? "success" : "info"}
              title={
                verification.providerConfigured
                  ? "Provider verification available"
                  : "External verification not configured"
              }
            >
              {verification.message}
            </Alert>
            <dl className="mt-3">
              <InfoRow label="Source" value={verification.source} />
              <InfoRow
                label="Provider"
                value={verification.providerReference ?? null}
              />
            </dl>
          </SectionCard>
        </aside>
      </DetailGrid>
    </div>
  );
}
