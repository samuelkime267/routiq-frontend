"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/marketplace/OrderStatusBadge";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { useMarketplaceAccount } from "@/hooks/useMarketplaceAccount";
import { ApiError, customerOrderApi } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { authLoginUrl } from "@/lib/urls";
import type { MarketplaceOrderGroup, PaginationMeta } from "@/types/api";

const STATUS_FILTERS = [
  { id: "all", label: "All orders" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
] as const;

const PAGE_SIZE = 10;

const emptyMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  pages: 1,
};

function OrderGroupCard({ group }: { group: MarketplaceOrderGroup }) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[11.5px] font-semibold tracking-[0.02em] text-ink">
              {group.masterOrderNumber}
            </p>
            <OrderStatusBadge status={group.status} />
            <PaymentStatusBadge status={group.paymentStatus} />
          </div>
          <p className="mt-1 text-[10.5px] text-muted">
            Placed {formatDate(group.placedAt ?? group.createdAt)}
            {group.orderCount > 1
              ? ` · ${group.orderCount} stores`
              : " · 1 store"}
            {group.itemCount
              ? ` · ${group.itemCount} item${group.itemCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[9.5px] font-semibold tracking-[0.12em] text-muted uppercase">
            Total
          </p>
          <p className="text-[16px] font-bold tracking-tight text-ink">
            {formatNaira(group.total)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
        {group.orders.map((order) => (
          <span
            key={order._id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-soft/50 px-2.5 py-1"
          >
            <Icon name="store" className="size-3 shrink-0 text-pri" />
            <span className="truncate text-[10.5px] font-medium text-ink">
              {order.store?.name ?? "Store"}
            </span>
            <span className="shrink-0 text-[10px] text-muted">
              {formatNaira(order.total)}
            </span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-soft/30 px-4 py-3 sm:px-5">
        {group.isPendingPayment ? (
          <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#8a5a00]">
            <Icon name="alert-circle" className="size-3.5" />
            Payment not confirmed yet
          </p>
        ) : (
          <p className="text-[10.5px] text-muted">
            {group.expectedDeliveryAt
              ? `Estimated delivery ${formatDate(group.expectedDeliveryAt)}`
              : "Delivery updates appear in the order details."}
          </p>
        )}

        <div className="flex items-center gap-2">
          {group.isPendingPayment ? (
            <Button
              size="sm"
              href={`/checkout/confirmation/${encodeURIComponent(
                group.masterOrderNumber,
              )}`}
            >
              Complete payment
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            href={`/orders/${encodeURIComponent(group.masterOrderNumber)}`}
            icon={<Icon name="arrow-right" className="size-3.5" />}
          >
            View order
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const { hydrated, user } = useMarketplaceAccount();
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [groups, setGroups] = useState<MarketplaceOrderGroup[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await customerOrderApi.list({
          page,
          limit: PAGE_SIZE,
          ...(status === "all" ? {} : { status }),
        });

        if (!active) return;

        setGroups(result.orders);
        setMeta(result.pagination);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "We could not load your orders. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user, status, page, version]);

  const tabs = useMemo(
    () =>
      STATUS_FILTERS.map((filter) => ({
        id: filter.id,
        label: filter.label,
      })),
    [],
  );

  const changeStatus = (next: string) => {
    setStatus(next);
    setPage(1);
  };

  if (!hydrated) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-3 w-80 max-w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-36 rounded-[20px]" />
          <Skeleton className="h-36 rounded-[20px]" />
        </div>
      </MarketplaceContainer>
    );
  }

  if (!user) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Orders" },
          ]}
          eyebrow="Your Routiq orders"
          title="Sign in to see your orders"
          description="Order history, delivery progress and payment receipts are private to your account."
        />
        <div className="mt-6 max-w-md rounded-[20px] border border-line bg-white p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-pri text-lime">
            <Icon name="package" className="size-5" />
          </span>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Sign in with the account you used at checkout to follow each store
            in your order.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              href={authLoginUrl("/orders")}
            >
              Sign in
            </Button>
            <Button href="/products" variant="outline">
              Keep shopping
            </Button>
          </div>
        </div>
      </MarketplaceContainer>
    );
  }

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Orders" },
        ]}
        eyebrow="Your Routiq orders"
        title="Orders and deliveries"
        description="Every checkout is grouped by its master order, with one sub-order and one delivery per store."
        meta={
          <p className="text-[10.5px] text-muted">
            {meta.total} {meta.total === 1 ? "order group" : "order groups"}
          </p>
        }
        actions={
          <Button href="/products" variant="outline" size="sm">
            Continue shopping
          </Button>
        }
      />

      <div className="mt-5">
        <Tabs
          items={tabs}
          value={status}
          onChange={changeStatus}
          variant="pill"
          ariaLabel="Filter orders by status"
        />
      </div>

      <div className="mt-5 space-y-3">
        {error ? (
          <Alert tone="error" title="Orders could not be loaded">
            {error}
            <button
              type="button"
              onClick={() => setVersion((current) => current + 1)}
              className="mt-2 block text-[12px] font-semibold text-pri underline underline-offset-2"
            >
              Try again
            </button>
          </Alert>
        ) : loading ? (
          <>
            <Skeleton className="h-36 rounded-[20px]" />
            <Skeleton className="h-36 rounded-[20px]" />
          </>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="package"
            title={
              status === "all"
                ? "No orders yet"
                : "No orders with this status"
            }
            description={
              status === "all"
                ? "When you check out, each store's items appear here with their delivery progress."
                : "Try another status filter, or view all of your orders."
            }
            action={
              status === "all" ? (
                <Button href="/products">Shop products</Button>
              ) : (
                <Button variant="outline" onClick={() => changeStatus("all")}>
                  View all orders
                </Button>
              )
            }
          />
        ) : (
          groups.map((group) => (
            <OrderGroupCard key={group.masterOrderNumber} group={group} />
          ))
        )}
      </div>

      {!loading && !error && meta.total > PAGE_SIZE ? (
        <div className="mt-4 rounded-[20px] border border-line bg-white">
          <Pagination
            meta={meta}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="orders"
          />
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-line bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-[12px] font-semibold text-ink">
            Something not right with an order?
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Open the order to see its payment state, delivery details and
            timeline before contacting support.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <Badge tone="neutral">Buyer protection</Badge>
          <Link
            href="/help"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
          >
            Help centre
            <Icon name="arrow-right" className="size-3" />
          </Link>
        </div>
      </div>
    </MarketplaceContainer>
  );
}
