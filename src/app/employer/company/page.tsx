import Link from "next/link";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { CompanyForm } from "@/components/employer/company-form";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { employerPageContext } from "@/lib/employer";
import { formatDate } from "@/lib/format";
import { VerificationForm } from "./verification-form";

export const metadata = { title: "Company profile" };

export default async function CompanyProfilePage() {
  const { company } = await employerPageContext();
  const [industries, locations, lastRequest] = await Promise.all([
    db.industry.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.location.findMany({ where: { isActive: true }, orderBy: [{ country: "desc" }, { city: "asc" }], select: { id: true, city: true, country: true } }),
    db.companyVerification.findFirst({ where: { companyId: company.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title="Company profile"
        description={
          <>
            Shown on every listing and on your{" "}
            <Link href={`/companies/${company.slug}`} className="font-semibold text-accent-ink underline dark:text-accent">
              public company page
            </Link>
            .
          </>
        }
      />

      <section id="verification" className="scroll-mt-24 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Verification</h2>
        {company.verificationStatus === "VERIFIED" ? (
          <p className="mt-3 flex items-center gap-2 text-accent-ink dark:text-accent">
            <BadgeCheck className="size-5" aria-hidden />
            Verified{company.verifiedAt ? ` on ${formatDate(company.verifiedAt)}` : ""}. Your listings show the verified badge.
          </p>
        ) : company.verificationStatus === "PENDING" ? (
          <p className="mt-3 flex items-center gap-2 text-muted">
            <Clock className="size-5" aria-hidden />
            Under review since {lastRequest ? formatDate(lastRequest.createdAt) : "recently"}. We&apos;ll notify you when it&apos;s done.
          </p>
        ) : (
          <>
            {company.verificationStatus === "REJECTED" && lastRequest?.reviewNote && (
              <p className="mt-3 flex items-start gap-2 text-danger">
                <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                Your last request wasn&apos;t approved: {lastRequest.reviewNote}
              </p>
            )}
            <p className="mt-2 text-sm text-muted">Verified companies get a badge and can publish jobs without manual review.</p>
            <VerificationForm />
          </>
        )}
      </section>

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-5 font-sans text-lg font-bold tracking-normal">Details</h2>
        <CompanyForm
          mode="edit"
          industries={industries}
          locations={locations.map((l) => ({ id: l.id, label: l.country === "Uganda" ? l.city : `${l.city}, ${l.country}` }))}
          defaults={{
            name: company.name,
            type: company.type,
            tagline: company.tagline ?? "",
            description: company.description ?? "",
            industryId: company.industryId ?? "",
            locationId: company.locationId ?? "",
            size: company.size ?? "",
            website: company.website ?? "",
            contactEmail: company.contactEmail ?? "",
            contactPhone: company.contactPhone ?? "",
            foundedYear: company.foundedYear ? String(company.foundedYear) : "",
            brandColor: company.brandColor ?? "",
          }}
        />
      </section>
    </div>
  );
}
