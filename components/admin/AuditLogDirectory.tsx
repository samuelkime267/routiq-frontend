"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DetailPanel from "@/components/ui/DetailPanel";
import { FilterBar, FilterDate, FilterSelect } from "@/components/ui/FilterBar";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";
import { useServerTable } from "@/hooks/useServerTable";
import { adminApi } from "@/lib/api";
import {
  formatAdminDate,
  formatAuditAction,
  formatAuditEntity,
} from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import type { SortDirection } from "@/lib/pagination";
import type { AuditLogEntry } from "@/types/api";

const ENTITY_TYPES = [
  "admin",
  "admin_role",
  "invitation",
  "user",
  "vendor",
  "store",
  "product",
  "order",
  "payment",
  "escrow",
  "shipment",
  "dispute",
  "settings",
  "platform",
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "action:asc", label: "Action A–Z" },
  { value: "entityType:asc", label: "Entity A–Z" },
  { value: "actorName:asc", label: "Actor A–Z" },
];

function StateBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <div className="rounded-xl border border-line bg-well/30 px-3.5 py-3">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          {label}
        </p>
        <p className="mt-1 text-[11px] text-muted">No captured value.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-well/30 px-3.5 py-3">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </p>
      <pre className="mt-1.5 max-h-56 overflow-auto text-[10.5px] leading-relaxed whitespace-pre-wrap text-ink">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogDirectory() {
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summary, setSummary] = useState<{
    total: number;
    entityTypes: Array<{ _id: string; count: number }>;
    actions: Array<{ _id: string; count: number }>;
  }>({ total: 0, entityTypes: [], actions: [] });
  const detailRequest = useRef(0);

  const table = useServerTable<AuditLogEntry>({
    loader: async (query) => {
      const result = await adminApi.auditLogs({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        entityType: query.filters.entityType,
        action: query.filters.action,
        admin: query.filters.admin,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      });

      setSummary(result.summary);
      return { rows: result.logs, pagination: result.pagination };
    },
    initialSort: { key: "createdAt", direction: "desc" },
  });

  async function openLog(log: AuditLogEntry) {
    setSelected(log);
    setDetail(null);
    setDetailLoading(true);
    const request = detailRequest.current + 1;
    detailRequest.current = request;

    try {
      const result = await adminApi.auditLog(log._id);
      if (detailRequest.current === request) setDetail(result.log);
    } catch {
      if (detailRequest.current === request) setDetail(log);
    } finally {
      if (detailRequest.current === request) setDetailLoading(false);
    }
  }

  function closePanel() {
    detailRequest.current += 1;
    setSelected(null);
    setDetail(null);
    setDetailLoading(false);
  }

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      id: "createdAt",
      header: "When",
      sortable: true,
      primary: true,
      cell: (log) => (
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink">
            {formatAuditAction(log.action)}
          </p>
          <p className="truncate text-[10px] text-muted">
            {formatAdminDate(log.createdAt)}
          </p>
        </div>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      sortable: true,
      sortKey: "actorName",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-ink">
            {log.actorName ?? "System"}
          </p>
          <p className="truncate text-[10px] text-muted">
            {log.actorEmail ?? log.actorRole ?? "automation"}
          </p>
        </div>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      sortable: true,
      sortKey: "entityType",
      hideOnMobile: true,
      cell: (log) => (
        <Badge tone="neutral" className="px-2.5 py-0.5 text-[10px]">
          {formatAuditEntity(log.entityType)}
        </Badge>
      ),
    },
    {
      id: "entityLabel",
      header: "Record",
      hideOnMobile: true,
      cell: (log) => (
        <span className="text-[11px] text-muted">
          {log.entityLabel ?? log.entityId ?? "—"}
        </span>
      ),
    },
    {
      id: "reason",
      header: "Reason",
      hideOnMobile: true,
      cell: (log) => (
        <span className="line-clamp-2 max-w-[220px] text-[11px] text-muted">
          {log.reason ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (log) => (
        <Button variant="ghost" size="sm" onClick={() => void openLog(log)}>
          Inspect
        </Button>
      ),
    },
  ];

  const current = detail ?? selected;
  const entityFilterOptions = [
    { value: "", label: "All entities" },
    ...ENTITY_TYPES.map((entity) => ({
      value: entity,
      label: formatAuditEntity(entity),
    })),
  ];
  const actionFilterOptions = [
    { value: "", label: "All actions" },
    ...summary.actions.map((action) => ({
      value: action._id,
      label: formatAuditAction(action._id),
    })),
  ];

  const actor =
    current && typeof current === "object"
      ? {
          name: current.actorName ?? "System",
          email: current.actorEmail,
          role: current.actorRole,
        }
      : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit logs"
        eyebrow="Administration"
        description="Every sensitive administrative action is recorded with its actor, entity, before/after state, reason and request metadata. Entries are append-only; there is no edit or delete endpoint."
        breadcrumbs={breadcrumbsFor("/audit-logs")}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="refresh" />}
            onClick={table.reload}
            disabled={table.loading}
          >
            Refresh
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{summary.total} matching entries</Badge>
            <Badge tone="green">Append-only</Badge>
            <Badge tone="neutral">Read only</Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Matching entries"
          value={summary.total}
          hint="After the current filters"
          icon="file-text"
        />
        <MetricCard
          label="Entity types"
          value={summary.entityTypes.length}
          hint={summary.entityTypes[0] ? `Most: ${formatAuditEntity(summary.entityTypes[0]._id)}` : "No data"}
          icon="package"
        />
        <MetricCard
          label="Distinct actions"
          value={summary.actions.length}
          hint={summary.actions[0] ? `Most: ${formatAuditAction(summary.actions[0]._id)}` : "No data"}
          icon="activity"
        />
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="px-4 py-3">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search actions, actors, records or reasons"
              label="Search audit logs"
              className="w-full lg:max-w-md"
            />
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Entity"
                value={table.filters.entityType ?? ""}
                onChange={(value) => table.setFilter("entityType", value)}
                options={entityFilterOptions}
              />
              <FilterSelect
                label="Action"
                value={table.filters.action ?? ""}
                onChange={(value) => table.setFilter("action", value)}
                options={actionFilterOptions}
              />
              <div className="w-full sm:w-44">
                <label
                  htmlFor="audit-admin-filter"
                  className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase"
                >
                  Actor
                </label>
                <input
                  id="audit-admin-filter"
                  value={table.filters.admin ?? ""}
                  onChange={(event) => table.setFilter("admin", event.target.value)}
                  placeholder="Name or email"
                  className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[12px] font-medium text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
                />
              </div>
              <FilterDate
                label="From"
                value={table.filters.createdFrom ?? ""}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <FilterDate
                label="To"
                value={table.filters.createdTo ?? ""}
                onChange={(value) => table.setFilter("createdTo", value)}
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
          caption="Administrative audit trail, paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(log) => log._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No audit entries match these filters"
              : "No audit entries yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Widen the date range or clear the entity and action filters."
              : "Entries appear automatically as administrators take action."
          }
          footer={
            <Pagination
              meta={table.meta}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="entries"
              disabled={table.loading}
            />
          }
        />
      </div>

      <DetailPanel
        open={Boolean(selected)}
        onClose={closePanel}
        title={current ? formatAuditAction(current.action) : "Audit entry"}
        description={current ? formatAdminDate(current.createdAt) : undefined}
        badge={
          current ? (
            <Badge tone="neutral" className="px-2.5 py-0.5 text-[10px]">
              {current.action}
            </Badge>
          ) : null
        }
        sections={
          current
            ? [
                {
                  id: "entity",
                  label: "Entity",
                  value: formatAuditEntity(current.entityType),
                },
                {
                  id: "record",
                  label: "Record",
                  value: current.entityLabel ?? current.entityId ?? "—",
                },
                {
                  id: "actor",
                  label: "Actor",
                  value: actor?.name ?? "System",
                },
                {
                  id: "actor-role",
                  label: "Actor role",
                  value: actor?.role ?? "system",
                },
                {
                  id: "reason",
                  label: "Reason",
                  value: current.reason ?? "Not provided",
                },
                {
                  id: "ip",
                  label: "IP address",
                  value: current.ipAddress ?? "Not captured",
                },
                {
                  id: "request",
                  label: "Request",
                  value:
                    current.method && current.path
                      ? `${current.method} ${current.path}`
                      : "Not captured",
                },
              ]
            : []
        }
      >
        {detailLoading && !detail ? (
          <div className="space-y-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : null}

        {current ? (
          <>
            <StateBlock label="Previous state" value={current.previousState} />
            <StateBlock label="New state" value={current.newState} />
            <StateBlock label="Metadata" value={current.metadata} />

            <div className="rounded-xl border border-line bg-well/30 px-3.5 py-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                Request metadata
              </p>
              <dl className="mt-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">User agent</dt>
                  <dd className="max-w-[70%] truncate text-right text-ink">
                    {current.userAgent ?? "Not captured"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Entry ID</dt>
                  <dd className="font-mono text-[10px] text-ink">{current._id}</dd>
                </div>
              </dl>
            </div>

            <p className="rounded-xl bg-well/60 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
              Audit records are immutable. This entry cannot be edited or
              deleted from the console.
            </p>
          </>
        ) : null}
      </DetailPanel>
    </div>
  );
}
