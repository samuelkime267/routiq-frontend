import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Tone = "error" | "success" | "info";

interface AlertProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}

const tones: Record<Tone, { wrapper: string; icon: "alert-circle" | "check-circle" | "shield" }> = {
  error: {
    wrapper: "border-danger/20 bg-danger/5 text-danger",
    icon: "alert-circle",
  },
  success: {
    wrapper: "border-success/20 bg-success/5 text-pri",
    icon: "check-circle",
  },
  info: {
    wrapper: "border-pri/15 bg-well text-pri",
    icon: "shield",
  },
};

export default function Alert({
  tone = "info",
  title,
  children,
  className,
}: AlertProps) {
  const styles = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        styles.wrapper,
        className,
      )}
    >
      <Icon name={styles.icon} className="mt-0.5 size-4" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn("text-[13px] leading-relaxed", title && "mt-0.5")}>
          {children}
        </div>
      </div>
    </div>
  );
}
