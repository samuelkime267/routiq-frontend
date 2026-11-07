"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import { useAdminSession } from "@/components/admin/AdminSession";
import { ADMIN_PERMISSION_LABELS } from "@/lib/admin";
import { visibleNavigation } from "@/lib/adminNavigation";
import type { AdminPermission } from "@/types/api";

interface RequirePermissionProps {
  /** The route is available when the admin holds at least one permission. */
  permissions: AdminPermission[];
  children: ReactNode;
}

export default function RequirePermission({
  permissions,
  children,
}: RequirePermissionProps) {
  const { permissions: granted } = useAdminSession();
  const allowed = permissions.some((permission) =>
    granted.includes(permission),
  );

  if (!allowed) {
    return <AccessDenied required={permissions} />;
  }

  return <>{children}</>;
}

export function AccessDenied({
  required,
}: {
  required: AdminPermission[];
}) {
  const { permissions } = useAdminSession();
  const fallback = visibleNavigation(permissions)[0]?.items[0];

  return (
    <div className="rounded-[24px] border border-line bg-white px-6 py-12 text-center sm:px-10">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger">
        <Icon name="lock" className="size-6" />
      </span>
      <h1 className="mt-4 text-[21px] leading-tight font-semibold tracking-[-0.03em] text-ink">
        You do not have access to this area
      </h1>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
        This section requires the{" "}
        {required.map((permission, index) => (
          <span key={permission}>
            {index > 0 ? " or " : ""}
            <span className="font-semibold text-ink">
              {ADMIN_PERMISSION_LABELS[permission]}
            </span>
          </span>
        ))}{" "}
        permission. Ask a Super Admin to update your access if you need it.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button href={fallback?.href ?? "/"} size="sm">
          Go to {fallback?.label ?? "dashboard"}
        </Button>
        <Button href="/" variant="outline" size="sm">
          Back to dashboard
        </Button>
      </div>
      <Link
        href="/"
        className="mt-5 inline-block text-[11px] font-semibold text-muted transition hover:text-pri"
      >
        Or return to the admin home
      </Link>
    </div>
  );
}
