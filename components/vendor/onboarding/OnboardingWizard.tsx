"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ApiError, storeApi, userApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { formatDate } from "@/lib/format";
import { clearAuth, getAccessToken } from "@/lib/session";
import { APP_URLS, authLoginUrl, roleHome, withSessionHandoff } from "@/lib/urls";
import type { ApiStore, ApiUser } from "@/types/api";
import { ONBOARDING_STEPS } from "./constants";
import {
  createEmptyForm,
  firstErrorPath,
  formToPayload,
  stepForField,
  storeToForm,
} from "./model";
import type { StepProps, StoreFormState } from "./model";
import { ONBOARDING_STEP_FIELDS, onboardingSchema } from "./schema";
import StepProgress from "./StepProgress";
import BusinessStep from "./steps/BusinessStep";
import DocumentsStep from "./steps/DocumentsStep";
import HoursStep from "./steps/HoursStep";
import LocationStep from "./steps/LocationStep";
import RepresentativeStep from "./steps/RepresentativeStep";
import ReviewStep from "./steps/ReviewStep";
import SettlementStep from "./steps/SettlementStep";

const DRAFT_KEY = "routiq.onboarding.draft";

interface OnboardingWizardProps {
  storeId?: string;
}

function readDraft(): StoreFormState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as StoreFormState;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}

function stepBody(step: number, props: StepProps) {
  switch (step) {
    case 0:
      return <BusinessStep {...props} />;
    case 1:
      return <LocationStep {...props} />;
    case 2:
      return <HoursStep {...props} />;
    case 3:
      return <RepresentativeStep {...props} />;
    case 4:
      return <SettlementStep {...props} />;
    case 5:
      return <DocumentsStep {...props} />;
    default:
      return <ReviewStep {...props} />;
  }
}

