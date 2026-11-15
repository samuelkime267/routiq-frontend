import type { ReactNode } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { Icon } from "@/components/icons";
import PageHeader from "@/components/ui/PageHeader";
import { marketplaceConfig } from "@/config/marketplace";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  after?: ReactNode;
}

interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}

export default function LegalDocument({
  eyebrow,
  title,
  description,
  updated,
  sections,
}: LegalDocumentProps) {
  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: title },
        ]}
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={
          <p className="text-[10.5px] text-muted">Last updated {updated}</p>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
        <nav
          aria-label={`${title} contents`}
          className="rounded-[22px] border border-line bg-white p-2 lg:sticky lg:top-[100px]"
        >
          <p className="px-3.5 pt-2 pb-1.5 text-[9px] font-semibold tracking-[0.16em] text-pri/60 uppercase">
            On this page
          </p>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-[11.5px] font-medium text-muted transition hover:bg-well hover:text-ink focus-visible:bg-well focus-visible:outline-none"
            >
              {section.title}
            </a>
          ))}
          <div className="mt-1 border-t border-line px-3.5 py-3">
            <p className="text-[10.5px] leading-relaxed text-muted">
              Questions about this document? Email{" "}
              <a
                href={`mailto:${marketplaceConfig.supportEmail}`}
                className="font-semibold text-pri underline underline-offset-2"
              >
                {marketplaceConfig.supportEmail}
              </a>
              .
            </p>
          </div>
        </nav>

        <article className="rounded-[22px] border border-line bg-white p-5 sm:p-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28"
              >
                <h2 className="text-[15px] font-semibold tracking-tight text-ink sm:text-[16px]">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-2.5 text-[12px] leading-relaxed text-muted"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets?.length ? (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[12px] leading-relaxed text-muted"
                      >
                        <Icon
                          name="check-circle"
                          className="mt-[3px] size-3.5 shrink-0 text-pri/50"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.after}
              </section>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10.5px] text-muted">
              Related reading:{" "}
              <Link
                href="/delivery"
                className="font-semibold text-pri underline underline-offset-2"
              >
                Delivery information
              </Link>
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-pri transition hover:gap-2"
            >
              Contact support
              <Icon name="arrow-right" className="size-3.5" />
            </Link>
          </div>
        </article>
      </div>
    </MarketplaceContainer>
  );
}
