"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DetailPanel from "@/components/ui/DetailPanel";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import { SelectField, TextField } from "@/components/ui/FormField";
import { Field, Select } from "@/components/ui/Form";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import AdminInvitations from "@/components/admin/AdminInvitations";
import ReasonDialog from "@/components/admin/ReasonDialog";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useServerTable } from "@/hooks/useServerTable";
import { adminApi, ApiError } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import {
  inviteAdminSchema,
  type InviteAdminValues,
} from "@/lib/schemas/admin";
import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_ROLE_LABELS,
  adminInitials,
  adminRoleDescription,
  formatAdminDate,
  formatAdminRole,
  formatAdminStatus,
} from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import type { SortDirection } from "@/lib/pagination";
import type {
  AdminDetailResult,
  AdminListEntry,
  AdminRoleDefinition,
  AdminStatus,
} from "@/types/api";

interface StatusChange {
  entry: AdminListEntry;
  next: AdminStatus;
  label: string;
  description: string;
  tone: "danger" | "primary";
}

function statusChangeFor(entry: AdminListEntry): StatusChange | null {
  switch (entry.admin.adminStatus) {
    case "ACTIVE":
      return {
        entry,
        next: "SUSPENDED",
        label: "Suspend access",
        description:
          "Suspend this administrator? Their sessions are revoked and they cannot sign in to the admin console until reactivated.",
        tone: "danger",
      };
    case "SUSPENDED":
      return {
        entry,
        next: "ACTIVE",
        label: "Reactivate access",
        description:
          "Reactivate this administrator? They can sign in again with their existing credentials.",
        tone: "primary",
      };
    case "INVITED":
      return {
        entry,
        next: "DEACTIVATED",
        label: "Revoke invitation",
        description:
          "Revoke this pending invitation? The invitation link stops working and the account is deactivated.",
        tone: "danger",
      };
    case "DEACTIVATED":
      return {
        entry,
        next: "ACTIVE",
        label: "Reactivate access",
        description:
          "Reactivate this administrator? They can sign in again with their existing credentials.",
        tone: "primary",
      };
    default:
      return null;
  }
}

const roleOptions = [
  { value: "", label: "All roles" },
  ...Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INVITED", label: "Invited" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "lastLoginAt:desc", label: "Recent sign-in" },
  { value: "adminStatus:asc", label: "Status A–Z" },
];

