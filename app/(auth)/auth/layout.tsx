import type { Metadata } from "next";
import "@/styles/globals.css";
import { fonts } from "@/config/fonts";
import { appMetadata } from "@/config/metadata";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = appMetadata;

export default function RootLayout({ children }: LayoutProps<"/auth">) {
  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="min-h-full bg-cream">
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}
