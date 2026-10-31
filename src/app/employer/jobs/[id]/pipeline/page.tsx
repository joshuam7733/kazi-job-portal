import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { JobStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { employerPageContext } from "@/lib/employer";
import { PipelineBoard } from "./pipeline-board";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await employerPageContext();
  const job = await db.job.findFirst({
    where: { id, companyId: company.id },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: { select: { name: true, jobSeekerProfile: { select: { headline: true, locationText: true } } } },
          _count: { select: { notes: true } },
        },
      },
    },
  });
  if (!job) notFound();

  return (
    <div className="grid gap-6">
      <Link href="/employer/jobs" className="text-sm font-semibold text-muted hover:text-ink">
        ← All jobs
      </Link>
      <PageHeader
        title={job.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} /> {job.applications.length} {job.applications.length === 1 ? "applicant" : "applicants"}
          </span>
        }
        actions={
          job.status !== "REMOVED" && (
            <Button asChild variant="secondary">
              <Link href={`/employer/jobs/${job.id}/edit`}>
                <Pencil /> Edit job
              </Link>
            </Button>
          )
        }
      />
      <PipelineBoard
        applications={job.applications.map((a) => ({
          id: a.id,
          status: a.status,
          name: a.candidate.name ?? "Candidate",
          headline: a.candidate.jobSeekerProfile?.headline ?? null,
          location: a.candidate.jobSeekerProfile?.locationText ?? null,
          appliedAt: a.createdAt.toISOString(),
          notes: a._count.notes,
        }))}
      />
    </div>
  );
}
