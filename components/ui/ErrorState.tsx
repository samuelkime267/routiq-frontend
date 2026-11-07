import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Check your connection and try again.",
  onRetry,
  action,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger/[0.04] text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-2xl bg-danger/10 text-danger",
          compact ? "size-10" : "size-12",
        )}
      >
        <Icon name="alert-circle" className={compact ? "size-5" : "size-6"} />
      </span>
      <p
        className={cn(
          "font-semibold tracking-tight text-ink",
          compact ? "mt-3 text-[13px]" : "mt-4 text-[15px]",
        )}
      >
        {title}
      </p>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
        {description}
      </p>
      {onRetry || action ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-pri px-4 text-xs font-semibold text-white transition hover:bg-pri-deep focus-visible:ring-4 focus-visible:ring-pri/30 focus-visible:outline-none"
            >
              <Icon name="refresh" className="size-3.5" />
              Try again
            </button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
