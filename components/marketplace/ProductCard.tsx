"use client";

import Link from "next/link";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import MarketplaceMedia from "@/components/marketplace/MarketplaceMedia";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import {
  categoryHref,
  categoryIcon,
  productDiscount,
  productImage,
} from "@/lib/marketplace";
import type { MarketplaceProduct } from "@/types/api";

interface ProductCardProps {
  product: MarketplaceProduct;
  priority?: boolean;
  className?: string;
}

export default function ProductCard({
  product,
  priority = false,
  className,
}: ProductCardProps) {
  const { addToCart, isWishlisted, toggleWishlist } = useMarketplace();
  const { toast } = useToast();

  const discount = productDiscount(product);
  const saved = isWishlisted(product._id);
  const lowStock = product.inStock && product.stock > 0 && product.stock <= 5;

  const handleAdd = () => {
    const added = addToCart(product);

    if (!added) {
      toast({
        title: "This product is unavailable",
        description: "It is currently out of stock.",
        tone: "error",
      });
      return;
    }

    toast({
      title: "Added to cart",
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
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-pri/20 hover:shadow-[0_14px_36px_rgba(6,76,80,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative">
        <Link
          href={`/products/${product._id}`}
          aria-label={`View ${product.name}`}
          className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri/20"
        >
          <MarketplaceMedia
            src={productImage(product)}
            alt={product.name}
            icon={categoryIcon(product.category)}
            priority={priority}
            zoom
            className="aspect-square"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          />
        </Link>

        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {discount ? (
            <Badge tone="lime" className="px-2.5 py-1 text-[10px]">
              -{discount}%
            </Badge>
          ) : null}
          {!product.inStock ? (
            <Badge
              tone="neutral"
              className="bg-white/90 px-2.5 py-1 text-[10px] text-ink backdrop-blur"
            >
              Sold out
            </Badge>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            saved
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          aria-pressed={saved}
          className={cn(
            "absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full border border-white/70 bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
            saved && "text-danger",
          )}
        >
          <Icon
            name="heart"
            className={cn("size-4", saved && "fill-current")}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link
          href={categoryHref(product.category)}
          className="w-fit rounded text-[9.5px] font-semibold tracking-[0.14em] text-muted uppercase transition hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
        >
          {product.category}
        </Link>

        <h3 className="mt-1.5 text-[13px] leading-snug font-semibold text-ink">
          <Link
            href={`/products/${product._id}`}
            className="line-clamp-2 rounded transition hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none sm:text-[13.5px]"
          >
            {product.name}
          </Link>
        </h3>

        {product.store ? (
          <Link
            href={`/stores/${product.store._id}`}
            className="mt-1.5 flex w-fit items-center gap-1 rounded text-[10.5px] font-medium text-muted transition hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
          >
            <Icon name="store" className="size-3" />
            <span className="max-w-[170px] truncate">{product.store.name}</span>
          </Link>
        ) : null}

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[14.5px] font-bold tracking-tight text-ink sm:text-[15px]">
              {formatNaira(product.price)}
            </span>
            {product.compareAtPrice &&
            product.compareAtPrice > product.price ? (
              <span className="text-[10.5px] font-medium text-muted line-through">
                {formatNaira(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          <p className="mt-1 min-h-4 text-[10px] font-medium">
            {!product.inStock ? (
              <span className="text-danger">Currently unavailable</span>
            ) : lowStock ? (
              <span className="text-[#8a5a00]">Only {product.stock} left</span>
            ) : (
              <span className="text-success">In stock</span>
            )}
          </p>

          <Button
            type="button"
            variant={product.inStock ? "outline" : "ghost"}
            size="sm"
            fullWidth
            disabled={!product.inStock}
            onClick={handleAdd}
            className={cn(
              "mt-2.5 h-9 gap-1.5 text-[11px]",
              product.inStock &&
                "group-hover:border-pri/25 group-hover:bg-well/70",
            )}
            icon={<Icon name="shopping-bag" className="size-3.5" />}
          >
            {product.inStock ? "Add to cart" : "Out of stock"}
          </Button>
        </div>
      </div>
    </article>
  );
}
