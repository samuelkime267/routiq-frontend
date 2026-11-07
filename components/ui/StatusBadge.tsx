import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "teal" | "lime" | "amber" | "green" | "red" | "blue";

/**
 * Domain statuses across the marketplace share a small set of tones so the
 * same state always reads the same way.
 */
const STATUS_TONES: Record<string, Tone> = {
  active: "green",
  approved: "green",
  completed: "green",
  delivered: "green",
  paid: "green",
  resolved: "green",
  released: "green",
  pending: "amber",
  invited: "amber",
  processing: "amber",
  reviewing: "amber",
  "in review": "amber",
  "under review": "amber",
  open: "amber",
  awaiting: "amber",
  shipped: "blue",
  "in transit": "blue",
  escrow: "blue",
  refunded: "blue",
  scheduled: "blue",
  suspended: "red",
  rejected: "red",
  failed: "red",
  cancelled: "red",
  overdue: "red",
  disputed: "red",
  deactivated: "neutral",
  inactive: "neutral",
  draft: "neutral",
  closed: "neutral",
  archived: "neutral",
  unknown: "neutral",
};

export function humanizeStatus(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  dot?: boolean;
}

export default function StatusBadge({
  status,
  label,
  className,
  dot = true,
}: StatusBadgeProps) {
  const normalized = status.replace(/[_-]+/g, " ").toLowerCase();
  const tone = STATUS_TONES[normalized] ?? "neutral";
  const text = label ?? humanizeStatus(status);

  return (
    <Badge
      tone={tone}
      className={cn("gap-1.5 px-2.5 py-0.5 text-[10px]", className)}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-70" /> : null}
      {text}
    </Badge>
  );
}
