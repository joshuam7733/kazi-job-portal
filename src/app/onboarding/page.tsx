import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { CompanyForm } from "@/components/employer/company-form";
import { SeekerOnboarding } from "./seeker-onboarding";

export const metadata: Metadata = { title: "Set up your account", robots: { index: false } };

export default async function OnboardingPage() {
  const user = await requirePageUser(["JOB_SEEKER", "EMPLOYER"], "/onboarding");

  if (user.role === "EMPLOYER") {
    const profile = await db.employerProfile.findUnique({ where: { userId: user.id } });
    if (profile?.companyId) redirect("/employer");
    const [industries, locations, dbUser] = await Promise.all([
      db.industry.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      db.location.findMany({ where: { isActive: true }, orderBy: [{ country: "desc" }, { city: "asc" }], select: { id: true, city: true, country: true } }),
      db.user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true } }),
    ]);
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold">Set up your company</h1>
        <p className="mt-2 text-muted">Job seekers see this on every listing. You can change it any time.</p>
        <div className="mt-8">
          <CompanyForm mode="create" industries={industries} locations={locations.map((l) => ({ id: l.id, label: l.country === "Uganda" ? l.city : `${l.city}, ${l.country}` }))} defaults={{ contactEmail: dbUser.email }} />
        </div>
      </Shell>
    );
  }

  if (user.onboarded) redirect("/dashboard");
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true } });
  return (
    <Shell>
      <SeekerOnboarding name={dbUser.name ?? ""} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="container-page max-w-2xl pb-16 pt-6">
        {children}
      </main>
    </div>
  );
}
