import type { Metadata } from "next";
import "@/styles/globals.css";
import { fonts } from "@/config/fonts";
import { appMetadata } from "@/config/metadata";
import VendorHeader from "@/components/vendor/VendorHeader";
import SessionHandoff from "@/components/SessionHandoff";

export const metadata: Metadata = appMetadata;

export default function RootLayout({ children }: LayoutProps<"/vendor">) {
  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="min-h-full bg-soft/60">
        <SessionHandoff />
        <VendorHeader />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
