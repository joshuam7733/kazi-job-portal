import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";
import { AddResourceCategory } from "./add-category";

export const metadata = { title: "Career resources" };

export default async function ContentList() {
  await requireAdminPage("content:manage");
  const [posts, categories] = await Promise.all([
    db.blogPost.findMany({ orderBy: { updatedAt: "desc" }, include: { category: true, author: { select: { name: true } } } }),
    db.resourceCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Career resources"
        description="Articles published at /resources."
        actions={
          <Button asChild>
            <Link href="/admin/content/new">
              <Plus /> New article
            </Link>
          </Button>
        }
      />
      {posts.length === 0 ? (
        <EmptyState icon={BookOpen} title="No articles yet" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/content/${p.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-surface-2/60 sm:flex-row sm:items-center sm:gap-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.title}</span>
                  <span className="text-sm text-muted">
                    {p.category?.name ?? "Uncategorised"}, updated {formatDate(p.updatedAt)}
                    {p.author?.name ? ` by ${p.author.name}` : ""}
                  </span>
                </span>
                <span className="flex gap-1.5">
                  {p.isFeatured && <Badge tone="sun">Featured</Badge>}
                  {p.isSample && <Badge tone="outline">Sample</Badge>}
                  <Badge tone={p.status === "PUBLISHED" ? "accent" : "outline"}>{p.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-[14px] border border-line bg-surface p-5">
        <h2 className="font-sans text-base font-bold tracking-normal">Article categories</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Badge>
                {c.name} ({c._count.posts})
              </Badge>
            </li>
          ))}
        </ul>
        <AddResourceCategory />
      </section>
    </div>
  );
}
