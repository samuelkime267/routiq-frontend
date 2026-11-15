"use client";

import { useState } from "react";
import { NIGERIAN_STATES } from "@/config/marketplace";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import Modal from "@/components/ui/Modal";
import { addressApi, ApiError } from "@/lib/api";
import type { AddressPayload, MarketplaceAddress } from "@/types/api";

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  address?: MarketplaceAddress | null;
  onSaved: (address: MarketplaceAddress) => void;
}

interface FormState {
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  lga: string;
  state: string;
  landmark: string;
  postalCode: string;
  isDefault: boolean;
}

const emptyForm: FormState = {
  label: "Home",
  recipientName: "",
  phone: "",
  street: "",
  city: "",
  lga: "",
  state: "",
  landmark: "",
  postalCode: "",
  isDefault: false,
};

function formFromAddress(address: MarketplaceAddress): FormState {
  return {
    label: address.label || "Home",
    recipientName: address.recipientName,
    phone: address.phone,
    street: address.street,
    city: address.city,
    lga: address.lga,
    state: address.state,
    landmark: address.landmark ?? "",
    postalCode: address.postalCode ?? "",
    isDefault: address.isDefault,
  };
}

export default function AddressFormModal(props: AddressFormModalProps) {
  if (!props.open) return null;

  // Remounting per opened address starts the form from a clean snapshot
  // without synchronising props into state in an effect.
  return <AddressForm key={props.address?._id ?? "new"} {...props} />;
}

function AddressForm({ open, onClose, address, onSaved }: AddressFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    address ? formFromAddress(address) : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload: AddressPayload = {
      label: form.label.trim() || "Home",
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      lga: form.lga.trim(),
      state: form.state,
      country: "Nigeria",
      landmark: form.landmark.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      isDefault: form.isDefault,
    };

    try {
      const result = address
        ? await addressApi.update(address._id, payload)
        : await addressApi.create(payload);

      onSaved(result.address);
      onClose();
    } catch (saveError) {
      if (saveError instanceof ApiError) {
        setError(saveError.message);
        setFieldErrors(saveError.fieldErrors);
      } else {
        setError("We could not save this address. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={address ? "Edit delivery address" : "Add a delivery address"}
      description="We use this address to calculate delivery for every store in your order."
      size="lg"
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {address ? "Save changes" : "Save address"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label" htmlFor="address-label" optional>
            <Input
              id="address-label"
              value={form.label}
              onChange={(event) => set("label", event.target.value)}
              placeholder="Home, Work, Mum's place"
            />
          </Field>

          <Field
            label="Recipient name"
            htmlFor="address-recipient"
            error={fieldErrors.recipientName}
          >
            <Input
              id="address-recipient"
              value={form.recipientName}
              onChange={(event) => set("recipientName", event.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </Field>

          <Field
            label="Phone number"
            htmlFor="address-phone"
            error={fieldErrors.phone}
            hint="For the rider to reach you on delivery."
          >
            <Input
              id="address-phone"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="08012345678"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          <Field
            label="Street address"
            htmlFor="address-street"
            error={fieldErrors.street}
          >
            <Input
              id="address-street"
              value={form.street}
              onChange={(event) => set("street", event.target.value)}
              placeholder="House number and street"
              autoComplete="street-address"
            />
          </Field>

          <Field label="City" htmlFor="address-city" error={fieldErrors.city}>
            <Input
              id="address-city"
              value={form.city}
              onChange={(event) => set("city", event.target.value)}
              placeholder="City"
              autoComplete="address-level2"
            />
          </Field>

          <Field
            label="Local government area"
            htmlFor="address-lga"
            error={fieldErrors.lga}
          >
            <Input
              id="address-lga"
              value={form.lga}
              onChange={(event) => set("lga", event.target.value)}
              placeholder="LGA"
              autoComplete="address-level3"
            />
          </Field>

          <Field
            label="State"
            htmlFor="address-state"
            error={fieldErrors.state}
          >
            <Select
              id="address-state"
              value={form.state}
              onChange={(event) => set("state", event.target.value)}
            >
              <option value="">Select a state</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Landmark"
            htmlFor="address-landmark"
            optional
            error={fieldErrors.landmark}
          >
            <Input
              id="address-landmark"
              value={form.landmark}
              onChange={(event) => set("landmark", event.target.value)}
              placeholder="Near the filling station"
            />
          </Field>

          <Field
            label="Postal code"
            htmlFor="address-postal"
            optional
            error={fieldErrors.postalCode}
          >
            <Input
              id="address-postal"
              value={form.postalCode}
              onChange={(event) => set("postalCode", event.target.value)}
              placeholder="100001"
              inputMode="numeric"
            />
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-soft/60 px-4 py-3">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(event) => set("isDefault", event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--pri)]"
          />
          <span>
            <span className="block text-[12px] font-semibold text-ink">
              Make this my default address
            </span>
            <span className="mt-0.5 block text-[11px] text-muted">
              It will be selected automatically for future checkouts.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
