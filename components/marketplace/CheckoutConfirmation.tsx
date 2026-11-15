"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/marketplace/OrderStatusBadge";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useMarketplaceAccount } from "@/hooks/useMarketplaceAccount";
import { ApiError, checkoutApi, paymentApi } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { authLoginUrl } from "@/lib/urls";
import type { CheckoutState, DeliveryOption } from "@/types/api";

interface CheckoutConfirmationProps {
  masterOrderNumber: string;
  /** Provider reference from the redirect query, if the customer came back from pay. */
  providerReference: string | null;
}

function deliverySummary(option: DeliveryOption | null) {
  if (!option) return null;
  if (option.estimatedDeliveryText) return option.estimatedDeliveryText;

  if (option.estimatedDaysMin !== null) {
    const days = option.estimatedDaysMax ?? option.estimatedDaysMin;

    return `${days} ${days === 1 ? "business day" : "business days"}`;
  }

  return null;
}

function PaymentBadge({ status }: { status: CheckoutState["payment"]["status"] }) {
  if (status === "paid") return <PaymentStatusBadge status="paid" />;
  if (status === "failed") return <PaymentStatusBadge status="failed" />;

  return <PaymentStatusBadge status="pending" />;
}

export default function CheckoutConfirmation({
  masterOrderNumber,
  providerReference,
}: CheckoutConfirmationProps) {
  const { hydrated, user } = useMarketplaceAccount();
  const { clearCart } = useMarketplace();

  const [state, setState] = useState<CheckoutState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const signedOut = hydrated && !user;

  // On return from the provider the URL carries a reference. Confirmation is
  // still server-to-server: this only tells Routiq to ask the provider.
  useEffect(() => {
    if (!user) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (providerReference && version === 0) {
          setVerifying(true);

          try {
            await paymentApi.verify(masterOrderNumber);
          } catch (verifyError) {
            // A verification failure is not fatal: the checkout state below
            // explains whether the payment is pending, failed or missing.
            if (!(verifyError instanceof ApiError)) throw verifyError;
          } finally {
            if (active) setVerifying(false);
          }
        }

        const result = await checkoutApi.state(masterOrderNumber);

        if (active) setState(result.checkout);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "We could not load this checkout. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user, masterOrderNumber, providerReference, version]);

  // The cart is only emptied once the provider has confirmed the payment.
  useEffect(() => {
    if (state?.payment.status === "paid") clearCart();
  }, [state?.payment.status, clearCart]);

  const retryPayment = useCallback(async () => {
    setRetrying(true);
    setRetryError(null);

    try {
      const result = await paymentApi.retry(masterOrderNumber);

      if (result.payment.status === "paid") {
        setVersion((current) => current + 1);
        return;
      }

      if (result.payment.authorizationUrl) {
        window.location.assign(result.payment.authorizationUrl);
        return;
      }

      setRetryError(
        result.payment.message ??
          "The payment provider is unavailable right now. Please try again shortly.",
      );
    } catch (retryFailure) {
      setRetryError(
        retryFailure instanceof ApiError
          ? retryFailure.message
          : "We could not restart the payment. Please try again.",
      );
    } finally {
      setRetrying(false);
    }
  }, [masterOrderNumber]);

  if (!hydrated) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-5 h-72 rounded-[20px]" />
      </MarketplaceContainer>
    );
  }

  if (signedOut) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Checkout confirmation" },
          ]}
          eyebrow="Order confirmation"
          title="Sign in to view this checkout"
          description="Order details are private to the customer who placed them."
        />
        <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
          <Button
            href={authLoginUrl(`/checkout/confirmation/${masterOrderNumber}`)}
          >
            Sign in
          </Button>
        </div>
      </MarketplaceContainer>
    );
  }

  if (loading) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-3 w-80 max-w-full" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-[20px]" />
            <Skeleton className="h-64 rounded-[20px]" />
          </div>
          <Skeleton className="h-72 rounded-[20px]" />
        </div>
        {verifying ? (
          <p className="mt-4 text-center text-[11px] text-muted">
            Confirming your payment with the provider…
          </p>
        ) : null}
      </MarketplaceContainer>
    );
  }

  if (error || !state) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Checkout confirmation" },
          ]}
          eyebrow="Order confirmation"
          title="We could not load this checkout"
        />
        <div className="mt-6 max-w-xl">
          <Alert tone="error" title="Please try again">
            {error ?? "This checkout could not be found."}
          </Alert>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setVersion((current) => current + 1)}>
              Retry
            </Button>
            <Button href="/orders" variant="outline">
              Your orders
            </Button>
            <Button href="/help" variant="ghost">
              Get help
            </Button>
          </div>
        </div>
      </MarketplaceContainer>
    );
  }

  const paid = state.payment.status === "paid";
  const failed = state.payment.status === "failed";

  const misplacedReference =
    providerReference &&
    state.payment.reference &&
    providerReference !== state.payment.reference;

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Checkout", href: "/checkout" },
          { label: "Confirmation" },
        ]}
        eyebrow={paid ? "Payment confirmed" : "Order received"}
        title={
          paid
            ? "Thank you — your order is confirmed"
            : failed
              ? "Your payment did not go through"
              : "We are confirming your payment"
        }
        description={
          paid
            ? "Each store has been notified and will prepare its items. Your order reference is below."
            : failed
              ? "Your order is saved but not paid. You can try the payment again without rebuilding your cart."
              : "Your order is saved. Routiq will only mark it paid once the payment provider confirms the transaction."
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-soft px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-ink">
              {state.masterOrderNumber}
            </span>
            <PaymentBadge status={state.payment.status} />
            {state.orders.length > 0 ? (
              <Badge tone="neutral">
                {state.orders.length}{" "}
                {state.orders.length === 1 ? "store" : "stores"}
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.55fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          {paid ? (
            <div className="rounded-[20px] border border-success/25 bg-success/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success text-white">
                  <Icon name="check" className="size-4" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    Payment received
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                    Confirmed by {state.payment.provider ?? "the payment provider"}
                    {state.paidAt ? ` on ${formatDate(state.paidAt)}` : ""}.
                    {state.payment.reference
                      ? ` Reference ${state.payment.reference}.`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {failed ? (
            <Alert tone="error" title="This payment attempt failed">
              {state.payment.failureReason ??
                "The payment was not completed. Your order is still saved and nothing was charged."}
              {retryError ? (
                <p className="mt-2 text-[12px]">{retryError}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {state.payment.canRetry ? (
                  <Button
                    size="sm"
                    onClick={() => void retryPayment()}
                    loading={retrying}
                  >
                    Try payment again
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVersion((current) => current + 1)}
                >
                  Refresh status
                </Button>
              </div>
            </Alert>
          ) : null}

          {!paid && !failed ? (
            <Alert tone="info" title="Waiting for the payment provider">
              We have not received confirmation yet. If you completed payment,
              refresh in a moment — you do not need to pay again. Your order is
              only marked paid after the provider confirms it.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setVersion((current) => current + 1)}
                  loading={loading}
                >
                  Check again
                </Button>
                {state.payment.canRetry ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void retryPayment()}
                    loading={retrying}
                  >
                    Restart payment
                  </Button>
                ) : null}
              </div>
              {retryError ? (
                <p className="mt-2 text-[12px]">{retryError}</p>
              ) : null}
            </Alert>
          ) : null}

          {misplacedReference ? (
            <Alert tone="info">
              The reference in this link did not match the payment on file. We
              verified the payment on the server, so this does not affect your
              order.
            </Alert>
          ) : null}

          <section className="overflow-hidden rounded-[20px] border border-line bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <h2 className="text-[13px] font-semibold text-ink">
                What you ordered
              </h2>
              <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                {state.summary.itemCount}{" "}
                {state.summary.itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="divide-y divide-line/70">
              {state.groups.map((group) => {
                const order = state.orders.find(
                  (row) => row.store === group.store._id,
                );

                return (
                  <div key={group.store._id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-full bg-soft text-pri">
                          <Icon name="store" className="size-3.5" />
                        </span>
                        <div>
                          <p className="text-[12.5px] font-semibold text-ink">
                            {group.store.name}
                          </p>
                          <p className="text-[10px] text-muted">
                            {[group.store.city, group.store.state]
                              .filter(Boolean)
                              .join(", ") || "Routiq store"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[12px] font-semibold text-ink">
                        {formatNaira(group.total)}
                      </p>
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {group.items.map((line) => (
                        <li
                          key={line.product}
                          className="flex items-baseline justify-between gap-3 text-[11.5px]"
                        >
                          <span className="min-w-0 text-muted">
                            <span className="font-medium text-ink">
                              {line.name}
                            </span>{" "}
                            × {line.quantity}
                          </span>
                          <span className="shrink-0 font-medium text-ink">
                            {formatNaira(line.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/70 pt-2 text-[10.5px] text-muted">
                      <span>
                        Delivery:{" "}
                        <span className="text-ink">
                          {group.deliveryFee === 0
                            ? "Free"
                            : formatNaira(group.deliveryFee)}
                        </span>
                      </span>
                      {group.delivery ? (
                        <span>
                          <span className="text-ink">
                            {group.delivery.courier}
                          </span>
                          {deliverySummary(group.delivery)
                            ? ` · ${deliverySummary(group.delivery)}`
                            : ""}
                        </span>
                      ) : null}
                      {order?.orderNumber ? (
                        <span className="ml-auto font-medium text-ink">
                          {order.orderNumber}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-line bg-soft/30 px-4 py-3 text-[11.5px] sm:px-5">
              <div className="flex justify-between">
                <span className="text-muted">Items</span>
                <span className="font-medium text-ink">
                  {formatNaira(state.summary.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className="font-medium text-ink">
                  {state.summary.deliveryFee === 0
                    ? "Free"
                    : formatNaira(state.summary.deliveryFee)}
                </span>
              </div>
              {state.summary.serviceFee > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted">Service fee</span>
                  <span className="font-medium text-ink">
                    {formatNaira(state.summary.serviceFee)}
                  </span>
                </div>
              ) : null}
              {state.summary.discount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted">Discount</span>
                  <span className="font-medium text-success">
                    −{formatNaira(state.summary.discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <span className="text-[12px] font-semibold text-ink">
                  Total
                </span>
                <span className="text-[17px] font-bold tracking-tight text-ink">
                  {formatNaira(state.summary.total)}
                </span>
              </div>
            </div>
          </section>

          {state.orders.length > 0 ? (
            <section className="rounded-[20px] border border-line bg-white">
              <div className="border-b border-line px-4 py-3.5 sm:px-5">
                <h2 className="text-[13px] font-semibold text-ink">
                  Store orders
                </h2>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  One sub-order per store, all linked to{" "}
                  {state.masterOrderNumber}.
                </p>
              </div>

              <ul className="divide-y divide-line/70">
                {state.orders.map((order) => {
                  const group = state.groups.find(
                    (row) => row.store._id === order.store,
                  );

                  return (
                    <li
                      key={order._id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-ink">
                          {group?.store.name ?? "Store order"}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          {order.orderNumber}
                          {order.subOrderNumber
                            ? ` · ${order.subOrderNumber}`
                            : ""}
                          {order.itemCount
                            ? ` · ${order.itemCount} item${
                                order.itemCount === 1 ? "" : "s"
                              }`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <span className="text-[12px] font-semibold text-ink">
                          {formatNaira(order.total)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="space-y-4 lg:sticky lg:top-[100px]">
          <div className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-soft text-pri">
                <Icon name="map-pin" className="size-4" />
              </span>
              <div>
                <h2 className="text-[12.5px] font-semibold text-ink">
                  Delivering to
                </h2>
                <p className="text-[10px] text-muted">
                  {state.address?.label ?? "Delivery address"}
                </p>
              </div>
            </div>

            {state.address ? (
              <div className="mt-3 rounded-xl border border-line bg-soft/40 px-3 py-2.5">
                <p className="text-[12px] font-semibold text-ink">
                  {state.address.recipientName}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {state.address.street}, {state.address.city},{" "}
                  {state.address.lga}, {state.address.state}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {state.address.phone}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-muted">
                The delivery address for this checkout is unavailable.
              </p>
            )}

            {state.orders[0]?.expectedDeliveryAt ? (
              <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted">
                <Icon name="truck" className="size-3.5 text-pri" />
                Estimated delivery {formatDate(state.orders[0].expectedDeliveryAt)}
              </p>
            ) : null}
          </div>

          <div className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
            <h2 className="text-[12.5px] font-semibold text-ink">
              Order reference
            </h2>
            <p className="mt-1.5 rounded-lg bg-soft px-3 py-2 font-mono text-[11.5px] tracking-[0.02em] text-ink">
              {state.masterOrderNumber}
            </p>
            {state.createdAt ? (
              <p className="mt-2 text-[10px] text-muted">
                Placed {formatDate(state.createdAt)}
                {state.paidAt ? ` · Paid ${formatDate(state.paidAt)}` : ""}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              <Button
                href={`/orders/${encodeURIComponent(state.masterOrderNumber)}`}
                fullWidth
                variant="outline"
                icon={<Icon name="package" className="size-4" />}
              >
                View order details
              </Button>
              <Button href="/products" fullWidth variant="ghost">
                Continue shopping
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-[12px] font-semibold text-ink">
              Need a hand?
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Quote your order reference when contacting support. A payment is
              never marked successful because a browser said so.
            </p>
            <Link
              href="/help"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-pri hover:underline"
            >
              Visit help centre
              <Icon name="arrow-right" className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </MarketplaceContainer>
  );
}