export default function AdminManagement() {
  const { user, permissions } = useAdminSession();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AdminListEntry | null>(null);
  const [detail, setDetail] = useState<AdminDetailResult | null>(null);
  const [pending, setPending] = useState<StatusChange | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tab, setTab] = useState("directory");
  const [roles, setRoles] = useState<AdminRoleDefinition[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AdminListEntry | null>(null);
  const [nextRole, setNextRole] = useState("");
  const detailRequest = useRef(0);

  const canManage = permissions.includes("admins.manage");
  const canInvite = permissions.includes("admins.invite");
  const canManageRoles = permissions.includes("roles.manage");

  useEffect(() => {
    if (!canManageRoles || rolesLoaded) return;
    let active = true;

    adminApi
      .roles({ limit: 100, sortBy: "key", sortOrder: "asc" })
      .then((result) => {
        if (!active) return;
        setRoles(result.roles);
        setRolesLoaded(true);
      })
      .catch(() => {
        if (active) setRolesLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [canManageRoles, rolesLoaded]);

  async function openDetails(entry: AdminListEntry) {
    setSelected(entry);
    setDetail(null);
    const request = detailRequest.current + 1;
    detailRequest.current = request;

    try {
      const result = await adminApi.getAdmin(entry.admin._id);
      if (detailRequest.current === request) setDetail(result);
    } catch {
      if (detailRequest.current === request) setDetail(null);
    }
  }

  function closeDetails() {
    detailRequest.current += 1;
    setSelected(null);
    setDetail(null);
  }

  function openRoleChange(entry: AdminListEntry) {
    setRoleTarget(entry);
    setNextRole(entry.admin.adminRole);
  }

  const table = useServerTable<AdminListEntry>({
    loader: async (query) => {
      const result = await adminApi.admins({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        role: query.filters.role,
        status: query.filters.status,
      });

      return { rows: result.admins, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  function canManageTarget(entry: AdminListEntry) {
    if (!canManage) return false;
    if (entry.admin._id === user._id) return false;
    // Mirrors the API guard: only a Super Admin may manage another Super Admin.
    if (entry.admin.adminRole === "SUPER_ADMIN" && user.adminRole !== "SUPER_ADMIN") {
      return false;
    }

    return true;
  }

  function rowActions(entry: AdminListEntry) {
    const change = statusChangeFor(entry);
    const isSelf = entry.admin._id === user._id;
    const canChangeRole =
      canManageRoles &&
      !isSelf &&
      !(
        entry.admin.adminRole === "SUPER_ADMIN" &&
        user.adminRole !== "SUPER_ADMIN"
      );
    const items: DropdownItem[] = [
      {
        id: "view",
        label: "View details",
        icon: "eye",
        onSelect: () => void openDetails(entry),
      },
    ];

    if (canChangeRole) {
      items.push({
        id: "role",
        label: "Change role",
        icon: "key",
        onSelect: () => openRoleChange(entry),
      });
    }

    if (canManageTarget(entry) && change) {
      items.push({
        id: "status",
        label: change.label,
        icon: change.next === "ACTIVE" ? "check-circle" : "lock",
        danger: change.tone === "danger",
        separatorBefore: true,
        onSelect: () => setPending(change),
      });
    } else if (isSelf) {
      items.push({
        id: "self",
        label: "You cannot change your own status",
        icon: "lock",
        disabled: true,
        separatorBefore: true,
      });
    }

    return (
      <DropdownMenu
        label={`Actions for ${entry.admin.name}`}
        align="right"
        widthClassName="w-60"
        triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
        trigger={<Icon name="more-horizontal" className="size-4" />}
        items={items}
      />
    );
  }

  const columns: DataTableColumn<AdminListEntry>[] = [
    {
      id: "name",
      header: "Administrator",
      sortable: true,
      primary: true,
      cell: (entry) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-well text-[10px] font-semibold text-pri">
            {adminInitials(entry.admin.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-ink">
              {entry.admin.name}
              {entry.admin._id === user._id ? (
                <span className="ml-1.5 rounded-full bg-lime/60 px-1.5 py-0.5 text-[9px] font-semibold text-pri-deep">
                  You
                </span>
              ) : null}
            </p>
            <p className="truncate text-[11px] text-muted">
              {entry.admin.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      sortKey: "adminRole",
      cell: (entry) => (
        <Badge
          tone={entry.admin.adminRole === "SUPER_ADMIN" ? "teal" : "neutral"}
          className="px-2.5 py-0.5 text-[10px]"
        >
          {formatAdminRole(entry.admin.adminRole)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortKey: "adminStatus",
      cell: (entry) => <StatusBadge status={entry.admin.adminStatus} />,
    },
    {
      id: "lastLoginAt",
      header: "Last sign-in",
      sortable: true,
      hideOnMobile: true,
      cell: (entry) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(entry.admin.lastLoginAt)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortable: true,
      hideOnMobile: true,
      cell: (entry) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(entry.admin.createdAt)}
        </span>
      ),
    },
  ];

  const selectedChange = selected ? statusChangeFor(selected) : null;
  const selectedTimeline: TimelineItem[] = selected
    ? [
        ...(selected.admin.lastLoginAt
          ? [
              {
                id: "last-login",
                title: "Most recent sign-in",
                description: "Admin console session authenticated.",
                time: formatAdminDate(selected.admin.lastLoginAt),
                icon: "shield" as const,
                tone: "teal" as const,
              },
            ]
          : []),
        ...(selected.admin.invitedAt
          ? [
              {
                id: "invited",
                title: "Invitation created",
                time: formatAdminDate(selected.admin.invitedAt),
                icon: "mail" as const,
                tone: "lime" as const,
              },
            ]
          : []),
        {
          id: "created",
          title: "Administrator record created",
          time: formatAdminDate(selected.admin.createdAt),
          icon: "user" as const,
          tone: "neutral" as const,
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin management"
        eyebrow="Administration"
        description="Invite administrators, review their access and manage the lifecycle of every console account. This directory proves the server-side table stack against a real endpoint."
        breadcrumbs={breadcrumbsFor("/admins")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={table.reload}
              disabled={table.loading}
            >
              Refresh
            </Button>
            {canInvite ? (
              <Button
                size="sm"
                icon={<Icon name="plus" />}
                onClick={() => setInviteOpen(true)}
              >
                Invite administrator
              </Button>
            ) : null}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              {table.meta.total} matching
              {table.meta.total === 1 ? " administrator" : " administrators"}
            </Badge>
            <Badge tone={canManage ? "green" : "amber"}>
              {canManage ? "Can manage status" : "Read only"}
            </Badge>
            <Badge tone="neutral">
              {permissions.length} permissions on your account
            </Badge>
          </div>
        }
      />

      <Tabs
        variant="underline"
        ariaLabel="Admin management sections"
        value={tab}
        onChange={setTab}
        items={[
          { id: "directory", label: "Directory", icon: "users" },
          { id: "invitations", label: "Invitations", icon: "mail" },
        ]}
      />

      {tab === "invitations" ? (
        <AdminInvitations
          onInviteRequest={canInvite ? () => setInviteOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search by name or email"
              label="Search administrators"
              className="w-full lg:max-w-sm"
            />
            <Tabs
              variant="pill"
              ariaLabel="Filter administrators by status"
              value={table.filters.status ?? ""}
              onChange={(id) => table.setFilter("status", id)}
              items={[
                { id: "", label: "All" },
                { id: "ACTIVE", label: "Active" },
                { id: "INVITED", label: "Invited" },
                { id: "SUSPENDED", label: "Suspended" },
                { id: "DEACTIVATED", label: "Deactivated" },
              ]}
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Role"
                value={table.filters.role ?? ""}
                onChange={(value) => table.setFilter("role", value)}
                options={roleOptions}
              />
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
          caption="Administrators, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(entry) => entry.admin._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No administrators match these filters"
              : "No administrators yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the role and status filters."
              : "Invite the first administrator to start building the console team."
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
            ) : canInvite ? (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
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
              itemLabel="administrators"
              disabled={table.loading}
            />
          }
        />
        </div>
      )}

      <DetailPanel
        open={Boolean(selected)}
        onClose={closeDetails}
        title={selected?.admin.name ?? "Administrator"}
        description={selected?.admin.email}
        badge={
          selected ? <StatusBadge status={selected.admin.adminStatus} /> : null
        }
        sections={
          selected
            ? [
                {
                  id: "role",
                  label: "Role",
                  value: formatAdminRole(selected.admin.adminRole),
                },
                {
                  id: "role-description",
                  label: "Scope",
                  value: adminRoleDescription(selected.admin.adminRole),
                },
                {
                  id: "status",
                  label: "Status",
                  value: formatAdminStatus(selected.admin.adminStatus),
                },
                {
                  id: "created",
                  label: "Created",
                  value: formatAdminDate(selected.admin.createdAt),
                },
                {
                  id: "invited",
                  label: "Invited",
                  value: formatAdminDate(selected.admin.invitedAt),
                },
                {
                  id: "last-login",
                  label: "Last sign-in",
                  value: formatAdminDate(selected.admin.lastLoginAt),
                },
              ]
            : []
        }
        footer={
          selected ? (
            <div className="flex flex-wrap gap-2">
              <Button
                href={`/admins/${selected.admin._id}`}
                variant="outline"
                size="sm"
                icon={<Icon name="arrow-right" />}
              >
                Full profile
              </Button>
              {canManageRoles &&
              selected.admin._id !== user._id &&
              !(
                selected.admin.adminRole === "SUPER_ADMIN" &&
                user.adminRole !== "SUPER_ADMIN"
              ) ? (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Icon name="key" />}
                  onClick={() => openRoleChange(selected)}
                >
                  Change role
                </Button>
              ) : null}
              {canManageTarget(selected) && selectedChange ? (
                <Button
                  variant={
                    selectedChange.tone === "danger" ? "danger" : "primary"
                  }
                  size="sm"
                  onClick={() => setPending(selectedChange)}
                >
                  {selectedChange.label}
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <>
            <section>
              <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Effective permissions (
                {(detail?.permissions ?? selected.permissions).length})
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(detail?.permissions ?? selected.permissions).map(
                  (permission) => (
                    <Badge
                      key={permission}
                      tone="neutral"
                      className="px-2.5 py-0.5 text-[10px]"
                    >
                      {ADMIN_PERMISSION_LABELS[permission]}
                    </Badge>
                  ),
                )}
              </div>
            </section>

            {selected.admin.permissionGrants?.length ||
            selected.admin.permissionRevocations?.length ? (
              <section className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
                <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  Role overrides
                </h3>
                {selected.admin.permissionGrants?.length ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-ink">
                    Granted:{" "}
                    {selected.admin.permissionGrants
                      .map((permission) => ADMIN_PERMISSION_LABELS[permission])
                      .join(", ")}
                  </p>
                ) : null}
                {selected.admin.permissionRevocations?.length ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-ink">
                    Revoked:{" "}
                    {selected.admin.permissionRevocations
                      .map((permission) => ADMIN_PERMISSION_LABELS[permission])
                      .join(", ")}
                  </p>
                ) : null}
              </section>
            ) : null}

            {detail?.invitations?.length ? (
              <section className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
                <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                  Invitation history
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {detail.invitations.slice(0, 5).map((invitation) => (
                    <li
                      key={invitation._id}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="text-muted">
                        {formatAdminDate(invitation.lastSentAt)}
                      </span>
                      <StatusBadge
                        status={invitation.status}
                        className="px-2 py-0.5 text-[9px]"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Account activity
              </h3>
              <Timeline items={selectedTimeline} className="mt-3" />
            </section>
          </>
        ) : null}
      </DetailPanel>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;

          await adminApi.updateAdminStatus(pending.entry.admin._id, pending.next);

          toast({
            tone: "success",
            title: `${pending.entry.admin.name} updated`,
            description:
              pending.next === "ACTIVE"
                ? "The administrator can access the console again."
                : pending.next === "SUSPENDED"
                  ? "The administrator has been suspended and signed out."
                  : "The invitation has been revoked.",
          });

          setPending(null);
          closeDetails();
          table.reload();
        }}
        title={pending?.label ?? "Change administrator status"}
        description={pending?.description ?? ""}
        confirmLabel={pending?.label}
        tone={pending?.tone}
      >
        {pending ? (
          <div className="rounded-xl border border-line px-3.5 py-3">
            <p className="text-[12px] font-semibold text-ink">
              {pending.entry.admin.name}
            </p>
            <p className="text-[11px] text-muted">
              {pending.entry.admin.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-muted">
              <StatusBadge status={pending.entry.admin.adminStatus} />
              <Icon name="arrow-right" className="size-3" />
              <StatusBadge status={pending.next} />
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ReasonDialog
        open={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        onConfirm={async (reason) => {
          if (!roleTarget) return;
          if (!nextRole) throw new Error("Choose an administrative role.");

          await adminApi.updateAdminRole(roleTarget.admin._id, nextRole, reason);

          toast({
            tone: "success",
            title: "Role updated",
            description: `${roleTarget.admin.name} is now ${formatAdminRole(nextRole)}.`,
          });

          setRoleTarget(null);
          closeDetails();
          table.reload();
        }}
        title="Change administrator role"
        description="The new role takes effect immediately. Existing invitations are unaffected."
        confirmLabel="Update role"
        tone="primary"
        requireReason
      >
        {roleTarget ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-line px-3.5 py-3">
              <p className="text-[12px] font-semibold text-ink">
                {roleTarget.admin.name}
              </p>
              <p className="text-[11px] text-muted">{roleTarget.admin.email}</p>
              <p className="mt-1 text-[11px] text-muted">
                Current role: {formatAdminRole(roleTarget.admin.adminRole)}
              </p>
            </div>

            <Field label="New role" htmlFor="admin-next-role">
              <Select
                id="admin-next-role"
                value={nextRole}
                onChange={(event) => setNextRole(event.target.value)}
              >
                {(roles.length
                  ? roles.map((role) => ({
                      value: role.key,
                      label: role.label,
                    }))
                  : Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <p className="rounded-xl bg-well/60 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
              {adminRoleDescription(nextRole)}
            </p>
          </div>
        ) : null}
      </ReasonDialog>

      <InviteAdminModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={roles}
        onInvited={() => {
          table.reload();
          setInviteOpen(false);
        }}
      />
    </div>
  );
}

interface InviteAdminModalProps {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
  roles?: AdminRoleDefinition[];
}

function InviteAdminModal({
  open,
  onClose,
  onInvited,
  roles = [],
}: InviteAdminModalProps) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<InviteAdminValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      adminRole: "OPERATIONS_ADMIN",
    },
  });
  const role = useWatch({ control, name: "adminRole" });

  function close() {
    reset();
    setFormError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await adminApi.inviteAdmin({
        name: values.name,
        email: values.email,
        adminRole: values.adminRole,
      });

      toast({
        tone: "success",
        title: "Invitation sent",
        description: `${values.email} has been invited as ${formatAdminRole(values.adminRole)}.`,
      });

      reset();
      onInvited();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setFieldError, error.fieldErrors, [
          "name",
          "email",
          "adminRole",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The invitation could not be sent.",
        );
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite administrator"
      description="The invitee receives a secure link to set their password. Access takes effect only after the invitation is accepted."
      size="md"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={close}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-admin-form"
            size="sm"
            loading={isSubmitting}
          >
            Send invitation
          </Button>
        </>
      }
    >
      <form
        id="invite-admin-form"
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        <TextField
          label="Full name"
          placeholder="Amara Okafor"
          autoComplete="name"
          hint="Shown in the administrator directory."
          error={errors.name?.message}
          register={register("name")}
        />

        <TextField
          label="Work email"
          type="email"
          placeholder="amara@routiq.ng"
          autoComplete="email"
          hint="Existing customer or vendor accounts cannot be promoted."
          error={errors.email?.message}
          register={register("email")}
        />

        <SelectField
          label="Administrative role"
          hint={adminRoleDescription(role)}
          error={errors.adminRole?.message}
          options={
            roles.length
              ? roles.map((item) => ({ value: item.key, label: item.label }))
              : Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))
          }
          register={register("adminRole")}
        />

        {formError ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-[12px] leading-relaxed text-danger"
          >
            {formError}
          </p>
        ) : null}

        <p className="rounded-xl bg-well/60 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
          Only a Super Admin can invite another Super Admin. The API enforces
          this even if the option is selected here.
        </p>
      </form>
    </Modal>
  );
}
