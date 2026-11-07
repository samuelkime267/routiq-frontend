"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. Set to 0 to keep it open. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<
  ToastTone,
  { icon: IconName; iconClass: string; bar: string }
> = {
  success: {
    icon: "check-circle",
    iconClass: "text-success",
    bar: "bg-success",
  },
  error: {
    icon: "alert-circle",
    iconClass: "text-danger",
    bar: "bg-danger",
  },
  info: {
    icon: "shield",
    iconClass: "text-pri",
    bar: "bg-pri",
  },
};

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

let sequence = 0;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      sequence += 1;
      const id = `toast-${sequence}`;

      setToasts((current) => [
        ...current.slice(-3),
        { ...options, id },
      ]);

      const duration = options.duration ?? 5000;
      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((item) => {
          const tone = item.tone ?? "info";
          const styles = toneStyles[tone];

          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm gap-3 overflow-hidden rounded-2xl border border-line bg-white p-3.5 shadow-[0_16px_48px_rgba(6,76,80,0.16)]"
            >
              <span
                aria-hidden="true"
                className={cn("w-1 shrink-0 rounded-full", styles.bar)}
              />
              <Icon
                name={styles.icon}
                className={cn("mt-0.5 size-4 shrink-0", styles.iconClass)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition hover:bg-well hover:text-ink focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
              >
                <Icon name="x" className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
