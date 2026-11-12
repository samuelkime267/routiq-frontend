"use client";

import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import {
  ADMIN_PERMISSION_LABELS,
  adminInitials,
  adminRoleDescription,
  formatAdminDate,
  formatAdminRole,
  formatAuditAction,
  formatAuditEntity,
} from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { adminApi } from "@/lib/api";
import { useResource } from "@/hooks/useResource";

interface AdminDetailProps {
  adminId: string;
}

export default function AdminDetail({ adminId }: AdminDetailProps) {
  const resource = useResource(
    adminId,
    () => adminApi.getAdmin(adminId),
    "We could not load this administrator.",
  );

  const breadcrumbs = [
    ...breadcrumbsFor("/admins"),
    { label: resource.data?.admin.name ?? "Administrator" },
  ];

  if (resource.loading && !resource.data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (resource.error && !resource.data) {
    return (
      <ErrorState
        title="Administrator unavailable"
        description={resource.error}
        onRetry={resource.reload}
      />
    );
  }

  if (!resource.data) return null;

  const { admin, permissions, invitations } = resource.data;
  const timeline: TimelineItem[] = [
    ...(admin.lastLoginAt
      ? [
          {
            id: "login",
            title: "Most recent sign-in",
            description: "Admin console session authenticated.",
            time: formatAdminDate(admin.lastLoginAt),
            icon: "shield" as const,
            tone: "teal" as const,
          },
        ]
      : []),
    ...(admin.invitedAt
      ? [
          {
            id: "invited",
            title: "Invitation created",
            description: "A single-use activation link was issued.",
            time: formatAdminDate(admin.invitedAt),
            icon: "mail" as const,
            tone: "lime" as const,
          },
        ]
      : []),
    {
      id: "created",
      title: "Administrator record created",
      time: formatAdminDate(admin.createdAt),
      icon: "user" as const,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={admin.name}
        eyebrow="Administrator"
        description={admin.email}
        breadcrumbs={breadcrumbs}
        actions={
          <Button href="/admins" variant="outline" size="sm" icon={<Icon name="arrow-left" />}>
            Back to directory
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={admin.adminStatus} />
            <Badge tone={admin.adminRole === "SUPER_ADMIN" ? "teal" : "neutral"}>
              {formatAdminRole(admin.adminRole)}
            </Badge>
            <Badge tone="neutral">{permissions.length} permissions</Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-well text-[18px] font-semibold text-pri">
              {adminInitials(admin.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-semibold tracking-tight text-ink">
                {admin.name}
              </h2>
              <p className="text-[12px] text-muted">{admin.email}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                {adminRoleDescription(admin.adminRole)}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            {[
              { label: "Role", value: formatAdminRole(admin.adminRole) },
              { label: "Status", value: admin.adminStatus },
              { label: "Phone", value: admin.phone || "Not provided" },
              { label: "Created", value: formatAdminDate(admin.createdAt) },
              { label: "Invited", value: formatAdminDate(admin.invitedAt) },
              { label: "Last sign-in", value: formatAdminDate(admin.lastLoginAt) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-[13px] font-medium text-ink">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[13px] font-semibold text-ink">
            Effective permissions
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Derived from the role plus any individual grants and revocations.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <Badge
                key={permission}
                tone="neutral"
                className="px-2.5 py-0.5 text-[10px]"
              >
                {ADMIN_PERMISSION_LABELS[permission]}
              </Badge>
            ))}
          </div>

          {admin.permissionGrants?.length || admin.permissionRevocations?.length ? (
            <div className="mt-4 rounded-xl border border-line bg-well/40 px-3.5 py-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Role overrides
              </p>
              {admin.permissionGrants?.length ? (
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink">
                  Granted:{" "}
                  {admin.permissionGrants
                    .map((permission) => ADMIN_PERMISSION_LABELS[permission])
                    .join(", ")}
                </p>
              ) : null}
              {admin.permissionRevocations?.length ? (
                <p className="mt-1 text-[11px] leading-relaxed text-ink">
                  Revoked:{" "}
                  {admin.permissionRevocations
                    .map((permission) => ADMIN_PERMISSION_LABELS[permission])
                    .join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-ink">
              Invitation history
            </h2>
            <Badge tone="neutral">{invitations.length}</Badge>
          </div>
          {invitations.length ? (
            <ul className="mt-3 divide-y divide-line">
              {invitations.map((invitation) => (
                <li
                  key={invitation._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div>
                    <p className="text-[12px] font-medium text-ink">
                      {formatAdminRole(invitation.adminRole)}
                    </p>
                    <p className="text-[10px] text-muted">
                      Sent {formatAdminDate(invitation.lastSentAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={invitation.status}
                    className="px-2 py-0.5 text-[9px]"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[12px] text-muted">
              No invitations have been recorded for this account.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[13px] font-semibold text-ink">Account activity</h2>
          <Timeline items={timeline} className="mt-3" />
        </section>
      </div>

      {resource.data.auditLogs?.length ? (
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[13px] font-semibold text-ink">Recent audit trail</h2>
          <ul className="mt-3 divide-y divide-line">
            {resource.data.auditLogs.map((log) => (
              <li key={log._id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-ink">
                    {formatAuditAction(log.action)}
                  </p>
                  <p className="text-[10px] text-muted">
                    {formatAuditEntity(log.entityType)}
                    {log.reason ? ` · ${log.reason}` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-muted">
                  {formatAdminDate(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
          <Button
            href="/audit-logs"
            variant="ghost"
            size="sm"
            className="mt-3"
            icon={<Icon name="arrow-right" />}
          >
            Open audit logs
          </Button>
        </section>
      ) : null}
    </div>
  );
}
