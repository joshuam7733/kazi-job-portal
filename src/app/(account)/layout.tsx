import type { Metadata } from "next";
import { RoleShell } from "@/components/app/role-shell";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Shared pages for every signed-in role: messages, notifications, settings. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser();
  return <RoleShell>{children}</RoleShell>;
}
