"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import Skeleton from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/format";
import type { CheckoutQuote } from "@/types/api";

interface CheckoutSummaryCardProps {
  quote: CheckoutQuote | null;
  loading?: boolean;
  itemCount: number;
  action?: ReactNode;
}

function Row({
  label,
  value,
  emphasis = false,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "discount";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={
          emphasis ? "text-[13px] font-semibold text-ink" : "text-[12px] text-muted"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-[17px] font-bold tracking-tight text-ink"
            : tone === "discount"
              ? "text-[12px] font-semibold text-success"
              : "text-[12px] font-medium text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Order summary.
 *
 * Every amount here comes from the server quote. The card never adds up cart
 * prices itself, so what the customer authorises is exactly what Routiq
 * recalculated from the catalogue and delivery provider.
 */
export default function CheckoutSummaryCard({
  quote,
  loading = false,
  itemCount,
  action,
}: CheckoutSummaryCardProps) {
  const summary = quote?.summary ?? null;
  const storeCount = quote?.groups.length ?? 0;

  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">Order summary</h2>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {itemCount} {itemCount === 1 ? "item" : "items"}
            {storeCount > 0
              ? ` · ${storeCount} ${storeCount === 1 ? "store" : "stores"}`
              : ""}
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-soft text-pri">
          <Icon name="shopping-bag" className="size-4" />
        </span>
      </div>

      <div className="space-y-2.5 px-4 py-4 sm:px-5">
        {loading && !summary ? (
          <>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-3 h-6 w-1/2" />
          </>
        ) : summary ? (
          <>
            <Row label="Items" value={formatNaira(summary.subtotal)} />
            <Row
              label="Delivery"
              value={
                summary.deliveryFee === 0
                  ? "Free"
                  : formatNaira(summary.deliveryFee)
              }
            />
            {summary.serviceFee > 0 ? (
              <Row label="Service fee" value={formatNaira(summary.serviceFee)} />
            ) : null}
            {summary.discount > 0 ? (
              <Row
                label="Discount"
                value={`−${formatNaira(summary.discount)}`}
                tone="discount"
              />
            ) : null}

            <div className="border-t border-line pt-3">
              <Row
                label="Total"
                value={formatNaira(summary.total)}
                emphasis
              />
              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Includes {summary.itemCount}{" "}
                {summary.itemCount === 1 ? "item" : "items"} across{" "}
                {storeCount || 1} {storeCount === 1 || !storeCount ? "store" : "stores"}.
                Routiq confirms this total before payment.
              </p>
            </div>
          </>
        ) : (
          <p className="py-2 text-[12px] text-muted">
            Add a delivery address to see your verified total.
          </p>
        )}
      </div>

      {action ? (
        <div className="border-t border-line px-4 py-4 sm:px-5">{action}</div>
      ) : null}
    </div>
  );
}
