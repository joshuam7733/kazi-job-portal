import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoleShell } from "@/components/app/role-shell";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | KAZI" }, robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["JOB_SEEKER"], "/dashboard");
  if (!user.onboarded) redirect("/onboarding");
  return <RoleShell>{children}</RoleShell>;
}
