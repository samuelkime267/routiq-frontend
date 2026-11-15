import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { marketplaceConfig } from "@/config/marketplace";

const steps = [
  {
    icon: "store" as const,
    title: "You choose the store",
    body: "Find a product from an approved, active store and add it to your cart. Every listing shown is published by a verified vendor.",
  },
  {
    icon: "message-square" as const,
    title: "We confirm the order",
    body: "Online checkout is being rolled out. Contact support with your cart and delivery location and the team confirms the order with the store.",
  },
  {
    icon: "truck" as const,
    title: "The store dispatches",
    body: "The store prepares your items and hands them to the delivery partner. Timing depends on the store's preparation and your distance from it.",
  },
  {
    icon: "package" as const,
    title: "You receive your items",
    body: "Check your items when they arrive. If something is wrong, contact support with your reference and photos where possible.",
  },
];

const faqs = [
  {
    question: "How much does delivery cost?",
    answer:
      "Delivery fees are set per order and depend on the store, the size of your items and your location. Support confirms the fee before the order is finalised; it is never added silently.",
  },
  {
    question: "How long will my order take?",
    answer:
      "Most local deliveries are arranged within the same or next working day once the store confirms the order. Inter-state orders take longer and are coordinated case by case.",
  },
  {
    question: "Can I order from more than one store at a time?",
    answer:
      "Each store fulfils its own items, so orders are confirmed per store. Support will tell you if your cart spans several stores and how each part will be delivered.",
  },
  {
    question: "What if I am not available to receive the order?",
    answer:
      "Tell support as early as possible. The delivery partner may reattempt on another day, and repeated failed deliveries can attract an additional fee set by the store.",
  },
  {
    question: "Do you deliver nationwide?",
    answer:
      "Stores set their own delivery coverage. Local deliveries are the most reliable today, and inter-state delivery is arranged case by case through the store's partner.",
  },
  {
    question: "How do I track a delivery?",
    answer:
      "Send your order or reference number to support and the team will check the latest status with the store and delivery partner. Self-service tracking is being rolled out.",
  },
];

export default function DeliveryPage() {
  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Delivery information" },
        ]}
        eyebrow="Getting your order"
        title="Delivery information"
        description="How delivery works on Routiq, what affects the cost and timing, and where to get an update."
        actions={
          <Button href="/track-order" variant="outline" size="sm">
            Track an order
          </Button>
        }
      />

      <div className="mt-6 rounded-[24px] bg-pri p-5 text-white sm:p-7 lg:p-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              label: "Coverage",
              value: "Local and inter-state",
              note: "Arranged per store",
            },
            {
              label: "Confirmation",
              value: "Before dispatch",
              note: "Fee and timing agreed",
            },
            {
              label: "Support",
              value: "By email",
              note: marketplaceConfig.supportEmail,
            },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[9px] font-semibold tracking-[0.16em] text-lime uppercase">
                {stat.label}
              </p>
              <p className="mt-1.5 text-[16px] font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10.5px] break-words text-white/55">
                {stat.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.8fr] lg:items-start">
        <div className="rounded-[22px] border border-line bg-white p-5 sm:p-7">
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">
            From cart to doorstep
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Each store fulfils its own items, so delivery is confirmed with that
            store rather than promised in advance.
          </p>

          <ol className="mt-5 space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pri/[0.07] text-pri">
                  <Icon name={step.icon} className="size-4" />
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">
                    <span className="mr-1.5 text-muted/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
            <h2 className="text-[14px] font-semibold tracking-tight text-ink">
              Before you order
            </h2>
            <ul className="mt-3 space-y-2.5">
              {[
                "Check the store's location and delivery notes on its page.",
                "Confirm your address and a reachable phone number with support.",
                "Ask about the delivery fee before the order is finalised.",
                "Keep your order reference for tracking and returns.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-[11.5px] leading-relaxed text-muted"
                >
                  <Icon
                    name="check-circle"
                    className="mt-0.5 size-3.5 shrink-0 text-success"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-line bg-soft/60 p-5 sm:p-6">
            <h2 className="text-[14px] font-semibold tracking-tight text-ink">
              Need an update?
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Send your reference to support and the team will check with the
              store and delivery partner.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button href="/track-order" size="sm">
                Track an order
              </Button>
              <Button href="/help" variant="outline" size="sm">
                Read the FAQs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-line bg-white px-5 sm:px-7">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group border-b border-line py-4 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <span className="text-[12.5px] font-semibold text-ink">
                {faq.question}
              </span>
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45 group-open:border-pri/30 group-open:text-pri">
                <Icon name="plus" className="size-3.5" />
              </span>
            </summary>
            <p className="mt-2.5 max-w-[720px] text-[11.5px] leading-relaxed text-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-5 text-[10.5px] leading-relaxed text-muted">
        Still unsure?{" "}
        <Link
          href="/contact"
          className="font-semibold text-pri underline underline-offset-2"
        >
          Contact support
        </Link>{" "}
        and include your order reference.
      </p>
    </MarketplaceContainer>
  );
}
