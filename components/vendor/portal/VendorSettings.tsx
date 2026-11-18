"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import FileUpload from "@/components/ui/FileUpload";
import { TextField, TextareaField } from "@/components/ui/FormField";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { ApiError, vendorPortalApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { applyApiFieldErrors } from "@/lib/form";
import {
  OPERATING_DAYS,
  vendorSettingsSchema,
  type VendorSettingsValues,
} from "@/lib/schemas/vendorSettings";
import { storeStatusLabel } from "@/lib/vendors";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import { formatVendorDay } from "@/lib/vendorPortal";
import type {
  OperatingDay,
  StoreStatus,
  UploadedFile,
  VendorSettingsSnapshot,
} from "@/types/api";

const STORE_TONES: Record<StoreStatus, "green" | "amber" | "red" | "neutral"> =
  {
    draft: "neutral",
    pending: "amber",
    under_review: "amber",
    approved: "green",
    rejected: "red",
    suspended: "red",
    closed: "neutral",
  };

const DAY_LABELS: Record<OperatingDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function hoursFromSnapshot(snapshot: VendorSettingsSnapshot) {
  const saved = new Map(
    snapshot.store.operatingHours.map((hour) => [hour.day, hour]),
  );

  return OPERATING_DAYS.map((day) => {
    const hour = saved.get(day);

    return {
      day,
      isOpen: hour?.isOpen ?? false,
      openingTime: hour?.openingTime ?? "",
      closingTime: hour?.closingTime ?? "",
    };
  });
}

export default function VendorSettings() {
  const { data, error, loading, reload } =
    useResource<VendorSettingsSnapshot>(
      "vendor-settings",
      () => vendorPortalApi.settings(),
      "We could not load your settings.",
    );

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[560px] rounded-2xl" />
          <Skeleton className="h-[560px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <ErrorState
        title="Settings unavailable"
        description={error ?? "We could not load your settings."}
        onRetry={reload}
      />
    );
  }

  return <SettingsForm snapshot={data} onSaved={reload} />;
}

