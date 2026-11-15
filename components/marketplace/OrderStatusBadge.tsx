import Badge from "@/components/ui/Badge";

type BadgeTone = "neutral" | "teal" | "lime" | "amber" | "green" | "red" | "blue";

const orderTones: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "blue" },
  processing: { label: "Processing", tone: "blue" },
  shipped: { label: "Shipped", tone: "teal" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
};

const paymentTones: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Payment pending", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  failed: { label: "Payment failed", tone: "red" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = orderTones[status] ?? {
    label: status.replace(/_/g, " "),
    tone: "neutral" as const,
  };

  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const meta = paymentTones[status] ?? {
    label: status.replace(/_/g, " "),
    tone: "neutral" as const,
  };

  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
