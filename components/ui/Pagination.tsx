"use client";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  PAGE_SIZE_OPTIONS,
  pageBounds,
  pageWindow,
} from "@/lib/pagination";
import type { PaginationMeta } from "@/types/api";

interface PaginationProps {
  meta: PaginationMeta;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /** Plural noun used in the summary, e.g. "admins". */
  itemLabel?: string;
  disabled?: boolean;
  className?: string;
}

const control =
  "grid size-8 place-items-center rounded-lg border border-transparent text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted";

export default function Pagination({
  meta,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "results",
  disabled = false,
  className,
}: PaginationProps) {
  const { from, to } = pageBounds(meta);
  const pages = Math.max(meta.pages, 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-[11px] text-muted">
        {meta.total === 0 ? (
          <>No {itemLabel} to show</>
        ) : (
          <>
            Showing{" "}
            <span className="font-semibold text-ink">
              {from}–{to}
            </span>{" "}
            of <span className="font-semibold text-ink">{meta.total}</span>{" "}
            {itemLabel}
          </>
        )}
      </p>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-[11px] text-muted">
            <span className="hidden sm:inline">Rows</span>
            <span className="sr-only sm:hidden">Rows per page</span>
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              aria-label="Rows per page"
              className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-semibold text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 disabled:opacity-60"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={control}
            aria-label="Previous page"
            disabled={disabled || meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <Icon name="arrow-left" className="size-3.5" />
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            {pageWindow(meta.page, pages).map((entry, index) =>
              entry === "gap" ? (
                <span
                  key={`gap-${index}`}
                  className="grid size-8 place-items-center text-[11px] text-muted"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  disabled={disabled}
                  aria-label={`Page ${entry}`}
                  aria-current={entry === meta.page ? "page" : undefined}
                  onClick={() => onPageChange(entry)}
                  className={cn(
                    "grid size-8 place-items-center rounded-lg text-[11px] font-semibold transition focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
                    entry === meta.page
                      ? "bg-pri text-white"
                      : "text-muted hover:bg-well hover:text-pri",
                  )}
                >
                  {entry}
                </button>
              ),
            )}
          </div>

          <span className="px-1 text-[11px] font-semibold text-muted sm:hidden">
            Page {meta.page} of {pages}
          </span>

          <button
            type="button"
            className={control}
            aria-label="Next page"
            disabled={disabled || meta.page >= pages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            <Icon name="arrow-right" className="size-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
