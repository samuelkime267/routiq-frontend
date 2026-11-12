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
import { adminAuthApi, ApiError } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import {
  acceptInvitationSchema,
  type AcceptInvitationValues,
} from "@/lib/schemas/admin";
import { saveAuth } from "@/lib/session";

interface AdminAcceptInvitationFormProps {
  token: string;
}

/**
 * Public activation screen for an administrative invitation. A successful
 * acceptance signs the new administrator in and sends them to the console.
 */
export default function AdminAcceptInvitationForm({
  token,
}: AdminAcceptInvitationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <>
        <AuthIntro
          eyebrow="Admin invitation"
          title="Invalid invitation link"
          description="This invitation link is missing its token."
        />
        <Alert tone="error">
          Ask a Super Admin to send a new invitation from the admin directory.
        </Alert>
        <Button href="/login" fullWidth size="lg" className="mt-5">
          Go to sign in
        </Button>
      </>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const result = await adminAuthApi.acceptInvitation(token, values.password);

      if (result.user.role !== "admin") {
        setError("This invitation does not grant admin access.");
        return;
      }

      saveAuth(result.token.accessToken, result.user);
      window.location.replace("/");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
        applyApiFieldErrors(setFieldError, submitError.fieldErrors, [
          "password",
          "confirmPassword",
        ]);
      } else {
        setError("Could not activate your account. Please try again.");
      }
    }
  });

  return (
    <>
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-well px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-pri uppercase">
        <Icon name="shield" className="size-3.5" />
        Invitation only
      </div>

      <AuthIntro
        eyebrow="Admin invitation"
        title="Activate your admin account"
        description="Choose a password to accept your invitation. The link works once and expires automatically."
      />

      {error ? (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordField
          label="Create a password"
          autoComplete="new-password"
          placeholder="New password"
          hint="At least 6 characters with upper, lower, number and symbol."
          error={errors.password?.message}
          register={register("password")}
        />

        <PasswordField
          label="Confirm password"
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
          icon={<Icon name="check-circle" className="size-4" />}
        >
          Accept invitation
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Already activated?{" "}
        <Link
          href="/login"
          className="font-semibold text-pri underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
