"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Icon, type IconName } from "@/components/icons";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import PasswordInput from "@/components/ui/PasswordInput";
import { cn } from "@/lib/cn";

/**
 * Form fields wired for react-hook-form.
 *
 * Every field takes the result of `register("fieldName")` plus an optional
 * error message and renders both the control and its error automatically.
 * Server-side validation errors can be piped in through `setError`.
 */

interface FieldCommonProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** Class applied to the wrapper around the control and message. */
  fieldClassName?: string;
}

interface TextFieldProps
  extends Omit<ComponentPropsWithRef<"input">, "name">,
    FieldCommonProps {
  /** Optional leading icon rendered inside the control. */
  icon?: IconName;
}

export function TextField({
  label,
  register,
  error,
  hint,
  optional,
  fieldClassName,
  className,
  icon,
  id,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? register.name;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      optional={optional}
      className={fieldClassName}
    >
      <div className={icon ? "relative" : undefined}>
        {icon ? (
          <Icon
            name={icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          />
        ) : null}
        <Input
          id={fieldId}
          error={!!error}
          className={cn(icon && "pl-10", className)}
          {...props}
          {...register}
        />
      </div>
    </Field>
  );
}

interface TextareaFieldProps
  extends Omit<ComponentPropsWithRef<"textarea">, "name">,
    FieldCommonProps {}

export function TextareaField({
  label,
  register,
  error,
  hint,
  optional,
  fieldClassName,
  className,
  id,
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? register.name;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      optional={optional}
      className={fieldClassName}
    >
      <Textarea
        id={fieldId}
        error={!!error}
        className={className}
        {...props}
        {...register}
      />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps
  extends Omit<ComponentPropsWithRef<"select">, "name" | "children">,
    FieldCommonProps {
  options: SelectOption[];
  /** Rendered as a disabled first option when no value is selected. */
  placeholder?: string;
}

export function SelectField({
  label,
  register,
  error,
  hint,
  optional,
  fieldClassName,
  className,
  options,
  placeholder,
  id,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? register.name;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      optional={optional}
      className={fieldClassName}
    >
      <Select
        id={fieldId}
        error={!!error}
        className={className}
        {...props}
        {...register}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

interface PasswordFieldProps
  extends Omit<ComponentPropsWithRef<"input">, "name" | "type">,
    FieldCommonProps {
  icon?: IconName;
}

export function PasswordField({
  label,
  register,
  error,
  hint,
  optional,
  fieldClassName,
  className,
  icon,
  id,
  ...props
}: PasswordFieldProps) {
  const fieldId = id ?? register.name;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      optional={optional}
      className={fieldClassName}
    >
      <div className={icon ? "relative" : undefined}>
        {icon ? (
          <Icon
            name={icon}
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted"
          />
        ) : null}
        <PasswordInput
          id={fieldId}
          aria-invalid={!!error || undefined}
          className={cn(icon && "pl-10", className)}
          {...props}
          {...register}
          error={!!error}
        />
      </div>
    </Field>
  );
}

interface CheckboxFieldProps
  extends Omit<ComponentPropsWithRef<"input">, "name" | "type">,
    Omit<FieldCommonProps, "label"> {
  label: ReactNode;
  description?: ReactNode;
}

export function CheckboxField({
  label,
  description,
  register,
  error,
  optional,
  fieldClassName,
  className,
  id,
  ...props
}: CheckboxFieldProps) {
  const fieldId = id ?? register.name;

  return (
    <div className={cn("space-y-1.5", fieldClassName)}>
      <label
        htmlFor={fieldId}
        className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink"
      >
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={!!error || undefined}
          className={cn(
            "mt-0.5 size-4 shrink-0 rounded border-line accent-pri",
            error && "border-danger",
            className,
          )}
          {...props}
          {...register}
        />
        <span>
          {label}
          {optional ? (
            <span className="ml-1 font-normal text-muted">(optional)</span>
          ) : null}
          {description ? (
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p className="pl-6 text-[12px] leading-snug text-danger">{error}</p>
      ) : null}
    </div>
  );
}
