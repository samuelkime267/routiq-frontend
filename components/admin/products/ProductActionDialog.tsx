"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import { TextareaField } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, productAdminApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import {
  PRODUCT_ACTION_LABELS,
  productActionSchema,
  type ProductActionKind,
  type ProductActionValues,
} from "@/lib/schemas/product";

interface ProductActionDialogProps {
  productId: string;
  productName: string;
  action: ProductActionKind;
  onClose: () => void;
  onCompleted?: () => void;
}

/**
 * Confirmation dialog for the four administrative product decisions.
 *
 * Mount it with a `key` per action so the resolver and defaults are fresh.
 */
export default function ProductActionDialog({
  productId,
  productName,
  action,
  onClose,
  onCompleted,
}: ProductActionDialogProps) {
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const labels = PRODUCT_ACTION_LABELS[action];
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductActionValues>({
    resolver: zodResolver(productActionSchema(action)),
    defaultValues: { note: "", reason: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      switch (action) {
        case "approve":
          await productAdminApi.approve(
            productId,
            values.note.trim() || undefined,
          );
          break;
        case "reject":
          await productAdminApi.reject(productId, values.reason);
          break;
        case "suspend":
          await productAdminApi.suspend(productId, values.reason);
          break;
        case "restore":
          await productAdminApi.restore(
            productId,
            values.note.trim() || undefined,
          );
          break;
      }

      toast({
        tone: "success",
        title: successTitle(action),
        description: successDescription(action, productName),
      });

      onCompleted?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, ["note", "reason"]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The product could not be updated.",
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
            form="product-action-form"
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
        id="product-action-form"
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
      >
        <div className="rounded-xl border border-line bg-well/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            Product
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink">
            {productName}
          </p>
        </div>

        {action === "approve" || action === "restore" ? (
          <TextareaField
            label="Reviewer note"
            optional
            rows={4}
            placeholder="Optional context kept with the moderation record"
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
                : "Explain why the product is being suspended"
            }
            hint="Shared with the vendor and stored in the moderation history."
            error={errors.reason?.message}
            register={register("reason")}
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

function successTitle(action: ProductActionKind) {
  switch (action) {
    case "approve":
      return "Product approved";
    case "reject":
      return "Product rejected";
    case "suspend":
      return "Product suspended";
    case "restore":
      return "Product restored";
  }
}

function successDescription(action: ProductActionKind, productName: string) {
  switch (action) {
    case "approve":
      return `${productName} passed moderation. It stays unpublished until the vendor publishes it.`;
    case "reject":
      return `${productName} was rejected. The vendor can correct and resubmit it.`;
    case "suspend":
      return `${productName} has been suspended and can no longer be sold.`;
    case "restore":
      return `${productName} has been restored to its previous moderation status.`;
  }
}
