"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarketplaceCategories } from "@/hooks/useMarketplace";
import { useMarketplaceAccount } from "@/hooks/useMarketplaceAccount";
import { Icon, Logo } from "@/components/icons";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import Modal from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { authLoginUrl, authRegisterUrl } from "@/lib/urls";
import Skeleton from "@/components/ui/Skeleton";
import { useHydrated } from "@/lib/useHydrated";

function SearchForm({
  value,
  onChange,
  onSubmit,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
}) {
  return (
    <form onSubmit={onSubmit} role="search" className={cn("relative", className)}>
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder="Search products and stores"
        label="Search the marketplace"
        className="[&_input]:h-11 [&_input]:rounded-full [&_input]:bg-soft/60 [&_input]:pr-[92px] [&_input]:focus:bg-white"
      />
      <Button
        type="submit"
        size="sm"
        className="absolute top-1 right-1 h-9 px-3.5"
        icon={<Icon name="search" className="size-3.5" />}
      >
        Search
      </Button>
    </form>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 grid min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[9px] leading-[17px] font-bold text-pri-deep">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function MarketplaceHeader() {
  const router = useRouter();
  const hydrated = useHydrated();
  const {
    cartCount,
    cartSubtotal,
    wishlistCount,
    location,
    setLocation,
  } = useMarketplace();
  const { user } = useMarketplaceAccount();
  const { data: categoryData, loading: categoriesLoading } =
    useMarketplaceCategories({
      limit: 12,
      sortBy: "productCount",
      sortOrder: "desc",
    });

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState(location);

  const categories = categoryData?.categories ?? [];
  const firstName = user?.name?.split(/\s+/)[0] ?? null;

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    setMenuOpen(false);
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  const openLocation = () => {
    setLocationDraft(location);
    setLocationOpen(true);
  };

  const saveLocation = () => {
    setLocation(locationDraft);
    setLocationOpen(false);
  };

  return (
    <>
      <div className="bg-pri-deep text-white/65">
        <MarketplaceContainer className="flex h-9 items-center justify-between gap-4 text-[10px] font-medium">
          <button
            type="button"
            onClick={openLocation}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-full py-1 transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
          >
            <Icon name="map-pin" className="size-3.5 text-lime" />
            <span className="text-white/45">Deliver to</span>
            <span className="max-w-[160px] truncate font-semibold text-white">
              {hydrated ? location : "Nigeria"}
            </span>
            <Icon name="chevron-down" className="size-3 text-white/40" />
          </button>

          <nav
            aria-label="Marketplace information"
            className="hidden items-center gap-4 sm:flex"
          >
            <Link
              href="/delivery"
              className="rounded transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
            >
              Delivery information
            </Link>
            <Link
              href="/track-order"
              className="rounded transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
            >
              Track order
            </Link>
            <Link
              href="/help"
              className="rounded transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
            >
              Help
            </Link>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded font-semibold text-white transition hover:text-lime focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
            >
              <Icon name="user" className="size-3.5" />
              {firstName ? `Hi, ${firstName}` : "Sign in"}
            </Link>
          </nav>
        </MarketplaceContainer>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
        <MarketplaceContainer className="flex h-[68px] items-center gap-3 sm:gap-4 lg:h-[76px]">
          <Link
            href="/"
            aria-label="Routiq marketplace home"
            className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none"
          >
            <span className="grid size-9 place-items-center rounded-[13px] bg-pri text-lime sm:size-10 sm:rounded-2xl">
              <Logo className="size-5 sm:size-6" />
            </span>
            <span className="hidden flex-col leading-none min-[380px]:flex">
              <span className="text-[18px] font-semibold tracking-[-0.04em] text-pri sm:text-[20px]">
                Routiq
              </span>
              <span className="mt-1 text-[8px] font-semibold tracking-[0.17em] text-muted uppercase">
                Marketplace
              </span>
            </span>
          </Link>

          <SearchForm
            value={query}
            onChange={setQuery}
            onSubmit={submitSearch}
            className="hidden flex-1 md:block md:max-w-[560px] lg:mx-4"
          />

          <nav
            aria-label="Marketplace account and cart"
            className="ml-auto flex items-center gap-1 sm:gap-2"
          >
            <Link
              href="/account"
              className="hidden h-10 items-center gap-2 rounded-full px-2.5 transition hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none lg:inline-flex"
            >
              <span className="grid size-8 place-items-center rounded-full bg-well text-pri">
                <Icon name="user" className="size-4" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[9px] font-medium tracking-[0.04em] text-muted uppercase">
                  Account
                </span>
                <span className="mt-0.5 max-w-[90px] truncate text-[11px] font-semibold text-ink">
                  {hydrated && firstName ? firstName : "Sign in"}
                </span>
              </span>
            </Link>

            <Link
              href="/wishlist"
              aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}` : ""}`}
              className="relative hidden h-10 items-center gap-2 rounded-full px-2.5 transition hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none sm:inline-flex"
            >
              <span className="relative grid size-8 place-items-center text-ink">
                <Icon name="heart" className="size-[18px]" />
                <CountBadge count={wishlistCount} />
              </span>
              <span className="text-[11px] font-semibold text-ink">Wishlist</span>
            </Link>

            <Link
              href="/cart"
              aria-label={`Cart${cartCount ? `, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : ""}`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-pri px-2.5 text-white transition hover:bg-pri-deep focus-visible:ring-4 focus-visible:ring-pri/30 focus-visible:outline-none sm:px-3.5"
            >
              <span className="relative grid size-7 place-items-center">
                <Icon name="shopping-bag" className="size-[18px]" />
                <CountBadge count={cartCount} />
              </span>
              <span className="hidden flex-col leading-none sm:flex">
                <span className="text-[8.5px] font-medium tracking-[0.1em] text-white/60 uppercase">
                  Cart
                </span>
                <span className="mt-0.5 text-[11px] font-semibold">
                  {hydrated && cartCount > 0
                    ? formatNaira(cartSubtotal)
                    : "0 items"}
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open marketplace menu"
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-full border border-line text-ink transition hover:border-pri/25 hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none lg:hidden"
            >
              <Icon name="menu" className="size-5" />
            </button>
          </nav>
        </MarketplaceContainer>

        <MarketplaceContainer className="pb-3 md:hidden">
          <SearchForm
            value={query}
            onChange={setQuery}
            onSubmit={submitSearch}
          />
        </MarketplaceContainer>

        <div className="hidden border-t border-line/80 lg:block">
          <MarketplaceContainer className="flex h-11 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/categories"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-semibold text-pri transition hover:bg-well focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
            >
              <Icon name="grid" className="size-3.5" />
              All categories
            </Link>
            <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-line" />
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="mr-1 h-6 w-20 shrink-0 rounded-full"
                  />
                ))
              : categories.map((category) => (
                  <Link
                    key={category.key}
                    href={`/categories/${category.key}`}
                    className="shrink-0 rounded-full px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
                  >
                    {category.name}
                  </Link>
                ))}
          </MarketplaceContainer>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close marketplace menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-pri-deep/45 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Marketplace menu"
            className="absolute top-0 right-0 flex h-full w-[min(88vw,380px)] flex-col overflow-y-auto border-l border-line bg-white shadow-[0_24px_80px_rgba(6,76,80,0.24)]"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-pri text-lime">
                  <Logo className="size-4.5" />
                </span>
                <span className="text-base font-semibold tracking-tight text-pri">
                  Routiq
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full border border-line text-ink transition hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none"
              >
                <Icon name="x" className="size-4" />
              </button>
            </div>

            <div className="px-4 pt-4">
              <SearchForm
                value={query}
                onChange={setQuery}
                onSubmit={submitSearch}
              />
            </div>

            <div className="px-4 py-5">
              <p className="px-1 text-[9px] font-semibold tracking-[0.18em] text-muted uppercase">
                Shop
              </p>
              <div className="mt-2 grid gap-1">
                {[
                  { label: "All products", href: "/products", icon: "shopping-bag" as const },
                  { label: "All stores", href: "/stores", icon: "store" as const },
                  { label: "Wishlist", href: "/wishlist", icon: "heart" as const },
                  { label: "Cart", href: "/cart", icon: "shopping-bag" as const },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-ink transition hover:bg-well focus-visible:bg-well focus-visible:outline-none"
                  >
                    <Icon name={item.icon} className="size-4 text-pri" />
                    {item.label}
                    {item.href === "/wishlist" && wishlistCount > 0 ? (
                      <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-[10px] text-muted">
                        {wishlistCount}
                      </span>
                    ) : null}
                    {item.href === "/cart" && cartCount > 0 ? (
                      <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-[10px] text-muted">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>

              <div className="my-4 h-px bg-line" />

              <div className="flex items-center justify-between px-1">
                <p className="text-[9px] font-semibold tracking-[0.18em] text-muted uppercase">
                  Categories
                </p>
                <Link
                  href="/categories"
                  onClick={() => setMenuOpen(false)}
                  className="text-[10px] font-semibold text-pri"
                >
                  View all
                </Link>
              </div>
              <div className="mt-2 grid gap-0.5">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.key}
                    href={`/categories/${category.key}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px] text-muted transition hover:bg-well hover:text-pri focus-visible:bg-well focus-visible:outline-none"
                  >
                    {category.name}
                    <span className="text-[10px] text-muted/70">
                      {category.productCount}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="my-4 h-px bg-line" />

              <p className="px-1 text-[9px] font-semibold tracking-[0.18em] text-muted uppercase">
                Account
              </p>
              <div className="mt-2 grid gap-0.5">
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-ink transition hover:bg-well focus-visible:bg-well focus-visible:outline-none"
                >
                  <Icon name="user" className="size-4 text-pri" />
                  {firstName ? `Hi, ${firstName}` : "Sign in or create account"}
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-muted transition hover:bg-well hover:text-pri focus-visible:bg-well focus-visible:outline-none"
                >
                  <Icon name="truck" className="size-4 text-pri" />
                  Track order
                </Link>
                <Link
                  href="/help"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-muted transition hover:bg-well hover:text-pri focus-visible:bg-well focus-visible:outline-none"
                >
                  <Icon name="help-circle" className="size-4 text-pri" />
                  Help and FAQs
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-muted transition hover:bg-well hover:text-pri focus-visible:bg-well focus-visible:outline-none"
                >
                  <Icon name="sparkles" className="size-4 text-pri" />
                  About Routiq
                </Link>
              </div>
            </div>

            <div className="mt-auto border-t border-line p-4">
              <a
                href={authRegisterUrl("vendor")}
                className="flex items-center justify-between rounded-xl bg-pri px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-pri-deep focus-visible:ring-4 focus-visible:ring-pri/30 focus-visible:outline-none"
              >
                Become a vendor
                <Icon name="arrow-right" className="size-4 text-lime" />
              </a>
              {!firstName ? (
                <a
                  href={authLoginUrl()}
                  className="mt-2 flex items-center justify-center rounded-xl border border-line px-4 py-2.5 text-[12px] font-semibold text-pri transition hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none"
                >
                  Sign in
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        title="Set your delivery location"
        description="Your location is saved on this device and shown in your cart and delivery details."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocationOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={saveLocation}>
              Save location
            </Button>
          </div>
        }
      >
        <Field
          label="City or area"
          htmlFor="marketplace-location"
          hint="You can change this at any time."
        >
          <Input
            id="marketplace-location"
            value={locationDraft}
            onChange={(event) => setLocationDraft(event.target.value)}
            placeholder="e.g. Port Harcourt, Rivers"
            autoComplete="address-level2"
          />
        </Field>
      </Modal>
    </>
  );
}
