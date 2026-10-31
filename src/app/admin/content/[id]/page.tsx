import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import { PostForm } from "../post-form";

export const metadata = { title: "Edit article" };

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdminPage("content:manage");
  const { id } = await params;
  const { saved } = await searchParams;
  const [post, categories] = await Promise.all([
    db.blogPost.findUnique({ where: { id } }),
    db.resourceCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!post) notFound();
  return (
    <div className="grid max-w-3xl gap-6">
      <Link href="/admin/content" className="text-sm font-semibold text-muted hover:text-ink">
        ← All articles
      </Link>
      <PageHeader
        title="Edit article"
        description={
          post.status === "PUBLISHED" ? (
            <Link href={`/resources/${post.slug}`} target="_blank" className="font-semibold text-accent-ink underline dark:text-accent">
              View published article
            </Link>
          ) : (
            "Draft — not visible to the public."
          )
        }
      />
      <PostForm
        saved={saved === "1"}
        categories={categories}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          categoryId: post.categoryId ?? "",
          coverImageUrl: post.coverImageUrl ?? "",
          readingMinutes: String(post.readingMinutes),
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          isFeatured: post.isFeatured,
          status: post.status,
          coverPreview: post.coverImageId ? `/api/files/${post.coverImageId}` : post.coverImageUrl,
        }}
      />
    </div>
  );
}
