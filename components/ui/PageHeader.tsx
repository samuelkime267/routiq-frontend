import type { ReactNode } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/cn";
import type { BreadcrumbItem } from "@/lib/adminNavigation";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/**
 * Consistent page title block for every admin screen. The global `h1` scale is
 * intended for marketing pages, so admin titles set their own size.
 */
export default function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {breadcrumbs?.length && breadcrumbs.length > 1 ? (
        <Breadcrumbs items={breadcrumbs} className="hidden sm:block" />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-pri/60 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[23px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-3">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
