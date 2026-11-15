import type { ReactNode } from "react";

/**
 * Frame for the per-subdomain auth pages.
 *
 * The shared auth forms are rendered on the marketplace and vendor hosts, so
 * this wrapper keeps them in the same cream/teal presentation language as the
 * rest of the app without dragging in the full-page auth artwork.
 */
export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="bg-cream px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-[460px] rounded-[24px] border border-line bg-white p-5 shadow-[0_18px_60px_rgba(6,76,80,0.07)] sm:p-8">
        {children}
      </div>
    </section>
  );
}