export default function OnboardingWizard({ storeId }: OnboardingWizardProps) {
  const router = useRouter();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [store, setStore] = useState<ApiStore | null>(null);
  const [step, setStep] = useState(0);
  const [highestReached, setHighestReached] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<ApiStore | null>(null);
  const [createdStoreId, setCreatedStoreId] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    trigger,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormState>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: createEmptyForm(),
    mode: "onTouched",
  });

  const values = useWatch({ control }) as StoreFormState;
  const editing = Boolean(storeId);
  const isLastStep = step === ONBOARDING_STEPS.length - 1;

  const goToAuth = useCallback(() => {
    clearAuth();
    window.location.href = authLoginUrl();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const currentUser = await userApi.me();
        if (cancelled) return;

        if (currentUser.role === "user") {
          window.location.href = withSessionHandoff(
            roleHome(currentUser.role),
            getAccessToken(),
          );
          return;
        }

        setUser(currentUser);

        if (storeId) {
          const { store: existing } = await storeApi.get(storeId);
          if (cancelled) return;

          setStore(existing);
          reset(storeToForm(existing));
          setHighestReached(6);
          setStep(0);
        } else {
          const draft = readDraft();
          if (draft) {
            reset(draft);
            setDraftRestored(true);
          }
        }
      } catch (bootstrapError) {
        if (cancelled) return;

        if (bootstrapError instanceof ApiError) {
          if (bootstrapError.status === 401) {
            goToAuth();
            return;
          }
          setError(bootstrapError.message);
        } else {
          setError("Could not load your onboarding details. Please refresh.");
        }
        setLoadFailed(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [goToAuth, reset, storeId]);

  useEffect(() => {
    if (!ready || editing || submitted || createdStoreId) return;

    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      // Saving a draft is best-effort only.
    }
  }, [createdStoreId, editing, ready, submitted, values]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelect(nextStep: number) {
    if (nextStep > highestReached) return;

    setStep(nextStep);
    scrollToTop();
  }

  async function handleNext() {
    setError(null);

    if (isLastStep) {
      await submitForm();
      return;
    }

    const valid = await trigger(ONBOARDING_STEP_FIELDS[step], {
      shouldFocus: true,
    });

    if (!valid) {
      setError("Check the highlighted fields before continuing.");
      scrollToTop();
      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    setHighestReached((current) => Math.max(current, nextStep));
    scrollToTop();
  }

  function handleBack() {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
    scrollToTop();
  }

  const submitForm = handleSubmit(
    async (data) => {
      setError(null);

      try {
        const payload = formToPayload(data);
        const targetStoreId = storeId ?? createdStoreId;
        const result = targetStoreId
          ? await storeApi.update(targetStoreId, payload)
          : await storeApi.create(payload);

        if (!targetStoreId) setCreatedStoreId(result.store._id);

        setStore(result.store);
        setSubmitted(result.store);
        setHighestReached(6);
        clearDraft();

        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (submitError) {
        if (submitError instanceof ApiError) {
          applyApiFieldErrors(setFieldError, submitError.fieldErrors);

          const firstField = Object.keys(submitError.fieldErrors)[0];
          if (firstField) {
            const targetStep = stepForField(firstField);
            setStep(targetStep);
            setHighestReached((current) => Math.max(current, targetStep));
          }

          if (submitError.status === 401) {
            goToAuth();
            return;
          }

          setError(submitError.message);
        } else {
          setError("Could not submit your store. Please try again.");
        }
        scrollToTop();
      }
    },
    (invalidErrors) => {
      const firstField = firstErrorPath(invalidErrors);
      const targetStep = firstField ? stepForField(firstField) : 0;

      setStep(targetStep);
      setHighestReached((current) => Math.max(current, targetStep));
      setError("A few details still need attention.");
      scrollToTop();
    },
  );

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1180px] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-muted">
          <span className="size-5 animate-spin rounded-full border-2 border-pri border-t-transparent" />
          Preparing your onboarding…
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 lg:py-16">
        <div className="rounded-[26px] border border-line bg-white p-6 sm:p-10">
          <span className="grid size-11 place-items-center rounded-2xl bg-danger/10 text-danger">
            <Icon name="alert-circle" className="size-5" />
          </span>
          <h1 className="mt-4 text-[26px] leading-tight font-semibold tracking-[-0.03em] text-ink">
            We could not open this application.
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {error ??
              "The store may not exist, or it may belong to another vendor account."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button href="/" size="lg">
              Back to dashboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const rejected = submitted.status === "rejected";

    return (
      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:py-16">
        <div className="overflow-hidden rounded-[26px] border border-line bg-white">
          <div className="bg-pri px-6 py-10 text-white sm:px-10">
            <span className="grid size-12 place-items-center rounded-2xl bg-lime text-pri-deep">
              <Icon name="check-circle" className="size-6" />
            </span>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">
              {editing ? "Changes saved" : "Application received"}
            </p>
            <h1 className="mt-2 text-[30px] leading-tight font-semibold tracking-[-0.03em] sm:text-[36px]">
              {submitted.name} is now with our review team.
            </h1>
            <p className="mt-3 max-w-[520px] text-[13px] leading-relaxed text-white/70">
              We verify Nigerian business details within 1–3 working days. You
              can keep updating your store while the application is pending.
            </p>
          </div>

          <div className="space-y-4 px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-soft/60 px-4 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  Current status
                </p>
                <div className="mt-1">
                  <Badge tone="amber">
                    <span className="size-1.5 rounded-full bg-accent" />
                    Pending review
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  Submitted
                </p>
                <p className="mt-1 text-[12px] font-semibold text-ink">
                  {formatDate(submitted.submittedAt ?? new Date().toISOString())}
                </p>
              </div>
            </div>

            {rejected ? (
              <Alert tone="error" title="Previous rejection">
                {submitted.rejectionReason ??
                  "The review team asked for changes. Updating your details will resubmit the store."}
              </Alert>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                href="/"
                size="lg"
                fullWidth
                icon={<Icon name="arrow-left" className="size-4" />}
              >
                Back to dashboard
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => {
                  setSubmitted(null);
                  setStep(0);
                }}
              >
                Update my details
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted">
              Questions about verification? Contact vendor support from the
              dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (store && !["pending", "rejected"].includes(store.status)) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 lg:py-16">
        <div className="rounded-[26px] border border-line bg-white p-6 sm:p-10">
          <Badge tone={store.status === "approved" ? "green" : "neutral"}>
            {store.status}
          </Badge>
          <h1 className="mt-4 text-[28px] leading-tight font-semibold tracking-[-0.03em] text-ink">
            This store is not open for editing.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            A store can only be edited while its application is pending or
            rejected. Contact an administrator if the store status looks wrong.
          </p>
          <Button href="/" size="lg" className="mt-6">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentMeta = ONBOARDING_STEPS[step];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pri/60">
            {editing ? "Store application" : "Vendor onboarding"}
          </p>
          <h1 className="mt-2 text-[30px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">
            {editing
              ? `Edit ${store?.name ?? "your store"}`
              : "Open your Routiq storefront"}
          </h1>
          <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-muted">
            Complete the seven steps below. We use this information to verify
            your business, set up payouts, and keep shoppers protected.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[11px] text-muted">
            <span className="grid size-6 place-items-center rounded-full bg-well text-pri">
              <Icon name="user" className="size-3.5" />
            </span>
            {user.name}
          </div>
        ) : null}
      </div>

      {draftRestored ? (
        <Alert tone="info" className="mb-5">
          We restored a draft saved on this device. Pick up where you left off,
          or{" "}
          <button
            type="button"
            className="font-semibold text-pri underline underline-offset-2"
            onClick={() => {
              reset(createEmptyForm());
              setDraftRestored(false);
              setStep(0);
              setHighestReached(0);
              clearDraft();
            }}
          >
            start over
          </button>
          .
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" className="mb-5" title="Could not continue">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[268px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-line bg-white p-4 lg:sticky lg:top-24">
          <div className="mb-4 flex items-center justify-between gap-3 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Progress
            </p>
            <span className="text-[11px] font-semibold text-pri">
              {Math.min(step + 1, ONBOARDING_STEPS.length)}/
              {ONBOARDING_STEPS.length}
            </span>
          </div>

          <StepProgress
            current={step}
            completedThrough={highestReached}
            onSelect={handleSelect}
          />

          <div className="mt-4 rounded-xl bg-soft/70 px-3 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
              <Icon name="shield" className="size-3.5 text-pri" />
              Your data is protected
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              NIN, BVN and payout details are visible only to authorised
              reviewers.
            </p>
          </div>

          {!editing ? (
            <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted">
              Your progress is saved on this device until you submit.
            </p>
          ) : null}
        </aside>

        <div className="min-w-0 scroll-mt-24">
          <div className="rounded-[24px] border border-line bg-white">
            <div className="border-b border-line px-5 py-5 sm:px-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pri/60">
                Step {step + 1} of {ONBOARDING_STEPS.length}
              </p>
              <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">
                {currentMeta.title}
              </h2>
              <p className="mt-1 text-[12px] text-muted">
                {currentMeta.description}
              </p>
            </div>

            <div className="px-5 py-6 sm:px-7">
              {stepBody(step, {
                values,
                register,
                errors,
                setValue,
              })}
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-[24px] border-t border-line bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0 || isSubmitting}
                icon={<Icon name="arrow-left" className="size-4" />}
              >
                Back
              </Button>

              <div className="flex items-center gap-2">
                {editing ? (
                  <Button
                    variant="ghost"
                    href="/"
                    disabled={isSubmitting}
                    className="max-sm:hidden"
                  >
                    Cancel
                  </Button>
                ) : null}

                <Button
                  onClick={handleNext}
                  loading={isSubmitting}
                  icon={
                    <Icon
                      name={isLastStep ? "check" : "arrow-right"}
                      className="size-4"
                    />
                  }
                >
                  {isLastStep
                    ? editing
                      ? "Resubmit store"
                      : "Submit application"
                    : "Save & continue"}
                </Button>
              </div>
            </div>
          </div>

          {step === ONBOARDING_STEPS.length - 1 ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
              <Icon name="lock" className="size-3" />
              Submitting sends your application to the Routiq review team.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="store" className="size-3.5" />
          {APP_URLS.marketplace.replace(/^https?:\/\//, "")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="shield" className="size-3.5" />
          Nigerian KYB compliant
        </span>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-semibold text-pri underline-offset-2 hover:underline"
        >
          Save and finish later
        </button>
      </div>
    </div>
  );
}
