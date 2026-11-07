import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import Skeleton from "@/components/ui/Skeleton";
import {
  formatNaira,
  formatNairaCompact,
  formatNumber,
} from "@/lib/format";
import { cn } from "@/lib/cn";

interface ChartFrameProps {
  title: string;
  description: string;
  total: number;
  kind: "count" | "currency";
  loading?: boolean;
  hasData: boolean;
  children: ReactNode;
  className?: string;
  footnote?: ReactNode;
}

/**
 * Shared card shell for every dashboard chart. It owns the title, total and
 * loading/empty states so charts only have to draw the series itself.
 */
export default function ChartFrame({
  title,
  description,
  total,
  kind,
  loading = false,
  hasData,
  children,
  className,
  footnote,
}: ChartFrameProps) {
  return (
    <section
      className={cn("rounded-2xl border border-line bg-white p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Total
          </p>
          <p
            className="mt-1 text-[16px] leading-none font-semibold tracking-tight text-ink"
            title={kind === "currency" ? formatNaira(total) : formatNumber(total)}
          >
            {kind === "currency" ? formatNairaCompact(total) : formatNumber(total)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            <Skeleton className="h-[176px] w-full rounded-xl" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
        ) : hasData ? (
          children
        ) : (
          <div className="flex h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-soft/40 text-center">
            <span className="grid size-9 place-items-center rounded-xl bg-well text-pri">
              <Icon name="bar-chart" className="size-4" />
            </span>
            <p className="mt-2 text-[12px] font-semibold text-ink">
              No activity in this period
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              Try a wider reporting range.
            </p>
          </div>
        )}
      </div>

      {footnote ? (
        <p className="mt-3 text-[10px] leading-relaxed text-muted">{footnote}</p>
      ) : null}
    </section>
  );
}
