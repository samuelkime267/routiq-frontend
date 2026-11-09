"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Form";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, shipmentAdminApi } from "@/lib/api";

interface ShipmentCancelDialogProps {
  shipmentId: string;
  trackingNumber: string;
  onClose: () => void;
  onCompleted?: () => void;
}

/**
 * Cancels a shipment with Shipbubble. The provider only accepts cancellation
 * before pickup, so the reason is optional but recorded locally.
 */
export default function ShipmentCancelDialog({
  shipmentId,
  trackingNumber,
  onClose,
  onCompleted,
}: ShipmentCancelDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setBusy(true);
    setError(null);

    try {
      await shipmentAdminApi.cancel(shipmentId, reason.trim() || undefined);

      toast({
        title: "Shipment cancelled",
        description: `${trackingNumber} was cancelled with Shipbubble.`,
        tone: "success",
      });

      onCompleted?.();
      onClose();
    } catch (cancelError) {
      setError(
        cancelError instanceof ApiError
          ? cancelError.message
          : "The shipment could not be cancelled.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Cancel ${trackingNumber}?`}
      description="Shipbubble only accepts cancellation before the package is picked up. Delivered, failed and in-transit shipments cannot be cancelled."
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Keep shipment
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            onClick={() => void handleCancel()}
          >
            Cancel shipment
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-[12px] text-danger">
            {error}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="shipment-cancel-reason"
            className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase"
          >
            Reason (optional)
          </label>
          <Textarea
            id="shipment-cancel-reason"
            value={reason}
            maxLength={500}
            placeholder="Why is this shipment being cancelled?"
            onChange={(event) => setReason(event.target.value)}
            className="text-[12px]"
          />
        </div>
      </div>
    </Modal>
  );
}
