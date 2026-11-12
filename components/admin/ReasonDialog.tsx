"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";
import Modal from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";

interface ReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  /** A reason is optional by default, matching the API contract. */
  requireReason?: boolean;
  children?: ReactNode;
}

/**
 * Shared destructive/administrative confirmation. Every audited mutation can
 * capture an optional operator reason without inventing a one-off modal.
 */
export default function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = "danger",
  requireReason = false,
  children,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    if (submitting) return;
    setReason("");
    setError(null);
    onClose();
  }

  async function submit() {
    if (requireReason && reason.trim().length < 3) {
      setError("Add a short reason for the audit trail.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : submitError instanceof Error
            ? submitError.message
            : "The action could not be completed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      size="md"
      dismissible={!submitting}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={close}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            loading={submitting}
            onClick={() => void submit()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}

        <Field
          label={requireReason ? "Reason (required)" : "Reason (optional)"}
          htmlFor="admin-action-reason"
          hint="Stored on the audit record with your name and the time of the change."
          error={error ?? undefined}
        >
          <Textarea
            id="admin-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this change is being made"
            maxLength={500}
          />
        </Field>
      </div>
    </Modal>
  );
}
