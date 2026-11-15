import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/urls";

export default function MarketplaceAuthIndexPage() {
  redirect(AUTH_ROUTES.login);
}
