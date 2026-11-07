"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: IconName;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

interface DropdownMenuProps {
  label: string;
  trigger: ReactNode;
  items?: DropdownItem[];
  header?: ReactNode;
  footer?: ReactNode;
  align?: "left" | "right";
  widthClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  /** Custom panel content, used for richer menus such as notifications. */
  children?: ReactNode;
}

export default function DropdownMenu({
  label,
  trigger,
  items = [],
  header,
  footer,
  align = "right",
  widthClassName = "w-64",
  triggerClassName,
  panelClassName,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-line bg-white text-ink transition hover:border-pri/25 hover:bg-well focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none",
          triggerClassName,
        )}
      >
        {trigger}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_48px_rgba(6,76,80,0.14)]",
            align === "right" ? "right-0" : "left-0",
            widthClassName,
            panelClassName,
          )}
        >
          {header ? <div className="border-b border-line p-3">{header}</div> : null}

          {children ?? (
            <div className="p-1.5">
              {items.map((item) => {
                const itemClasses = cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-semibold transition focus-visible:outline-none",
                  item.danger
                    ? "text-danger hover:bg-danger/5"
                    : "text-ink hover:bg-well focus-visible:bg-well",
                  item.disabled && "pointer-events-none opacity-40",
                );

                return (
                  <div key={item.id} role="none">
                    {item.separatorBefore ? (
                      <div className="my-1 h-px bg-line" role="separator" />
                    ) : null}
                    {item.href ? (
                      <Link
                        href={item.href}
                        role="menuitem"
                        className={itemClasses}
                        onClick={() => setOpen(false)}
                      >
                        {item.icon ? (
                          <Icon name={item.icon} className="size-4 text-muted" />
                        ) : null}
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        disabled={item.disabled}
                        className={itemClasses}
                        onClick={() => {
                          setOpen(false);
                          item.onSelect?.();
                        }}
                      >
                        {item.icon ? (
                          <Icon
                            name={item.icon}
                            className={cn(
                              "size-4",
                              item.danger ? "text-danger" : "text-muted",
                            )}
                          />
                        ) : null}
                        {item.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {footer ? (
            <div className="border-t border-line p-1.5">{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
