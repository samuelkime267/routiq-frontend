import Link from "next/link";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-5 flex items-end justify-between gap-4 sm:mb-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.18em] text-pri/55 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[21px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[26px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-muted sm:text-[13px]">
            {description}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[11px] font-semibold text-pri transition hover:border-pri/25 hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none sm:px-4"
        >
          {linkLabel}
          <Icon
            name="arrow-right"
            className="size-3.5 transition group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      ) : null}
    </div>
  );
}
