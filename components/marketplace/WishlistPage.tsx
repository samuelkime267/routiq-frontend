"use client";

import { useState } from "react";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import ProductGrid from "@/components/marketplace/ProductGrid";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function WishlistPage() {
  const {
    hydrated,
    wishlist,
    wishlistCount,
    addToCart,
    clearWishlist,
  } = useMarketplace();
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  const addAvailable = () => {
    let added = 0;

    wishlist.forEach((product) => {
      if (product.inStock && addToCart(product)) added += 1;
    });

    toast({
      title:
        added > 0
          ? `${added} ${added === 1 ? "item" : "items"} added to cart`
          : "Nothing available to add",
      description:
        added > 0
          ? "Your selection is waiting in the cart."
          : "The saved products are currently out of stock.",
      tone: added > 0 ? "success" : "info",
    });
  };

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Wishlist" },
        ]}
        eyebrow="Saved for later"
        title="Your wishlist"
        description="Keep products you are considering in one place. Saved items stay on this device between visits."
        meta={
          <p className="text-[10.5px] text-muted">
            {hydrated
              ? `${wishlistCount} saved ${wishlistCount === 1 ? "product" : "products"}`
              : "Loading your wishlist…"}
          </p>
        }
        actions={
          wishlist.length > 0 ? (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-medium text-muted">
                  Clear wishlist?
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    clearWishlist();
                    setConfirmClear(false);
                    toast({
                      title: "Wishlist cleared",
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
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addAvailable}
                  icon={<Icon name="shopping-bag" className="size-3.5" />}
                >
                  Add available to cart
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmClear(true)}
                >
                  Clear
                </Button>
              </div>
            )
          ) : undefined
        }
      />

      <div className="mt-6">
        {!hydrated ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-[4/5] rounded-[18px]"
              />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for later."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button href="/products" variant="primary">
                  Discover products
                </Button>
                <Button href="/categories" variant="outline">
                  Explore categories
                </Button>
              </div>
            }
          />
        ) : (
          <ProductGrid products={wishlist} priorityCount={4} />
        )}
      </div>
    </MarketplaceContainer>
  );
}
