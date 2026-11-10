import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function initials(name?: string | null) {
  return (
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== "—";

  return (
    <div className="flex flex-col gap-0.5 border-b border-line/70 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "text-[12px] break-words text-ink sm:text-right",
          mono && "font-mono text-[11px]",
        )}
      >
        {hasValue ? value : "—"}
      </dd>
    </div>
  );
}

export function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-label={label}>
      <div className="h-8 w-64 animate-pulse rounded-lg bg-well" />
      <div className="h-10 w-full animate-pulse rounded-full bg-well" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-well" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-well" />
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      {children}
    </div>
  );
}
