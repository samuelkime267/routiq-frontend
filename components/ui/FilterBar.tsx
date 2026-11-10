"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/Form";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  children: ReactNode;
  onReset?: () => void;
  activeCount?: number;
  className?: string;
}

export function FilterBar({
  children,
  onReset,
  activeCount = 0,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {children}
      </div>
      {onReset && activeCount > 0 ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-full px-3 text-[12px] font-semibold text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none sm:self-end"
        >
          <Icon name="x" className="size-3.5" />
          Reset {activeCount === 1 ? "filter" : `${activeCount} filters`}
        </button>
      ) : null}
    </div>
  );
}

interface FilterDateProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  min?: string;
  max?: string;
}

export function FilterDate({
  label,
  value,
  onChange,
  className,
  id,
  min,
  max,
}: FilterDateProps) {
  const dateId = id ?? `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={cn("w-full sm:w-40", className)}>
      <label
        htmlFor={dateId}
        className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase"
      >
        {label}
      </label>
      <input
        id={dateId}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[12px] font-medium text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
      />
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
  id?: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
  id,
}: FilterSelectProps) {
  const selectId = id ?? `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={cn("w-full sm:w-44", className)}>
      <label
        htmlFor={selectId}
        className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase"
      >
        {label}
      </label>
      <Select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("h-10 text-[12px] font-medium")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
