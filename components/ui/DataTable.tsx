"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { SortState } from "@/lib/pagination";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import Skeleton, { TableSkeleton } from "./Skeleton";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  /** Server-side field to sort by. Defaults to the column id. */
  sortKey?: string;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  /** Hidden in the mobile card layout. */
  hideOnMobile?: boolean;
  /** Used as the card title on mobile. Defaults to the first column. */
  primary?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  caption: string;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sort?: SortState | null;
  onSortChange?: (key: string) => void;
  rowActions?: (row: T) => ReactNode;
  actionsLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  skeletonRows?: number;
  footer?: ReactNode;
  className?: string;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  loading = false,
  refreshing = false,
  error,
  onRetry,
  sort,
  onSortChange,
  rowActions,
  actionsLabel = "Actions",
  emptyTitle = "Nothing here yet",
  emptyDescription = "Records will appear here once they are available.",
  emptyAction,
  skeletonRows = 6,
  footer,
  className,
}: DataTableProps<T>) {
  const hasActions = Boolean(rowActions);
  const primaryColumn = columns.find((column) => column.primary) ?? columns[0];
  const secondaryColumns = columns.filter(
    (column) => column !== primaryColumn && !column.hideOnMobile,
  );

  return (
    <section
      aria-busy={loading}
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-white",
        className,
      )}
    >
      {refreshing ? (
        <div className="h-0.5 w-full overflow-hidden bg-well">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-pri" />
        </div>
      ) : null}

      {error ? (
        <div className="p-4">
          <ErrorState
            compact
            title="Could not load this collection"
            description={error}
            onRetry={onRetry}
          />
        </div>
      ) : loading && rows.length === 0 ? (
        <div aria-label="Loading records">
          <div className="hidden md:block">
            <TableSkeleton rows={skeletonRows} columns={columns.length + (hasActions ? 1 : 0)} />
          </div>
          <div className="divide-y divide-line md:hidden">
            {Array.from({ length: Math.min(skeletonRows, 4) }).map((_, index) => (
              <div key={index} className="space-y-2 px-4 py-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState
            compact
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr className="border-b border-line bg-soft/50">
                  {columns.map((column) => {
                    const sortKey = column.sortKey ?? column.id;
                    const active = sort?.key === sortKey;
                    const sortedAscending =
                      active && sort?.direction === "asc";

                    return (
                      <th
                        key={column.id}
                        scope="col"
                        aria-sort={
                          active
                            ? sortedAscending
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn(
                          "px-4 py-2.5 text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap text-muted uppercase",
                          alignClass[column.align ?? "left"],
                          column.headerClassName,
                        )}
                      >
                        {column.sortable && onSortChange ? (
                          <button
                            type="button"
                            onClick={() => onSortChange(sortKey)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded transition hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
                              column.align === "right" && "flex-row-reverse",
                              active && "text-pri",
                            )}
                          >
                            {column.header}
                            <Icon
                              name={
                                active
                                  ? sortedAscending
                                    ? "chevron-up"
                                    : "chevron-down"
                                  : "chevrons-up-down"
                              }
                              className={cn(
                                "size-3",
                                !active && "text-muted/60",
                              )}
                            />
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
                  {hasActions ? (
                    <th scope="col" className="w-12 px-2 py-2.5">
                      <span className="sr-only">{actionsLabel}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className={cn(refreshing && "opacity-60")}>
                {rows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    className="border-b border-line/70 transition last:border-0 hover:bg-well/40"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-3 align-middle text-[13px] text-ink",
                          alignClass[column.align ?? "left"],
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {hasActions ? (
                      <td className="px-2 py-2 text-right">
                        {rowActions?.(row)}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line md:hidden">
            {rows.map((row) => (
              <li key={getRowId(row)} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-[13px] font-semibold text-ink">
                    {primaryColumn?.cell(row)}
                  </div>
                  {hasActions ? (
                    <div className="shrink-0">{rowActions?.(row)}</div>
                  ) : null}
                </div>

                {secondaryColumns.length ? (
                  <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                    {secondaryColumns.map((column) => (
                      <div key={column.id} className="min-w-0">
                        <dt className="text-[9px] font-semibold tracking-[0.12em] text-muted uppercase">
                          {column.header}
                        </dt>
                        <dd className="mt-0.5 truncate text-[12px] text-ink">
                          {column.cell(row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {footer}
    </section>
  );
}
