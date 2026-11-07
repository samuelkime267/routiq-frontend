import { SelectField, TextField } from "@/components/ui/FormField";
import { ID_TYPE_OPTIONS } from "../constants";
import type { StepProps } from "../model";

export default function RepresentativeStep({ register, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-soft/60 px-4 py-3 text-[12px] leading-relaxed text-muted">
        We verify the person responsible for this store. Use the details on your
        government-issued ID. NIN and BVN are stored securely and never shown to
        shoppers.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full legal name"
          placeholder="Ada Obi"
          fieldClassName="sm:col-span-2"
          error={errors.representative?.fullName?.message}
          register={register("representative.fullName")}
        />

        <TextField
          label="Date of birth"
          type="date"
          error={errors.representative?.dateOfBirth?.message}
          register={register("representative.dateOfBirth")}
        />

        <TextField
          label="Nationality"
          error={errors.representative?.nationality?.message}
          register={register("representative.nationality")}
        />

        <SelectField
          label="ID type"
          options={ID_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={errors.representative?.idType?.message}
          register={register("representative.idType")}
        />

        <TextField
          label="ID number"
          placeholder="12345678901"
          error={errors.representative?.idNumber?.message}
          register={register("representative.idNumber")}
        />

        <TextField
          label="NIN"
          inputMode="numeric"
          maxLength={11}
          placeholder="12345678901"
          hint="11 digits. Provide a NIN or BVN."
          error={errors.representative?.nin?.message}
          register={register("representative.nin")}
        />

        <TextField
          label="BVN"
          inputMode="numeric"
          maxLength={11}
          placeholder="12345678901"
          hint="11 digits. Provide a NIN or BVN."
          error={errors.representative?.bvn?.message}
          register={register("representative.bvn")}
        />
      </div>
    </div>
  );
}
