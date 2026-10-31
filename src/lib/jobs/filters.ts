import type { EducationLevel, EmploymentType, ExperienceLevel, Prisma, WorkplaceType } from "@prisma/client";
import { z } from "zod";

/** URL ⇄ enum mapping. URL values are lowercase-kebab so links stay readable and shareable. */
export const TYPE_PARAM: Record<string, EmploymentType> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACT",
  internship: "INTERNSHIP",
  freelance: "FREELANCE",
};
export const WORKPLACE_PARAM: Record<string, WorkplaceType> = { remote: "REMOTE", onsite: "ONSITE", hybrid: "HYBRID" };
export const EXPERIENCE_PARAM: Record<string, ExperienceLevel> = {
  entry: "ENTRY",
  junior: "JUNIOR",
  mid: "MID",
  senior: "SENIOR",
  lead: "LEAD",
  executive: "EXECUTIVE",
};
export const EDUCATION_PARAM: Record<string, EducationLevel> = {
  none: "NONE",
  certificate: "CERTIFICATE",
  diploma: "DIPLOMA",
  bachelors: "BACHELORS",
  masters: "MASTERS",
  doctorate: "DOCTORATE",
};

export const SORTS = ["newest", "relevance", "salary", "deadline"] as const;
export type JobSort = (typeof SORTS)[number];
export const PAGE_SIZE = 12;

const list = <T extends string>(map: Record<string, T>) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const raw = (Array.isArray(v) ? v.join(",") : (v ?? "")).split(",").map((s) => s.trim().toLowerCase());
      return [...new Set(raw.filter((s) => s in map))];
    });

const single = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined);

export const jobFiltersSchema = z.object({
  q: single.transform((v) => v?.slice(0, 100)),
  loc: single,
  cat: single,
  ind: single,
  company: single,
  type: list(TYPE_PARAM),
  wp: list(WORKPLACE_PARAM),
  exp: list(EXPERIENCE_PARAM),
  edu: list(EDUCATION_PARAM),
  salary: single.transform((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 1_000_000_000) : undefined;
  }),
  posted: single.transform((v) => {
    const n = Number(v);
    return [1, 3, 7, 30].includes(n) ? n : undefined;
  }),
  sort: single.transform((v): JobSort => (SORTS.includes(v as JobSort) ? (v as JobSort) : "newest")),
  page: single.transform((v) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : 1;
  }),
});

export type JobFilters = z.infer<typeof jobFiltersSchema>;

export function parseJobFilters(params: Record<string, string | string[] | undefined>): JobFilters {
  return jobFiltersSchema.parse(params);
}

/** Only jobs that the public may see. */
export function publicJobWhere(now = new Date()): Prisma.JobWhereInput {
  return {
    status: "PUBLISHED",
    company: { isSuspended: false },
    OR: [{ deadline: null }, { deadline: { gte: now } }],
  };
}

export function buildJobWhere(f: JobFilters, now = new Date()): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [publicJobWhere(now)];

  if (f.q) {
    const terms = f.q.split(/\s+/).filter((t) => t.length > 0).slice(0, 6);
    for (const term of terms) {
      and.push({
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { summary: { contains: term, mode: "insensitive" } },
          { company: { name: { contains: term, mode: "insensitive" } } },
          { skills: { some: { skill: { name: { contains: term, mode: "insensitive" } } } } },
          { category: { name: { contains: term, mode: "insensitive" } } },
        ],
      });
    }
  }
  if (f.loc) and.push({ location: { slug: f.loc } });
  if (f.cat) and.push({ category: { slug: f.cat } });
  if (f.ind) and.push({ company: { industry: { slug: f.ind } } });
  if (f.company) and.push({ company: { slug: f.company } });
  if (f.type.length) and.push({ employmentType: { in: f.type.map((t) => TYPE_PARAM[t]) } });
  if (f.wp.length) and.push({ workplace: { in: f.wp.map((t) => WORKPLACE_PARAM[t]) } });
  if (f.exp.length) and.push({ experienceLevel: { in: f.exp.map((t) => EXPERIENCE_PARAM[t]) } });
  if (f.edu.length) and.push({ educationLevel: { in: f.edu.map((t) => EDUCATION_PARAM[t]) } });
  if (f.salary) {
    // Salary filter is expressed per month; yearly salaries are compared at 12× the threshold.
    const s = f.salary;
    and.push({
      showSalary: true,
      OR: [
        { salaryPeriod: "MONTH", OR: [{ salaryMax: { gte: s } }, { salaryMax: null, salaryMin: { gte: s } }] },
        { salaryPeriod: "YEAR", OR: [{ salaryMax: { gte: s * 12 } }, { salaryMax: null, salaryMin: { gte: s * 12 } }] },
      ],
    });
  }
  if (f.posted) and.push({ publishedAt: { gte: new Date(now.getTime() - f.posted * 86_400_000) } });

  return { AND: and };
}

export function buildJobOrderBy(sort: JobSort): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "salary":
      return [{ salaryMax: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "deadline":
      return [{ deadline: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }];
    case "relevance":
      return [{ isFeatured: "desc" }, { publishedAt: "desc" }];
    default:
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

/** Serialise filters back into a query string (omitting defaults) — used for links and alerts. */
export function filtersToSearchParams(f: Partial<JobFilters>, overrides: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams();
  const put = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  };
  put("q", f.q);
  put("loc", f.loc);
  put("cat", f.cat);
  put("ind", f.ind);
  put("company", f.company);
  put("type", f.type);
  put("wp", f.wp);
  put("exp", f.exp);
  put("edu", f.edu);
  put("salary", f.salary);
  put("posted", f.posted);
  if (f.sort && f.sort !== "newest") put("sort", f.sort);
  if (f.page && f.page > 1) put("page", f.page);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) p.delete(k);
    else p.set(k, v);
  }
  return p;
}

export function activeFilterCount(f: JobFilters) {
  return (
    [f.loc, f.cat, f.ind, f.company, f.salary, f.posted].filter(Boolean).length +
    f.type.length +
    f.wp.length +
    f.exp.length +
    f.edu.length
  );
}
