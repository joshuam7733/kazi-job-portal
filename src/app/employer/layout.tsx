import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoleShell } from "@/components/app/role-shell";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Employer", template: "%s | KAZI Employer" }, robots: { index: false, follow: false } };

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["EMPLOYER"], "/employer");
  const profile = await db.employerProfile.findUnique({ where: { userId: user.id }, include: { company: true } });
  if (!profile?.companyId) redirect("/onboarding");
  if (profile.company?.isSuspended) {
    return (
      <main id="main" className="container-page max-w-xl py-24">
        <h1 className="font-display text-3xl font-semibold">This company account is suspended</h1>
        <p className="mt-3 text-muted">Your listings are hidden while our trust & safety team reviews the account. Contact support to resolve this.</p>
      </main>
    );
  }
  return <RoleShell>{children}</RoleShell>;
}
