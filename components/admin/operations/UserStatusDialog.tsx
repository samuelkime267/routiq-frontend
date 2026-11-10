"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import { TextareaField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, userAdminApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import {
  vendorStatusFormSchema,
  type VendorStatusFormValues,
} from "@/lib/schemas/store";

interface UserStatusDialogProps {
  userId: string;
  userName: string;
  currentStatus: "active" | "inactive" | "suspended";
  onClose: () => void;
  onCompleted?: () => void;
}

/**
 * Suspends or reactivates a customer/vendor account.
 *
 * A suspension always carries a reason; reactivation clears the stored reason.
 * Administrator accounts are managed through the admin invitation endpoints.
 */
export default function UserStatusDialog({
  userId,
  userName,
  currentStatus,
  onClose,
  onCompleted,
}: UserStatusDialogProps) {
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
      await userAdminApi.updateStatus(userId, {
        status: values.status,
        reason: values.status === "suspended" ? values.reason : undefined,
      });

      toast({
        tone: "success",
        title: suspending ? `${userName} suspended` : `${userName} reactivated`,
        description: suspending
          ? "The account can no longer sign in until it is reactivated."
          : "The account is active again.",
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
            : "The account could not be updated.",
        );
      }
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={suspending ? "Suspend account" : "Reactivate account"}
      description={
        suspending
          ? "Suspending blocks sign-in. Orders, payments and support history are preserved."
          : "Reactivating restores sign-in for this account."
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
            form="user-status-form"
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
        id="user-status-form"
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        <div className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            Account
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink">{userName}</p>
        </div>

        {currentStatus === "suspended" ? (
          <p className="rounded-xl border border-line bg-well/40 px-3.5 py-3 text-[12px] leading-relaxed text-muted">
            The suspension reason is cleared when the account is reactivated.
            The change is recorded in the audit trail.
          </p>
        ) : (
          <TextareaField
            label="Suspension reason"
            required
            rows={5}
            placeholder="Explain why this account is being suspended"
            hint="Recorded in the audit trail and shown on the account."
            error={errors.reason?.message}
            register={register("reason")}
          />
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
