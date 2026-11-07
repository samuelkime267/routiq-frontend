"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import { TextareaField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, vendorApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import {
  vendorStatusFormSchema,
  type VendorStatusFormValues,
} from "@/lib/schemas/store";

interface VendorStatusDialogProps {
  vendorId: string;
  vendorName: string;
  /** Suspended vendors are reactivated; every other status is suspended. */
  currentStatus: "active" | "inactive" | "suspended";
  onClose: () => void;
  onCompleted?: () => void;
}

/**
 * Suspends or reactivates a vendor *account*.
 *
 * This does not touch the vendor's store status; store suspension is a
 * separate store-level decision with its own audit trail.
 */
export default function VendorStatusDialog({
  vendorId,
  vendorName,
  currentStatus,
  onClose,
  onCompleted,
}: VendorStatusDialogProps) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const suspending = currentStatus !== "suspended";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorStatusFormValues>({
    resolver: zodResolver(vendorStatusFormSchema),
    defaultValues: {
      status: suspending ? "suspended" : "active",
      reason: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await vendorApi.updateStatus(vendorId, {
        status: values.status,
        reason: values.status === "suspended" ? values.reason : undefined,
      });

      toast({
        tone: "success",
        title: suspending
          ? `${vendorName} suspended`
          : `${vendorName} reactivated`,
        description: suspending
          ? "The vendor can no longer sign in or trade until reactivated."
          : "The vendor account is active again.",
      });

      onCompleted?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, ["reason"]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The vendor account could not be updated.",
        );
      }
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={
        suspending ? "Suspend vendor account" : "Reactivate vendor account"
      }
      description={
        suspending
          ? "Suspending blocks the vendor from signing in and trading. Their store and data are preserved."
          : "Reactivating restores sign-in and trading access for this vendor."
      }
      size="md"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="vendor-status-form"
            size="sm"
            variant={suspending ? "danger" : "primary"}
            loading={isSubmitting}
          >
            {suspending ? "Suspend account" : "Reactivate account"}
          </Button>
        </>
      }
    >
      <form
        id="vendor-status-form"
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        <div className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            Vendor
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink">{vendorName}</p>
        </div>

        {suspending ? (
          <TextareaField
            label="Suspension reason"
            required
            rows={5}
            placeholder="Explain why this vendor account is being suspended"
            hint="Shared with the vendor and recorded in the audit trail."
            error={errors.reason?.message}
            register={register("reason")}
          />
        ) : (
          <p className="rounded-xl border border-line bg-well/40 px-3.5 py-3 text-[12px] leading-relaxed text-muted">
            The vendor keeps their store, products and history. They will be
            notified in-app that access is restored.
          </p>
        )}

        {formError ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-[12px] font-medium text-danger"
          >
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
