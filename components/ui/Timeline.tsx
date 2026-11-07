import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import Link from "next/link";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  icon?: IconName;
  tone?: "teal" | "lime" | "amber" | "neutral" | "danger";
  /** Deep link into the module that owns the event. */
  href?: string;
}

const toneStyles = {
  teal: "bg-pri text-white",
  lime: "bg-lime text-pri-deep",
  amber: "bg-accent/20 text-[#8a5a00]",
  neutral: "bg-well text-muted",
  danger: "bg-danger/10 text-danger",
} as const;

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  emptyLabel?: string;
}

export default function Timeline({
  items,
  className,
  emptyLabel = "No activity yet.",
}: TimelineProps) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-muted">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol className={cn("relative space-y-4", className)}>
      {items.map((item, index) => {
        const content = (
          <>
            <p className="text-[12px] font-semibold text-ink">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {item.description}
              </p>
            ) : null}
            {item.time ? (
              <p className="mt-1 text-[10px] font-medium tracking-wide text-muted/80">
                {item.time}
              </p>
            ) : null}
          </>
        );

        return (
          <li key={item.id} className="relative flex gap-3">
            {index < items.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-8 left-[15px] h-[calc(100%-8px)] w-px bg-line"
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full",
                toneStyles[item.tone ?? "neutral"],
              )}
            >
              <Icon name={item.icon ?? "clock"} className="size-3.5" />
            </span>

            {item.href ? (
              <Link
                href={item.href}
                className="group min-w-0 rounded-lg pt-0.5 transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
              >
                {content}
              </Link>
            ) : (
              <div className="min-w-0 pt-0.5">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
