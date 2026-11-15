import Image from "next/image";
import groceryImg from "@/assets/images/grocery.jpg";
import { Icon } from "@/components/icons";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import Button from "@/components/ui/Button";
import { authRegisterUrl } from "@/lib/urls";

const values = [
  {
    icon: "shield" as const,
    title: "Trust before scale",
    body: "Stores are reviewed before they appear. We would rather grow carefully than fill the marketplace with unverified listings.",
  },
  {
    icon: "tag" as const,
    title: "Clarity in every price",
    body: "Naira pricing, genuine discounts and availability come directly from each store's catalogue.",
  },
  {
    icon: "store" as const,
    title: "Local commerce matters",
    body: "Independent Nigerian businesses deserve a considered storefront and shoppers who can find them.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="pt-4 sm:pt-6 lg:pt-8">
        <MarketplaceContainer>
          <div className="relative overflow-hidden rounded-[24px] bg-pri lg:rounded-[28px]">
            <div className="grid items-center gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 sm:p-8 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold tracking-[0.16em] text-lime uppercase">
                  <Icon name="sparkles" className="size-3" />
                  About Routiq
                </span>
                <h1 className="mt-4 max-w-[560px] text-[32px] leading-[1.06] font-semibold tracking-[-0.04em] text-white sm:text-[42px] lg:text-[48px]">
                  A marketplace built for how Nigeria shops.
                </h1>
                <p className="mt-4 max-w-[480px] text-[12.5px] leading-relaxed text-white/65 sm:text-[13.5px]">
                  Routiq brings independent stores and shoppers together in one
                  calm, trustworthy marketplace. Browse real catalogues, compare
                  prices in Naira and discover businesses worth returning to.
                </p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    href="/products"
                    variant="lime"
                    size="lg"
                    className="w-full sm:w-auto"
                    icon={<Icon name="shopping-bag" className="size-4" />}
                  >
                    Explore the marketplace
                  </Button>
                  <a
                    href={authRegisterUrl("vendor")}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-lime/30 focus-visible:outline-none sm:w-auto"
                  >
                    Become a vendor
                    <Icon name="arrow-right" className="size-4" />
                  </a>
                </div>
              </div>

              <div className="relative min-h-[230px] overflow-hidden sm:min-h-[280px] lg:min-h-[430px]">
                <Image
                  src={groceryImg}
                  alt="Everyday products from local Routiq stores"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-pri/80 via-pri/10 to-transparent lg:bg-gradient-to-r lg:from-pri lg:via-pri/20 lg:to-transparent"
                />
              </div>
            </div>
          </div>
        </MarketplaceContainer>
      </section>

      <MarketplaceContainer className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="text-[9.5px] font-semibold tracking-[0.18em] text-pri/55 uppercase">
              What we care about
            </p>
            <h2 className="mt-2 max-w-[360px] text-[26px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:text-[32px]">
              Good commerce starts with good details.
            </h2>
            <p className="mt-3 max-w-[340px] text-[12px] leading-relaxed text-muted">
              The marketplace is designed to make the important things easy to
              see: who is selling, what is available, what it costs and where it
              is coming from.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-[18px] border border-line bg-white p-5"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-pri/[0.07] text-pri">
                  <Icon name={value.icon} className="size-[18px]" />
                </span>
                <h3 className="mt-3 text-[13px] font-semibold tracking-tight text-ink">
                  {value.title}
                </h3>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                  {value.body}
                </p>
              </div>
            ))}

            <div className="rounded-[18px] bg-pri-deep p-5 text-white sm:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.16em] text-lime uppercase">
                    The Routiq promise
                  </p>
                  <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-white/75">
                    A marketplace where approved stores can be found, products
                    are presented honestly and every price is in Naira.
                  </p>
                </div>
                <Button href="/help" variant="lime" size="sm">
                  Read the FAQs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MarketplaceContainer>
    </>
  );
}
