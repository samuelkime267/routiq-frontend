import type { Metadata } from "next";
import { fonts } from "@/config/fonts";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceProvider from "@/components/marketplace/MarketplaceProvider";
import ToastProvider from "@/components/ui/Toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Routiq Marketplace | Shop trusted stores across Nigeria",
    template: "%s | Routiq Marketplace",
  },
  description:
    "Discover products from approved Nigerian stores. Compare prices in Naira, save favourites and shop a marketplace built around trusted vendors.",
  applicationName: "Routiq Marketplace",
  keywords: [
    "Routiq",
    "Nigeria marketplace",
    "online shopping Nigeria",
    "trusted vendors",
    "Nigerian stores",
  ],
  category: "shopping",
};

export default function RootLayout({ children }: LayoutProps<"/marketplace">) {
  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-white text-ink">
        <ToastProvider>
          <MarketplaceProvider>
            <a
              href="#main-content"
              className="sr-only z-[100] rounded-full bg-pri px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              Skip to content
            </a>
            <MarketplaceHeader />
            <main id="main-content" className="min-h-[55vh] flex-1">
              {children}
            </main>
            <MarketplaceFooter />
          </MarketplaceProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
