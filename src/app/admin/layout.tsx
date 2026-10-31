import type { Metadata } from "next";
import { RoleShell } from "@/components/app/role-shell";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | KAZI Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["ADMIN"], "/admin");
  return <RoleShell>{children}</RoleShell>;
}
