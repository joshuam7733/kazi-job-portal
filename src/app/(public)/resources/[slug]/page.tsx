import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { SampleBadge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

const getPost = (slug: string) =>
  db.blogPost.findFirst({ where: { slug, status: "PUBLISHED" }, include: { category: true, author: { select: { name: true } } } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const image = post.coverImageId ? `/api/files/${post.coverImageId}` : post.coverImageUrl ?? undefined;
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: { canonical: `/resources/${post.slug}` },
    openGraph: { type: "article", title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, publishedTime: post.publishedAt?.toISOString(), images: image ? [image] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const more = await db.blogPost.findMany({
    where: { status: "PUBLISHED", id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true, readingMinutes: true },
  });
  const cover = post.coverImageId ? `/api/files/${post.coverImageId}` : post.coverImageUrl;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "KAZI Job Portal" },
    mainEntityOfPage: absoluteUrl(`/resources/${post.slug}`),
  };

  return (
    <article className="container-page max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href={post.category ? `/resources?category=${post.category.slug}` : "/resources"} className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
        {post.category?.name ?? "Career resources"}
      </Link>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-xl leading-relaxed text-muted">{post.excerpt}</p>
      <p className="mt-6 flex flex-wrap items-center gap-3 border-b border-line pb-6 text-sm text-muted">
        <span>{post.publishedAt && formatDate(post.publishedAt, "d MMMM yyyy")}</span>
        <span aria-hidden>/</span>
        <span>{post.readingMinutes} min read</span>
        {post.isSample && <SampleBadge />}
      </p>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="mt-8 aspect-[16/9] w-full rounded-[20px] object-cover" />
      )}
      <Markdown className="mt-8">{post.content}</Markdown>

      {more.length > 0 && (
        <aside className="mt-16 border-t border-line pt-8">
          <h2 className="text-xl font-semibold">Keep reading</h2>
          <ul className="mt-4 grid gap-3">
            {more.map((m) => (
              <li key={m.slug}>
                <Link href={`/resources/${m.slug}`} className="flex items-baseline justify-between gap-4 font-semibold hover:underline">
                  {m.title}
                  <span className="shrink-0 text-sm font-normal text-muted">{m.readingMinutes} min</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
