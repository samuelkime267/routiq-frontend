import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { marketplaceConfig } from "@/config/marketplace";
import { vendorRegisterUrl } from "@/lib/urls";

const faqs = [
  {
    question: "How do I place an order?",
    answer:
      "You can browse the full catalogue, compare products and build a cart right away. Online checkout is still being rolled out, so to complete an order contact support with the items in your cart and your delivery location.",
  },
  {
    question: "How do I know a store is approved?",
    answer:
      "Every product and store shown in the public marketplace has passed Routiq's review process and is currently active. Products from unapproved, suspended or unpublished stores are not displayed.",
  },
  {
    question: "How is delivery handled?",
    answer:
      "Delivery is coordinated with the store once your order is confirmed. The final fee and timing depend on the store, your location and the delivery partner. Support can confirm the details for your order.",
  },
  {
    question: "How do I track an order?",
    answer:
      "Send your order or reference number to the support team and they will check the latest status with the store. Customer self-service tracking is being rolled out.",
  },
  {
    question: "How do I save a product for later?",
    answer:
      "Tap the heart on any product card or product page. Saved products appear in your wishlist and stay on this device between visits.",
  },
  {
    question: "Where is my cart stored?",
    answer:
      "Your cart and wishlist are saved in this browser on your device. They are not yet synced to a customer account, so they will not appear on another device.",
  },
  {
    question: "How do I become a vendor?",
    answer:
      "Create a vendor account, complete the store onboarding steps and submit your business details for review. Approved, active stores appear in the marketplace.",
  },
  {
    question: "How do I contact support?",
    answer: `Email ${marketplaceConfig.supportEmail} or use the contact page. Include your order reference where relevant so the team can help faster.`,
  },
];

export default function HelpPage() {
  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Help" },
        ]}
        eyebrow="Support"
        title="Help and FAQs"
        description="Straight answers about shopping, approved stores, delivery and your Routiq account."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_0.75fr] lg:items-start">
        <div className="rounded-[22px] border border-line bg-white px-5 sm:px-7">
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
              <p className="mt-2.5 max-w-[680px] text-[11.5px] leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="space-y-4 lg:sticky lg:top-[100px]">
          <div className="rounded-[22px] bg-pri p-5 text-white sm:p-6">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-lime">
              <Icon name="message-square" className="size-[18px]" />
            </span>
            <h2 className="mt-3 text-[17px] font-semibold tracking-tight">
              Still need help?
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/65">
              Send the team a message and include your order reference if you
              have one.
            </p>
            <Button
              href="/contact"
              variant="lime"
              size="sm"
              className="mt-4"
              icon={<Icon name="mail" className="size-3.5" />}
            >
              Contact support
            </Button>
          </div>

          <div className="rounded-[22px] border border-line bg-white p-2">
            {[
              {
                label: "Track an order",
                href: "/track-order",
                icon: "truck" as const,
              },
              {
                label: "Delivery information",
                href: "/delivery",
                icon: "package" as const,
              },
              {
                label: "Your account",
                href: "/account",
                icon: "user" as const,
              },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-[12px] font-semibold text-ink transition hover:bg-well focus-visible:bg-well focus-visible:outline-none"
              >
                <Icon name={link.icon} className="size-4 text-pri" />
                {link.label}
                <Icon
                  name="chevron-right"
                  className="ml-auto size-4 text-muted/60"
                />
              </Link>
            ))}
          </div>

          <div className="rounded-[22px] border border-line bg-soft/60 p-5">
            <p className="text-[9px] font-semibold tracking-[0.16em] text-pri/60 uppercase">
              For businesses
            </p>
            <p className="mt-2 text-[12px] font-semibold text-ink">
              Ready to sell on Routiq?
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Apply as a vendor and complete store verification.
            </p>
            <a
              href={vendorRegisterUrl()}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-pri hover:underline"
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