function SettingsForm({
  snapshot,
  onSaved,
}: {
  snapshot: VendorSettingsSnapshot;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [logo, setLogo] = useState(snapshot.store.logo ?? "");
  const [cover, setCover] = useState(snapshot.store.coverImage ?? "");
  const [avatar, setAvatar] = useState(snapshot.profile.profilePicture ?? "");

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<VendorSettingsValues>({
    resolver: zodResolver(vendorSettingsSchema),
    defaultValues: {
      name: snapshot.profile.name,
      phone: snapshot.profile.phone ?? "",
      profilePicture: snapshot.profile.profilePicture ?? "",
      description: snapshot.store.description ?? "",
      phoneNumber: snapshot.store.phoneNumber,
      logo: snapshot.store.logo ?? "",
      coverImage: snapshot.store.coverImage ?? "",
      pickupInstructions: snapshot.store.pickupInstructions ?? "",
      operatingHours: hoursFromSnapshot(snapshot),
    },
  });

  const hours = watch("operatingHours");

  function handleUpload(
    field: "profilePicture" | "logo" | "coverImage",
    file: UploadedFile,
  ) {
    setValue(field, file.url, { shouldDirty: true });
    if (field === "profilePicture") setAvatar(file.url);
    if (field === "logo") setLogo(file.url);
    if (field === "coverImage") setCover(file.url);
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await vendorPortalApi.updateSettings({
        profile: {
          name: values.name.trim(),
          phone: values.phone.trim() || null,
          profilePicture: values.profilePicture.trim() || null,
        },
        storefront: {
          description: values.description.trim() || null,
          phoneNumber: values.phoneNumber.trim(),
          logo: values.logo.trim() || null,
          coverImage: values.coverImage.trim() || null,
        },
        operations: {
          pickupInstructions: values.pickupInstructions.trim() || null,
          operatingHours: values.operatingHours.map((hour) => ({
            day: hour.day,
            isOpen: hour.isOpen,
            openingTime: hour.isOpen ? hour.openingTime : null,
            closingTime: hour.isOpen ? hour.closingTime : null,
          })),
        },
      });

      toast({
        title: "Settings saved",
        description:
          "Your profile, storefront and pickup details are up to date.",
        tone: "success",
      });
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, [
          "name",
          "phone",
          "description",
          "phoneNumber",
          "pickupInstructions",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "Your settings could not be saved.",
        );
      }
    }
  });

  const { store, profile, payout, access } = snapshot;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="Store settings"
        description="Your account details, storefront presentation and the pickup information customers see. Legal identity and settlement details come from your reviewed application."
        breadcrumbs={vendorBreadcrumbs("/settings")}
        actions={
          <Button
            type="submit"
            form="vendor-settings-form"
            size="sm"
            loading={isSubmitting}
            disabled={!isDirty}
          >
            Save changes
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={STORE_TONES[store.status]}>
              {storeStatusLabel(store.status)}
            </Badge>
            <Badge tone="neutral">{store.category}</Badge>
            {store.reviewedAt ? (
              <Badge tone="neutral">
                Reviewed {formatVendorDay(store.reviewedAt)}
              </Badge>
            ) : null}
          </div>
        }
      />

      {store.status === "rejected" && store.rejectionReason ? (
        <Alert tone="error" title="Your store application needs attention">
          {store.rejectionReason}{" "}
          <a
            href="/onboarding"
            className="font-semibold underline underline-offset-2"
          >
            Review the application
          </a>
          .
        </Alert>
      ) : null}

      {store.status === "suspended" && store.suspensionReason ? (
        <Alert tone="error" title="Your store is suspended">
          {store.suspensionReason}
        </Alert>
      ) : null}

      {!access.canSell ? (
        <Alert tone="info" title="Selling is paused">
          {access.restriction ??
            "Your store needs approval before products can be published and orders fulfilled."}
        </Alert>
      ) : null}

      <form
        id="vendor-settings-form"
        onSubmit={onSubmit}
        className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Your profile
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                Shown on orders and store messages. Your email cannot be changed
                here.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-well text-pri">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="size-full object-cover" />
                ) : (
                  <Icon name="user" className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <FileUpload
                  id="vendor-profile-picture"
                  label="Profile picture"
                  description="JPEG, PNG or WebP · up to 10MB"
                  purpose="profile_picture"
                  accept=".jpg,.jpeg,.png,.webp"
                  value={avatar || undefined}
                  onUploaded={(file) => handleUpload("profilePicture", file)}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField
                label="Full name"
                register={register("name")}
                error={errors.name?.message}
              />
              <TextField
                label="Phone"
                type="tel"
                placeholder="08012345678"
                register={register("phone")}
                error={errors.phone?.message}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-soft/40 px-3.5 py-2.5">
                <p className="text-[9px] font-semibold tracking-[0.12em] text-muted uppercase">
                  Email
                </p>
                <p className="mt-1 break-all text-[12px] text-ink">
                  {profile.email}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-soft/40 px-3.5 py-2.5">
                <p className="text-[9px] font-semibold tracking-[0.12em] text-muted uppercase">
                  Username
                </p>
                <p className="mt-1 text-[12px] text-ink">
                  {profile.username ?? "Not set"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Storefront
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                Presentation only. Changing these does not affect your verified
                business identity.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-ink">Logo</p>
                {logo ? (
                  <div className="flex items-center gap-3">
                    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-well">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="" className="size-full object-cover" />
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogo("");
                        setValue("logo", "", { shouldDirty: true });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
                <FileUpload
                  id="vendor-store-logo"
                  label="Upload logo"
                  purpose="store_logo"
                  accept=".jpg,.jpeg,.png,.webp"
                  onUploaded={(file) => handleUpload("logo", file)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-ink">Cover image</p>
                {cover ? (
                  <div className="flex items-center gap-3">
                    <span className="grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-well">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt=""
                        className="size-full object-cover"
                      />
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCover("");
                        setValue("coverImage", "", { shouldDirty: true });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
                <FileUpload
                  id="vendor-store-cover"
                  label="Upload cover"
                  purpose="store_cover"
                  accept=".jpg,.jpeg,.png,.webp"
                  onUploaded={(file) => handleUpload("coverImage", file)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <TextareaField
                label="About your store"
                rows={4}
                placeholder="What do you sell, where do you source it, and what makes your store different?"
                register={register("description")}
                error={errors.description?.message}
              />
              <TextField
                label="Store phone number"
                type="tel"
                placeholder="08012345678"
                hint="Customers see this for delivery questions."
                register={register("phoneNumber")}
                error={errors.phoneNumber?.message}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Operations
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                Pickup notes and opening hours. Orders can still arrive outside
                these hours; this only sets expectations.
              </p>
            </div>

            <div className="mt-4">
              <TextareaField
                label="Pickup instructions"
                optional
                rows={3}
                placeholder="Where couriers should collect orders, gate access, contact person…"
                register={register("pickupInstructions")}
                error={errors.pickupInstructions?.message}
              />
            </div>

            <div className="mt-4">
              <p className="text-[13px] font-semibold text-ink">
                Opening hours
              </p>
              <div className="mt-2 divide-y divide-line rounded-xl border border-line">
                {hours.map((hour, index) => {
                  const dayErrors = errors.operatingHours?.[index];

                  return (
                    <div
                      key={hour.day}
                      className="flex flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <label className="flex items-center gap-2 text-[12px] font-medium text-ink">
                        <input
                          type="checkbox"
                          {...register(
                            `operatingHours.${index}.isOpen` as const,
                          )}
                          className="size-4 rounded border-line text-pri focus:ring-pri/30"
                        />
                        {DAY_LABELS[hour.day]}
                      </label>

                      {hour.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            aria-label={`${DAY_LABELS[hour.day]} opening time`}
                            {...register(
                              `operatingHours.${index}.openingTime` as const,
                            )}
                            className={cn(
                              "h-9 rounded-lg border bg-white px-2 text-[12px] text-ink focus:border-pri focus:ring-2 focus:ring-pri/10 focus:outline-none",
                              dayErrors?.openingTime
                                ? "border-danger"
                                : "border-line",
                            )}
                          />
                          <span className="text-[11px] text-muted">to</span>
                          <input
                            type="time"
                            aria-label={`${DAY_LABELS[hour.day]} closing time`}
                            {...register(
                              `operatingHours.${index}.closingTime` as const,
                            )}
                            className={cn(
                              "h-9 rounded-lg border bg-white px-2 text-[12px] text-ink focus:border-pri focus:ring-2 focus:ring-pri/10 focus:outline-none",
                              dayErrors?.closingTime
                                ? "border-danger"
                                : "border-line",
                            )}
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.operatingHours ? (
                <p role="alert" className="mt-2 text-[11px] text-danger">
                  Check the opening hours: each open day needs an opening and
                  closing time in order.
                </p>
              ) : null}
            </div>
          </section>

          {formError ? (
            <Alert tone="error" title="Could not save your settings">
              {formError}
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted">
              Saved changes update your storefront and order handoff notes.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                href="/"
                disabled={isSubmitting}
              >
                Back to dashboard
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={isSubmitting}
                disabled={!isDirty}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                  Legal identity
                </h2>
                <p className="mt-1 text-[11px] text-muted">
                  Locked to your reviewed application.
                </p>
              </div>
              <Icon name="lock" className="size-4 text-muted" />
            </div>

            <dl className="mt-3 space-y-2 text-[12px]">
              <ReadRow label="Store name" value={store.name} />
              <ReadRow label="Category" value={store.category} />
              <ReadRow label="Store email" value={store.email} />
              {store.address ? (
                <div>
                  <dt className="text-muted">Address</dt>
                  <dd className="mt-0.5 text-ink">
                    {[
                      store.address.street,
                      store.address.lga,
                      store.address.city,
                      store.address.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
              ) : null}
              <ReadRow
                label="Submitted"
                value={
                  store.submittedAt
                    ? formatVendorDay(store.submittedAt)
                    : "Not submitted"
                }
              />
            </dl>

            <p className="mt-3 rounded-xl border border-line bg-soft/50 px-3 py-2 text-[10px] leading-relaxed text-muted">
              {snapshot.editable.reason}
            </p>

            <Button
              href="/onboarding"
              variant="outline"
              size="sm"
              className="mt-3"
              icon={<Icon name="file-text" />}
            >
              Open store application
            </Button>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                  Settlement account
                </h2>
                <p className="mt-1 text-[11px] text-muted">
                  Where Routiq sends your withdrawals.
                </p>
              </div>
              <Badge tone={payout.verified ? "green" : "amber"}>
                {payout.verified ? "Verified" : "Not verified"}
              </Badge>
            </div>

            {payout.bankName ? (
              <dl className="mt-3 space-y-2 text-[12px]">
                <ReadRow label="Bank" value={payout.bankName} />
                <ReadRow
                  label="Account name"
                  value={payout.accountName ?? "—"}
                />
                <ReadRow
                  label="Account number"
                  value={payout.accountNumber ?? "—"}
                />
              </dl>
            ) : (
              <p className="mt-3 text-[12px] text-muted">
                No settlement account is recorded. Complete your store
                application to add one.
              </p>
            )}

            <p className="mt-3 rounded-xl border border-line bg-soft/50 px-3 py-2 text-[10px] leading-relaxed text-muted">
              This account is part of KYB review and cannot be edited here. Add
              a separate payout account if you need money sent elsewhere.
            </p>

            <Button
              href="/finance/bank-accounts"
              variant="outline"
              size="sm"
              className="mt-3"
              icon={<Icon name="building" />}
            >
              Manage payout accounts
            </Button>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Store link
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              Your public storefront address on the marketplace.
            </p>
            <p className="mt-2 break-all rounded-xl border border-line bg-soft/50 px-3 py-2 font-mono text-[11px] text-ink">
              /stores/{store.slug}
            </p>
            <p className="mt-2 text-[10px] text-muted">
              Commissions, escrow rules and withdrawal limits are managed by
              Routiq and shown on your finance pages.
            </p>
          </section>

          <section className="rounded-2xl border border-pri/15 bg-well/60 p-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-pri">
              Need something changed?
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Legal names, CAC details, NIN/BVN and your settlement account are
              locked after review. Contact support if any of them are wrong.
            </p>
            <p className="mt-2 text-[10px] text-muted">
              Withdrawable balance changes never depend on frontend values:
              every payout is checked against the server ledger.
            </p>
          </section>
        </div>
      </form>
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all text-right text-ink">{value}</dd>
    </div>
  );
}
