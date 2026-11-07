import { TextareaField, TextField } from "@/components/ui/FormField";
import { BUSINESS_TYPES, isRegisteredBusiness } from "../constants";
import type { StepProps } from "../model";
import { cn } from "@/lib/cn";

export default function BusinessStep({
  values,
  register,
  errors,
  setValue,
}: StepProps) {
  const registered = isRegisteredBusiness(values.businessType);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Business structure
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {BUSINESS_TYPES.map((option) => {
            const active = values.businessType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setValue("businessType", option.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition",
                  active
                    ? "border-pri bg-well ring-2 ring-pri/10"
                    : "border-line bg-white hover:border-pri/25",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full border",
                      active
                        ? "border-pri bg-pri text-white"
                        : "border-line bg-white",
                    )}
                  >
                    {active ? (
                      <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    ) : null}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-muted">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>
        {errors.businessType?.message ? (
          <p className="mt-1.5 text-[12px] leading-snug text-danger">
            {errors.businessType.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Store name"
          placeholder="Routiq Mart"
          error={errors.name?.message}
          register={register("name")}
        />

        <TextField
          label="Registered business name"
          placeholder="Routiq Limited"
          error={errors.legalBusinessName?.message}
          register={register("legalBusinessName")}
        />

        <TextField
          label="Business category"
          placeholder="Groceries"
          hint="For example: groceries, pharmacy, fashion."
          error={errors.category?.message}
          register={register("category")}
        />

        <TextField
          label="Business phone"
          inputMode="tel"
          placeholder="08031234567"
          error={errors.phoneNumber?.message}
          register={register("phoneNumber")}
        />

        <TextField
          label="Store email"
          type="email"
          placeholder="store@example.com"
          fieldClassName="sm:col-span-2"
          error={errors.email?.message}
          register={register("email")}
        />

        <TextareaField
          label="What do you sell?"
          optional
          placeholder="Fresh produce, pantry staples, and household essentials delivered same day."
          hint="A short line shoppers see on your storefront."
          fieldClassName="sm:col-span-2"
          error={errors.description?.message}
          register={register("description")}
        />
      </div>

      {registered ? (
        <div className="rounded-2xl border border-line bg-soft/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Registration details
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <TextField
              label="CAC registration number"
              placeholder="RC123456"
              error={errors.cacRegistrationNumber?.message}
              register={register("cacRegistrationNumber")}
            />

            <TextField
              label="Tax identification number (TIN)"
              inputMode="numeric"
              placeholder="12345678"
              error={errors.tin?.message}
              register={register("tin")}
            />

            <TextField
              label="Registration date"
              type="date"
              optional
              error={errors.businessRegistrationDate?.message}
              register={register("businessRegistrationDate")}
            />

            <TextField
              label="SCUML number"
              placeholder="SC-123456"
              optional
              error={errors.scumlNumber?.message}
              register={register("scumlNumber")}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
