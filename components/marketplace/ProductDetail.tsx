"use client";

import { useState } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import MarketplaceMedia from "@/components/marketplace/MarketplaceMedia";
import ProductGrid from "@/components/marketplace/ProductGrid";
import SectionHeading from "@/components/marketplace/SectionHeading";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useMarketplaceProduct } from "@/hooks/useMarketplace";
import { formatNaira } from "@/lib/format";
import {
  categoryHref,
  categoryIcon,
  initials,
  productDiscount,
  productImage,
} from "@/lib/marketplace";
import { cn } from "@/lib/cn";

export default function ProductDetail({ productId }: { productId: string }) {
  const { data, loading, error, reload } = useMarketplaceProduct(productId);
  const { addToCart, isWishlisted, toggleWishlist } = useMarketplace();
  const { toast } = useToast();

  const product = data?.product ?? null;
  // Quantity and gallery index belong to the product on screen. Keying them by
  // product id resets both when the shopper opens another product.
  const [selection, setSelection] = useState({
    productId,
    quantity: 1,
    activeImage: 0,
  });
  const selected = selection.productId === productId;
  const quantity = selected ? selection.quantity : 1;
  const activeImage = selected ? selection.activeImage : 0;

  const setQuantity = (update: number | ((value: number) => number)) =>
    setSelection((current) => {
      const base =
        current.productId === productId ? current.quantity : 1;
      return {
        productId,
        quantity: typeof update === "function" ? update(base) : update,
        activeImage:
          current.productId === productId ? current.activeImage : 0,
      };
    });

  const setActiveImage = (nextImage: number) =>
    setSelection((current) => ({
      productId,
      quantity: current.productId === productId ? current.quantity : 1,
      activeImage: nextImage,
    }));

  if (loading) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-3 w-48" />
        <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Skeleton className="aspect-square w-full rounded-[24px]" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </MarketplaceContainer>
    );
  }

  if (error || !product) {
    return (
      <MarketplaceContainer className="py-10 sm:py-14">
        <ErrorState
          title="We could not load this product"
          description={
            error ??
            "This product may have been unpublished or its store is no longer active."
          }
          onRetry={reload}
          action={
            <Button href="/products" size="sm" variant="outline">
              Browse all products
            </Button>
          }
          className="bg-white"
        />
      </MarketplaceContainer>
    );
  }

  const images = product.images.filter(Boolean);
  const currentImage = images[activeImage] ?? productImage(product);
  const discount = productDiscount(product);
  const saved = isWishlisted(product._id);
  const maxQuantity = Math.max(1, product.stock);
  const related = data?.related ?? [];

  const handleAdd = () => {
    const added = addToCart(product, quantity);

    if (!added) {
      toast({
        title: "This product is unavailable",
        description: "It is currently out of stock.",
        tone: "error",
      });
      return;
    }

    toast({
      title: `Added ${quantity} to cart`,
      description: product.name,
      tone: "success",
    });
  };

  const handleWishlist = () => {
    const added = toggleWishlist(product);
    toast({
      title: added ? "Saved to wishlist" : "Removed from wishlist",
      description: product.name,
      tone: added ? "success" : "info",
    });
  };

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.category, href: categoryHref(product.category) },
          { label: product.name },
        ]}
        className="mb-4"
      />

      <div className="grid gap-7 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
        <div>
          <div className="overflow-hidden rounded-[24px] border border-line bg-white">
            <MarketplaceMedia
              src={currentImage}
              alt={product.name}
              icon={categoryIcon(product.category)}
              priority
              className="aspect-square"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
          </div>

          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={index === activeImage}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
                    index === activeImage
                      ? "border-pri"
                      : "border-line hover:border-pri/30",
                  )}
                >
                  <MarketplaceMedia
                    src={image}
                    alt=""
                    icon={categoryIcon(product.category)}
                    className="size-full"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={categoryHref(product.category)}
              className="rounded-full bg-well px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.1em] text-pri uppercase transition hover:bg-pri hover:text-white"
            >
              {product.category}
            </Link>
            {product.store ? (
              <Link
                href={`/stores/${product.store._id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-muted transition hover:border-pri/25 hover:text-pri"
              >
                <Icon name="store" className="size-3" />
                {product.store.name}
              </Link>
            ) : null}
          </div>

          <h1 className="mt-3 text-[26px] leading-[1.12] font-semibold tracking-[-0.04em] text-ink sm:text-[32px]">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
              {formatNaira(product.price)}
            </span>
            {product.compareAtPrice &&
            product.compareAtPrice > product.price ? (
              <span className="text-[13px] font-medium text-muted line-through">
                {formatNaira(product.compareAtPrice)}
              </span>
            ) : null}
            {discount ? (
              <Badge tone="lime" className="px-2.5 py-1 text-[10px]">
                Save {discount}%
              </Badge>
            ) : null}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium">
            {product.inStock ? (
              <>
                <span className="size-1.5 rounded-full bg-success" />
                <span className="text-success">In stock</span>
                {product.stock <= 5 ? (
                  <span className="text-[#8a5a00]">
                    · Only {product.stock} left
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-danger" />
                <span className="text-danger">Currently unavailable</span>
              </>
            )}
          </p>

          {product.description ? (
            <p className="mt-4 max-w-[560px] text-[12.5px] leading-relaxed text-muted">
              {product.description}
            </p>
          ) : null}

          <div className="mt-5 rounded-[18px] border border-line bg-white p-3.5 sm:p-4">
            <p className="text-[9px] font-semibold tracking-[0.15em] text-muted uppercase">
              Quantity
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="inline-flex h-11 items-center rounded-full border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1 || !product.inStock}
                  aria-label="Decrease quantity"
                  className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-well hover:text-pri disabled:opacity-40"
                >
                  <Icon name="minus" className="size-4" />
                </button>
                <span className="w-8 text-center text-[13px] font-semibold text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(maxQuantity, value + 1))
                  }
                  disabled={
                    quantity >= maxQuantity || !product.inStock
                  }
                  aria-label="Increase quantity"
                  className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-well hover:text-pri disabled:opacity-40"
                >
                  <Icon name="plus" className="size-4" />
                </button>
              </div>

              <p className="text-[10.5px] text-muted">
                {product.inStock
                  ? `${formatNaira(product.price * quantity)} total`
                  : "Out of stock"}
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="lg"
                fullWidth
                disabled={!product.inStock}
                onClick={handleAdd}
                icon={<Icon name="shopping-bag" className="size-4" />}
              >
                {product.inStock ? "Add to cart" : "Out of stock"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleWishlist}
                aria-pressed={saved}
                icon={
                  <Icon
                    name="heart"
                    className={cn("size-4", saved && "fill-current text-danger")}
                  />
                }
                className="sm:w-auto"
              >
                {saved ? "Saved" : "Wishlist"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { icon: "shield" as const, label: "Verified vendor" },
              { icon: "truck" as const, label: "Delivery coordinated" },
              { icon: "card" as const, label: "Naira pricing" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-xl bg-soft/70 px-3 py-2.5"
              >
                <Icon name={item.icon} className="size-3.5 text-pri" />
                <span className="text-[10px] font-medium text-muted">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {product.store ? (
            <Link
              href={`/stores/${product.store._id}`}
              className="mt-4 flex items-center gap-3 rounded-[18px] border border-line bg-white p-3.5 transition hover:border-pri/25 hover:bg-well/30"
            >
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-pri text-[12px] font-bold text-lime">
                {product.store.logo ? (
                  <MarketplaceMedia
                    compact
                    src={product.store.logo}
                    alt={`${product.store.name} logo`}
                    icon="store"
                    fit="contain"
                    className="size-full"
                    sizes="44px"
                  />
                ) : (
                  initials(product.store.name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
                  Sold by
                </p>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-ink">
                  {product.store.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-muted">
                  {product.store.category}
                </p>
              </div>
              <Icon name="arrow-right" className="size-4 text-pri" />
            </Link>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="mt-12 border-t border-line pt-9 sm:mt-16">
          <SectionHeading
            title="You may also like"
            description="More products from the same category."
            href={categoryHref(product.category)}
          />
          <ProductGrid products={related} />
        </div>
      ) : null}
    </MarketplaceContainer>
  );
}
