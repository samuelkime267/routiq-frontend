import type { Metadata } from "next";

const SITE_NAME = "Routiq";
const SITE_URL = "https://your-domain.com";

export const appMetadata: Metadata = {
  // Basic SEO
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Routiq | Logistics and Delivery Management",
    template: "%s | Routiq",
  },

  description:
    "Manage deliveries, coordinate logistics, and streamline order fulfillment with Routiq.",

  applicationName: SITE_NAME,

  authors: [{ name: "Routiq" }],
  creator: "Routiq",
  publisher: "Routiq",

  keywords: [
    "Routiq",
    "logistics",
    "delivery management",
    "shipment tracking",
    "order fulfillment",
    "delivery services",
  ],

  category: "technology",

  // Canonical URL and language alternatives
  alternates: {
    canonical: "/",
    languages: {
      "en-NG": "/",
    },
  },

  // Search engine indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph: WhatsApp, Facebook, LinkedIn, etc.
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: SITE_NAME,
    title: "Routiq | Logistics and Delivery Management",
    description:
      "Manage deliveries, coordinate logistics, and streamline order fulfillment with Routiq.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Routiq — Logistics and Delivery Management",
      },
    ],
  },

  // Twitter / X previews
  twitter: {
    card: "summary_large_image",
    title: "Routiq | Logistics and Delivery Management",
    description:
      "Manage deliveries, coordinate logistics, and streamline order fulfillment with Routiq.",
    images: ["/og-image.png"],
    // creator: "@yourhandle",
    // site: "@yourhandle",
  },

  // Browser and device icons
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/logo.png", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Optional verification: uncomment when configured
  verification: {
    // google: "your-google-site-verification-code",
    // yandex: "your-yandex-verification-code",
    // other: {
    //   "msvalidate.01": "your-bing-verification-code",
    // },
  },

  // Optional: configure if you have a real manifest
  // manifest: "/manifest.webmanifest",
};
