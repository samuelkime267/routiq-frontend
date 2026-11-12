"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useAdminSession } from "@/components/admin/AdminSession";
import { useResource } from "@/hooks/useResource";
import { adminApi, ApiError } from "@/lib/api";
import { formatAdminDate, formatAdminRole } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira } from "@/lib/format";
import type {
  PlatformSettings,
  UpdatePlatformSettingsPayload,
} from "@/types/api";

type SettingsGroup =
  | "marketplace"
  | "commission"
  | "storeApproval"
  | "shipping"
  | "notifications"
  | "security";

type SettingsTab =
  | SettingsGroup
  | "categories"
  | "profile";

const TABS = [
  { id: "marketplace", label: "Marketplace" },
  { id: "commission", label: "Commission" },
  { id: "categories", label: "Categories" },
  { id: "storeApproval", label: "Store approval" },
  { id: "shipping", label: "Shipping" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "profile", label: "My profile" },
];

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line px-3.5 py-3">
      <span>
        <span className="block text-[12.5px] font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 rounded border-line accent-pri"
      />
    </label>
  );
}

export default function PlatformSettingsScreen() {
  const resource = useResource(
    "platform-settings",
    () => adminApi.settings(),
    "We could not load platform settings.",
  );

  if (resource.loading && !resource.data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (resource.error && !resource.data) {
    return (
      <ErrorState
        title="Settings unavailable"
        description={resource.error}
        onRetry={resource.reload}
      />
    );
  }

  if (!resource.data) return null;

  return (
    <PlatformSettingsEditor
      key={resource.data.settings.updatedAt ?? "platform-settings"}
      settings={resource.data.settings}
      onRefresh={resource.reload}
      refreshing={resource.loading || resource.refreshing}
    />
  );
}

function PlatformSettingsEditor({
  settings,
  onRefresh,
  refreshing,
}: {
  settings: PlatformSettings;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const [tab, setTab] = useState<SettingsTab>("marketplace");
  const [form, setForm] = useState<PlatformSettings>(settings);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState<SettingsTab | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone ?? "");
  const [profilePicture, setProfilePicture] = useState(
    user.profilePicture ?? "",
  );
  const [profileReason, setProfileReason] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  function patch<K extends SettingsGroup>(
    group: K,
    value: Partial<PlatformSettings[K]>,
  ) {
    setForm((previous) =>
      previous ? { ...previous, [group]: { ...previous[group], ...value } } : previous,
    );
  }

  async function saveGroup(group: SettingsTab) {
    if (group === "profile") return;

    const payload: UpdatePlatformSettingsPayload = {
      reason: reason.trim() || undefined,
    };

    switch (group) {
      case "marketplace":
        payload.marketplace = form.marketplace;
        break;
      case "commission":
        payload.commission = {
          ratePercent: form.commission.ratePercent,
          note: form.commission.note,
        };
        break;
      case "categories":
        payload.productCategories = form.productCategories;
        break;
      case "storeApproval":
        payload.storeApproval = form.storeApproval;
        break;
      case "shipping":
        payload.shipping = form.shipping;
        break;
      case "notifications":
        payload.notifications = form.notifications;
        break;
      case "security":
        payload.security = form.security;
        break;
    }

    setSaving(group);

    try {
      const result = await adminApi.updateSettings(payload);
      setForm(result.settings);
      setReason("");
      toast({
        tone: "success",
        title: "Settings updated",
        description: "The change was recorded in the audit trail.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not save settings",
        description:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Please try again.",
      });
    } finally {
      setSaving(null);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);

    try {
      await adminApi.updateProfile({
        name: profileName,
        phone: profilePhone || null,
        profilePicture: profilePicture || null,
        reason: profileReason.trim() || undefined,
      });
      setProfileReason("");
      toast({
        tone: "success",
        title: "Profile updated",
        description: "Your administrator profile was saved.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not update your profile",
        description:
          error instanceof ApiError
            ? error.message
            : "Please try again shortly.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  const saveButton = (group: SettingsTab, label = "Save changes") => (
    <Button
      size="sm"
      loading={saving === group}
      onClick={() => void saveGroup(group)}
      icon={<Icon name="check" />}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Platform settings"
        eyebrow="Administration"
        description="Configure marketplace presentation, commission reference, categories, approvals, shipping defaults, notifications and security windows. Every change is audited."
        breadcrumbs={breadcrumbsFor("/settings")}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="refresh" />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">Updated {formatAdminDate(form.updatedAt)}</Badge>
            <Badge tone="green">Audited</Badge>
            <Badge tone="neutral">NGN · Africa/Lagos</Badge>
          </div>
        }
      />

      <Tabs
        variant="underline"
        ariaLabel="Settings sections"
        value={tab}
        onChange={(id) => {
          setTab(id as SettingsTab);
          setReason("");
        }}
        items={TABS}
      />

      {form.commission.appliesToRecordedPayments === false ? (
        <div className="flex items-start gap-3 rounded-2xl border border-pri/15 bg-well/60 px-4 py-3.5">
          <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-pri" />
          <p className="text-[11.5px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Money already recorded is untouched.</span>{" "}
            Commission percentages are reference values for future pricing. Each
            payment stores the commission and escrow amounts calculated when it
            was captured, so changing a rate here cannot rewrite a settled
            transaction or escrow balance.
          </p>
        </div>
      ) : null}

      {tab === "marketplace" ? (
        <SettingsCard
          title="Marketplace identity"
          description="Customer-facing names and support contacts."
          footer={saveButton("marketplace")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marketplace name" htmlFor="settings-name">
              <Input
                id="settings-name"
                value={form.marketplace.name}
                onChange={(event) => patch("marketplace", { name: event.target.value })}
              />
            </Field>
            <Field label="Support email" htmlFor="settings-email">
              <Input
                id="settings-email"
                type="email"
                value={form.marketplace.supportEmail}
                onChange={(event) =>
                  patch("marketplace", { supportEmail: event.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Tagline" htmlFor="settings-tagline">
            <Input
              id="settings-tagline"
              value={form.marketplace.tagline}
              onChange={(event) => patch("marketplace", { tagline: event.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support phone" htmlFor="settings-phone" optional>
              <Input
                id="settings-phone"
                value={form.marketplace.supportPhone ?? ""}
                onChange={(event) =>
                  patch("marketplace", { supportPhone: event.target.value || null })
                }
              />
            </Field>
            <Field label="Timezone" htmlFor="settings-timezone" hint="Locked to Nigerian time.">
              <Select id="settings-timezone" value={form.marketplace.timezone} disabled>
                <option value="Africa/Lagos">Africa/Lagos</option>
              </Select>
            </Field>
          </div>
        </SettingsCard>
      ) : null}

      {tab === "commission" ? (
        <SettingsCard
          title="Commission reference"
          description="Percentage retained by the marketplace when pricing new business."
          footer={saveButton("commission")}
        >
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <Field
              label="Rate (%)"
              htmlFor="settings-commission"
              hint="0–50%"
            >
              <Input
                id="settings-commission"
                type="number"
                min={0}
                max={50}
                step="0.1"
                value={form.commission.ratePercent}
                onChange={(event) =>
                  patch("commission", { ratePercent: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Operator note" htmlFor="settings-commission-note">
              <Input
                id="settings-commission-note"
                value={form.commission.note}
                onChange={(event) => patch("commission", { note: event.target.value })}
              />
            </Field>
          </div>
          <div className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              How this is applied
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              New transactions calculate commission from this rate. Existing
              payments keep their stored commission snapshot, and escrow release
              amounts come from the payment and escrow ledger, never from this
              screen.
            </p>
          </div>
        </SettingsCard>
      ) : null}

      {tab === "categories" ? (
        <SettingsCard
          title="Product categories"
          description="The catalogue taxonomy vendors choose from when publishing products."
          footer={saveButton("categories")}
        >
          <div className="flex flex-wrap gap-1.5">
            {form.productCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-medium text-ink"
              >
                {category}
                <button
                  type="button"
                  aria-label={`Remove ${category}`}
                  onClick={() =>
                    setForm((previous) =>
                      previous
                        ? {
                            ...previous,
                            productCategories: previous.productCategories.filter(
                              (item) => item !== category,
                            ),
                          }
                        : previous,
                    )
                  }
                  className="text-muted transition hover:text-danger"
                >
                  <Icon name="x" className="size-3" />
                </button>
              </span>
            ))}
            {form.productCategories.length === 0 ? (
              <p className="text-[12px] text-muted">No categories configured.</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Add a category" htmlFor="settings-new-category" className="flex-1">
              <Input
                id="settings-new-category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="e.g. Frozen Foods"
              />
            </Field>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="plus" />}
              disabled={newCategory.trim().length < 2}
              onClick={() => {
                const value = newCategory.trim();
                if (!value) return;
                setForm((previous) =>
                  previous
                    ? {
                        ...previous,
                        productCategories: [
                          ...new Set([...previous.productCategories, value]),
                        ],
                      }
                    : previous,
                );
                setNewCategory("");
              }}
            >
              Add category
            </Button>
          </div>
        </SettingsCard>
      ) : null}

      {tab === "storeApproval" ? (
        <SettingsCard
          title="Store approval workflow"
          description="How new store applications enter the review queue."
          footer={saveButton("storeApproval")}
        >
          <ToggleRow
            label="Require manual review"
            description="Every submitted store waits for an administrator decision."
            checked={form.storeApproval.requireManualReview}
            onChange={(checked) =>
              patch("storeApproval", { requireManualReview: checked })
            }
          />
          <ToggleRow
            label="Auto-approve verified stores"
            description="Skip manual review when all KYB documents are verified."
            checked={form.storeApproval.autoApproveVerifiedStores}
            onChange={(checked) =>
              patch("storeApproval", { autoApproveVerifiedStores: checked })
            }
          />
          <Field
            label="Review SLA (hours)"
            htmlFor="settings-sla"
            hint="Used to flag overdue reviews in the operations queue."
          >
            <Input
              id="settings-sla"
              type="number"
              min={1}
              max={720}
              value={form.storeApproval.reviewSlaHours}
              onChange={(event) =>
                patch("storeApproval", { reviewSlaHours: Number(event.target.value) })
              }
            />
          </Field>
        </SettingsCard>
      ) : null}

      {tab === "shipping" ? (
        <SettingsCard
          title="Delivery defaults"
          description="Fallback shipping values. Shipbubble remains the delivery provider."
          footer={saveButton("shipping")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider" htmlFor="settings-provider">
              <Select id="settings-provider" value={form.shipping.provider} disabled>
                <option value="shipbubble">Shipbubble</option>
              </Select>
            </Field>
            <Field
              label="Default delivery fee (₦)"
              htmlFor="settings-delivery-fee"
              hint={formatNaira(form.shipping.defaultDeliveryFee)}
            >
              <Input
                id="settings-delivery-fee"
                type="number"
                min={0}
                value={form.shipping.defaultDeliveryFee}
                onChange={(event) =>
                  patch("shipping", {
                    defaultDeliveryFee: Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field
              label="Free shipping threshold (₦)"
              htmlFor="settings-free-shipping"
              optional
              hint={
                form.shipping.freeShippingThreshold === null
                  ? "No free shipping threshold"
                  : formatNaira(form.shipping.freeShippingThreshold)
              }
            >
              <Input
                id="settings-free-shipping"
                type="number"
                min={0}
                value={form.shipping.freeShippingThreshold ?? ""}
                onChange={(event) =>
                  patch("shipping", {
                    freeShippingThreshold: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
              />
            </Field>
            <Field
              label="Estimated delivery days"
              htmlFor="settings-delivery-days"
            >
              <Input
                id="settings-delivery-days"
                type="number"
                min={1}
                max={30}
                value={form.shipping.estimatedDeliveryDays}
                onChange={(event) =>
                  patch("shipping", {
                    estimatedDeliveryDays: Number(event.target.value),
                  })
                }
              />
            </Field>
          </div>
        </SettingsCard>
      ) : null}

      {tab === "notifications" ? (
        <SettingsCard
          title="Administrative notifications"
          description="Email routing for the console team. Delivery still depends on configured SMTP."
          footer={saveButton("notifications")}
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <ToggleRow
              label="Email enabled"
              description="Master switch for transactional and administrative email."
              checked={form.notifications.emailEnabled}
              onChange={(checked) => patch("notifications", { emailEnabled: checked })}
            />
            <ToggleRow
              label="Daily admin digest"
              description="Send the operations summary once per day."
              checked={form.notifications.adminDailyDigest}
              onChange={(checked) =>
                patch("notifications", { adminDailyDigest: checked })
              }
            />
            <ToggleRow
              label="Vendor alerts"
              description="Notify the team about vendor account changes."
              checked={form.notifications.vendorAlerts}
              onChange={(checked) => patch("notifications", { vendorAlerts: checked })}
            />
            <ToggleRow
              label="Dispute alerts"
              description="Raise an alert when a new dispute is opened."
              checked={form.notifications.disputeAlerts}
              onChange={(checked) =>
                patch("notifications", { disputeAlerts: checked })
              }
            />
            <ToggleRow
              label="Store submission alerts"
              description="Notify reviewers when a store application arrives."
              checked={form.notifications.storeSubmissionAlerts}
              onChange={(checked) =>
                patch("notifications", { storeSubmissionAlerts: checked })
              }
            />
          </div>
        </SettingsCard>
      ) : null}

      {tab === "security" ? (
        <SettingsCard
          title="Security windows"
          description="Invitation, reset and audit retention limits."
          footer={saveButton("security")}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Invitation expiry (hours)"
              htmlFor="settings-invitation-expiry"
              hint="Default 168 hours (7 days)."
            >
              <Input
                id="settings-invitation-expiry"
                type="number"
                min={1}
                max={720}
                value={form.security.invitationExpiryHours}
                onChange={(event) =>
                  patch("security", {
                    invitationExpiryHours: Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field
              label="Password reset (minutes)"
              htmlFor="settings-reset-expiry"
            >
              <Input
                id="settings-reset-expiry"
                type="number"
                min={5}
                max={1440}
                value={form.security.passwordResetExpiryMinutes}
                onChange={(event) =>
                  patch("security", {
                    passwordResetExpiryMinutes: Number(event.target.value),
                  })
                }
              />
            </Field>
            <Field
              label="Audit retention (days)"
              htmlFor="settings-audit-retention"
            >
              <Input
                id="settings-audit-retention"
                type="number"
                min={30}
                max={3650}
                value={form.security.auditRetentionDays}
                onChange={(event) =>
                  patch("security", {
                    auditRetentionDays: Number(event.target.value),
                  })
                }
              />
            </Field>
          </div>
          <ToggleRow
            label="Require a reason for destructive actions"
            description="Ask operators to explain suspensions, revocations and other sensitive changes."
            checked={form.security.requireReasonForDestructiveActions}
            onChange={(checked) =>
              patch("security", {
                requireReasonForDestructiveActions: checked,
              })
            }
          />
        </SettingsCard>
      ) : null}

      {tab === "profile" ? (
        <SettingsCard
          title="My administrator profile"
          description="Your own details. Role, status and permissions are managed from the directory."
          footer={
            <Button
              size="sm"
              loading={savingProfile}
              onClick={() => void saveProfile()}
              icon={<Icon name="check" />}
            >
              Save profile
            </Button>
          }
        >
          <div className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
            <p className="text-[12px] font-semibold text-ink">{user.name}</p>
            <p className="text-[11px] text-muted">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tone="teal">{formatAdminRole(user.adminRole)}</Badge>
              <Badge tone="neutral">{user.adminStatus}</Badge>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="profile-name">
              <Input
                id="profile-name"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </Field>
            <Field label="Phone" htmlFor="profile-phone" optional>
              <Input
                id="profile-phone"
                value={profilePhone}
                onChange={(event) => setProfilePhone(event.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Profile picture URL"
            htmlFor="profile-picture"
            optional
            hint="Upload a picture first, then paste the returned URL."
          >
            <Input
              id="profile-picture"
              value={profilePicture}
              onChange={(event) => setProfilePicture(event.target.value)}
            />
          </Field>
          <Field label="Reason" htmlFor="profile-reason" optional>
            <Textarea
              id="profile-reason"
              value={profileReason}
              onChange={(event) => setProfileReason(event.target.value)}
              placeholder="Optional note for the audit trail"
              maxLength={500}
            />
          </Field>
        </SettingsCard>
      ) : null}

      {tab !== "profile" ? (
        <div className="rounded-2xl border border-line bg-white px-4 py-3.5">
          <Field
            label="Reason for this change"
            htmlFor="settings-reason"
            optional
            hint="Stored on the audit record together with your identity."
          >
            <Textarea
              id="settings-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this group of settings is changing"
              maxLength={500}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function SettingsCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
        {footer}
      </header>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  );
}
