"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddressFormModal from "@/components/marketplace/AddressFormModal";
import CheckoutSummaryCard from "@/components/marketplace/CheckoutSummaryCard";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import MarketplaceMedia from "@/components/marketplace/MarketplaceMedia";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useMarketplaceAccount } from "@/hooks/useMarketplaceAccount";
import {
  addressApi,
  ApiError,
  checkoutApi,
  paymentApi,
  type CheckoutQuoteRequest,
} from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import { categoryIcon } from "@/lib/marketplace";
import { authLoginUrl } from "@/lib/urls";
import type {
  CheckoutGroup,
  CheckoutQuote,
  DeliveryOption,
  MarketplaceAddress,
  PaymentMethodsResult,
} from "@/types/api";

function newCheckoutKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function deliveryLabel(option: DeliveryOption, fallback: string | null) {
  if (option.estimatedDeliveryText) return option.estimatedDeliveryText;
  if (fallback) return formatDate(fallback);
  if (option.estimatedDaysMin !== null) {
    const days = option.estimatedDaysMax ?? option.estimatedDaysMin;

    return `${days} ${days === 1 ? "business day" : "business days"}`;
  }

  return "Delivery time confirmed by the store";
}

function CheckoutSection({
  step,
  title,
  description,
  action,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pri text-[11px] font-semibold text-white">
            {step}
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hydrated, user, status: authStatus } = useMarketplaceAccount();
  const { hydrated: cartHydrated, cart, cartCount, clearCart } =
    useMarketplace();

  const [addresses, setAddresses] = useState<MarketplaceAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressVersion, setAddressVersion] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [addressModal, setAddressModal] = useState<{
    address: MarketplaceAddress | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<MarketplaceAddress | null>(null);

  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteVersion, setQuoteVersion] = useState(0);
  const [deliverySelections, setDeliverySelections] = useState<
    Record<string, string>
  >({});

  const [methods, setMethods] = useState<PaymentMethodsResult | null>(null);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const keyRef = useRef<{ signature: string; key: string } | null>(null);

  const signedOut =
    hydrated &&
    cartHydrated &&
    authStatus === "anonymous" &&
    !user &&
    cart.length > 0;

  useEffect(() => {
    if (!signedOut) return;

    // `next` survives the sign-in round trip, so the shopper lands back on
    // checkout with the cart that is already saved on this device.
    window.location.replace(authLoginUrl("/checkout"));
  }, [signedOut]);

  // Address book.
  useEffect(() => {
    if (!user) return;

    let active = true;

    const load = async () => {
      setAddressesLoading(true);
      setAddressError(null);

      try {
        const result = await addressApi.list();

        if (!active) return;

        setAddresses(result.addresses);
        setSelectedAddressId((current) => {
          if (current && result.addresses.some((row) => row._id === current)) {
            return current;
          }

          return (
            result.addresses.find((row) => row.isDefault)?._id ??
            result.addresses[0]?._id ??
            null
          );
        });
      } catch (error) {
        if (!active) return;
        setAddressError(
          error instanceof ApiError
            ? error.message
            : "We could not load your saved addresses.",
        );
      } finally {
        if (active) setAddressesLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user, addressVersion]);

  // Payment methods come from the server so the UI never names a gateway.
  useEffect(() => {
    let active = true;

    const load = async () => {
      setMethodsError(null);

      try {
        const result = await paymentApi.methods();

        if (active) setMethods(result);
      } catch (error) {
        if (!active) return;
        setMethodsError(
          error instanceof ApiError
            ? error.message
            : "Payment options could not be loaded.",
        );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  // Authoritative quote. The backend recalculates products, stock, delivery and
  // totals on every change; the client only renders the result.
  useEffect(() => {
    if (!user || !cartHydrated || cart.length === 0) return;

    let active = true;

    const load = async () => {
      setQuoteLoading(true);
      setQuoteError(null);

      const payload: CheckoutQuoteRequest = {
        items: cart.map((line) => ({
          productId: line.product._id,
          quantity: line.quantity,
          expectedUnitPrice: line.product.price,
        })),
        ...(selectedAddressId ? { addressId: selectedAddressId } : {}),
        ...(Object.keys(deliverySelections).length
          ? { deliverySelections }
          : {}),
      };

      try {
        const result = await checkoutApi.quote(payload);

        if (active) setQuote(result.quote);
      } catch (error) {
        if (!active) return;
        setQuoteError(
          error instanceof ApiError
            ? error.message
            : "We could not calculate your order total. Please try again.",
        );
      } finally {
        if (active) setQuoteLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [
    user,
    cartHydrated,
    cart,
    selectedAddressId,
    deliverySelections,
    quoteVersion,
  ]);

  const blockingIssues = useMemo(
    () => (quote?.issues ?? []).filter((issue) => issue.code !== "price_changed"),
    [quote],
  );
  const priceChanges = useMemo(
    () => (quote?.issues ?? []).filter((issue) => issue.code === "price_changed"),
    [quote],
  );

  const allCouriersSelected = useMemo(() => {
    if (!quote) return false;

    return quote.groups.every(
      (group) =>
        !group.delivery.available ||
        Boolean(deliverySelections[group.store._id]),
    );
  }, [quote, deliverySelections]);

  const canPay =
    Boolean(quote) &&
    !quote?.blocking &&
    Boolean(selectedAddressId) &&
    Boolean(methods?.configured) &&
    allCouriersSelected &&
    !quoteLoading &&
    !placing;

  const selectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setDeliverySelections({});
    setPlaceError(null);
  };

  const handleAddressSaved = (address: MarketplaceAddress) => {
    setAddressVersion((version) => version + 1);
    setSelectedAddressId(address._id);
    setDeliverySelections({});
    toast({
      title: "Address saved",
      description: "Delivery will be calculated for this address.",
      tone: "success",
    });
  };

  const removeAddress = async () => {
    if (!deleteTarget) return;

    await addressApi.remove(deleteTarget._id);
    setDeleteTarget(null);
    setAddressVersion((version) => version + 1);
    setSelectedAddressId(null);
    toast({
      title: "Address removed",
      description: "Choose another address for delivery.",
      tone: "info",
    });
  };

  const submit = async () => {
    if (!quote || !selectedAddressId || !canPay) return;

    setPlacing(true);
    setPlaceError(null);

    const items = cart.map((line) => ({
      productId: line.product._id,
      quantity: line.quantity,
      expectedUnitPrice: line.product.price,
    }));
    const signature = [
      selectedAddressId,
      items.map((item) => `${item.productId}:${item.quantity}`).join(","),
      JSON.stringify(deliverySelections),
    ].join("|");

    if (!keyRef.current || keyRef.current.signature !== signature) {
      keyRef.current = { signature, key: newCheckoutKey() };
    }
    const checkoutKey = keyRef.current.key;

    try {
      const result = await checkoutApi.place({
        key: checkoutKey,
        items,
        addressId: selectedAddressId,
        deliverySelections,
        expectedTotal: quote.summary.total,
      });

      if (result.payment.status === "paid") {
        clearCart();
        router.push(`/checkout/confirmation/${result.masterOrderNumber}`);
        return;
      }

      if (result.payment.authorizationUrl) {
        // The provider's hosted checkout is the only place a payment is made.
        window.location.assign(result.payment.authorizationUrl);
        return;
      }

      // The order exists but the payment attempt could not start. The
      // confirmation screen explains that state and offers a retry.
      router.push(`/checkout/confirmation/${result.masterOrderNumber}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setPlaceError(error.message);
        const data = error.data as { quote?: CheckoutQuote } | null;

        if (data?.quote) setQuote(data.quote);
      } else {
        setPlaceError(
          "We could not place your order. Your cart is safe; please try again.",
        );
      }

      setPlacing(false);
      setQuoteVersion((version) => version + 1);
    }
  };

  const retryQuote = () => setQuoteVersion((version) => version + 1);

  if (!hydrated || !cartHydrated) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-[20px]" />
            <Skeleton className="h-64 rounded-[20px]" />
          </div>
          <Skeleton className="h-72 rounded-[20px]" />
        </div>
      </MarketplaceContainer>
    );
  }

  if (cart.length === 0) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Checkout" }]}
          eyebrow="Secure checkout"
          title="Checkout"
        />
        <div className="mt-6">
          <EmptyState
            icon="shopping-bag"
            title="Your cart is empty"
            description="Add a product from an approved store before you check out."
            action={
              <Button href="/products" variant="primary">
                Shop products
              </Button>
            }
          />
        </div>
      </MarketplaceContainer>
    );
  }

  if (!user) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Checkout" }]}
          eyebrow="Secure checkout"
          title="Sign in to check out"
          description="Your cart is saved on this device. Sign in and you will return here to finish your order."
        />
        <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
          <Alert tone="info" title="Taking you to sign in">
            If you are not redirected automatically, use the button below.
          </Alert>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              href={authLoginUrl("/checkout")}
              variant="primary"
            >
              Sign in
            </Button>
            <Button href="/cart" variant="outline">
              Back to cart
            </Button>
          </div>
        </div>
      </MarketplaceContainer>
    );
  }

  const selectedAddress =
    addresses.find((address) => address._id === selectedAddressId) ?? null;

  return (
    <MarketplaceContainer className="py-6 pb-28 sm:py-8 lg:py-10 lg:pb-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
        eyebrow="Secure checkout"
        title="Complete your order"
        description="Confirm your delivery address, review each store's fulfilment and pay securely. Totals are recalculated by Routiq."
        meta={
          <p className="text-[10.5px] text-muted">
            {cartCount} {cartCount === 1 ? "item" : "items"} ·{" "}
            {quote ? `${quote.groups.length} store` : "Calculating"}{" "}
            {quote && quote.groups.length === 1 ? "" : "s"}
          </p>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_0.85fr] lg:items-start">
        <div className="space-y-4">
          <CheckoutSection
            step={1}
            title="Delivery address"
            description="Select where this order should be delivered."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddressModal({ address: null })}
                icon={<Icon name="plus" className="size-3.5" />}
              >
                Add address
              </Button>
            }
          >
            {addressesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ) : addressError ? (
              <Alert tone="error" title="Addresses could not be loaded">
                {addressError}
                <button
                  type="button"
                  onClick={() => setAddressVersion((version) => version + 1)}
                  className="mt-2 block text-[12px] font-semibold text-pri underline underline-offset-2"
                >
                  Try again
                </button>
              </Alert>
            ) : addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-soft/50 p-5 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-white text-pri">
                  <Icon name="map-pin" className="size-5" />
                </span>
                <p className="mt-2 text-[13px] font-semibold text-ink">
                  Add a delivery address
                </p>
                <p className="mt-1 text-[11.5px] text-muted">
                  We need a street address to calculate delivery for each store.
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setAddressModal({ address: null })}
                >
                  Add address
                </Button>
              </div>
            ) : (
              <div
                role="radiogroup"
                aria-label="Delivery address"
                className="grid gap-3 sm:grid-cols-2"
              >
                {addresses.map((address) => {
                  const selected = address._id === selectedAddressId;

                  return (
                    <div
                      key={address._id}
                      className={`rounded-2xl border p-4 transition ${
                        selected
                          ? "border-pri bg-well/70 ring-1 ring-pri"
                          : "border-line bg-white hover:border-pri/30"
                      }`}
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectAddress(address._id)}
                        className="w-full text-left focus-visible:outline-none"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                              {address.label}
                            </span>
                            {address.isDefault ? (
                              <Badge tone="lime">Default</Badge>
                            ) : null}
                          </div>
                          {selected ? (
                            <span className="grid size-5 place-items-center rounded-full bg-pri text-white">
                              <Icon name="check" className="size-3" />
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-[12.5px] font-semibold text-ink">
                          {address.recipientName}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                          {address.street}, {address.city}, {address.lga},{" "}
                          {address.state}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {address.phone}
                        </p>
                      </button>

                      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line/70 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setAddressModal({ address })
                          }
                        >
                          Edit
                        </Button>
                        {!address.isDefault ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await addressApi.setDefault(address._id);
                                setAddressVersion((version) => version + 1);
                                toast({
                                  title: "Default address updated",
                                  tone: "success",
                                });
                              } catch (error) {
                                toast({
                                  title: "Could not update default address",
                                  description:
                                    error instanceof ApiError
                                      ? error.message
                                      : undefined,
                                  tone: "error",
                                });
                              }
                            }}
                          >
                            Set default
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:bg-danger/10"
                          onClick={() => setDeleteTarget(address)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedAddress?.validation.status === "invalid" ? (
              <Alert tone="info" className="mt-3">
                {selectedAddress.validation.message ??
                  "This address could not be verified. Check the street, city and state before paying."}
              </Alert>
            ) : null}
          </CheckoutSection>

          <CheckoutSection
            step={2}
            title="Fulfilment by store"
            description="Each store prepares and ships its own items. Delivery is calculated per store."
          >
            {quoteError ? (
              <Alert tone="error" title="Order summary unavailable">
                {quoteError}
                <button
                  type="button"
                  onClick={retryQuote}
                  className="mt-2 block text-[12px] font-semibold text-pri underline underline-offset-2"
                >
                  Try again
                </button>
              </Alert>
            ) : quoteLoading && !quote ? (
              <div className="space-y-3">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : quote && quote.groups.length > 0 ? (
              <div className="space-y-4">
                {quote.groups.map((group) => (
                  <StoreFulfilment
                    key={group.store._id}
                    group={group}
                    selectedOptionId={
                      deliverySelections[group.store._id] ?? null
                    }
                    onSelectOption={(optionId) =>
                      setDeliverySelections((current) => ({
                        ...current,
                        [group.store._id]: optionId,
                      }))
                    }
                  />
                ))}
              </div>
            ) : (
              <Alert tone="info">
                Add a delivery address to see each store&apos;s delivery
                options.
              </Alert>
            )}

            {blockingIssues.length > 0 ? (
              <Alert
                tone="error"
                title="Resolve these before paying"
                className="mt-4"
              >
                <ul className="mt-1 space-y-1">
                  {blockingIssues.map((issue, index) => (
                    <li key={`${issue.code}-${issue.productId ?? index}`}>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </Alert>
            ) : null}

            {priceChanges.length > 0 ? (
              <Alert
                tone="info"
                title="Prices were updated"
                className="mt-4"
              >
                <ul className="mt-1 space-y-1">
                  {priceChanges.map((issue) => (
                    <li key={issue.productId}>{issue.message}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}
          </CheckoutSection>

          <CheckoutSection
            step={3}
            title="Payment"
            description="Payments are handled by Routiq's payment provider. You will be redirected to complete payment securely."
          >
            {methodsError ? (
              <Alert tone="error">{methodsError}</Alert>
            ) : !methods ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : !methods.configured ? (
              <Alert tone="error" title="Online payment is unavailable">
                Payments are not configured right now. Your cart is saved; try
                again later or contact support.
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  {methods.methods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center gap-2 rounded-xl border border-line bg-soft/40 px-3 py-2.5"
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-white text-pri">
                        <Icon
                          name={
                            method.id === "bank_transfer"
                              ? "building"
                              : method.id === "ussd"
                                ? "phone"
                                : "card"
                          }
                          className="size-3.5"
                        />
                      </span>
                      <span className="text-[11.5px] font-medium text-ink">
                        {method.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                  <Icon
                    name="shield"
                    className="mt-0.5 size-3.5 shrink-0 text-pri"
                  />
                  Payment confirmation comes from {methods.provider ?? "the"}
                  &nbsp;payment provider. Routiq never marks an order paid until
                  the provider confirms it.
                </p>
              </div>
            )}
          </CheckoutSection>
        </div>

        <div className="space-y-4 lg:sticky lg:top-[100px]">
          <CheckoutSummaryCard
            quote={quote}
            loading={quoteLoading}
            itemCount={cartCount}
            action={
              <>
                {placeError ? (
                  <Alert tone="error" className="mb-3">
                    {placeError}
                  </Alert>
                ) : null}

                <Button
                  fullWidth
                  size="lg"
                  onClick={() => void submit()}
                  loading={placing}
                  disabled={!canPay}
                  icon={<Icon name="lock" className="size-4" />}
                >
                  {quote
                    ? `Pay ${formatNaira(quote.summary.total)}`
                    : "Review total"}
                </Button>

                {quote && !allCouriersSelected ? (
                  <p className="mt-2 text-center text-[11px] font-medium text-pri">
                    Select a courier for every store before paying.
                  </p>
                ) : null}

                <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">
                  By paying you agree to Routiq&apos;s{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-pri underline-offset-2 hover:underline"
                  >
                    terms of sale
                  </Link>
                  . Your cart is only cleared after payment is confirmed.
                </p>
              </>
            }
          />

          <div className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-[12px] font-semibold text-ink">
              Need a hand?
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Delivery fees and totals are confirmed by Routiq before payment.
              If a store cannot deliver to your address, you will see it above
              before you pay.
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

      {/* Mobile final action: total and payment in one sticky bar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-semibold tracking-[0.12em] text-muted uppercase">
              Total
            </p>
            <p className="text-[17px] font-bold text-ink">
              {quote ? formatNaira(quote.summary.total) : "—"}
            </p>
          </div>
          <Button
            onClick={() => void submit()}
            loading={placing}
            disabled={!canPay}
            icon={<Icon name="lock" className="size-4" />}
          >
            Pay securely
          </Button>
        </div>
      </div>

      <AddressFormModal
        open={Boolean(addressModal)}
        address={addressModal?.address ?? null}
        onClose={() => setAddressModal(null)}
        onSaved={handleAddressSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeAddress}
        title="Remove this address?"
        description="You can add it again later. Delivery will be recalculated for the address you select."
        confirmLabel="Remove address"
      >
        {deleteTarget ? (
          <p className="rounded-xl border border-line bg-soft/60 px-4 py-3 text-[12px] text-ink">
            {deleteTarget.label} · {deleteTarget.street}, {deleteTarget.city}
          </p>
        ) : null}
      </ConfirmDialog>
    </MarketplaceContainer>
  );
}

function StoreFulfilment({
  group,
  selectedOptionId,
  onSelectOption,
}: {
  group: CheckoutGroup;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-soft/50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-pri">
            <Icon name="store" className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-ink">
              {group.store.name}
            </p>
            <p className="text-[10px] text-muted">
              {[group.store.city, group.store.state]
                .filter(Boolean)
                .join(", ") || "Store pickup"}
            </p>
          </div>
        </div>
        <p className="text-[12px] font-semibold text-ink">
          {formatNaira(group.subtotal)}
        </p>
      </div>

      <ul className="divide-y divide-line/70 px-4">
        {group.items.map((line) => (
          <li key={line.product} className="flex gap-3 py-3">
            <MarketplaceMedia
              src={line.image}
              alt={line.name}
              icon={categoryIcon(line.category)}
              compact
              className="size-12 shrink-0 rounded-lg"
              sizes="48px"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[12px] font-medium text-ink">
                {line.name}
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted">
                {line.quantity} × {formatNaira(line.unitPrice)}
              </p>
            </div>
            <p className="text-[12px] font-semibold text-ink">
              {formatNaira(line.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          Delivery options
        </p>

        {!group.delivery.available ? (
          <Alert tone="error" className="mt-2">
            {group.delivery.message ??
              "Delivery is not available for this store at your address."}
          </Alert>
        ) : (
          <div className="mt-2 space-y-2" role="radiogroup" aria-label={`Delivery for ${group.store.name}`}>            {group.delivery.options.map((option) => {
              const selected = option.id === selectedOptionId;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelectOption(option.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    selected
                      ? "border-pri bg-well/60"
                      : "border-line bg-white hover:border-pri/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-pri bg-pri text-white"
                          : "border-line text-transparent"
                      }`}
                    >
                      <Icon name="check" className="size-3" />
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold text-ink">
                        {option.courier}
                      </p>
                      <p className="text-[10.5px] text-muted">
                        {deliveryLabel(option, group.estimatedDeliveryAt)}
                        {option.provider === "platform"
                          ? " · Routiq standard rate"
                          : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] font-semibold text-ink">
                    {option.fee === 0 ? "Free" : formatNaira(option.fee)}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {group.delivery.available && !selectedOptionId ? (
          <p className="mt-2 text-[11px] font-medium text-pri">
            Choose a courier to continue.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-line bg-soft/30 px-4 py-2.5 text-[11px]">
        <span className="text-muted">Store total</span>
        <span className="font-semibold text-ink">
          {formatNaira(group.total)}
        </span>
      </div>
    </div>
  );
}
