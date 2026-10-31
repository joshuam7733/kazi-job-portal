import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPublicJob } from "@/lib/jobs/queries";
import { requirePageUser } from "@/lib/session";
import { parseQuestions } from "@/lib/validation/application";
import { ApplyFlow } from "./apply-flow";

export const metadata: Metadata = { title: "Apply", robots: { index: false } };

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requirePageUser(["JOB_SEEKER"], `/jobs/${slug}/apply`);
  const job = await getPublicJob(slug);
  if (!job) notFound();

  const existing = await db.application.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: user.id } }, select: { id: true } });
  if (existing) redirect(`/dashboard/applications/${existing.id}`);

  const [resumes, profile, dbUser] = await Promise.all([
    db.resume.findMany({ where: { userId: user.id }, include: { file: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    db.jobSeekerProfile.findUnique({ where: { userId: user.id }, select: { headline: true, phone: true, locationText: true } }),
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, email: true } }),
  ]);

  return (
    <div className="container-page max-w-3xl py-10">
      <ApplyFlow
        job={{
          id: job.id,
          slug: job.slug,
          title: job.title,
          company: job.company.name,
          brandColor: job.company.brandColor,
          logoUrl: job.company.logoUrl,
          questions: parseQuestions(job.questions),
          deadline: job.deadline?.toISOString() ?? null,
        }}
        applicant={{ name: dbUser.name ?? "", email: dbUser.email, headline: profile?.headline ?? null, phone: profile?.phone ?? null, location: profile?.locationText ?? null }}
        resumes={resumes.map((r) => ({ id: r.id, label: r.label, fileName: r.file.originalName, size: r.file.size, isDefault: r.isDefault }))}
      />
    </div>
  );
}
