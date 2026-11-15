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
import { clearAuth, saveAuth } from "@/lib/session";
import {
  AUTH_ROUTES,
  AUTH_SCOPE_ROLES,
  appNameForRole,
  authRegisterUrl,
  loginForRole,
  readNextPath,
  type AuthScope,
} from "@/lib/urls";
import { useHydrated } from "@/lib/useHydrated";

interface LoginFormProps {
  /** Which app host is rendering the form; only its roles may sign in. */
  scope?: AuthScope;
}

export default function LoginForm({ scope = "marketplace" }: LoginFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const [blockedRole, setBlockedRole] = useState<string | null>(null);

  // Read the return path on the client only so the register link can carry it
  // too, without a server/client markup mismatch.
  const nextPath = hydrated ? readNextPath() : null;
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
    setBlockedRole(null);

    try {
      const result = await authApi.login({
        email: values.email,
        password: values.password,
      });

      saveAuth(result.token.accessToken, result.user);

      // Credentials are correct, but this host only serves its own roles.
      // Sessions cannot move between subdomains, so the token is discarded
      // instead of leaving a half-signed-in account on the wrong app.
      if (!AUTH_SCOPE_ROLES[scope].includes(result.user.role)) {
        try {
          await authApi.logout();
        } catch {
          // The token is discarded locally even if the server call fails.
        }

        clearAuth();
        setBlockedRole(result.user.role);
        return;
      }

      if (!result.user.isEmailVerified) {
        router.push(AUTH_ROUTES.verifyEmail);
        return;
      }

      window.location.assign(nextPath ?? "/");
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
        title={scope === "vendor" ? "Sign in to your store" : "Sign in to Routiq"}
        description={
          scope === "vendor"
            ? "Manage your storefront, fulfil orders and track payouts from one dashboard."
            : "Track orders, manage your storefront, and keep your customers moving."
        }
      />

      {error ? (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      {blockedRole ? (
        <Alert
          tone="info"
          title={`Use the ${appNameForRole(blockedRole)} app`}
          className="mb-5"
        >
          Those details are correct, but this account belongs to the{" "}
          {appNameForRole(blockedRole)} app.{" "}
          <a
            href={loginForRole(blockedRole)}
            className="font-semibold text-pri underline underline-offset-4"
          >
            Sign in there
          </a>{" "}
          instead.
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
            href={AUTH_ROUTES.forgotPassword}
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
            href={authRegisterUrl(undefined, nextPath)}
            className="font-semibold text-pri underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        {scope === "marketplace" ? (
          <p className="rounded-xl bg-well px-4 py-3 text-[12px]">
            Selling on Routiq?{" "}
            <Link
              href={authRegisterUrl("vendor")}
              className="font-semibold text-pri underline-offset-4 hover:underline"
            >
              Open a vendor account
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
