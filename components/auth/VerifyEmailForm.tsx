"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthIntro from "@/components/auth/AuthIntro";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { ApiError, authApi } from "@/lib/api";
import { verifyEmailSchema, type VerifyEmailValues } from "@/lib/schemas/auth";
import { getStoredUser, getAccessToken, saveUser } from "@/lib/session";
import { useHydrated } from "@/lib/useHydrated";
import { APP_URLS, roleHome, withSessionHandoff } from "@/lib/urls";

export default function VerifyEmailForm() {
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "" },
  });

  const storedUser = hydrated ? getStoredUser() : null;
  const continueUrl = withSessionHandoff(
    storedUser ? roleHome(storedUser.role) : `${APP_URLS.auth}/login`,
    hydrated ? getAccessToken() : null,
  );
  const alreadyVerified = Boolean(storedUser?.isEmailVerified);

  async function handleSendCode() {
    setError(null);
    setNotice(null);
    setSending(true);

    try {
      await authApi.sendVerificationEmail();
      setNotice("A fresh 6-digit code is on its way. It expires in 10 minutes.");
    } catch (sendError) {
      setError(
        sendError instanceof ApiError
          ? sendError.message
          : "Could not send the code. Please sign in and try again.",
      );
    } finally {
      setSending(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setNotice(null);

    try {
      await authApi.verifyEmail(values.code);
      const user = getStoredUser();
      if (user) saveUser({ ...user, isEmailVerified: true });
      setVerified(true);
    } catch (verifyError) {
      setError(
        verifyError instanceof ApiError
          ? verifyError.message
          : "Could not verify the code. Request a new one and try again.",
      );
    }
  });

  if (verified || alreadyVerified) {
    return (
      <>
        <AuthIntro
          eyebrow="Email verification"
          title="Email verified"
          description="Your account is ready. Continue to your dashboard to keep going."
        />
        <Alert tone="success" title="You're verified">
          You can now receive order updates, receipts, and vendor review
          notifications.
        </Alert>
        <Button
          href={continueUrl}
          fullWidth
          size="lg"
          className="mt-5"
          icon={<Icon name="arrow-right" className="size-4" />}
        >
          Continue to Routiq
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthIntro
        eyebrow="Email verification"
        title="Verify your email"
        description="We use a 6-digit code to keep your account and payouts secure."
      />

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="success" className="mb-4">
          {notice}
        </Alert>
      ) : null}

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-line bg-soft px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-pri">
          <Icon name="mail" className="size-4" />
        </span>
        <div className="text-[12px] leading-relaxed text-muted">
          <p className="font-semibold text-ink">Step 1 · Send a code</p>
          <p>Get a 6-digit code delivered to your account email.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={sending}
          onClick={handleSendCode}
          className="ml-auto shrink-0"
        >
          Send code
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="h-14 text-center text-2xl font-semibold tracking-[0.5em]"
          error={errors.code?.message}
          register={register("code", {
            onChange: (event) => {
              event.target.value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);
            },
          })}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          icon={<Icon name="check" className="size-4" />}
        >
          Verify email
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-[12px] text-muted">
        <Link
          href="/login"
          className="font-semibold text-pri underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
        <button
          type="button"
          onClick={() => {
            window.location.href = continueUrl;
          }}
          className="font-semibold text-pri underline-offset-4 hover:underline"
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
