import LegalDocument, {
  type LegalSection,
} from "@/components/marketplace/LegalDocument";

const sections: LegalSection[] = [
  {
    id: "about-these-terms",
    title: "About these terms",
    paragraphs: [
      "These terms govern your use of Routiq Marketplace. By browsing, creating an account or contacting support to place an order, you agree to them. If you do not agree, please do not use the marketplace.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and access",
    bullets: [
      "You must be at least 18 years old to create an account or place an order.",
      "Give accurate details and keep your password private. You are responsible for activity under your account.",
      "We may suspend or close an account that is used fraudulently, abuses other users or breaks these terms.",
      "You can stop using the marketplace at any time and ask us to close your account.",
    ],
  },
  {
    id: "marketplace-role",
    title: "Routiq's role",
    paragraphs: [
      "Routiq is a marketplace that connects shoppers with independent stores. Each store is responsible for the products it lists, the accuracy of its catalogue, its prices and its own fulfilment. Routiq reviews stores before they appear publicly but does not manufacture or own the products.",
      "Where a dispute arises about a product or delivery, Routiq support can help mediate between you and the store.",
    ],
  },
  {
    id: "orders-and-prices",
    title: "Orders and prices",
    bullets: [
      "All prices are shown in Nigerian Naira (₦) and come from the store's catalogue.",
      "A product listing is an invitation to order, not a confirmed sale until the store accepts it.",
      "Online checkout is still being rolled out. Orders are confirmed with support, and the delivery fee and timing are agreed before dispatch.",
      "If a price or availability changes before confirmation, support will tell you and you may choose not to proceed.",
      "Discounts and crossed-out prices are genuine reductions against the store's own reference price where one is shown.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    paragraphs: [
      "Delivery is arranged with the fulfilling store and its delivery partner. Timing and fees depend on the store, your location and the size of the items. More detail is available on the delivery information page.",
      "Please provide a reachable phone number and an accurate address. Repeated failed deliveries may attract an additional fee set by the store.",
    ],
  },
  {
    id: "returns-and-refunds",
    title: "Returns and refunds",
    paragraphs: [
      "Stores set their own return windows for their products. If an item arrives damaged, incorrect or materially different from its listing, contact support with your order reference and, where possible, photos. We will work with the store to arrange a replacement or refund.",
      "Perishable goods and personal-care items may not be returnable once opened, except where they were faulty on arrival.",
    ],
  },
  {
    id: "vendor-obligations",
    title: "Vendor obligations",
    bullets: [
      "Vendors must complete Routiq's business verification and keep their store information current.",
      "Only products the vendor is legally entitled to sell may be listed, with accurate descriptions, prices and stock.",
      "Approved stores must honour confirmed orders and respond to support requests within a reasonable time.",
      "Routiq may suspend or remove a store that misrepresents its products, repeatedly fails orders or breaches these terms.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    bullets: [
      "Do not use the marketplace for unlawful, fraudulent or misleading activity.",
      "Do not attempt to access another user's account, disrupt the service or scrape the catalogue at scale.",
      "Do not post or send content that infringes someone else's rights or contains malware.",
      "Do not impersonate a store, a Routiq employee or another user.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    paragraphs: [
      "The Routiq name, design and marketplace content are protected. Vendors keep ownership of their own product images, descriptions and brand assets, and grant Routiq permission to display them on the marketplace.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    paragraphs: [
      "We work to keep the marketplace accurate and available, but it is provided on an as-is basis. To the extent permitted by law, Routiq is not liable for indirect losses arising from a store's products or a delivery partner's performance. Nothing in these terms limits rights you have under Nigerian consumer law.",
    ],
  },
  {
    id: "changes-and-law",
    title: "Changes and governing law",
    paragraphs: [
      "We may update these terms as the marketplace changes. The date at the top of this page shows the latest revision; continued use after a change means you accept the updated terms.",
      "These terms are governed by the laws of the Federal Republic of Nigeria, and disputes are subject to the jurisdiction of Nigerian courts.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Using Routiq"
      title="Terms of use"
      description="The rules that apply when you shop, sell or browse on Routiq Marketplace."
      updated="13 November 2026"
      sections={sections}
    />
  );
}
