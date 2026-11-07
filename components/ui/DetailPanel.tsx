"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/useHydrated";

export interface DetailSection {
  id: string;
  label: string;
  value: ReactNode;
}

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  badge?: ReactNode;
  sections?: DetailSection[];
  children?: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

/**
 * Right-hand record inspector used by collection tables. On phones it becomes
 * a full-height sheet so nothing is clipped.
 */
export default function DetailPanel({
  open,
  onClose,
  title,
  description,
  badge,
  sections = [],
  children,
  footer,
  widthClassName = "sm:max-w-[440px]",
}: DetailPanelProps) {
  const hydrated = useHydrated();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open || !hydrated) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <div
        className="absolute inset-0 bg-pri-deep/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-white shadow-[-24px_0_80px_rgba(6,76,80,0.16)] focus:outline-none",
          widthClassName,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {badge ? <div className="mb-2">{badge}</div> : null}
            <h2
              id={titleId}
              className="text-[16px] leading-snug font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-well hover:text-ink focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
          >
            <Icon name="x" className="size-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {sections.length ? (
            <dl className="divide-y divide-line rounded-xl border border-line">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                    {section.label}
                  </dt>
                  <dd className="text-[13px] font-medium text-ink sm:text-right">
                    {section.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {children}
        </div>

        {footer ? (
          <footer className="border-t border-line bg-soft/40 px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
