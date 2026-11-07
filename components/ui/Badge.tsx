import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "teal" | "lime" | "amber" | "green" | "red" | "blue";

const tones: Record<Tone, string> = {
  neutral: "bg-soft text-muted",
  teal: "bg-pri text-white",
  lime: "bg-lime text-pri-deep",
  amber: "bg-accent/20 text-[#8a5a00]",
  green: "bg-success/10 text-[#087a38]",
  red: "bg-danger/10 text-danger",
  blue: "bg-info text-[#1f5bb5]",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  tone = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
