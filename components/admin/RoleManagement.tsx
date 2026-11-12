"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DetailPanel from "@/components/ui/DetailPanel";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import { TextareaField, TextField } from "@/components/ui/FormField";
import MetricCard from "@/components/ui/MetricCard";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import { useToast } from "@/components/ui/Toast";
import PermissionPicker from "@/components/admin/PermissionPicker";
import ReasonDialog from "@/components/admin/ReasonDialog";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useServerTable } from "@/hooks/useServerTable";
import { adminApi, ApiError } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { ADMIN_PERMISSION_LABELS, adminRoleDescription } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import {
  createRoleSchema,
  type CreateRoleValues,
  type UpdateRoleValues,
} from "@/lib/schemas/admin";
import type { SortDirection } from "@/lib/pagination";
import type {
  AdminPermission,
  AdminRoleDefinition,
  PermissionCatalogue,
} from "@/types/api";

const sortOptions = [
  { value: "key:asc", label: "Key A–Z" },
  { value: "key:desc", label: "Key Z–A" },
  { value: "label:asc", label: "Name A–Z" },
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "createdAt:desc", label: "Newest first" },
];

export default function RoleManagement() {
  const { permissions: actorPermissions } = useAdminSession();
  const { toast } = useToast();
  const [catalogue, setCatalogue] = useState<PermissionCatalogue | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ total: 0, system: 0, custom: 0 });
  const [selected, setSelected] = useState<AdminRoleDefinition | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRoleDefinition | null>(null);
  const [deleting, setDeleting] = useState<AdminRoleDefinition | null>(null);

  useEffect(() => {
    let active = true;

    adminApi
      .permissions()
      .then((result) => {
        if (active) setCatalogue(result);
      })
      .catch((error) => {
        if (!active) return;
        setCatalogueError(
          error instanceof ApiError
            ? error.message
            : "Could not load the permission catalogue.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const table = useServerTable<AdminRoleDefinition>({
    loader: async (query) => {
      const result = await adminApi.roles({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        system: query.filters.system,
      });

      setSummary(result.summary);
      return { rows: result.roles, pagination: result.pagination };
    },
    initialSort: { key: "key", direction: "asc" },
  });

  const unavailable = catalogue
    ? catalogue.permissions
        .map((permission) => permission.key)
        .filter((permission) => !actorPermissions.includes(permission))
    : [];

  function canEdit(role: AdminRoleDefinition) {
    return role.key !== "SUPER_ADMIN";
  }

  function canDelete(role: AdminRoleDefinition) {
    return !role.system && (role.adminCount ?? 0) === 0;
  }

  function rowActions(role: AdminRoleDefinition) {
    const items: DropdownItem[] = [
      {
        id: "view",
        label: "View role",
        icon: "eye",
        onSelect: () => setSelected(role),
      },
    ];

    if (canEdit(role)) {
      items.push({
        id: "edit",
        label: "Edit role",
        icon: "key",
        separatorBefore: true,
        onSelect: () => setEditing(role),
      });
    } else {
      items.push({
        id: "protected",
        label: "Super Admin always holds every permission",
        icon: "lock",
        disabled: true,
        separatorBefore: true,
      });
    }

    if (canDelete(role)) {
      items.push({
        id: "delete",
        label: "Delete role",
        icon: "trash",
        danger: true,
        separatorBefore: true,
        onSelect: () => setDeleting(role),
      });
    } else if (!role.system && (role.adminCount ?? 0) > 0) {
      items.push({
        id: "delete-blocked",
        label: "Reassign its administrators before deleting",
        icon: "lock",
        disabled: true,
      });
    }

    return (
      <DropdownMenu
        label={`Actions for ${role.label}`}
        align="right"
        widthClassName="w-64"
        triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
        trigger={<Icon name="more-horizontal" className="size-4" />}
        items={items}
      />
    );
  }

  const columns: DataTableColumn<AdminRoleDefinition>[] = [
    {
      id: "label",
      header: "Role",
      sortable: true,
      primary: true,
      cell: (role) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-ink">
            {role.label}
          </p>
          <p className="truncate font-mono text-[10px] text-muted">{role.key}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (role) => (
        <Badge tone={role.system ? "teal" : "neutral"} className="px-2.5 py-0.5 text-[10px]">
          {role.system ? "Built-in" : "Custom"}
        </Badge>
      ),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: (role) => (
        <span className="text-[12px] text-muted">
          {role.permissions.length} of {catalogue?.permissions.length ?? "…"}
        </span>
      ),
    },
    {
      id: "admins",
      header: "Admins",
      hideOnMobile: true,
      cell: (role) => (
        <span className="text-[12px] text-muted">{role.adminCount ?? 0}</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      sortable: true,
      hideOnMobile: true,
      cell: (role) => (
        <span className="text-[12px] text-muted">
          {role.updatedAt
            ? new Date(role.updatedAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Seeded"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & permissions"
        eyebrow="Administration"
        description="Review the permission behind every role, then create or adjust custom roles. A role can never be granted more access than the administrator editing it already holds."
        breadcrumbs={breadcrumbsFor("/roles")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={() => {
                table.reload();
                void adminApi.permissions().then(setCatalogue).catch(() => {});
              }}
              disabled={table.loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              icon={<Icon name="plus" />}
              onClick={() => setCreateOpen(true)}
              disabled={!catalogue}
            >
              New role
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{summary.system} built-in</Badge>
            <Badge tone="neutral">{summary.custom} custom</Badge>
            <Badge tone="green">
              {catalogue?.permissions.length ?? "…"} granular permissions
            </Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Roles"
          value={table.meta.total}
          hint="Matched by the current filters"
          icon="key"
        />
        <MetricCard
          label="Built-in roles"
          value={summary.system}
          hint="Shipped with the platform"
          icon="shield"
        />
        <MetricCard
          label="Custom roles"
          value={summary.custom}
          hint="Created by administrators"
          icon="sparkles"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="px-4 py-3">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search roles by name, key or description"
              label="Search roles"
              className="w-full lg:max-w-sm"
            />
          </div>
          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Role type"
                value={table.filters.system ?? ""}
                onChange={(value) => table.setFilter("system", value)}
                options={[
                  { value: "", label: "All roles" },
                  { value: "true", label: "Built-in" },
                  { value: "false", label: "Custom" },
                ]}
              />
              <FilterSelect
                label="Sort by"
                value={
                  table.sort
                    ? `${table.sort.key}:${table.sort.direction}`
                    : "key:asc"
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
          caption="Administrative roles, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(role) => role._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error ?? catalogueError}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={rowActions}
          emptyTitle="No roles match these filters"
          emptyDescription="Clear the filters or create a new custom role."
          footer={
            <Pagination
              meta={table.meta}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="roles"
              disabled={table.loading}
            />
          }
        />
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-ink">
              Permission catalogue
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Permissions are grouped by feature area. Route access checks these
              keys directly, never role names.
            </p>
          </div>
          <Badge tone="neutral">
            {catalogue?.permissions.length ?? 0} permissions
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(catalogue?.groups ?? []).map((group) => (
            <div
              key={group.label}
              className="rounded-xl border border-line bg-well/30 px-3.5 py-3"
            >
              <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                {group.label}
              </h3>
              <ul className="mt-2 space-y-1">
                {group.permissions.map((permission) => (
                  <li
                    key={permission.key}
                    className="flex items-center justify-between gap-2 text-[11px] text-ink"
                  >
                    <span>{permission.label}</span>
                    <code className="text-[9px] text-muted">
                      {permission.key}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <DetailPanel
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.label ?? "Role"}
        description={selected?.description || selected?.key}
        badge={
          selected ? (
            <Badge tone={selected.system ? "teal" : "neutral"}>
              {selected.system ? "Built-in role" : "Custom role"}
            </Badge>
          ) : null
        }
        sections={
          selected
            ? [
                { id: "key", label: "Role key", value: selected.key },
                {
                  id: "scope",
                  label: "Scope",
                  value: adminRoleDescription(selected.key),
                },
                {
                  id: "admins",
                  label: "Assigned admins",
                  value: String(selected.adminCount ?? 0),
                },
                {
                  id: "permissions",
                  label: "Permissions",
                  value: String(selected.permissions.length),
                },
              ]
            : []
        }
        footer={
          selected && (canEdit(selected) || canDelete(selected)) ? (
            <div className="flex flex-wrap gap-2">
              {canEdit(selected) ? (
                <Button
                  size="sm"
                  icon={<Icon name="key" />}
                  onClick={() => setEditing(selected)}
                >
                  Edit role
                </Button>
              ) : null}
              {canDelete(selected) ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Icon name="trash" />}
                  onClick={() => setDeleting(selected)}
                >
                  Delete role
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <section>
            <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              Permissions
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.permissions.map((permission) => (
                <Badge
                  key={permission}
                  tone="neutral"
                  className="px-2.5 py-0.5 text-[10px]"
                >
                  {ADMIN_PERMISSION_LABELS[permission]}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}
      </DetailPanel>

      <RoleFormModal
        mode="create"
        open={createOpen}
        catalogue={catalogue}
        unavailable={unavailable}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          table.reload();
        }}
      />

      <RoleFormModal
        mode="edit"
        open={Boolean(editing)}
        role={editing ?? undefined}
        catalogue={catalogue}
        unavailable={unavailable}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setSelected(null);
          table.reload();
        }}
      />

      <ReasonDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async (reason) => {
          if (!deleting) return;

          await adminApi.deleteRole(deleting._id, reason || undefined);

          toast({
            tone: "success",
            title: "Role deleted",
            description: `${deleting.label} is no longer available for assignment.`,
          });

          setDeleting(null);
          setSelected(null);
          table.reload();
        }}
        title="Delete role"
        description={
          deleting
            ? `Delete ${deleting.label}? This cannot be undone. Administrators must be reassigned first.`
            : ""
        }
        confirmLabel="Delete role"
        tone="danger"
        requireReason
      />
    </div>
  );
}

interface RoleFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  role?: AdminRoleDefinition;
  catalogue: PermissionCatalogue | null;
  unavailable: AdminPermission[];
  onClose: () => void;
  onSaved: () => void;
}

function RoleFormModal({
  mode,
  open,
  role,
  catalogue,
  unavailable,
  onClose,
  onSaved,
}: RoleFormModalProps) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = mode === "edit";
  const form = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      key: "",
      label: "",
      description: "",
      permissions: [],
      reason: "",
    },
  });
  const permissions = useWatch({ control: form.control, name: "permissions" }) ?? [];

  useEffect(() => {
    if (!open) return;

    if (isEdit && role) {
      form.reset({
        key: role.key,
        label: role.label,
        description: role.description,
        permissions: role.permissions,
        reason: "",
      });
    } else {
      form.reset({
        key: "",
        label: "",
        description: "",
        permissions: [],
        reason: "",
      });
    }
    // The form is intentionally reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?._id]);

  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);

    try {
      if (isEdit && role) {
        const editValues = values as UpdateRoleValues;
        await adminApi.updateRole(role._id, {
          label: editValues.label,
          description: editValues.description,
          permissions: editValues.permissions as AdminPermission[],
          reason: editValues.reason,
        });
        toast({
          tone: "success",
          title: "Role updated",
          description: `${editValues.label} now has ${editValues.permissions.length} permissions.`,
        });
      } else {
        const createValues = values as CreateRoleValues;
        await adminApi.createRole({
          key: createValues.key,
          label: createValues.label,
          description: createValues.description,
          permissions: createValues.permissions as AdminPermission[],
          reason: createValues.reason,
        });
        toast({
          tone: "success",
          title: "Role created",
          description: `${createValues.label} is ready to assign to administrators.`,
        });
      }

      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(
          form.setError,
          error.fieldErrors,
          isEdit
            ? ["label", "description", "permissions", "reason"]
            : ["key", "label", "description", "permissions", "reason"],
        );
      } else {
        setFormError(
          error instanceof Error ? error.message : "The role could not be saved.",
        );
      }
    }
  });

  function close() {
    if (isSubmitting) return;
    setFormError(null);
    onClose();
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? "Edit role" : "Create a role"}
      description={
        isEdit
          ? "Changes apply immediately to every administrator holding this role."
          : "Define a reusable set of permissions. You cannot grant a permission you do not hold yourself."
      }
      size="lg"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={isEdit ? "edit-role-form" : "create-role-form"}
            size="sm"
            loading={isSubmitting}
          >
            {isEdit ? "Save changes" : "Create role"}
          </Button>
        </>
      }
    >
      <form
        id={isEdit ? "edit-role-form" : "create-role-form"}
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        {!isEdit ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Role key"
              placeholder="REGIONAL_SUPPORT"
              hint="Uppercase identifier used by the API."
              error={errors.key?.message}
              register={form.register("key")}
            />
            <TextField
              label="Display name"
              placeholder="Regional Support"
              error={errors.label?.message}
              register={form.register("label")}
            />
          </div>
        ) : (
          <TextField
            label="Display name"
            error={errors.label?.message}
            register={form.register("label")}
          />
        )}

        <TextareaField
          label="Description"
          placeholder="What this role is responsible for"
          optional
          error={errors.description?.message}
          register={form.register("description")}
        />

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">
            Permissions
            <span className="ml-1 font-normal text-muted">
              ({permissions.length} selected)
            </span>
          </p>
          <PermissionPicker
            catalogue={catalogue}
            value={permissions as AdminPermission[]}
            onChange={(next) =>
              form.setValue("permissions", next, { shouldValidate: true })
            }
            unavailable={unavailable}
          />
          {errors.permissions?.message ? (
            <p className="mt-1 text-[12px] text-danger">
              {errors.permissions.message}
            </p>
          ) : null}
        </div>

        <TextField
          label="Reason"
          placeholder="Why is this role changing?"
          optional
          error={errors.reason?.message}
          register={form.register("reason")}
        />

        {formError ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-[12px] leading-relaxed text-danger"
          >
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
