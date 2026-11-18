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
import {
  CheckboxField,
  PasswordField,
  TextField,
} from "@/components/ui/FormField";
import { ApiError, authApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";
import { saveAuth } from "@/lib/session";
import {
  AUTH_ROUTES,
  authLoginUrl,
  readNextPath,
  type AuthScope,
} from "@/lib/urls";
import { useHydrated } from "@/lib/useHydrated";

interface RegisterFormProps {
  /**
   * Which app host is rendering the form. Each host only creates the role it
   * serves: shoppers on the marketplace, vendors on the vendor host.
   */
  scope?: AuthScope;
}

export default function RegisterForm({
  scope = "marketplace",
}: RegisterFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const role = scope === "vendor" ? "vendor" : "user";
  const [error, setError] = useState<string | null>(null);
  const nextPath = hydrated ? readNextPath() : null;

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      const result = await authApi.register({
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
        role,
      });

      saveAuth(result.token.accessToken, result.user);

      if (!result.user.isEmailVerified) {
        router.push(AUTH_ROUTES.verifyEmail);
        return;
      }

      window.location.assign(nextPath ?? "/");
    } catch (registerError) {
      if (registerError instanceof ApiError) {
        setError(registerError.message);
        applyApiFieldErrors(setFieldError, registerError.fieldErrors, [
          "name",
          "username",
          "email",
          "password",
          "confirmPassword",
        ]);

        if (registerError.fieldErrors?.terms) {
          setFieldError("acceptedTerms", {
            type: "server",
            message: registerError.fieldErrors.terms,
          });
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  });

  return (
    <>
      <AuthIntro
        eyebrow="Get started"
        title={role === "vendor" ? "Open your storefront" : "Create your account"}
        description={
          role === "vendor"
            ? "Create a vendor account, then complete your store and KYB details for review."
            : "Save favourites, check out faster, and follow every delivery from your phone."
        }
      />

      {error ? (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Ada Obi"
          icon="user"
          error={errors.name?.message}
          register={register("name")}
        />

        <TextField
          label="Username"
          autoComplete="username"
          placeholder="adaobi"
          hint={
            role === "vendor"
              ? "This is how customers will see your store."
              : "This is how other shoppers will see you."
          }
          error={errors.username?.message}
          register={register("username")}
        />

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
          autoComplete="new-password"
          placeholder="Create a password"
          icon="lock"
          hint="At least 6 characters with upper, lower, number and symbol."
          error={errors.password?.message}
          register={register("password")}
        />

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          register={register("confirmPassword")}
        />

        <CheckboxField
          label="I agree to the Routiq marketplace terms and privacy policy."
          error={errors.acceptedTerms?.message}
          register={register("acceptedTerms")}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          icon={<Icon name="arrow-right" className="size-4" />}
        >
          {role === "vendor" ? "Create vendor account" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link
          href={authLoginUrl(nextPath)}
          className="font-semibold text-pri underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
