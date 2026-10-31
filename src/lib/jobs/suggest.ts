import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { listPublicJobs } from "./queries";

/**
 * Suggests jobs from the seeker's skills, preferred roles, preferred work arrangement and the
 * categories they've applied to. Excludes jobs they've already applied for.
 */
export async function suggestJobsFor(userId: string, take = 4) {
  const [profile, applied] = await Promise.all([
    db.jobSeekerProfile.findUnique({
      where: { userId },
      include: { skills: { select: { skillId: true } } },
    }),
    db.application.findMany({ where: { candidateId: userId }, select: { jobId: true, job: { select: { categoryId: true } } } }),
  ]);
  const or: Prisma.JobWhereInput[] = [];
  const skillIds = profile?.skills.map((s) => s.skillId) ?? [];
  if (skillIds.length) or.push({ skills: { some: { skillId: { in: skillIds } } } });
  for (const role of profile?.preferredRoles ?? []) {
    const word = role.split(/\s+/).find((w) => w.length > 3);
    if (word) or.push({ title: { contains: word, mode: "insensitive" } });
  }
  const categoryIds = [...new Set(applied.map((a) => a.job.categoryId).filter(Boolean) as string[])];
  if (categoryIds.length) or.push({ categoryId: { in: categoryIds } });

  const exclude = applied.map((a) => a.jobId);
  const base: Prisma.JobWhereInput = { id: { notIn: exclude } };
  if (profile?.preferredWorkplace.length) base.workplace = { in: profile.preferredWorkplace };

  if (or.length === 0) return listPublicJobs(base, take, [{ isFeatured: "desc" }, { publishedAt: "desc" }]);
  const matched = await listPublicJobs({ ...base, OR: or }, take);
  if (matched.length >= take) return matched;
  // Top up with recent jobs so the section is never empty.
  const extra = await listPublicJobs({ id: { notIn: [...exclude, ...matched.map((m) => m.id)] } }, take - matched.length);
  return [...matched, ...extra];
}
