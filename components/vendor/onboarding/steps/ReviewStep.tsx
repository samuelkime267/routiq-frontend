import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import { CheckboxField } from "@/components/ui/FormField";
import {
  BUSINESS_TYPES,
  DOCUMENT_LABELS,
  isRegisteredBusiness,
} from "../constants";
import type { StepProps } from "../model";
import { formatDate } from "@/lib/format";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="max-w-[62%] text-right text-[12px] font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {title}
      </p>
      <div className="mt-1 divide-y divide-line">{children}</div>
    </div>
  );
}

function mask(value: string) {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export default function ReviewStep({ values, register, errors }: StepProps) {
  const businessType = BUSINESS_TYPES.find(
    (type) => type.value === values.businessType,
  )?.label;

  const openDays = values.operatingHours.filter((entry) => entry.isOpen);
  const docTypes = values.documents.map(
    (document) => DOCUMENT_LABELS[document.type],
  );

  return (
    <div className="space-y-5">
      <Alert tone="info" title="Ready for review">
        Submitting sends your details to the Routiq team. You can keep editing
        while the application is pending.
      </Alert>

      {Object.keys(errors).length ? (
        <Alert tone="error" title="A few things need attention">
          Fix the highlighted fields in the earlier steps, then submit again.
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard title="Business">
          <SummaryRow label="Store" value={values.name || "—"} />
          <SummaryRow
            label="Legal name"
            value={values.legalBusinessName || "—"}
          />
          <SummaryRow label="Type" value={businessType ?? "—"} />
          <SummaryRow label="Category" value={values.category || "—"} />
          <SummaryRow label="Email" value={values.email || "—"} />
          <SummaryRow label="Phone" value={values.phoneNumber || "—"} />
          {isRegisteredBusiness(values.businessType) ? (
            <>
              <SummaryRow
                label="CAC"
                value={values.cacRegistrationNumber || "—"}
              />
              <SummaryRow label="TIN" value={values.tin || "—"} />
            </>
          ) : null}
        </SummaryCard>

        <SummaryCard title="Location">
          <SummaryRow
            label="Address"
            value={
              [
                values.address.street,
                values.address.city,
                values.address.lga,
                values.address.state,
              ]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <SummaryRow
            label="Coordinates"
            value={
              values.longitude && values.latitude
                ? `${values.latitude}, ${values.longitude}`
                : "—"
            }
          />
          <SummaryRow
            label="Open days"
            value={
              openDays.length
                ? openDays
                    .map(
                      (entry) =>
                        `${entry.day.slice(0, 3)} ${entry.openingTime}–${entry.closingTime}`,
                    )
                    .join(", ")
                : "—"
            }
          />
        </SummaryCard>

        <SummaryCard title="Representative">
          <SummaryRow
            label="Name"
            value={values.representative.fullName || "—"}
          />
          <SummaryRow
            label="Date of birth"
            value={
              values.representative.dateOfBirth
                ? formatDate(values.representative.dateOfBirth)
                : "—"
            }
          />
          <SummaryRow label="ID type" value={values.representative.idType} />
          <SummaryRow label="NIN" value={mask(values.representative.nin)} />
          <SummaryRow label="BVN" value={mask(values.representative.bvn)} />
        </SummaryCard>

        <SummaryCard title="Payout">
          <SummaryRow
            label="Bank"
            value={values.settlementAccount.bankName || "—"}
          />
          <SummaryRow
            label="Account name"
            value={values.settlementAccount.accountName || "—"}
          />
          <SummaryRow
            label="Account number"
            value={mask(values.settlementAccount.accountNumber)}
          />
          <SummaryRow
            label="Documents"
            value={docTypes.length ? docTypes.join(", ") : "—"}
          />
        </SummaryCard>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-soft/60 p-4">
        <CheckboxField
          label="I accept the Routiq marketplace terms and confirm the information above is accurate."
          error={errors.compliance?.termsAccepted?.message}
          register={register("compliance.termsAccepted")}
        />

        <CheckboxField
          label="I consent to Routiq processing my KYB data for verification and compliance checks."
          error={errors.compliance?.dataProcessingConsent?.message}
          register={register("compliance.dataProcessingConsent")}
        />
      </div>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <Icon name="shield" className="mt-0.5 size-3.5 shrink-0 text-pri" />
        Your NIN, BVN, and payout details are only visible to authorised Routiq
        reviewers.
      </p>
    </div>
  );
}
