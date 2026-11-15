import Image from "next/image";
import groceryImg from "@/assets/images/grocery.jpg";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import { marketplaceConfig } from "@/config/marketplace";

export default function PromoBanner() {
  const { promo } = marketplaceConfig;

  return (
    <section>
      <div className="relative overflow-hidden rounded-[24px] bg-pri-deep lg:rounded-[28px]">
        <div className="grid items-stretch lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 p-6 sm:p-8 lg:p-10 xl:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold tracking-[0.16em] text-lime uppercase">
              <Icon name="sparkles" className="size-3" />
              {promo.eyebrow}
            </span>

            <h2 className="mt-4 max-w-[470px] text-[27px] leading-[1.08] font-semibold tracking-[-0.04em] text-white sm:text-[34px] lg:text-[38px]">
              {promo.title}
            </h2>

            <p className="mt-3 max-w-[440px] text-[12px] leading-relaxed text-white/60 sm:text-[13px]">
              {promo.description}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href={promo.cta.href}
                variant="lime"
                size="lg"
                icon={<Icon name="arrow-right" className="size-4" />}
                className="w-full sm:w-auto"
              >
                {promo.cta.label}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-medium text-white/45">
                <Icon name="check-circle" className="size-3.5 text-lime" />
                No account needed to browse
              </span>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden sm:min-h-[260px] lg:min-h-full">
            <Image
              src={groceryImg}
              alt="A marketplace assortment of everyday products"
              fill
              sizes="(max-width: 1024px) 100vw, 440px"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-pri-deep/75 via-pri-deep/10 to-transparent lg:bg-gradient-to-r lg:from-pri-deep lg:via-pri-deep/20 lg:to-transparent"
            />

            <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-pri-deep/70 p-3 backdrop-blur-md sm:right-5 sm:bottom-5 sm:left-5 lg:left-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime text-pri-deep">
                <Icon name="shield" className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold text-white">
                  Storefronts are reviewed
                </p>
                <p className="mt-0.5 text-[9px] text-white/55">
                  Approved vendors, clear Naira pricing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
