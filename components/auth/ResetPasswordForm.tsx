"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthIntro from "@/components/auth/AuthIntro";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/FormField";
import { ApiError, authApi } from "@/lib/api";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/schemas/auth";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await authApi.resetPassword(token, values.password);
      setDone(true);
    } catch (resetError) {
      setError(
        resetError instanceof ApiError
          ? resetError.message
          : "Could not reset your password. The link may have expired.",
      );
    }
  });

  if (!token) {
    return (
      <>
        <AuthIntro
          eyebrow="Account recovery"
          title="Invalid reset link"
          description="This password reset link is missing its token."
        />
        <Alert tone="error">
          Request a new link from the forgot password page.
        </Alert>
        <Button
          href="/forgot-password"
          fullWidth
          size="lg"
          className="mt-5"
        >
          Request a new link
        </Button>
      </>
    );
  }

  if (done) {
    return (
      <>
        <AuthIntro
          eyebrow="Password updated"
          title="You're all set"
          description="Your password has been changed. Sign in with your new password to continue."
        />
        <Alert tone="success" title="Password changed">
          For your security, any other sessions will expire soon.
        </Alert>
        <Button
          href="/login"
          fullWidth
          size="lg"
          className="mt-5"
          icon={<Icon name="arrow-right" className="size-4" />}
        >
          Sign in
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthIntro
        eyebrow="Account recovery"
        title="Choose a new password"
        description="Use a strong password you have not used on Routiq before."
      />

      {error ? (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="New password"
          hint="At least 6 characters with upper, lower, number and symbol."
          error={errors.password?.message}
          register={register("password")}
        />

        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Repeat new password"
          error={errors.confirmPassword?.message}
          register={register("confirmPassword")}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          icon={<Icon name="check" className="size-4" />}
        >
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
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
