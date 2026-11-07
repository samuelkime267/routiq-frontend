import { TextField } from "@/components/ui/FormField";
import type { StepProps } from "../model";

export default function SettlementStep({ register, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-soft/60 px-4 py-3 text-[12px] leading-relaxed text-muted">
        Settlements are paid into this Nigerian bank account. The account name
        should match your business or representative name.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Bank name"
          placeholder="GTBank"
          error={errors.settlementAccount?.bankName?.message}
          register={register("settlementAccount.bankName")}
        />

        <TextField
          label="Bank code"
          inputMode="numeric"
          placeholder="058"
          hint="The 3-6 digit CBN bank code."
          error={errors.settlementAccount?.bankCode?.message}
          register={register("settlementAccount.bankCode")}
        />

        <TextField
          label="Account name"
          placeholder="Routiq Limited"
          fieldClassName="sm:col-span-2"
          error={errors.settlementAccount?.accountName?.message}
          register={register("settlementAccount.accountName")}
        />

        <TextField
          label="Account number"
          inputMode="numeric"
          maxLength={10}
          placeholder="0123456789"
          hint="10 digits, no spaces."
          fieldClassName="sm:col-span-2"
          error={errors.settlementAccount?.accountNumber?.message}
          register={register("settlementAccount.accountNumber")}
        />
      </div>
    </div>
  );
}
