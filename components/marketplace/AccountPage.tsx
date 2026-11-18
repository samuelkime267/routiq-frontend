"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { Icon, type IconName } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  announceSessionChange,
  useMarketplaceAccount,
} from "@/hooks/useMarketplaceAccount";
import { ApiError, authApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { clearAuth } from "@/lib/session";
import {
  appHomeForRole,
  authLoginUrl,
  authRegisterUrl,
  vendorRegisterUrl,
} from "@/lib/urls";
import { initials } from "@/lib/marketplace";

const quickLinks: Array<{
  label: string;
  description: string;
  href: string;
  icon: IconName;
}> = [
  {
    label: "Your orders",
    description: "Follow payment, delivery and each store's fulfilment.",
    href: "/orders",
    icon: "package",
  },
  {
    label: "Shopping cart",
    description: "Review the products you have saved for checkout.",
    href: "/cart",
    icon: "shopping-bag",
  },
  {
    label: "Wishlist",
    description: "Return to the products you are considering.",
    href: "/wishlist",
    icon: "heart",
  },
  {
    label: "Track an order",
    description: "Get the latest delivery status from support.",
    href: "/track-order",
    icon: "truck",
  },
  {
    label: "Help and FAQs",
    description: "Answers about shopping, stores and delivery.",
    href: "/help",
    icon: "help-circle",
  },
];

const roleLabels: Record<string, string> = {
  user: "Customer",
  vendor: "Vendor",
  admin: "Administrator",
};

export default function AccountPage() {
  const { hydrated, user } = useMarketplaceAccount();
  const { toast } = useToast();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);

    try {
      await authApi.logout();
    } catch (error) {
      if (error instanceof ApiError && error.status >= 500) {
        toast({
          title: "We could not reach the server",
          description: "Your local session was cleared anyway.",
          tone: "info",
        });
      }
    } finally {
      clearAuth();
      announceSessionChange();
      setSigningOut(false);
      router.push("/");
      router.refresh();
    }
  };

  if (!hydrated) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-72 rounded-[20px]" />
          <Skeleton className="h-72 rounded-[20px]" />
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
            { label: "Account" },
          ]}
          eyebrow="Your Routiq account"
          title="Sign in to make Routiq yours"
          description="Access your saved cart and wishlist across devices, follow stores and get help with an order."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-white p-5 sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-pri text-lime">
              <Icon name="user" className="size-5" />
            </span>
            <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.03em] text-ink">
              Welcome back
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Sign in to keep your shopping experience connected. Product
              browsing and your local cart are available without an account.
            </p>

            <ul className="mt-4 space-y-2.5">
              {[
                "Keep your wishlist and cart close",
                "Get order and delivery support",
                "Manage your vendor storefront",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[11.5px] text-muted"
                >
                  <Icon name="check-circle" className="size-3.5 text-success" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={authLoginUrl()}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-pri px-5 text-sm font-semibold text-white transition hover:bg-pri-deep focus-visible:ring-4 focus-visible:ring-pri/30 focus-visible:outline-none"
            >
              Sign in
            </a>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[22px] border border-line bg-white p-5 sm:p-7">
              <h2 className="text-[16px] font-semibold tracking-tight text-ink">
                New to Routiq?
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                Create a customer account to save your details and get support
                with orders. It takes less than a minute.
              </p>
              <a
                href={authRegisterUrl("user")}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-pri transition hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none"
              >
                Create an account
              </a>
            </div>

            <div className="rounded-[22px] bg-pri-deep p-5 text-white sm:p-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] text-lime uppercase">
                <Icon name="store" className="size-3" />
                For businesses
              </span>
              <h2 className="mt-3 text-[18px] leading-tight font-semibold tracking-tight">
                Sell on Routiq
              </h2>
              <p className="mt-2 text-[11.5px] leading-relaxed text-white/60">
                Apply to become a vendor, complete store verification and reach
                customers across the marketplace.
              </p>
              <a
                href={vendorRegisterUrl()}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-lime px-4 text-[12px] font-semibold text-pri-deep transition hover:brightness-95 focus-visible:ring-4 focus-visible:ring-lime/40 focus-visible:outline-none"
              >
                Become a vendor
                <Icon name="arrow-right" className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </MarketplaceContainer>
    );
  }

  // Other apps keep their own session, so this is a plain cross-app link.
  const dashboardHref =
    user.role === "user" ? null : appHomeForRole(user.role);

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Account" },
        ]}
        eyebrow="Your Routiq account"
        title={`Hello, ${user.name.split(/\s+/)[0]}`}
        description="Manage your saved shopping, account details and support options."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-[20px] bg-pri text-[18px] font-bold text-lime">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[19px] font-semibold tracking-[-0.03em] text-ink">
                  {user.name}
                </h2>
                <Badge tone="teal">
                  {roleLabels[user.role] ?? user.role}
                </Badge>
                {user.isEmailVerified ? (
                  <Badge tone="green">Verified</Badge>
                ) : (
                  <Badge tone="amber">Email pending</Badge>
                )}
              </div>
              <p className="mt-1 truncate text-[12px] text-muted">
                {user.email}
              </p>
              {user.createdAt ? (
                <p className="mt-1 text-[10.5px] text-muted/80">
                  Member since {formatDate(user.createdAt)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button href="/orders" variant="outline" fullWidth>
              View orders
            </Button>
            <Button href="/cart" variant="outline" fullWidth>
              View cart
            </Button>
            <Button
              href="/wishlist"
              variant="outline"
              fullWidth
              className="sm:col-span-2"
            >
              View wishlist
            </Button>
            {dashboardHref ? (
              <a
                href={dashboardHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-pri px-5 text-sm font-semibold text-white transition hover:bg-pri-deep focus-visible:ring-4 focus-visible:ring-pri/30 focus-visible:outline-none sm:col-span-2"
              >
                Go to {user.role === "admin" ? "admin" : "vendor"} dashboard
              </a>
            ) : null}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <Button
              variant="ghost"
              size="sm"
              loading={signingOut}
              onClick={() => void signOut()}
              icon={<Icon name="logout" className="size-3.5" />}
            >
              Sign out
            </Button>
          </div>
        </div>

        <div className="rounded-[22px] border border-line bg-white p-2">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-start gap-3 rounded-[16px] p-3.5 transition hover:bg-well focus-visible:bg-well focus-visible:outline-none"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pri/[0.07] text-pri">
                <Icon name={link.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-ink">
                  {link.label}
                </span>
                <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">
                  {link.description}
                </span>
              </span>
              <Icon name="chevron-right" className="mt-1 size-4 text-muted/60" />
            </Link>
          ))}
        </div>
      </div>
    </MarketplaceContainer>
  );
}
