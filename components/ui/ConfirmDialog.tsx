"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  children?: React.ReactNode;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  children,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  async function handleConfirm() {
    setBusy(true);
    setError(null);

    try {
      await onConfirm();
      close();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "The action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            loading={busy}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div
          className={
            tone === "danger"
              ? "flex gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3"
              : "flex gap-3 rounded-xl border border-pri/15 bg-well px-4 py-3"
          }
        >
          <Icon
            name={tone === "danger" ? "alert-circle" : "shield"}
            className={
              tone === "danger"
                ? "mt-0.5 size-4 shrink-0 text-danger"
                : "mt-0.5 size-4 shrink-0 text-pri"
            }
          />
          <p className="text-[12px] leading-relaxed text-muted">
            {tone === "danger"
              ? "This action changes access immediately. Make sure you have reviewed the details below."
              : "Review the details below before continuing."}
          </p>
        </div>

        {children}

        {error ? (
          <p role="alert" className="text-[12px] leading-relaxed text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
