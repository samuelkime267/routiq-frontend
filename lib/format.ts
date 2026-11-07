export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

/**
 * Compact Naira amounts for chart axes and metric cards (`₦2.5M`, `₦171.5K`).
 * The full amount remains available through `formatNaira` for tooltips.
 */
export function formatNairaCompact(value: number) {
  const sign = value < 0 ? "-" : "";
  const amount = Math.abs(value);
  const trim = (scaled: number) =>
    scaled >= 100
      ? Math.round(scaled).toString()
      : scaled >= 10
        ? (Math.round(scaled * 10) / 10).toString()
        : (Math.round(scaled * 100) / 100).toString();

  if (amount >= 1_000_000_000) return `${sign}₦${trim(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `${sign}₦${trim(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${sign}₦${trim(amount / 1_000)}K`;

  return `${sign}₦${formatNumber(amount)}`;
}

/** Compact labels for non-currency chart axes (1.2K, 3.4M). */
export function formatCountCompact(value: number) {
  const amount = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (amount >= 1_000_000) {
    return `${sign}${(Math.round((amount / 1_000_000) * 10) / 10).toString()}M`;
  }
  if (amount >= 10_000) {
    return `${sign}${(Math.round((amount / 1_000) * 10) / 10).toString()}K`;
  }

  return `${sign}${formatNumber(amount)}`;
}

/** Short relative timestamp used by the activity feed and pending queues. */
export function formatRelativeTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
