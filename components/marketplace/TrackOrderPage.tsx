"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import { marketplaceConfig } from "@/config/marketplace";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mailto, setMailto] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!orderNumber.trim()) {
      setError("Enter the order or reference number from your confirmation.");
      return;
    }

    const subject = encodeURIComponent(
      `Track order ${orderNumber.trim()}`,
    );
    const body = encodeURIComponent(
      [
        "Hello Routiq support,",
        "",
        "I would like an update on my order.",
        `Order or reference: ${orderNumber.trim()}`,
        email.trim() ? `Account email: ${email.trim()}` : "",
        "",
        "Thank you.",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const href = `mailto:${marketplaceConfig.supportEmail}?subject=${subject}&body=${body}`;
    setMailto(href);
    window.location.href = href;
  };

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Track order" },
        ]}
        eyebrow="Delivery support"
        title="Track an order"
        description="Send us the order reference from your confirmation and our support team will check the latest delivery status with the store."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="rounded-[22px] border border-line bg-white p-5 sm:p-7">
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">
            What to have ready
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Customer self-service tracking is being rolled out. Until then, our
            support team can check a delivery for you.
          </p>

          <ol className="mt-5 space-y-4">
            {[
              {
                title: "Find your reference",
                body: "Use the order or reference number from the confirmation you received.",
              },
              {
                title: "Send it to support",
                body: "The contact form opens your email app with the details already filled in.",
              },
              {
                title: "We check with the store",
                body: "Support coordinates with the store and delivery partner, then replies with the latest status.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pri text-[10px] font-bold text-lime">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-ink">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5">
            <Alert tone="info" title="Need a faster answer?">
              Read the{" "}
              <Link
                href="/help"
                className="font-semibold text-pri underline underline-offset-2"
              >
                help and FAQs
              </Link>{" "}
              for delivery, store and account questions.
            </Alert>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[22px] border border-line bg-white p-5 sm:p-7"
        >
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">
            Request a delivery update
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            We will use these details only to find and respond to your order.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              label="Order or reference number"
              htmlFor="track-order-number"
              hint="For example, the reference in your order confirmation."
            >
              <Input
                id="track-order-number"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="RQ-12345"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Email used for the order"
              htmlFor="track-order-email"
              optional
            >
              <Input
                id="track-order-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            {error ? (
              <p role="alert" className="text-[11.5px] text-danger">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              fullWidth
              size="lg"
              icon={<Icon name="mail" className="size-4" />}
            >
              Contact support
            </Button>
          </div>

          {mailto ? (
            <div className="mt-4">
              <Alert tone="success" title="Your email app should open">
                If it did not,{" "}
                <a
                  href={mailto}
                  className="font-semibold text-pri underline underline-offset-2"
                >
                  open the message again
                </a>{" "}
                or email{" "}
                <a
                  href={`mailto:${marketplaceConfig.supportEmail}`}
                  className="font-semibold text-pri underline underline-offset-2"
                >
                  {marketplaceConfig.supportEmail}
                </a>
                .
              </Alert>
            </div>
          ) : null}

          <div className="mt-5 border-t border-line pt-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-pri transition hover:gap-2"
            >
              Go to contact page
              <Icon name="arrow-right" className="size-3.5" />
            </Link>
          </div>
        </form>
      </div>
    </MarketplaceContainer>
  );
}
