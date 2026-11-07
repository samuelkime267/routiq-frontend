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
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await authApi.forgotPassword(values.email);
      setSentTo(values.email);
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Could not send the reset link. Please try again.",
      );
    }
  });

  if (sent) {
    return (
      <>
        <AuthIntro
          eyebrow="Check your inbox"
          title="Reset link sent"
          description={`If ${sentTo} belongs to a Routiq account, a password reset link is on its way.`}
        />
        <Alert tone="success" title="Link sent">
          The link expires in 10 minutes. Check your spam folder if you do not
          see it within a minute.
        </Alert>
        <Button
          href="/login"
          fullWidth
          size="lg"
          className="mt-5"
          icon={<Icon name="arrow-left" className="size-4" />}
        >
          Back to sign in
        </Button>
        <p className="mt-4 text-center text-[12px] text-muted">
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setSentTo("");
            }}
            className="font-semibold text-pri underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthIntro
        eyebrow="Account recovery"
        title="Forgot your password?"
        description="Enter the email tied to your account and we will send a secure reset link."
      />

      {error ? (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon="mail"
          error={errors.email?.message}
          register={register("email")}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          icon={<Icon name="arrow-right" className="size-4" />}
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-pri underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
