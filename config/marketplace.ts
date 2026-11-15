/**
 * Marketplace presentation copy.
 *
 * These values are intentionally configuration rather than hard-coded markup so
 * campaign messaging can change without touching the homepage composition.
 */
export const marketplaceConfig = {
  hero: {
    eyebrow: "Nigeria's marketplace",
    title: "Everything you need, all in one place.",
    description:
      "Discover products from trusted stores, shop with ease and get your orders delivered to your doorstep.",
    primaryCta: { label: "Shop now", href: "/products" },
    secondaryCta: { label: "Explore categories", href: "/categories" },
  },
  promo: {
    eyebrow: "A marketplace built around you",
    title: "One place to discover trusted stores.",
    description:
      "Compare products across verified vendors, pay in Naira and keep your favourites close. New stores and fresh finds are added regularly.",
    cta: { label: "Explore the marketplace", href: "/products" },
  },
  delivery: {
    label: "Delivery across Nigeria",
    note: "Delivery is coordinated with the store once your order is confirmed.",
  },
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@routiq.ng",
  // Computed at module load (build time) so prerendered pages stay stable.
  copyrightYear: new Date().getFullYear(),
  socialLinks: [
    {
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    },
    {
      label: "X",
      href: process.env.NEXT_PUBLIC_X_URL || "",
    },
    {
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    },
  ].filter((link) => Boolean(link.href)),
} as const;

/**
 * Nigerian states accepted by the address form. Kept in sync with the backend
 * `NIGERIAN_STATES` list; the API rejects anything outside it regardless.
 */
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;
