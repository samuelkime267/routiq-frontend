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
import { ApiError, adminAuthApi } from "@/lib/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth";

export default function AdminForgotPasswordForm() {
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
      await adminAuthApi.forgotPassword(values.email);
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
          eyebrow="Admin recovery"
          title="Check your inbox"
          description={`If ${sentTo} belongs to an active admin account, a secure reset link is on its way.`}
        />
        <Alert tone="success" title="Request received">
          For security, we do not confirm whether an admin account exists. The
          link expires in 10 minutes.
        </Alert>
        <Button
          href="/login"
          fullWidth
          size="lg"
          className="mt-5"
          icon={<Icon name="arrow-left" className="size-4" />}
        >
          Back to admin sign in
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
        eyebrow="Admin recovery"
        title="Reset your admin password"
        description="Enter the work email attached to your admin account. We will send a secure, single-use reset link."
      />

      {error ? (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="admin@routiq.ng"
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
          Back to admin sign in
        </Link>
      </p>
    </>
  );
}
