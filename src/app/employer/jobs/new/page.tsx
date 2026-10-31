import { JobForm } from "@/components/employer/job-form";
import { PageHeader } from "@/components/ui/misc";
import { employerPageContext, jobFormOptions } from "@/lib/employer";

export const metadata = { title: "Post a job" };

export default async function NewJobPage() {
  const { company } = await employerPageContext();
  const options = await jobFormOptions();
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Post a job" description="Clear, specific listings attract better candidates." />
      <JobForm {...options} verified={company.verificationStatus === "VERIFIED"} initial={{ showSalary: true, questions: [] }} />
    </div>
  );
}
