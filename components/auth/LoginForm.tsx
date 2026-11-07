"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthIntro from "@/components/auth/AuthIntro";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { ApiError, authApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import { saveAuth } from "@/lib/session";
import { roleHome, withSessionHandoff } from "@/lib/urls";

export default function LoginForm() {
  const router = useRouter();
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

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const result = await authApi.login({
        email: values.email,
        password: values.password,
      });

      saveAuth(result.token.accessToken, result.user);

      if (!result.user.isEmailVerified) {
        router.push("/verify-email");
        return;
      }

      window.location.assign(
        withSessionHandoff(
          roleHome(result.user.role),
          result.token.accessToken,
        ),
      );
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
      <AuthIntro
        eyebrow="Welcome back"
        title="Sign in to Routiq"
        description="Track orders, manage your storefront, and keep your customers moving."
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
          Sign in
        </Button>
      </form>

      <div className="mt-7 space-y-3 text-center text-[13px] text-muted">
        <p>
          New to Routiq?{" "}
          <Link
            href="/register"
            className="font-semibold text-pri underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p className="rounded-xl bg-well px-4 py-3 text-[12px]">
          Selling on Routiq?{" "}
          <Link
            href="/register?role=vendor"
            className="font-semibold text-pri underline-offset-4 hover:underline"
          >
            Open a vendor account
          </Link>
        </p>
      </div>
    </>
  );
}
