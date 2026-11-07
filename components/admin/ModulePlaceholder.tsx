"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useAdminSession } from "@/components/admin/AdminSession";
import { ADMIN_PERMISSION_LABELS } from "@/lib/admin";
import { breadcrumbsFor, findNavItem } from "@/lib/adminNavigation";

/**
 * Deliberate placeholder for console areas whose business modules are built in
 * later tasks. It still proves the shell, page header, breadcrumbs, permission
 * labels and empty-state patterns on every registered route.
 */
export default function ModulePlaceholder() {
  const pathname = usePathname();
  const { permissions } = useAdminSession();
  const match = findNavItem(pathname);

  if (!match) {
    return (
      <EmptyState
        icon="inbox"
        title="Page not found"
        description="This console route does not exist. Use the navigation to return to a known area."
        action={<Button href="/">Back to dashboard</Button>}
      />
    );
  }

  const { item, group } = match;

  return (
    <div className="space-y-5">
      <PageHeader
        title={item.label}
        eyebrow={group.label}
        description={item.description}
        breadcrumbs={breadcrumbsFor(pathname)}
        actions={
          <Button href="/" variant="outline" size="sm" icon={<Icon name="arrow-left" />}>
            Back to dashboard
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="amber">Module in progress</Badge>
            {item.permissions.map((permission) => (
              <Badge key={permission} tone="neutral">
                {ADMIN_PERMISSION_LABELS[permission]}
              </Badge>
            ))}
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <EmptyState
          icon={item.icon}
          title={`${item.label} is not enabled yet`}
          description="The application shell, navigation and permission gate for this area are ready. The operating data and actions arrive in a dedicated module task."
          action={
            <Button href="/" variant="outline" size="sm">
              Return to overview
            </Button>
          }
          className="bg-white"
        />

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-well text-pri">
              <Icon name="lock" className="size-4" />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-ink">
                Access requirements
              </h2>
              <p className="text-[11px] text-muted">
                Checked on this page and by the API.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {item.permissions.map((permission) => {
              const granted = permissions.includes(permission);

              return (
                <li
                  key={permission}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5"
                >
                  <span className="text-[12px] font-semibold text-ink">
                    {ADMIN_PERMISSION_LABELS[permission]}
                  </span>
                  <span
                    className={
                      granted
                        ? "inline-flex items-center gap-1 text-[10px] font-semibold text-success"
                        : "inline-flex items-center gap-1 text-[10px] font-semibold text-muted"
                    }
                  >
                    <Icon
                      name={granted ? "check-circle" : "lock"}
                      className="size-3.5"
                    />
                    {granted ? "Granted" : "Restricted"}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 rounded-xl bg-well/60 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
            Any of the listed permissions opens this route. Actions inside the
            module will require their own specific permission.
          </p>

          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-pri transition hover:underline"
          >
            <Icon name="activity" className="size-3.5" />
            Back to the admin overview
          </Link>
        </div>
      </section>
    </div>
  );
}
