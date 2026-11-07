import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

interface MetricTrend {
  value: string;
  direction: "up" | "down" | "flat";
  /** Whether this trend is a positive signal for the metric. */
  positive?: boolean;
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  trend?: MetricTrend;
  href?: string;
  className?: string;
}

const trendIcon = {
  up: "arrow-up-right",
  down: "arrow-right",
  flat: "arrow-right",
} as const;

export default function MetricCard({
  label,
  value,
  hint,
  icon,
  trend,
  href,
  className,
}: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          {label}
        </p>
        {icon ? (
          <span className="grid size-8 place-items-center rounded-xl bg-well text-pri">
            <Icon name={icon} className="size-4" />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink">
        {value}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              trend.positive === false
                ? "bg-danger/10 text-danger"
                : "bg-success/10 text-[#087a38]",
            )}
          >
            <Icon
              name={trendIcon[trend.direction]}
              className={cn(
                "size-3",
                trend.direction === "down" && "rotate-90",
              )}
            />
            {trend.value}
          </span>
        ) : null}
        {hint ? (
          <span className="text-[11px] leading-snug text-muted">{hint}</span>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "group block rounded-2xl border border-line bg-white p-4 transition hover:border-pri/25 hover:shadow-[0_8px_24px_rgba(6,76,80,0.06)] focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cn("rounded-2xl border border-line bg-white p-4", className)}
    >
      {content}
    </div>
  );
}
