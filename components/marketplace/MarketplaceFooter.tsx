import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, Logo } from "@/components/icons";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { marketplaceConfig } from "@/config/marketplace";
import { authLoginUrl, authRegisterUrl } from "@/lib/urls";

const shopLinks = [
  { label: "All products", href: "/products" },
  { label: "All stores", href: "/stores" },
  { label: "Categories", href: "/categories" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
];

const companyLinks = [
  { label: "About Routiq", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Delivery information", href: "/delivery" },
  { label: "Become a vendor", href: authRegisterUrl("vendor") },
];

const supportLinks = [
  { label: "Help and FAQs", href: "/help" },
  { label: "Track order", href: "/track-order" },
  { label: "Your account", href: "/account" },
  { label: "Sign in", href: authLoginUrl() },
];

const legalLinks = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
];

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");

  if (external) {
    return (
      <a
        href={href}
        className="w-fit rounded text-[11.5px] text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="w-fit rounded text-[11.5px] text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

export default function MarketplaceFooter() {
  return (
    <footer className="mt-14 bg-pri-deep text-white sm:mt-20">
      <MarketplaceContainer className="py-10 sm:py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1.85fr] lg:gap-16">
          <div>
            <Link
              href="/"
              aria-label="Routiq marketplace home"
              className="inline-flex items-center gap-2.5 rounded-xl focus-visible:ring-4 focus-visible:ring-lime/30 focus-visible:outline-none"
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-lime text-pri-deep">
                <Logo className="size-6" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[20px] font-semibold tracking-[-0.04em]">
                  Routiq
                </span>
                <span className="mt-1 text-[8px] font-semibold tracking-[0.18em] text-white/45 uppercase">
                  Marketplace
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-[330px] text-[12px] leading-relaxed text-white/55">
              A Nigerian marketplace connecting shoppers with approved,
              independent stores. Discover products, compare prices and keep
              your favourites in one place.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9.5px] font-semibold text-white/65">
                <Icon name="shield" className="size-3.5 text-lime" />
                Verified vendors
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9.5px] font-semibold text-white/65">
                <Icon name="truck" className="size-3.5 text-lime" />
                Delivery coordination
              </span>
            </div>

            {marketplaceConfig.socialLinks.length > 0 ? (
              <div className="mt-6 flex items-center gap-2">
                {marketplaceConfig.socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/70 transition hover:border-lime/40 hover:text-lime focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <p className="text-[9.5px] font-semibold tracking-[0.18em] text-white/35 uppercase">
                Shop
              </p>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {shopLinks.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9.5px] font-semibold tracking-[0.18em] text-white/35 uppercase">
                Company
              </p>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {companyLinks.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9.5px] font-semibold tracking-[0.18em] text-white/35 uppercase">
                Support
              </p>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {supportLinks.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9.5px] font-semibold tracking-[0.18em] text-white/35 uppercase">
                Legal
              </p>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {legalLinks.map((link) => (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] text-white/40 sm:flex-row sm:items-center sm:justify-between lg:mt-14">
          <p>
            &copy; {marketplaceConfig.copyrightYear} Routiq. All rights reserved.
          </p>
          <a
            href={`mailto:${marketplaceConfig.supportEmail}`}
            className="w-fit rounded transition hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:outline-none"
          >
            {marketplaceConfig.supportEmail}
          </a>
        </div>
      </MarketplaceContainer>
    </footer>
  );
}
