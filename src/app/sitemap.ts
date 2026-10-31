import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicJobWhere } from "@/lib/jobs/filters";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies, posts, categories, locations] = await Promise.all([
    db.job.findMany({ where: publicJobWhere(), select: { slug: true, updatedAt: true }, take: 45_000 }),
    db.company.findMany({ where: { verificationStatus: "VERIFIED", isSuspended: false }, select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.jobCategory.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.location.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);
  const staticPages = ["/", "/jobs", "/companies", "/resources", "/employers", "/about", "/trust", "/privacy", "/terms"];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p), changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/jobs?cat=${c.slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
    ...locations.map((l) => ({ url: absoluteUrl(`/jobs?loc=${l.slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
    ...jobs.map((j) => ({ url: absoluteUrl(`/jobs/${j.slug}`), lastModified: j.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...companies.map((c) => ({ url: absoluteUrl(`/companies/${c.slug}`), lastModified: c.updatedAt, priority: 0.6 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/resources/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
  ];
}
