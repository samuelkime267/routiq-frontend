"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import { TextareaField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, storeAdminApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import {
  STORE_ACTION_LABELS,
  storeActionSchema,
  type StoreActionKind,
  type StoreActionValues,
} from "@/lib/schemas/store";

interface StoreActionDialogProps {
  storeId: string;
  storeName: string;
  action: StoreActionKind;
  onClose: () => void;
  onCompleted?: () => void;
}

/**
 * Confirmation dialog for the five administrative store decisions.
 *
 * The form is shared across actions; the schema validates only the field the
 * selected action requires. Mount it with a `key` per action so the resolver
 * and defaults are always fresh.
 */
export default function StoreActionDialog({
  storeId,
  storeName,
  action,
  onClose,
  onCompleted,
}: StoreActionDialogProps) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const labels = STORE_ACTION_LABELS[action];
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StoreActionValues>({
    resolver: zodResolver(storeActionSchema(action)),
    defaultValues: { note: "", reason: "", message: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      switch (action) {
        case "approve":
          await storeAdminApi.approve(
            storeId,
            values.note.trim() || undefined,
          );
          break;
        case "reject":
          await storeAdminApi.reject(storeId, values.reason);
          break;
        case "request-information":
          await storeAdminApi.requestInformation(storeId, values.message);
          break;
        case "suspend":
          await storeAdminApi.suspend(storeId, values.reason);
          break;
        case "reactivate":
          await storeAdminApi.reactivate(
            storeId,
            values.note.trim() || undefined,
          );
          break;
      }

      toast({
        tone: "success",
        title: successTitle(action),
        description: successDescription(action, storeName),
      });

      onCompleted?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, [
          "note",
          "reason",
          "message",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The store could not be updated.",
        );
      }
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={labels.title}
      description={labels.description}
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
            form="store-action-form"
            size="sm"
            variant={labels.tone === "danger" ? "danger" : "primary"}
            loading={isSubmitting}
          >
            {labels.submitLabel}
          </Button>
        </>
      }
    >
      <form
        id="store-action-form"
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        <div className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            Store
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink">{storeName}</p>
        </div>

        {action === "approve" || action === "reactivate" ? (
          <TextareaField
            label="Reviewer note"
            optional
            rows={4}
            placeholder="Optional context kept with the review record"
            hint="Internal only. Vendors see the status change, not this note."
            error={errors.note?.message}
            register={register("note")}
          />
        ) : null}

        {action === "reject" || action === "suspend" ? (
          <TextareaField
            label="Reason"
            required
            rows={5}
            placeholder={
              action === "reject"
                ? "Tell the vendor what needs to change before resubmitting"
                : "Explain why the store is being suspended"
            }
            hint="Shared with the vendor and stored in the review history."
            error={errors.reason?.message}
            register={register("reason")}
          />
        ) : null}

        {action === "request-information" ? (
          <TextareaField
            label="What do you need from the vendor?"
            required
            rows={5}
            placeholder="For example: upload a clearer CAC certificate and confirm the settlement account name"
            hint="The store stays under review until the vendor responds."
            error={errors.message?.message}
            register={register("message")}
          />
        ) : null}

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

function successTitle(action: StoreActionKind) {
  switch (action) {
    case "approve":
      return "Store approved";
    case "reject":
      return "Application rejected";
    case "request-information":
      return "Information requested";
    case "suspend":
      return "Store suspended";
    case "reactivate":
      return "Store reactivated";
  }
}

function successDescription(action: StoreActionKind, storeName: string) {
  switch (action) {
    case "approve":
      return `${storeName} is approved and can start trading.`;
    case "reject":
      return `${storeName} was rejected. The vendor can correct and resubmit.`;
    case "request-information":
      return `The vendor of ${storeName} has been notified.`;
    case "suspend":
      return `${storeName} has been suspended and can no longer trade.`;
    case "reactivate":
      return `${storeName} is active again.`;
  }
}
