"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DetailPanel from "@/components/ui/DetailPanel";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useServerTable } from "@/hooks/useServerTable";
import { adminApi, ApiError } from "@/lib/api";
import {
  formatAdminDate,
  formatAdminRole,
  formatInvitationStatus,
  relativeExpiry,
} from "@/lib/admin";
import type { SortDirection } from "@/lib/pagination";
import type {
  AdminInvitation,
  AdminInvitationStatus,
} from "@/types/api";

interface AdminInvitationsProps {
  /** Opens the shared invitation modal owned by the parent screen. */
  onInviteRequest?: () => void;
}

const statusOptions = [
  { value: "", label: "All invitations" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REVOKED", label: "Revoked" },
  { value: "EXPIRED", label: "Expired" },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "expiresAt:asc", label: "Expiring soon" },
  { value: "email:asc", label: "Email A–Z" },
];

function invitationBadge(status: AdminInvitationStatus) {
  return <StatusBadge status={status} label={formatInvitationStatus(status)} />;
}

function canResend(invitation: AdminInvitation) {
  return invitation.status === "PENDING" || invitation.status === "EXPIRED";
}

export default function AdminInvitations({
  onInviteRequest,
}: AdminInvitationsProps) {
  const { permissions } = useAdminSession();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AdminInvitation | null>(null);
  const [detail, setDetail] = useState<AdminInvitation | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [resending, setResending] = useState<AdminInvitation | null>(null);
  const [revoking, setRevoking] = useState<AdminInvitation | null>(null);
  const detailRequest = useRef(0);

  const canInvite = permissions.includes("admins.invite");
  const canManage = permissions.includes("admins.manage");

  const table = useServerTable<AdminInvitation>({
    loader: async (query) => {
      const result = await adminApi.invitations({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.filters.status,
        role: query.filters.role,
      });

      setSummary(result.summary);
      return { rows: result.invitations, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  async function openInvitation(invitation: AdminInvitation) {
    setSelected(invitation);
    setDetail(null);
    const request = detailRequest.current + 1;
    detailRequest.current = request;

    try {
      const result = await adminApi.invitation(invitation._id);
      if (detailRequest.current === request) setDetail(result.invitation);
    } catch {
      // The list row already carries everything the panel needs.
      if (detailRequest.current === request) setDetail(invitation);
    }
  }

  function closePanel() {
    detailRequest.current += 1;
    setSelected(null);
    setDetail(null);
  }

  async function reloadAll() {
    table.reload();
  }

  const columns: DataTableColumn<AdminInvitation>[] = [
    {
      id: "name",
      header: "Invitee",
      sortable: true,
      primary: true,
      cell: (invitation) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-ink">
            {invitation.name}
          </p>
          <p className="truncate text-[11px] text-muted">{invitation.email}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      sortKey: "adminRole",
      cell: (invitation) => (
        <Badge
          tone={invitation.adminRole === "SUPER_ADMIN" ? "teal" : "neutral"}
          className="px-2.5 py-0.5 text-[10px]"
        >
          {formatAdminRole(invitation.adminRole)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (invitation) => invitationBadge(invitation.status),
    },
    {
      id: "expiresAt",
      header: "Expiry",
      sortable: true,
      hideOnMobile: true,
      cell: (invitation) => (
        <span className="text-[12px] text-muted">
          {invitation.status === "ACCEPTED"
            ? "Accepted"
            : relativeExpiry(invitation.expiresAt)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Invited",
      sortable: true,
      hideOnMobile: true,
      cell: (invitation) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(invitation.createdAt ?? invitation.lastSentAt)}
        </span>
      ),
    },
  ];

  const current = detail ?? selected;
  const timeline: TimelineItem[] = current
    ? [
        ...(current.acceptedAt
          ? [
              {
                id: "accepted",
                title: "Invitation accepted",
                description: "The account was activated.",
                time: formatAdminDate(current.acceptedAt),
                icon: "check-circle" as const,
                tone: "teal" as const,
              },
            ]
          : []),
        ...(current.revokedAt
          ? [
              {
                id: "revoked",
                title: "Invitation revoked",
                description: "The link can no longer be used.",
                time: formatAdminDate(current.revokedAt),
                icon: "lock" as const,
                tone: "neutral" as const,
              },
            ]
          : []),
        {
          id: "created",
          title: current.sendCount > 1 ? "Invitation re-issued" : "Invitation sent",
          description: `Sent ${current.sendCount} time${current.sendCount === 1 ? "" : "s"}.`,
          time: formatAdminDate(current.lastSentAt ?? current.createdAt),
          icon: "mail" as const,
          tone: "lime" as const,
        },
      ]
    : [];

  function rowActions(invitation: AdminInvitation) {
    const items: DropdownItem[] = [
      {
        id: "view",
        label: "View invitation",
        icon: "eye",
        onSelect: () => void openInvitation(invitation),
      },
    ];

    if (canInvite && canResend(invitation)) {
      items.push({
        id: "resend",
        label: "Resend invitation",
        icon: "refresh",
        separatorBefore: true,
        onSelect: () => setResending(invitation),
      });
    }

    if (canManage && canResend(invitation)) {
      items.push({
        id: "revoke",
        label: "Revoke invitation",
        icon: "lock",
        danger: true,
        onSelect: () => setRevoking(invitation),
      });
    }

    return (
      <DropdownMenu
        label={`Actions for ${invitation.email}`}
        align="right"
        widthClassName="w-56"
        triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
        trigger={<Icon name="more-horizontal" className="size-4" />}
        items={items}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={table.searchInput}
            onChange={table.setSearch}
            placeholder="Search by invitee name or email"
            label="Search invitations"
            className="w-full lg:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              variant="pill"
              ariaLabel="Filter invitations by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All", count: summary.PENDING ?? undefined },
                { id: "PENDING", label: "Pending", count: summary.PENDING },
                { id: "ACCEPTED", label: "Accepted", count: summary.ACCEPTED },
                { id: "REVOKED", label: "Revoked", count: summary.REVOKED },
                { id: "EXPIRED", label: "Expired", count: summary.EXPIRED },
              ]}
            />
            {canInvite && onInviteRequest ? (
              <Button
                size="sm"
                icon={<Icon name="plus" />}
                onClick={onInviteRequest}
              >
                Invite administrator
              </Button>
            ) : null}
          </div>
        </div>

        <div className="border-t border-line">
          <FilterBar
            onReset={table.resetFilters}
            activeCount={table.activeFilterCount}
          >
            <FilterSelect
              label="Status"
              value={table.filters.status ?? ""}
              onChange={(value) => table.setFilter("status", value)}
              options={statusOptions}
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
        caption="Administrative invitations, paginated by the server"
        columns={columns}
        rows={table.rows}
        getRowId={(invitation) => invitation._id}
        loading={table.loading}
        refreshing={table.refreshing}
        error={table.error}
        onRetry={table.reload}
        sort={table.sort}
        onSortChange={table.changeSort}
        rowActions={rowActions}
        emptyTitle={
          table.search || table.activeFilterCount > 0
            ? "No invitations match these filters"
            : "No invitations yet"
        }
        emptyDescription={
          table.search || table.activeFilterCount > 0
            ? "Try another search term or clear the status filter."
            : "Invite an administrator to create the first invitation."
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
          ) : canInvite && onInviteRequest ? (
            <Button size="sm" onClick={onInviteRequest}>
              Invite administrator
            </Button>
          ) : undefined
        }
        footer={
          <Pagination
            meta={table.meta}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            itemLabel="invitations"
            disabled={table.loading}
          />
        }
      />

      <DetailPanel
        open={Boolean(selected)}
        onClose={closePanel}
        title={current?.name ?? "Invitation"}
        description={current?.email}
        badge={current ? invitationBadge(current.status) : null}
        sections={
          current
            ? [
                {
                  id: "role",
                  label: "Role",
                  value: formatAdminRole(current.adminRole),
                },
                {
                  id: "status",
                  label: "Status",
                  value: formatInvitationStatus(current.status),
                },
                {
                  id: "expiry",
                  label: "Expiry",
                  value: current.expiresAt
                    ? `${formatAdminDate(current.expiresAt)} · ${relativeExpiry(current.expiresAt)}`
                    : "No expiry",
                },
                {
                  id: "sent",
                  label: "Last sent",
                  value: formatAdminDate(current.lastSentAt),
                },
                {
                  id: "send-count",
                  label: "Times sent",
                  value: String(current.sendCount),
                },
                {
                  id: "invited-by",
                  label: "Invited by",
                  value:
                    typeof current.invitedBy === "object" && current.invitedBy
                      ? current.invitedBy.name
                      : "System",
                },
                {
                  id: "accepted",
                  label: "Accepted",
                  value: formatAdminDate(current.acceptedAt),
                },
                {
                  id: "revoked",
                  label: "Revoked",
                  value: formatAdminDate(current.revokedAt),
                },
              ]
            : []
        }
        footer={
          current && canResend(current) ? (
            <div className="flex flex-wrap gap-2">
              {canInvite ? (
                <Button
                  size="sm"
                  icon={<Icon name="refresh" />}
                  onClick={() => setResending(current)}
                >
                  Resend invitation
                </Button>
              ) : null}
              {canManage ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Icon name="lock" />}
                  onClick={() => setRevoking(current)}
                >
                  Revoke
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {current ? (
          <section>
            <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              Invitation lifecycle
            </h3>
            <Timeline items={timeline} className="mt-3" />
            <p className="mt-4 rounded-xl bg-well/60 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
              Invitation links are single-use and only stored as a hash. Resending
              replaces the previous link, so an older email stops working
              immediately.
            </p>
          </section>
        ) : null}
      </DetailPanel>

      <ConfirmDialog
        open={Boolean(resending)}
        onClose={() => setResending(null)}
        onConfirm={async () => {
          if (!resending) return;

          try {
            await adminApi.resendInvitation(resending._id);
            toast({
              tone: "success",
              title: "Invitation resent",
              description: `A new link was sent to ${resending.email}. The previous link no longer works.`,
            });
            setResending(null);
            closePanel();
            await reloadAll();
          } catch (error) {
            toast({
              tone: "error",
              title: "Could not resend the invitation",
              description:
                error instanceof ApiError
                  ? error.message
                  : "Please try again shortly.",
            });
          }
        }}
        title="Resend invitation"
        description={
          resending
            ? `Send a fresh single-use link to ${resending.email}? The previous link is replaced.`
            : ""
        }
        confirmLabel="Resend invitation"
        tone="primary"
      />

      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={async () => {
          if (!revoking) return;

          try {
            await adminApi.revokeInvitation(revoking._id);
            toast({
              tone: "success",
              title: "Invitation revoked",
              description: `${revoking.email} can no longer use the invitation link.`,
            });
            setRevoking(null);
            closePanel();
            await reloadAll();
          } catch (error) {
            toast({
              tone: "error",
              title: "Could not revoke the invitation",
              description:
                error instanceof ApiError
                  ? error.message
                  : "Please try again shortly.",
            });
          }
        }}
        title="Revoke invitation"
        description={
          revoking
            ? `Revoke the invitation for ${revoking.email}? The account stays deactivated until a new invitation is accepted.`
            : ""
        }
        confirmLabel="Revoke invitation"
        tone="danger"
      />
    </div>
  );
}
