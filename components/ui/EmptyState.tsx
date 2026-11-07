import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-2xl bg-well text-pri",
          compact ? "size-10" : "size-12",
        )}
      >
        <Icon name={icon} className={compact ? "size-5" : "size-6"} />
      </span>
      <p
        className={cn(
          "font-semibold tracking-tight text-ink",
          compact ? "mt-3 text-[13px]" : "mt-4 text-[15px]",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
