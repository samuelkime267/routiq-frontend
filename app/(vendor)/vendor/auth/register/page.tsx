import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Open a vendor account",
  description:
    "Create a Routiq vendor account, then complete your store and KYB details for review.",
};

export default function VendorRegisterPage() {
  return <RegisterForm scope="vendor" />;
}
