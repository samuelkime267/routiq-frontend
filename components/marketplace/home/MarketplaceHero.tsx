import Image from "next/image";
import Link from "next/link";
import groceryImg from "@/assets/images/grocery.jpg";
import { Icon } from "@/components/icons";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import Button from "@/components/ui/Button";
import { marketplaceConfig } from "@/config/marketplace";

const trustItems = [
  { icon: "shield" as const, label: "Verified vendors" },
  { icon: "store" as const, label: "Many stores" },
  { icon: "truck" as const, label: "Delivery coordination" },
];

export default function MarketplaceHero() {
  const { hero } = marketplaceConfig;

  return (
    <section className="pt-4 sm:pt-6 lg:pt-8">
      <MarketplaceContainer>
        <div className="relative overflow-hidden rounded-[24px] bg-pri lg:rounded-[28px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full border border-white/[0.07]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -bottom-40 size-96 rounded-full bg-lime/10 blur-3xl"
          />

          <div className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:p-10 xl:p-12">
            <div className="max-w-[570px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9.5px] font-semibold tracking-[0.16em] text-lime uppercase">
                <Icon name="sparkles" className="size-3.5" />
                {hero.eyebrow}
              </span>

              <h1 className="mt-4 text-[32px] leading-[1.05] font-semibold tracking-[-0.04em] text-white sm:text-[42px] lg:text-[50px] xl:text-[54px]">
                Everything you need,{" "}
                <span className="text-lime">all in one place.</span>
              </h1>

              <p className="mt-4 max-w-[460px] text-[12.5px] leading-relaxed text-white/70 sm:text-[13.5px]">
                {hero.description}
              </p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <Button
                  href={hero.primaryCta.href}
                  variant="lime"
                  size="lg"
                  icon={<Icon name="shopping-bag" className="size-4" />}
                  className="w-full sm:w-auto"
                >
                  {hero.primaryCta.label}
                </Button>
                <Button
                  href={hero.secondaryCta.href}
                  variant="outline"
                  size="lg"
                  className="w-full border-white/20 bg-white/[0.06] text-white hover:border-white/35 hover:bg-white/10 sm:w-auto"
                  icon={<Icon name="grid" className="size-4" />}
                >
                  {hero.secondaryCta.label}
                </Button>
              </div>

              <div className="mt-7 grid max-w-[440px] grid-cols-3 gap-2 border-t border-white/10 pt-4">
                {trustItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <Icon
                      name={item.icon}
                      className="mt-0.5 size-3.5 shrink-0 text-lime"
                    />
                    <span className="text-[9.5px] leading-snug font-medium text-white/65">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto max-w-[480px]">
                <div className="rounded-[20px] border border-white/15 bg-white/[0.07] p-1.5">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-[15px]">
                    <Image
                      src={groceryImg}
                      alt="Fresh groceries from a local Routiq store"
                      fill
                      priority
                      sizes="(max-width: 1024px) 92vw, 470px"
                      className="object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-pri-deep/60 via-transparent to-transparent"
                    />

                    <div className="absolute right-3 bottom-3 left-3 flex items-center gap-2.5 rounded-2xl bg-white/95 p-2.5 shadow-[0_16px_36px_rgba(6,76,80,0.18)] backdrop-blur">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime text-pri-deep">
                        <Icon name="store" className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10.5px] font-semibold text-ink">
                          Local stores, one marketplace
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted">
                          Approved vendors · Naira pricing
                        </p>
                      </div>
                      <Link
                        href="/stores"
                        className="shrink-0 rounded-full bg-soft px-2.5 py-1 text-[9px] font-semibold text-pri transition hover:bg-well focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>

                <span className="absolute -top-3 -left-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-pri-deep/90 px-3 py-1.5 text-[9px] font-semibold text-white shadow-lg backdrop-blur sm:-left-3">
                  <span className="size-1.5 rounded-full bg-lime" />
                  Fresh finds daily
                </span>
              </div>
            </div>
          </div>
        </div>
      </MarketplaceContainer>
    </section>
  );
}
