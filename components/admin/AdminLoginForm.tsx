"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthIntro from "@/components/auth/AuthIntro";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { ApiError, adminAuthApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { saveAuth } from "@/lib/session";
import { useHydrated } from "@/lib/useHydrated";

export default function AdminLoginForm() {
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const reason = hydrated
    ? new URLSearchParams(window.location.search).get("reason")
    : null;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const result = await adminAuthApi.login({
        email: values.email,
        password: values.password,
      });

      if (result.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }

      saveAuth(result.token.accessToken, result.user);
      window.location.replace("/");
    } catch (loginError) {
      if (loginError instanceof ApiError) {
        setError(loginError.message);
        applyApiFieldErrors(setFieldError, loginError.fieldErrors, [
          "email",
          "password",
        ]);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  });

  return (
    <>
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-well px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-pri uppercase">
        <Icon name="shield" className="size-3.5" />
        Admin access only
      </div>

      <AuthIntro
        eyebrow="Routiq administration"
        title="Sign in to the admin console"
        description="Use the credentials tied to your administrative account. Customer and vendor accounts cannot access this console."
      />

      {reason === "expired" ? (
        <Alert tone="info" className="mb-5">
          Your session expired or was signed out. Sign in again to continue.
        </Alert>
      ) : null}

      {reason === "denied" ? (
        <Alert tone="error" className="mb-5">
          Your admin account is not active or no longer has console access.
          Contact a Super Admin if you believe this is a mistake.
        </Alert>
      ) : null}

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

        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          icon="lock"
          error={errors.password?.message}
          register={register("password")}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[12px] font-semibold text-pri underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          icon={<Icon name="arrow-right" className="size-4" />}
        >
          Sign in securely
        </Button>
      </form>

      <p className="mt-7 rounded-xl bg-well px-4 py-3 text-center text-[12px] leading-relaxed text-muted">
        Admin accounts are invite-only. Ask a Super Admin to invite you if you
        need access.
      </p>
    </>
  );
}
