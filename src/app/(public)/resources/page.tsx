import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Career resources — CV writing, interviews and job search advice",
  description: "Practical career advice for job seekers in Uganda and East Africa: CV writing, interview preparation, internships and avoiding job scams.",
  alternates: { canonical: "/resources" },
};

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [categories, posts] = await Promise.all([
    db.resourceCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } } }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED", ...(category ? { category: { slug: category } } : {}) },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      include: { category: true },
    }),
  ]);
  const [lead, ...rest] = posts;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Career resources</h1>
      <p className="mt-1 max-w-2xl text-muted">Straightforward advice for every stage of your job search.</p>

      <nav aria-label="Resource categories" className="mt-6 flex flex-wrap gap-2">
        <CategoryLink href="/resources" active={!category}>
          All
        </CategoryLink>
        {categories
          .filter((c) => c._count.posts > 0)
          .map((c) => (
            <CategoryLink key={c.slug} href={`/resources?category=${c.slug}`} active={category === c.slug}>
              {c.name}
            </CategoryLink>
          ))}
      </nav>

      {!lead ? (
        <EmptyState className="mt-8" icon={BookOpen} title="No articles here yet" description="Try another category." />
      ) : (
        <>
          <Link href={`/resources/${lead.slug}`} className="group mt-8 grid gap-6 rounded-[20px] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm font-semibold text-accent-ink dark:text-accent">{lead.category?.name}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight group-hover:underline group-hover:underline-offset-4 sm:text-4xl">{lead.title}</h2>
            </div>
            <div className="self-end">
              <p className="text-lg leading-relaxed text-muted">{lead.excerpt}</p>
              <p className="mt-4 text-sm text-muted">
                {lead.readingMinutes} min read, {lead.publishedAt && formatDate(lead.publishedAt)}
              </p>
            </div>
          </Link>
          <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.slug} href={`/resources/${p.slug}`} className="group block border-t border-line pt-5">
                <p className="text-sm font-semibold text-accent-ink dark:text-accent">{p.category?.name}</p>
                <h2 className="mt-2 text-xl font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{p.title}</h2>
                <p className="mt-2 line-clamp-3 leading-relaxed text-muted">{p.excerpt}</p>
                <p className="mt-3 text-sm text-muted">{p.readingMinutes} min read</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", active ? "border-ink bg-ink text-ink-contrast" : "border-line-strong bg-surface hover:border-ink/40")}
    >
      {children}
    </Link>
  );
}
