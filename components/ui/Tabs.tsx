"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: IconName;
  href?: string;
}

interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  variant?: "underline" | "pill";
  className?: string;
  ariaLabel?: string;
}

export default function Tabs({
  items,
  value,
  onChange,
  variant = "underline",
  className,
  ariaLabel = "Tabs",
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        variant === "underline"
          ? "flex gap-1 overflow-x-auto border-b border-line"
          : "inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.href ? false : item.id === value;

        const classes = cn(
          "inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold transition focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
          variant === "underline"
            ? cn(
                "-mb-px border-b-2 px-3.5 py-2.5",
                active
                  ? "border-pri text-pri"
                  : "border-transparent text-muted hover:border-line hover:text-pri",
              )
            : cn(
                "rounded-full px-3.5 py-1.5",
                active
                  ? "bg-pri text-white"
                  : "text-muted hover:bg-well hover:text-pri",
              ),
        );

        const content = (
          <>
            {item.icon ? <Icon name={item.icon} className="size-3.5" /> : null}
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active && variant === "pill"
                    ? "bg-white/15 text-white"
                    : "bg-well text-muted",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </>
        );

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} role="tab" className={classes}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active}
            aria-controls={`panel-${item.id}`}
            onClick={() => onChange?.(item.id)}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
