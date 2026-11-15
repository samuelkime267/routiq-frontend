"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import { marketplaceConfig } from "@/config/marketplace";

const topics = [
  "Order or delivery",
  "Product question",
  "Store or vendor application",
  "Account and sign-in",
  "Something else",
];

const supportHours = [
  { label: "Monday to Friday", value: "9:00am – 6:00pm" },
  { label: "Saturday", value: "10:00am – 3:00pm" },
  { label: "Sunday", value: "Closed" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mailto, setMailto] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please tell us your name so support knows who they are replying to.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address so we can reply.");
      return;
    }

    if (message.trim().length < 15) {
      setError("Add a little more detail to your message (at least 15 characters).");
      return;
    }

    const subject = encodeURIComponent(`[${topic}] Support request from ${name.trim()}`);
    const body = encodeURIComponent(
      [
        "Hello Routiq support,",
        "",
        message.trim(),
        "",
        "---",
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        reference.trim() ? `Order or reference: ${reference.trim()}` : "",
        `Topic: ${topic}`,
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
          { label: "Contact" },
        ]}
        eyebrow="Support"
        title="Contact Routiq"
        description="Questions about an order, a product or selling on the marketplace? Send the team a message and we will get back to you by email."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
        <form
          onSubmit={submit}
          className="rounded-[22px] border border-line bg-white p-5 sm:p-7"
        >
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">
            Send a message
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            The form opens your email app with the message already filled in, so
            nothing is sent until you press send there.
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" htmlFor="contact-name">
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                />
              </Field>

              <Field label="Email address" htmlFor="contact-email">
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="What is this about?" htmlFor="contact-topic">
                <Select
                  id="contact-topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                >
                  {topics.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Order or reference"
                htmlFor="contact-reference"
                optional
              >
                <Input
                  id="contact-reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="RQ-12345"
                  autoComplete="off"
                />
              </Field>
            </div>

            <Field
              label="Message"
              htmlFor="contact-message"
              hint="Include the product, store or order details that will help us help you."
            >
              <Textarea
                id="contact-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="How can we help?"
                rows={6}
              />
            </Field>

            {error ? (
              <Alert tone="error" title="Check the form">
                {error}
              </Alert>
            ) : null}

            <Button
              type="submit"
              fullWidth
              size="lg"
              icon={<Icon name="mail" className="size-4" />}
            >
              Open email draft
            </Button>

            {mailto ? (
              <Alert tone="success" title="Your email app should open">
                If it did not,{" "}
                <a
                  href={mailto}
                  className="font-semibold text-pri underline underline-offset-2"
                >
                  open the draft again
                </a>{" "}
                or write to{" "}
                <a
                  href={`mailto:${marketplaceConfig.supportEmail}`}
                  className="font-semibold text-pri underline underline-offset-2"
                >
                  {marketplaceConfig.supportEmail}
                </a>
                .
              </Alert>
            ) : null}
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-[22px] bg-pri p-5 text-white sm:p-6">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-lime">
              <Icon name="mail" className="size-[18px]" />
            </span>
            <h2 className="mt-3 text-[17px] font-semibold tracking-tight">
              Email support
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/65">
              The fastest way to reach us. Include your order reference where
              relevant and we will reply by email.
            </p>
            <a
              href={`mailto:${marketplaceConfig.supportEmail}`}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-lime px-4 text-[12px] font-semibold text-pri-deep transition hover:brightness-95 focus-visible:ring-4 focus-visible:ring-lime/40 focus-visible:outline-none"
            >
              {marketplaceConfig.supportEmail}
            </a>
          </div>

          <div className="rounded-[22px] border border-line bg-white p-5 sm:p-6">
            <h2 className="text-[14px] font-semibold tracking-tight text-ink">
              Support hours
            </h2>
            <dl className="mt-3 space-y-2 text-[11.5px]">
              {supportHours.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4"
                >
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted">
              Times are West Africa Time (WAT). Messages received outside these
              hours are answered on the next working day.
            </p>
          </div>

          <div className="rounded-[22px] border border-line bg-white p-2">
            {[
              { label: "Track an order", href: "/track-order", icon: "truck" as const },
              { label: "Help and FAQs", href: "/help", icon: "help-circle" as const },
              { label: "Delivery information", href: "/delivery", icon: "package" as const },
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
        </div>
      </div>
    </MarketplaceContainer>
  );
}
