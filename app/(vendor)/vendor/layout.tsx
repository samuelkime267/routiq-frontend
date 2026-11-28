import type { Metadata } from "next";
import "@/styles/globals.css";
import { fonts } from "@/config/fonts";
import ReduxProvider from "@/store/ReduxProvider";

export const metadata: Metadata = {
  title: {
    default: "Routiq Vendor",
    template: "%s | Routiq Vendor",
  },
  description: "Sell and manage your store on the Routiq marketplace.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/vendor">) {
  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="min-h-full bg-soft/60">
        <ReduxProvider scope="app">{children}</ReduxProvider>
      </body>
    </html>
  );
}
