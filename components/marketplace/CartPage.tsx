"use client";

import { useState } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import MarketplaceMedia from "@/components/marketplace/MarketplaceMedia";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatNaira } from "@/lib/format";
import {
  categoryHref,
  categoryIcon,
  productImage,
} from "@/lib/marketplace";

export default function CartPage() {
  const {
    hydrated,
    cart,
    cartCount,
    cartSubtotal,
    setCartQuantity,
    removeFromCart,
    clearCart,
    location,
  } = useMarketplace();
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Cart" },
        ]}
        eyebrow="Your selection"
        title="Shopping cart"
        description="Review the products saved on this device, then continue to checkout."
        meta={
          <p className="text-[10.5px] text-muted">
            {hydrated
              ? `${cartCount} ${cartCount === 1 ? "item" : "items"} in your cart`
              : "Loading your cart…"}
          </p>
        }
        actions={
          cart.length > 0 ? (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-medium text-muted">
                  Clear all items?
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    clearCart();
                    setConfirmClear(false);
                    toast({
                      title: "Cart cleared",
                      description: "All saved items were removed.",
                      tone: "info",
                    });
                  }}
                >
                  Yes, clear
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmClear(true)}
                icon={<Icon name="trash" className="size-3.5" />}
              >
                Clear cart
              </Button>
            )
          ) : undefined
        }
      />

      {!hydrated ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-3 rounded-[20px] border border-line bg-white p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-24 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-72 rounded-[20px]" />
        </div>
      ) : cart.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="shopping-bag"
            title="Your cart is empty"
            description="Browse products from approved stores and add what you like. Your cart stays saved on this device."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button href="/products" variant="primary">
                  Shop products
                </Button>
                <Button href="/categories" variant="outline">
                  Explore categories
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_0.8fr] lg:items-start">
          <div className="rounded-[20px] border border-line bg-white px-4 divide-y divide-line sm:px-5">
            {cart.map((line) => {
              const { product, quantity } = line;

              return (
                <div key={product._id} className="flex gap-3 py-4">
                  <Link
                    href={`/products/${product._id}`}
                    className="size-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none sm:size-24"
                  >
                    <MarketplaceMedia
                      src={productImage(product)}
                      alt={product.name}
                      icon={categoryIcon(product.category)}
                      className="size-full"
                      sizes="96px"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={categoryHref(product.category)}
                          className="text-[9px] font-semibold tracking-[0.12em] text-muted uppercase transition hover:text-pri"
                        >
                          {product.category}
                        </Link>
                        <h2 className="mt-0.5 text-[12.5px] leading-snug font-semibold text-ink">
                          <Link
                            href={`/products/${product._id}`}
                            className="line-clamp-2 transition hover:text-pri"
                          >
                            {product.name}
                          </Link>
                        </h2>
                        {product.store ? (
                          <Link
                            href={`/stores/${product.store._id}`}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted transition hover:text-pri"
                          >
                            <Icon name="store" className="size-3" />
                            {product.store.name}
                          </Link>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(product._id);
                          toast({
                            title: "Removed from cart",
                            description: product.name,
                            tone: "info",
                          });
                        }}
                        aria-label={`Remove ${product.name} from cart`}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger/30 focus-visible:outline-none"
                      >
                        <Icon name="trash" className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <div className="inline-flex h-9 items-center rounded-full border border-line bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            setCartQuantity(product._id, quantity - 1)
                          }
                          aria-label={`Decrease ${product.name} quantity`}
                          className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
                        >
                          <Icon name="minus" className="size-3.5" />
                        </button>
                        <span
                          aria-live="polite"
                          className="w-7 text-center text-[12px] font-semibold text-ink"
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCartQuantity(product._id, quantity + 1)
                          }
                          disabled={quantity >= Math.max(1, product.stock)}
                          aria-label={`Increase ${product.name} quantity`}
                          className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-well hover:text-pri disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
                        >
                          <Icon name="plus" className="size-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[13px] font-bold text-ink">
                          {formatNaira(product.price * quantity)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {formatNaira(product.price)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="rounded-[20px] border border-line bg-white p-4 sm:p-5 lg:sticky lg:top-[100px]">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Order summary
            </h2>

            <dl className="mt-4 space-y-2.5 text-[11.5px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Items</dt>
                <dd className="font-semibold text-ink">{cartCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold text-ink">
                  {formatNaira(cartSubtotal)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Delivery to</dt>
                <dd className="max-w-[150px] text-right font-medium text-ink">
                  {location}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="max-w-[150px] text-right text-muted">
                  Calculated at checkout
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[12px] font-semibold text-ink">
                Cart subtotal
              </span>
              <span className="text-[18px] font-bold text-ink">
                {formatNaira(cartSubtotal)}
              </span>
            </div>

            <div className="mt-4">
              <Button href="/checkout" fullWidth size="lg">
                Proceed to checkout
              </Button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">
                Delivery is calculated per store at checkout, then confirmed by
                Routiq before you pay.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <Button href="/products" variant="outline" fullWidth>
                Continue shopping
              </Button>
              <Button href="/wishlist" variant="ghost" fullWidth>
                View wishlist
              </Button>
            </div>
          </aside>
        </div>
      )}
    </MarketplaceContainer>
  );
}
