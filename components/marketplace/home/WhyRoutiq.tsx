import { Icon, type IconName } from "@/components/icons";
import Button from "@/components/ui/Button";

const features: Array<{
  icon: IconName;
  title: string;
  description: string;
}> = [
  {
    icon: "store",
    title: "Many stores, one cart",
    description:
      "Browse approved vendors and keep products from different stores together in one saved cart.",
  },
  {
    icon: "shield",
    title: "Verified storefronts",
    description:
      "Store applications are reviewed before they appear, so you shop with more confidence.",
  },
  {
    icon: "tag",
    title: "Clear Naira pricing",
    description:
      "Prices, genuine discounts and availability come directly from each store's catalogue.",
  },
  {
    icon: "heart",
    title: "Saved for later",
    description:
      "Keep a wishlist and a cart that stay on your device between visits, ready when you are.",
  },
];

export default function WhyRoutiq() {
  return (
    <section>
      <div className="rounded-[24px] border border-line bg-soft/60 p-5 sm:p-7 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.55fr] lg:gap-12">
          <div>
            <p className="text-[9.5px] font-semibold tracking-[0.18em] text-pri/55 uppercase">
              Why Routiq
            </p>
            <h2 className="mt-2 max-w-[320px] text-[24px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:text-[30px]">
              A calmer way to shop online.
            </h2>
            <p className="mt-3 max-w-[330px] text-[12px] leading-relaxed text-muted">
              Routiq brings independent Nigerian stores into one considered
              shopping experience, with the details that help you decide.
            </p>
            <Button
              href="/about"
              variant="outline"
              size="sm"
              className="mt-5"
              icon={<Icon name="arrow-up-right" className="size-3.5" />}
            >
              More about Routiq
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[16px] border border-line bg-white p-4 transition hover:border-pri/20 sm:p-5"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-pri/[0.07] text-pri">
                  <Icon name={feature.icon} className="size-4" />
                </span>
                <h3 className="mt-3 text-[12.5px] font-semibold tracking-tight text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
