import { notFound } from "next/navigation";
import { JobStatusBadge } from "@/components/app/status-badge";
import { JobForm } from "@/components/employer/job-form";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { employerPageContext, jobFormOptions } from "@/lib/employer";
import { parseQuestions } from "@/lib/validation/application";

export const metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await employerPageContext();
  const job = await db.job.findFirst({ where: { id, companyId: company.id }, include: { skills: { include: { skill: true } } } });
  if (!job || job.status === "REMOVED") notFound();
  const options = await jobFormOptions();
  const str = (n: number | null) => (n === null ? "" : String(n));
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Edit job" description={<span className="inline-flex items-center gap-2">{job.title} <JobStatusBadge status={job.status} /></span>} />
      <JobForm
        jobId={job.id}
        status={job.status}
        {...options}
        verified={company.verificationStatus === "VERIFIED"}
        initial={{
          title: job.title,
          categoryId: job.categoryId ?? "",
          locationId: job.locationId ?? "",
          workplace: job.workplace,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          educationLevel: job.educationLevel,
          openings: String(job.openings),
          salaryMin: str(job.salaryMin),
          salaryMax: str(job.salaryMax),
          salaryCurrency: job.salaryCurrency,
          salaryPeriod: job.salaryPeriod,
          showSalary: job.showSalary,
          summary: job.summary,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          preferredQualifications: job.preferredQualifications ?? "",
          benefits: job.benefits ?? "",
          skills: job.skills.map((s) => s.skill.name).join(", "),
          deadline: job.deadline ? job.deadline.toISOString().slice(0, 10) : "",
          questions: parseQuestions(job.questions).map(({ label, type, required }) => ({ label, type, required })),
        }}
      />
    </div>
  );
}
