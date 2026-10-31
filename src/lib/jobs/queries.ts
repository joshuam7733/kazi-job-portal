import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildJobOrderBy, buildJobWhere, PAGE_SIZE, publicJobWhere, type JobFilters } from "./filters";

export const jobCardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  workplace: true,
  employmentType: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  showSalary: true,
  publishedAt: true,
  createdAt: true,
  deadline: true,
  isFeatured: true,
  isSample: true,
  company: { select: { name: true, slug: true, logoUrl: true, brandColor: true, verificationStatus: true } },
  location: { select: { city: true, country: true, slug: true } },
  skills: { select: { skill: { select: { name: true } } }, take: 4 },
} satisfies Prisma.JobSelect;

export type JobCardData = Prisma.JobGetPayload<{ select: typeof jobCardSelect }>;

export async function searchJobs(filters: JobFilters) {
  const where = buildJobWhere(filters);
  const [total, jobs] = await db.$transaction([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy: buildJobOrderBy(filters.sort),
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: jobCardSelect,
    }),
  ]);
  return { total, jobs, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function listPublicJobs(where: Prisma.JobWhereInput, take: number, orderBy: Prisma.JobOrderByWithRelationInput[] = [{ publishedAt: "desc" }]) {
  return db.job.findMany({ where: { AND: [publicJobWhere(), where] }, orderBy, take, select: jobCardSelect });
}

export async function getPublicJob(slug: string) {
  return db.job.findFirst({
    where: { slug, ...publicJobWhere() },
    include: {
      company: { include: { industry: true, location: true, _count: { select: { jobs: { where: publicJobWhere() } } } } },
      category: true,
      location: true,
      skills: { include: { skill: true } },
    },
  });
}

export async function getRelatedJobs(job: { id: string; categoryId: string | null; companyId: string }, take = 4) {
  return listPublicJobs(
    { id: { not: job.id }, OR: [{ categoryId: job.categoryId ?? undefined }, { companyId: job.companyId }] },
    take,
  );
}

export async function getSavedJobIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const rows = await db.savedJob.findMany({ where: { userId }, select: { jobId: true } });
  return new Set(rows.map((r) => r.jobId));
}
