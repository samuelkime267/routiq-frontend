import type { Metadata } from "next";
import "@/styles/globals.css";
import { fonts } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: "Routiq Admin",
    template: "%s | Routiq Admin",
  },
  description: "Secure administration console for the Routiq marketplace.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="min-h-full bg-soft/60">
        {children}
      </body>
    </html>
  );
}
