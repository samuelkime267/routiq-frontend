"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useAdminSession } from "@/components/admin/AdminSession";
import StoreActionDialog from "@/components/admin/stores/StoreActionDialog";
import { useResource } from "@/hooks/useResource";
import { storeAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { formatNaira, formatNumber } from "@/lib/format";
import type { StoreActionKind } from "@/lib/schemas/store";
import {
  formatBusinessType,
  formatStoreDocument,
  reviewActionPresentation,
  reviewActorName,
  storeStatusLabel,
} from "@/lib/vendors";
import type { AdminStoreDetail, StoreReviewAction } from "@/types/api";

interface StoreReviewProps {
  storeId: string;
}

/**
 * Full store review workspace: KYB readiness, business and settlement details,
 * uploaded documents, metrics and the append-only review history.
 */
export default function StoreReview({ storeId }: StoreReviewProps) {
  const { permissions } = useAdminSession();
  const { data, loading, refreshing, error, reload } =
    useResource<AdminStoreDetail>(storeId, () => storeAdminApi.get(storeId));
  const [dialog, setDialog] = useState<StoreActionKind | null>(null);

  const canApprove = permissions.includes("stores.approve");
  const canReject = permissions.includes("stores.reject");
  const canSuspend = permissions.includes("stores.suspend");

  if (loading) {
    return <ReviewSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Store review"
          eyebrow="Marketplace"
          breadcrumbs={breadcrumbsForStore()}
        />
        <ErrorState
          title="Could not load this store"
          description={error ?? "This store may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/stores">
              Back to approvals
            </Button>
          }
        />
      </div>
    );
  }

  const { store, history, readiness, metrics } = data;
  const owner = typeof store.owner === "string" ? null : store.owner;
  const reviewing = ["pending", "under_review"].includes(store.status);

  const actions: StoreActionKind[] = [];

  if (reviewing && canApprove) actions.push("approve");
  if (reviewing && canApprove) actions.push("request-information");
  if (reviewing && canReject) actions.push("reject");
  if (store.status === "approved" && canSuspend) actions.push("suspend");
  if (store.status === "suspended" && canSuspend) actions.push("reactivate");

  const timeline: TimelineItem[] = history.map((review) => {
    const presentation = reviewActionPresentation(review.action);

    return {
      id: review._id,
      title: presentation.label,
      description: reviewDescription(review.action, review.reason, review.message),
      time: `${formatAdminDate(review.createdAt)} · ${reviewActorName(review)}`,
      icon: presentation.icon,
      tone: presentation.tone,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={store.name}
        eyebrow="Store application"
        description={store.legalBusinessName}
        breadcrumbs={breadcrumbsForStore(store.name)}
        actions={
          <>
            <Button variant="outline" size="sm" href="/stores">
              Back to approvals
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
            <StatusBadge
              status={store.status}
              label={storeStatusLabel(store.status)}
            />
            <Badge tone="neutral">
              Submitted {formatAdminDate(store.submittedAt ?? store.createdAt)}
            </Badge>
            {owner ? (
              <Badge tone="neutral">Vendor: {owner.name}</Badge>
            ) : null}
            {store.reviewedAt ? (
              <Badge tone="neutral">
                Last reviewed {formatAdminDate(store.reviewedAt)}
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {store.status === "rejected" && store.rejectionReason ? (
            <Callout
              title="Rejected — vendor was told"
              body={store.rejectionReason}
            />
          ) : null}

          {store.status === "suspended" && store.suspensionReason ? (
            <Callout
              title="Suspended — vendor was told"
              body={store.suspensionReason}
              meta={
                store.suspendedAt
                  ? `Suspended ${formatAdminDate(store.suspendedAt)}`
                  : undefined
              }
            />
          ) : null}

          <ReadinessPanel
            ready={readiness.ready}
            missing={readiness.missing}
            canApprove={reviewing && canApprove}
            onApprove={() => setDialog("approve")}
          />

          <Card
            title="Business details"
            description="Legal identity and contact information supplied during onboarding."
          >
            <dl>
              <InfoRow label="Legal business name" value={store.legalBusinessName} />
              <InfoRow label="Trading name" value={store.name} />
              <InfoRow label="Business type" value={formatBusinessType(store.businessType)} />
              <InfoRow label="Category" value={store.category} />
              <InfoRow label="CAC registration" value={store.cacRegistrationNumber} />
              <InfoRow label="Tax identification (TIN)" value={store.tin} />
              <InfoRow label="SCUML number" value={store.scumlNumber} />
              <InfoRow label="Registration date" value={store.businessRegistrationDate} />
              <InfoRow label="Business email" value={store.email} />
              <InfoRow label="Phone" value={store.phoneNumber} />
              <InfoRow label="Store slug" value={store.slug} />
            </dl>
            {store.description ? (
              <p className="mt-3 rounded-xl bg-well/50 px-3.5 py-3 text-[12px] leading-relaxed text-ink">
                {store.description}
              </p>
            ) : null}
          </Card>

          <Card
            title="Store location"
            description="Pickup address and operating hours used by customers and riders."
          >
            <p className="text-[13px] leading-relaxed text-ink">
              {[store.address.street, store.address.lga, store.address.city, store.address.state]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {store.address.country}
              {store.address.landmark ? ` · Landmark: ${store.address.landmark}` : ""}
              {store.address.postalCode ? ` · ${store.address.postalCode}` : ""}
            </p>
            {store.pickupInstructions ? (
              <p className="mt-3 rounded-xl bg-well/50 px-3.5 py-3 text-[12px] leading-relaxed text-ink">
                <span className="font-semibold">Pickup instructions: </span>
                {store.pickupInstructions}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(store.operatingHours ?? []).map((hour) => (
                <div
                  key={hour.day}
                  className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-[12px]"
                >
                  <span className="font-medium text-ink capitalize">{hour.day}</span>
                  <span className="text-muted">
                    {hour.isOpen
                      ? `${hour.openingTime ?? "—"} – ${hour.closingTime ?? "—"}`
                      : "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Representative"
            description="Person responsible for the business. KYB identifiers are shown for review only."
            action={<Badge tone="amber">Sensitive</Badge>}
          >
            <dl>
              <InfoRow label="Full name" value={store.representative.fullName} />
              <InfoRow
                label="Identification"
                value={`${store.representative.idType.replace(/_/g, " ")} · ${store.representative.idNumber}`}
              />
              <InfoRow label="NIN" value={store.representative.nin} />
              <InfoRow label="BVN" value={store.representative.bvn} />
              <InfoRow label="Date of birth" value={store.representative.dateOfBirth} />
              <InfoRow label="Nationality" value={store.representative.nationality} />
            </dl>
          </Card>

          <Card
            title="Settlement account"
            description="Where vendor payouts are sent."
          >
            <dl>
              <InfoRow label="Bank" value={store.settlementAccount.bankName} />
              <InfoRow label="Bank code" value={store.settlementAccount.bankCode} />
              <InfoRow label="Account name" value={store.settlementAccount.accountName} />
              <InfoRow label="Account number" value={store.settlementAccount.accountNumber} />
            </dl>
          </Card>

          <Card
            title={`Documents (${store.documents.length})`}
            description="Uploaded KYB evidence. Open each file in a new tab to verify it."
          >
            {store.documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-muted">
                No documents uploaded yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {store.documents.map((document) => (
                  <li key={`${document.type}-${document.url}`}>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 py-2.5 transition hover:text-pri"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-well text-pri">
                          <Icon name="file-text" className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-semibold text-ink">
                            {formatStoreDocument(document.type)}
                          </span>
                          {document.name ? (
                            <span className="block truncate text-[11px] text-muted">
                              {document.name}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <Icon name="arrow-up-right" className="size-4 shrink-0 text-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Store performance"
            description="Lifetime figures for this store."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Products" value={formatNumber(metrics.products)} icon="package" />
              <MetricCard label="Orders" value={formatNumber(metrics.orders)} icon="shopping-bag" />
              <MetricCard label="Order value" value={formatNaira(metrics.orderRevenue)} icon="bar-chart" />
              <MetricCard
                label="Transactions"
                value={formatNaira(metrics.transactionVolume)}
                hint={`${formatNumber(metrics.transactions)} successful payments`}
                icon="wallet"
              />
            </div>
          </Card>

          <Card
            title="Review history"
            description="Every submission and administrative decision on this store."
          >
            <Timeline
              items={timeline}
              emptyLabel="No review activity has been recorded yet."
            />
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Decision</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {decisionHint(store.status)}
            </p>

            <div className="mt-3 space-y-2">
              {actions.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  fullWidth
                  variant={
                    action === "reject" || action === "suspend"
                      ? "danger"
                      : action === "approve" || action === "reactivate"
                        ? "primary"
                        : "outline"
                  }
                  onClick={() => setDialog(action)}
                >
                  {actionButtonLabel(action)}
                </Button>
              ))}

              {actions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3.5 py-3 text-[11px] leading-relaxed text-muted">
                  Your account does not hold an action that applies to this
                  status right now.
                </p>
              ) : null}
            </div>

            {!readiness.ready && reviewing ? (
              <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[11px] leading-relaxed text-[#8a5a00]">
                Approval is blocked until the missing KYB items are supplied.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Vendor account</h2>
            {owner ? (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-pri text-[12px] font-semibold text-white">
                    {initials(owner.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {owner.name}
                    </p>
                    <p className="truncate text-[11px] text-muted">{owner.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  href={`/vendors/${owner._id}`}
                >
                  Open vendor profile
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-muted">Owner account not loaded.</p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Compliance</h2>
            <dl className="mt-2">
              <InfoRow
                label="Terms accepted"
                value={store.compliance.termsAccepted ? "Yes" : "No"}
              />
              <InfoRow
                label="Data processing consent"
                value={store.compliance.dataProcessingConsent ? "Yes" : "No"}
              />
              <InfoRow
                label="Accepted at"
                value={
                  store.compliance.acceptedAt
                    ? formatAdminDate(store.compliance.acceptedAt)
                    : null
                }
              />
            </dl>
          </section>
        </aside>
      </div>

      {dialog ? (
        <StoreActionDialog
          key={dialog}
          storeId={store._id}
          storeName={store.name}
          action={dialog}
          onClose={() => setDialog(null)}
          onCompleted={reload}
        />
      ) : null}
    </div>
  );
}

function breadcrumbsForStore(storeName?: string) {
  return [
    { label: "Admin console", href: "/" },
    { label: "Marketplace" },
    { label: "Store approvals", href: "/stores" },
    { label: storeName ?? "Store" },
  ];
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

function Card({
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

function Callout({
  title,
  body,
  meta,
}: {
  title: string;
  body: string;
  meta?: string;
}) {
  return (
    <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
          <Icon name="alert-circle" className="size-4" />
        </span>
        <div>
          <p className="text-[12px] font-semibold text-danger">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink">{body}</p>
          {meta ? <p className="mt-1 text-[11px] text-muted">{meta}</p> : null}
        </div>
      </div>
    </section>
  );
}

function ReadinessPanel({
  ready,
  missing,
  canApprove,
  onApprove,
}: {
  ready: boolean;
  missing: string[];
  canApprove: boolean;
  onApprove: () => void;
}) {
  return (
    <section
      className={
        ready
          ? "rounded-2xl border border-success/25 bg-success/[0.04] p-4"
          : "rounded-2xl border border-accent/40 bg-accent/10 p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className={
              ready
                ? "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-success/10 text-[#087a38]"
                : "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent/25 text-[#8a5a00]"
            }
          >
            <Icon name={ready ? "check-circle" : "alert-circle"} className="size-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink">
              {ready ? "KYB requirements complete" : "KYB requirements incomplete"}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {ready
                ? "Every document and identifier required for approval is present."
                : "Resolve the items below before this store can be approved."}
            </p>
          </div>
        </div>
        {ready && canApprove ? (
          <Button size="sm" variant="primary" onClick={onApprove}>
            Approve
          </Button>
        ) : null}
      </div>

      {!ready ? (
        <ul className="mt-3 space-y-1.5">
          {missing.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12px] text-ink">
              <Icon name="x" className="mt-0.5 size-3.5 shrink-0 text-danger" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading store review">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-well" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-well" />
          <div className="h-56 animate-pulse rounded-2xl bg-well" />
          <div className="h-40 animate-pulse rounded-2xl bg-well" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-well" />
      </div>
    </div>
  );
}

function decisionHint(status: string) {
  switch (status) {
    case "pending":
      return "This application is waiting for a first review.";
    case "under_review":
      return "You are reviewing this application. Approve it, ask for changes or reject it.";
    case "approved":
      return "The store is live. Suspend it if policy or verification problems appear.";
    case "suspended":
      return "The store cannot trade until it is reactivated.";
    case "rejected":
      return "The vendor can correct the application and resubmit it.";
    case "draft":
      return "The vendor has not submitted this application yet.";
    default:
      return "No administrative decisions are available for this status.";
  }
}

function actionButtonLabel(action: StoreActionKind) {
  switch (action) {
    case "approve":
      return "Approve store";
    case "reject":
      return "Reject application";
    case "request-information":
      return "Request information";
    case "suspend":
      return "Suspend store";
    case "reactivate":
      return "Reactivate store";
  }
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "V"
  );
}

function reviewDescription(
  action: StoreReviewAction,
  reason?: string | null,
  message?: string | null,
) {
  if (reason) return reason;
  if (message) return message;

  switch (action) {
    case "submitted":
      return "Application submitted for review.";
    case "resubmitted":
      return "Application updated and resubmitted.";
    case "approved":
      return "Store approved and opened for trading.";
    case "reactivated":
      return "Store returned to approved status.";
    default:
      return undefined;
  }
}
