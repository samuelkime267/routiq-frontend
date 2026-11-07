import type { ReactNode } from "react";
import Image from "next/image";
import groceryImg from "@/assets/images/grocery.jpg";
import { Icon, Logo } from "@/components/icons";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1180px] overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_24px_80px_rgba(6,76,80,0.08)] lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.02fr_1fr] lg:rounded-[28px]">
        <aside className="relative hidden flex-col overflow-hidden bg-pri p-9 text-white lg:flex xl:p-12">
          <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute top-24 -right-16 size-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-lime/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-lime text-pri-deep">
              <Logo className="size-7" />
            </span>
            <div>
              <p className="text-xl font-semibold tracking-tight">Routiq</p>
              <p className="text-[11px] text-white/60">Marketplace & delivery</p>
            </div>
          </div>

          <div className="relative mt-auto pt-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-lime">
              <Icon name="sparkles" className="size-3.5" />
              Built for Nigerian commerce
            </span>

            <h1 className="mt-5 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em]">
              Your store,
              <br />
              your customers,
              <br />
              <span className="text-lime">delivered.</span>
            </h1>

            <p className="mt-5 max-w-[360px] text-[13px] leading-relaxed text-white/70">
              Discover nearby stores, stock your pantry, and run your business
              from one calm, reliable marketplace.
            </p>

            <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-[20px] border border-white/10">
              <Image
                src={groceryImg}
                alt="Fresh groceries ready for delivery"
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pri-deep/60 via-transparent to-transparent" />
              <div className="absolute right-4 bottom-4 left-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-pri-deep shadow-lg">
                <span className="grid size-7 place-items-center rounded-full bg-lime text-pri-deep">
                  <Icon name="store" className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-none">
                    Local stores, live today
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    Fresh stock from trusted vendors
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#8a5a00]">
                  <span className="text-accent">★</span> 4.9
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: "shield" as const, label: "Verified vendors" },
                { icon: "clock" as const, label: "Same-day delivery" },
                { icon: "card" as const, label: "Secure payouts" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <Icon name={item.icon} className="size-4 text-lime" />
                  <p className="mt-2 text-[10px] leading-tight text-white/70">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4 lg:hidden">
            <span className="grid size-8 place-items-center rounded-xl bg-pri text-lime">
              <Logo className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-pri">
              Routiq
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
            <div className="w-full max-w-[420px]">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
