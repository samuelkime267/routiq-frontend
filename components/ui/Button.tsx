import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "lime" | "outline" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  href?: string;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-pri text-white hover:bg-pri-deep focus-visible:ring-pri/30 disabled:bg-pri/50",
  lime: "bg-lime text-pri-deep hover:brightness-95 focus-visible:ring-lime/50",
  outline:
    "border border-line bg-white text-ink hover:border-pri/30 hover:bg-well focus-visible:ring-pri/20",
  ghost: "bg-transparent text-pri hover:bg-well focus-visible:ring-pri/20",
  danger:
    "bg-danger text-white hover:brightness-95 focus-visible:ring-danger/30",
  dark: "bg-ink text-white hover:bg-ink/90 focus-visible:ring-ink/30",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  href,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}
