"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "@/components/icons";
import { Input } from "@/components/ui/Form";

export type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

/**
 * Password field with a visibility toggle. Forwards its ref so it can be used
 * directly with react-hook-form's `register()` result.
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, error, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          error={error}
          type={visible ? "text" : "password"}
          className={`pr-12 ${className ?? ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-well hover:text-pri"
        >
          <Icon name={visible ? "eye-off" : "eye"} className="size-4" />
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
