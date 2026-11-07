import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { ONBOARDING_STEPS } from "../onboarding/constants";

interface StepProgressProps {
  current: number;
  completedThrough: number;
  onSelect?: (step: number) => void;
}

export default function StepProgress({
  current,
  completedThrough,
  onSelect,
}: StepProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="min-w-0">
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {ONBOARDING_STEPS.map((step, index) => {
          const active = index === current;
          const done = index < completedThrough;
          const reachable = index <= completedThrough;

          return (
            <li
              key={step.id}
              className="relative flex min-w-[132px] flex-1 items-start gap-3 lg:min-w-0 lg:flex-none lg:pb-7"
            >
              {index < ONBOARDING_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-8 left-[15px] hidden h-full w-px lg:block",
                    done ? "bg-pri/30" : "bg-line",
                  )}
                />
              ) : null}

              <button
                type="button"
                onClick={() => reachable && onSelect?.(index)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex min-w-0 flex-1 items-start gap-3 rounded-xl p-2 text-left transition lg:flex-none",
                  reachable ? "hover:bg-well" : "cursor-not-allowed",
                  active && "bg-well",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition",
                    done && "border-pri bg-pri text-white",
                    active && !done && "border-pri bg-white text-pri ring-4 ring-pri/10",
                    !active && !done && "border-line bg-white text-muted",
                  )}
                >
                  {done ? <Icon name="check" className="size-4" /> : index + 1}
                </span>

                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[12px] font-semibold",
                      active || done ? "text-ink" : "text-muted",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="mt-0.5 hidden text-[11px] leading-snug text-muted lg:block">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
