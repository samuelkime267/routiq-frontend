import { OPERATING_DAYS } from "../constants";
import type { StepProps } from "../model";
import { cn } from "@/lib/cn";

export default function HoursStep({ values, errors, setValue }: StepProps) {
  function patchDay(
    day: (typeof OPERATING_DAYS)[number]["value"],
    patch: Partial<(typeof values.operatingHours)[number]>,
  ) {
    const next = values.operatingHours.map((entry) =>
      entry.day === day ? { ...entry, ...patch } : entry,
    );

    setValue("operatingHours", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-soft/60 px-4 py-3 text-[12px] leading-relaxed text-muted">
        Shoppers only see your store as open during these hours. You can change
        them any time after onboarding.
      </div>

      {errors.operatingHours?.message ? (
        <p className="text-[12px] font-medium text-danger">
          {errors.operatingHours.message}
        </p>
      ) : null}

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {OPERATING_DAYS.map((day, index) => {
          const entry = values.operatingHours.find(
            (item) => item.day === day.value,
          );
          if (!entry) return null;

          const dayErrors = errors.operatingHours?.[index];

          return (
            <div
              key={day.value}
              className={cn(
                "px-4 py-3 transition",
                entry.isOpen ? "bg-white" : "bg-soft/40",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={entry.isOpen}
                  onClick={() =>
                    patchDay(day.value, { isOpen: !entry.isOpen })
                  }
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition",
                    entry.isOpen ? "bg-pri" : "bg-line",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition",
                      entry.isOpen && "translate-x-5",
                    )}
                  />
                </button>

                <span className="w-24 text-[13px] font-semibold text-ink">
                  {day.label}
                </span>

                {entry.isOpen ? (
                  <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                    <label className="flex items-center gap-2 text-[11px] text-muted">
                      Open
                      <input
                        type="time"
                        value={entry.openingTime}
                        onChange={(event) =>
                          patchDay(day.value, {
                            openingTime: event.target.value,
                          })
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-ink"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-muted">
                      Close
                      <input
                        type="time"
                        value={entry.closingTime}
                        onChange={(event) =>
                          patchDay(day.value, {
                            closingTime: event.target.value,
                          })
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-ink"
                      />
                    </label>
                  </div>
                ) : (
                  <span className="ml-auto text-[11px] text-muted">Closed</span>
                )}
              </div>

              {dayErrors?.openingTime?.message ? (
                <p className="mt-2 text-[11px] text-danger">
                  {dayErrors.openingTime.message}
                </p>
              ) : null}
              {dayErrors?.closingTime?.message ? (
                <p className="mt-1 text-[11px] text-danger">
                  {dayErrors.closingTime.message}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
