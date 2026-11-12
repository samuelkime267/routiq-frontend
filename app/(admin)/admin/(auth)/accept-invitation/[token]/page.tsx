import type { Metadata } from "next";
import AdminAcceptInvitationForm from "@/components/admin/AdminAcceptInvitationForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Accept admin invitation",
  description: "Activate your Routiq administrator account.",
};

export default async function AdminAcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <AdminAcceptInvitationForm token={token} />;
}
