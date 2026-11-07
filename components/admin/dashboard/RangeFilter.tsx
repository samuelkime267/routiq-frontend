"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { DashboardRangeKey } from "@/types/api";

interface RangeSelection {
  range: DashboardRangeKey;
  from?: string;
  to?: string;
}

interface RangeFilterProps {
  value: DashboardRangeKey;
  from?: string;
  to?: string;
  rangeLabel?: string;
  timezone?: string;
  loading?: boolean;
  onChange: (selection: RangeSelection) => void;
  onRefresh?: () => void;
}

const PRESETS: { key: Exclude<DashboardRangeKey, "custom">; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

/** Today's calendar date in the marketplace timezone (not the browser's). */
function lagosToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
  }).format(new Date());
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export default function RangeFilter({
  value,
  from,
  to,
  rangeLabel,
  timezone = "Africa/Lagos",
  loading = false,
  onChange,
  onRefresh,
}: RangeFilterProps) {
  const today = lagosToday();
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from ?? shiftDate(today, -6));
  const [draftTo, setDraftTo] = useState(to ?? today);
  const [error, setError] = useState<string | null>(null);

  const toggleCustom = () => {
    if (!open) {
      setDraftFrom(from ?? shiftDate(today, -6));
      setDraftTo(to ?? today);
      setError(null);
    }

    setOpen((current) => !current);
  };

  const applyCustom = () => {
    if (!draftFrom || !draftTo) {
      setError("Choose both a start and an end date.");
      return;
    }

    if (draftFrom > draftTo) {
      setError("The start date must be on or before the end date.");
      return;
    }

    if (shiftDate(draftFrom, 366) < draftTo) {
      setError("Custom ranges can cover at most 366 days.");
      return;
    }

    setError(null);
    setOpen(false);
    onChange({ range: "custom", from: draftFrom, to: draftTo });
  };

  return (
    <section className="rounded-2xl border border-line bg-white px-4 py-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            <Icon name="calendar" className="size-3.5" />
            Period
          </span>

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Dashboard date range"
          >
            {PRESETS.map((preset) => {
              const active = value === preset.key;

              return (
                <button
                  key={preset.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setOpen(false);
                    onChange({ range: preset.key });
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
                    active
                      ? "border-pri bg-pri text-white"
                      : "border-line bg-white text-ink hover:border-pri/30 hover:bg-well",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}

            <button
              type="button"
              aria-expanded={open}
              aria-pressed={value === "custom"}
              onClick={toggleCustom}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
                value === "custom"
                  ? "border-pri bg-pri text-white"
                  : "border-line bg-white text-ink hover:border-pri/30 hover:bg-well",
              )}
            >
              <Icon name="calendar" className="size-3.5" />
              Custom
            </button>
          </div>

          {rangeLabel ? (
            <span className="text-[11px] text-muted">{rangeLabel}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] text-muted sm:inline">
            {timezone.replace(/_/g, " ")}
          </span>
          {onRefresh ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              loading={loading}
              icon={<Icon name="refresh" className="size-3.5" />}
              className="px-3"
            >
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="mt-3 rounded-xl border border-line bg-soft/60 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-[11px] font-semibold text-ink">
              From
              <input
                type="date"
                value={draftFrom}
                max={draftTo || today}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
              />
            </label>
            <label className="flex-1 text-[11px] font-semibold text-ink">
              To
              <input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                max={today}
                onChange={(event) => setDraftTo(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={applyCustom}>
                Apply range
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
          {error ? (
            <p className="mt-2 text-[11px] font-medium text-danger" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-2 text-[10px] text-muted">
              Inclusive calendar days in Lagos time. Today is clamped to the
              current time.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
