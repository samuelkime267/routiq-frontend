"use client";

import { useId, type ChangeEvent } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
  id,
  disabled,
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Icon
        name="search"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
      />
      <input
        id={inputId}
        type="text"
        role="searchbox"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        className={cn(
          "h-10 w-full rounded-xl border border-line bg-white pr-9 pl-10 text-[13px] text-ink transition",
          "placeholder:text-muted/70 focus:border-pri focus:ring-4 focus:ring-pri/10",
          "disabled:cursor-not-allowed disabled:bg-soft",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-well hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
        >
          <Icon name="x" className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
