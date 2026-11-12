"use client";

import type { AdminPermission, PermissionCatalogue } from "@/types/api";
import { ADMIN_PERMISSION_LABELS } from "@/lib/admin";

interface PermissionPickerProps {
  catalogue: PermissionCatalogue | null;
  value: AdminPermission[];
  onChange: (permissions: AdminPermission[]) => void;
  disabled?: boolean;
  /** Permissions the signed-in administrator does not hold themselves. */
  unavailable?: readonly AdminPermission[];
}

/**
 * Grouped permission selector used by the role editor. Selecting a permission
 * is shown with a filled state and a check mark, never colour alone.
 */
export default function PermissionPicker({
  catalogue,
  value,
  onChange,
  disabled = false,
  unavailable = [],
}: PermissionPickerProps) {
  const selected = new Set(value);

  function toggle(permission: AdminPermission) {
    if (disabled || unavailable.includes(permission)) return;

    const next = new Set(selected);
    if (next.has(permission)) next.delete(permission);
    else next.add(permission);

    onChange([...next]);
  }

  if (!catalogue) {
    return (
      <div className="rounded-xl border border-line bg-soft/40 px-4 py-6 text-center text-[12px] text-muted">
        Loading permission catalogue…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {catalogue.groups.map((group) => (
        <section
          key={group.label}
          className="rounded-xl border border-line bg-white p-3"
        >
          <h3 className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            {group.label}
          </h3>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {group.permissions.map((permission) => {
              const isSelected = selected.has(permission.key);
              const isUnavailable = unavailable.includes(permission.key);

              return (
                <button
                  key={permission.key}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={disabled || isUnavailable}
                  onClick={() => toggle(permission.key)}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                    isSelected
                      ? "border-pri bg-pri/5"
                      : "border-line bg-white hover:border-pri/30 hover:bg-well/40"
                  } ${isUnavailable ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <span
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold ${
                      isSelected
                        ? "border-pri bg-pri text-white"
                        : "border-line bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-ink">
                      {permission.label || ADMIN_PERMISSION_LABELS[permission.key]}
                    </span>
                    <span className="block truncate text-[10px] text-muted">
                      {permission.key}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
