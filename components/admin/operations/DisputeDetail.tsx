"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useResource } from "@/hooks/useResource";
import { adminApi, disputeAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira } from "@/lib/format";
import {
  DISPUTE_HISTORY_LABELS,
  DISPUTE_STATUS_DESCRIPTIONS,
  DISPUTE_STATUS_LABELS,
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  orderReference,
  partyName,
} from "@/lib/operations";
import type {
  AdminDisputeDetail,
  ApiDisputeHistoryEntry,
  DisputeStatus,
} from "@/types/api";
import { DetailGrid, InfoRow, PageSkeleton, SectionCard } from "./shared";

const TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  OPEN: ["UNDER_REVIEW", "AWAITING_INFORMATION", "RESOLVED", "CLOSED"],
  UNDER_REVIEW: ["AWAITING_INFORMATION", "RESOLVED", "CLOSED"],
  AWAITING_INFORMATION: ["UNDER_REVIEW", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

const priorityTone = {
  high: "red",
  medium: "amber",
  low: "neutral",
} as const;

type ModalKind = "assign" | "status" | "resolve" | null;

export default function DisputeDetail({ disputeId }: { disputeId: string }) {
  const { permissions } = useAdminSession();
  const { data, loading, refreshing, error, reload } =
    useResource<AdminDisputeDetail>(disputeId, () =>
      disputeAdminApi.get(disputeId),
    );
  const [modal, setModal] = useState<ModalKind>(null);

  const canManage = permissions.includes("disputes.manage");
  const canChooseAssignee = permissions.includes("admins.view");

  if (loading) return <PageSkeleton label="Loading dispute" />;

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Dispute"
          eyebrow="Support"
          breadcrumbs={breadcrumbsFor("/disputes")}
        />
        <ErrorState
          title="Could not load this dispute"
          description={error ?? "This dispute may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/disputes">
              Back to disputes
            </Button>
          }
        />
      </div>
    );
  }

  const {
    dispute,
    order,
    customer,
    vendor,
    store,
    assignment,
    history,
    notes,
    evidence,
    financials,
  } = data;

  const status = dispute.status;
  const canResolve = canManage && status !== "RESOLVED" && status !== "CLOSED";
  const canAssign = canManage && status !== "CLOSED";
  const transitions = TRANSITIONS[status].filter(
    (target) => target !== "RESOLVED",
  );

  const timeline: TimelineItem[] = history
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .map((entry) => historyItem(entry));

  return (
    <div className="space-y-5">
      <PageHeader
        title={dispute.subject}
        eyebrow="Dispute"
        description={`${dispute.reference} · ${formatDisputeCategory(
          dispute.category,
        )} · raised ${formatAdminDate(dispute.createdAt)}`}
        breadcrumbs={[
          ...breadcrumbsFor("/disputes"),
          { label: dispute.reference },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" href="/disputes">
              Back to disputes
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Icon name="user" />}
                  onClick={() => setModal("assign")}
                  disabled={!canAssign}
                  title={
                    canAssign
                      ? undefined
                      : "A closed dispute can no longer be reassigned"
                  }
                >
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModal("status")}
                  disabled={transitions.length === 0}
                >
                  Update status
                </Button>
                {canResolve ? (
                  <Button size="sm" onClick={() => setModal("resolve")}>
                    Resolve
                  </Button>
                ) : null}
              </>
            ) : null}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              status={status}
              label={formatDisputeStatus(status)}
            />
            <Badge tone={priorityTone[dispute.priority]}>
              {formatDisputePriority(dispute.priority)} priority
            </Badge>
            <Badge tone="neutral">
              {formatDisputeCategory(dispute.category)}
            </Badge>
            {assignment.assignedTo ? (
              <Badge tone="teal">
                Assigned to {partyName(assignment.assignedTo, "Administrator")}
              </Badge>
            ) : (
              <Badge tone="amber">Unassigned</Badge>
            )}
          </div>
        }
      />

      {status === "AWAITING_INFORMATION" && dispute.informationRequest ? (
        <Alert tone="info" title="Information requested">
          {dispute.informationRequest}
        </Alert>
      ) : null}

      {status === "RESOLVED" && dispute.resolution ? (
        <Alert tone="success" title="Resolution recorded">
          {dispute.resolution}
        </Alert>
      ) : null}

      <DetailGrid>
        <div className="space-y-4">
          <SectionCard
            title="Dispute"
            description={DISPUTE_STATUS_DESCRIPTIONS[status]}
          >
            <dl>
              <InfoRow label="Reference" value={dispute.reference} mono />
              <InfoRow
                label="Status"
                value={
                  <StatusBadge
                    status={status}
                    label={formatDisputeStatus(status)}
                  />
                }
              />
              <InfoRow
                label="Category"
                value={formatDisputeCategory(dispute.category)}
              />
              <InfoRow
                label="Priority"
                value={formatDisputePriority(dispute.priority)}
              />
              <InfoRow label="Raised" value={formatAdminDate(dispute.createdAt)} />
              <InfoRow
                label="Last updated"
                value={formatAdminDate(dispute.updatedAt ?? dispute.createdAt)}
              />
              {dispute.resolvedAt ? (
                <InfoRow
                  label="Resolved at"
                  value={formatAdminDate(dispute.resolvedAt)}
                />
              ) : null}
              {dispute.closedAt ? (
                <InfoRow
                  label="Closed at"
                  value={formatAdminDate(dispute.closedAt)}
                />
              ) : null}
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed whitespace-pre-line text-ink">
              {dispute.description ?? "No description was provided."}
            </p>
          </SectionCard>

          <SectionCard title="Order">
            {order ? (
              <>
                <dl>
                  <InfoRow label="Order number" value={orderReference(order)} />
                  <InfoRow
                    label="Status"
                    value={"status" in order ? <StatusBadge status={String(order.status)} /> : null}
                  />
                  <InfoRow
                    label="Total"
                    value={
                      "total" in order && typeof order.total === "number"
                        ? formatNaira(order.total)
                        : null
                    }
                  />
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
                This dispute is not linked to an order.
              </p>
            )}
          </SectionCard>

          <SectionCard title={`Evidence (${evidence.length})`}>
            {evidence.length === 0 ? (
              <EmptyState
                compact
                icon="file-text"
                title="No evidence attached"
                description="Customers and vendors have not attached files to this dispute."
              />
            ) : (
              <ul className="divide-y divide-line">
                {evidence.map((item) => (
                  <li key={item._id} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-ink">
                          {item.label}
                        </p>
                        {item.note ? (
                          <p className="mt-0.5 text-[11px] text-muted">
                            {item.note}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[10px] text-muted">
                          {formatAdminDate(item.createdAt)}
                        </p>
                      </div>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-[11px] font-semibold text-pri hover:underline"
                        >
                          Open
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={`Internal notes (${notes.length})`}>
            <ul className="space-y-2">
              {notes.length === 0 ? (
                <li className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-muted">
                  No internal notes have been added.
                </li>
              ) : (
                notes
                  .slice()
                  .reverse()
                  .map((note) => (
                    <li
                      key={note._id}
                      className="rounded-xl border border-line px-3.5 py-3"
                    >
                      <p className="text-[12px] leading-relaxed text-ink">
                        {note.body}
                      </p>
                      <p className="mt-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
                        {partyName(note.author, "Administrator")} ·{" "}
                        {formatAdminDate(note.createdAt)}
                      </p>
                    </li>
                  ))
              )}
            </ul>

            {canManage ? (
              <AddNoteForm disputeId={disputeId} onCompleted={reload} />
            ) : null}
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Assignment">
            <dl>
              <InfoRow
                label="Assignee"
                value={
                  assignment.assignedTo
                    ? partyName(assignment.assignedTo, "Administrator")
                    : null
                }
              />
              <InfoRow
                label="Assigned by"
                value={
                  assignment.assignedBy
                    ? partyName(assignment.assignedBy, "Administrator")
                    : null
                }
              />
              <InfoRow
                label="Assigned at"
                value={
                  assignment.assignedAt
                    ? formatAdminDate(assignment.assignedAt)
                    : null
                }
              />
            </dl>
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="mt-3"
                onClick={() => setModal("assign")}
                disabled={!canAssign}
              >
                {assignment.assignedTo ? "Reassign" : "Assign to me"}
              </Button>
            ) : null}
          </SectionCard>

          <SectionCard title="Financial records">
            <Alert tone="info" title="No money is moved here">
              {financials.note}
            </Alert>
            <dl className="mt-3">
              <InfoRow
                label="Order total"
                value={
                  financials.orderTotal !== null
                    ? formatNaira(financials.orderTotal)
                    : null
                }
              />
              <InfoRow
                label="Escrow modified"
                value={financials.escrowModified ? "Yes" : "No"}
              />
            </dl>
          </SectionCard>

          <SectionCard title="History">
            <Timeline
              items={timeline}
              emptyLabel="No dispute activity has been recorded."
            />
          </SectionCard>
        </aside>
      </DetailGrid>

      {modal === "assign" ? (
        <AssignModal
          disputeId={disputeId}
          canChooseAssignee={canChooseAssignee}
          currentAssigneeId={
            assignment.assignedTo ? assignment.assignedTo._id : undefined
          }
          onClose={() => setModal(null)}
          onCompleted={reload}
        />
      ) : null}

      {modal === "status" ? (
        <StatusModal
          disputeId={disputeId}
          transitions={transitions}
          onClose={() => setModal(null)}
          onCompleted={reload}
        />
      ) : null}

      {modal === "resolve" ? (
        <ResolveModal
          disputeId={disputeId}
          onClose={() => setModal(null)}
          onCompleted={reload}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modals and note form                                                       */
/* -------------------------------------------------------------------------- */

function AssignModal({
  disputeId,
  canChooseAssignee,
  currentAssigneeId,
  onClose,
  onCompleted,
}: {
  disputeId: string;
  canChooseAssignee: boolean;
  currentAssigneeId?: string;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { user } = useAdminSession();
  const { toast } = useToast();
  const [adminId, setAdminId] = useState(currentAssigneeId ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const admins = useResource(
    canChooseAssignee ? "dispute-assignees" : "dispute-assignees-skip",
    async () => {
      if (!canChooseAssignee) return null;
      return adminApi.admins({ limit: 100, status: "ACTIVE" });
    },
  );

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      await disputeAdminApi.assign(disputeId, {
        adminId: adminId || undefined,
        note: note.trim() || undefined,
      });

      toast({
        tone: "success",
        title: "Dispute assigned",
        description: adminId
          ? "The selected administrator now owns this dispute."
          : "This dispute is now assigned to you.",
      });

      onCompleted();
      onClose();
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "The dispute could not be assigned.",
      );
    } finally {
      setSaving(false);
    }
  };

  const options =
    admins.data?.admins.filter(
      (entry) => entry.admin.adminStatus === "ACTIVE" && entry.admin._id !== user._id,
    ) ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title="Assign dispute"
      description="The assignee is recorded in the dispute history and the administrative audit trail."
      dismissible={!saving}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={saving}>
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {canChooseAssignee ? (
          <div>
            <label
              htmlFor="dispute-assignee"
              className="mb-1 block text-[13px] font-semibold text-ink"
            >
              Assign to
            </label>
            <select
              id="dispute-assignee"
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
            >
              <option value="">Me ({user.name})</option>
              {options.map((entry) => (
                <option key={entry.admin._id} value={entry.admin._id}>
                  {entry.admin.name} · {entry.admin.email}
                </option>
              ))}
            </select>
            {admins.error ? (
              <p className="mt-1 text-[11px] text-danger">{admins.error}</p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-well/40 px-3.5 py-3 text-[12px] leading-relaxed text-muted">
            You can assign this dispute to yourself. Choosing another
            administrator requires the admin-management permission.
          </p>
        )}

        <div>
          <label
            htmlFor="dispute-assign-note"
            className="mb-1 block text-[13px] font-semibold text-ink"
          >
            Assignment note
            <span className="ml-1 font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="dispute-assign-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why is this being assigned?"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-[12px] font-medium text-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function StatusModal({
  disputeId,
  transitions,
  onClose,
  onCompleted,
}: {
  disputeId: string;
  transitions: DisputeStatus[];
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { toast } = useToast();
  const [target, setTarget] = useState<DisputeStatus>(transitions[0] ?? "CLOSED");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);

    if (target === "AWAITING_INFORMATION" && message.trim().length < 10) {
      setError("Describe the information the customer needs to provide.");
      return;
    }

    setSaving(true);

    try {
      await disputeAdminApi.updateStatus(disputeId, {
        status: target,
        message:
          target === "AWAITING_INFORMATION" ? message.trim() : undefined,
        note: note.trim() || undefined,
      });

      toast({
        tone: "success",
        title: "Dispute updated",
        description: `The dispute is now ${formatDisputeStatus(target).toLowerCase()}.`,
      });

      onCompleted();
      onClose();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "The status could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Update dispute status"
      description="Only valid transitions are offered. Every change is written to the dispute history."
      dismissible={!saving}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={saving}>
            Save status
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="dispute-status"
            className="mb-1 block text-[13px] font-semibold text-ink"
          >
            New status
          </label>
          <select
            id="dispute-status"
            value={target}
            onChange={(event) => setTarget(event.target.value as DisputeStatus)}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
          >
            {transitions.map((value) => (
              <option key={value} value={value}>
                {DISPUTE_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {target === "AWAITING_INFORMATION" ? (
          <div>
            <label
              htmlFor="dispute-message"
              className="mb-1 block text-[13px] font-semibold text-ink"
            >
              Information request
            </label>
            <textarea
              id="dispute-message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell the customer what they need to provide"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-muted">
              At least 10 characters. This message is stored on the dispute.
            </p>
          </div>
        ) : null}

        <div>
          <label
            htmlFor="dispute-status-note"
            className="mb-1 block text-[13px] font-semibold text-ink"
          >
            Internal note
            <span className="ml-1 font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="dispute-status-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
          />
        </div>

        {target === "CLOSED" ? (
          <p className="rounded-xl border border-line bg-well/40 px-3.5 py-3 text-[12px] leading-relaxed text-muted">
            Closing a dispute is final. A closed dispute cannot be reassigned or
            resolved again.
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-[12px] font-medium text-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function ResolveModal({
  disputeId,
  onClose,
  onCompleted,
}: {
  disputeId: string;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { toast } = useToast();
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);

    if (resolution.trim().length < 10) {
      setError("A resolution of at least 10 characters is required.");
      return;
    }

    setSaving(true);

    try {
      await disputeAdminApi.resolve(disputeId, {
        resolution: resolution.trim(),
        note: note.trim() || undefined,
      });

      toast({
        tone: "success",
        title: "Dispute resolved",
        description:
          "The resolution is recorded. No payment or escrow record was changed.",
      });

      onCompleted();
      onClose();
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "The dispute could not be resolved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Resolve dispute"
      description="Resolving records the outcome only. Refunds and escrow releases stay separate, audited operations."
      dismissible={!saving}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={saving}>
            Resolve dispute
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="dispute-resolution"
            className="mb-1 block text-[13px] font-semibold text-ink"
          >
            Resolution
          </label>
          <textarea
            id="dispute-resolution"
            rows={5}
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            placeholder="Summarise the agreed outcome"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-muted">
            At least 10 characters. Shown on the dispute record.
          </p>
        </div>

        <div>
          <label
            htmlFor="dispute-resolution-note"
            className="mb-1 block text-[13px] font-semibold text-ink"
          >
            Internal note
            <span className="ml-1 font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="dispute-resolution-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-[12px] font-medium text-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function AddNoteForm({
  disputeId,
  onCompleted,
}: {
  disputeId: string;
  onCompleted: () => void;
}) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);

    if (body.trim().length < 3) {
      setError("A note needs at least 3 characters.");
      return;
    }

    setSaving(true);

    try {
      await disputeAdminApi.addNote(disputeId, body.trim());
      setBody("");
      toast({ tone: "success", title: "Internal note added" });
      onCompleted();
    } catch (noteError) {
      setError(
        noteError instanceof Error
          ? noteError.message
          : "The note could not be added.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-line pt-3">
      <label
        htmlFor="dispute-note"
        className="mb-1 block text-[13px] font-semibold text-ink"
      >
        Add an internal note
      </label>
      <textarea
        id="dispute-note"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What should the next reviewer know?"
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
      />
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-danger">{error}</p>
      ) : null}
      <Button
        size="sm"
        className="mt-2"
        onClick={submit}
        loading={saving}
        disabled={!body.trim()}
      >
        Save note
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function historyItem(entry: ApiDisputeHistoryEntry): TimelineItem {

  const label = DISPUTE_HISTORY_LABELS[entry.action] ?? "Dispute updated";
  const change =
    entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus
      ? `${formatDisputeStatus(entry.fromStatus)} → ${formatDisputeStatus(
          entry.toStatus,
        )}`
      : null;

  return {
    id: entry._id,
    title: label,
    description: [change, entry.note].filter(Boolean).join(" · ") || undefined,
    time: `${formatAdminDate(entry.createdAt)} · ${partyName(
      entry.actor,
      "System",
    )}`,
    icon:
      entry.action === "resolved" || entry.action === "closed"
        ? "check-circle"
        : entry.action === "assigned"
          ? "user"
          : entry.action === "note_added"
            ? "message-square"
            : "activity",
    tone:
      entry.action === "resolved" || entry.action === "closed"
        ? "lime"
        : entry.action === "information_requested"
          ? "amber"
          : "neutral",
  };
}
