import type {
  ComponentPropsWithRef,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-xl border bg-white px-4 text-sm text-ink placeholder:text-muted/70 transition focus:border-pri focus:ring-4 focus:ring-pri/10 disabled:cursor-not-allowed disabled:bg-soft";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold text-ink"
        >
          {label}
          {optional ? (
            <span className="ml-1 font-normal text-muted">(optional)</span>
          ) : null}
        </label>
      </div>
      {children}
      {error ? (
        <p className="text-[12px] leading-snug text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] leading-snug text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  error,
  ...props
}: ComponentPropsWithRef<"input"> & { error?: boolean }) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(
        base,
        "h-11",
        error && "border-danger focus:border-danger focus:ring-danger/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  error,
  ...props
}: ComponentPropsWithRef<"textarea"> & { error?: boolean }) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(
        base,
        "min-h-24 resize-y py-3 leading-relaxed",
        error && "border-danger focus:border-danger focus:ring-danger/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  error,
  children,
  ...props
}: ComponentPropsWithRef<"select"> & { error?: boolean }) {
  return (
    <select
      aria-invalid={error || undefined}
      className={cn(
        base,
        "h-11 appearance-none bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10",
        error && "border-danger focus:border-danger focus:ring-danger/10",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}
