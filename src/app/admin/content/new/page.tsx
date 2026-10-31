import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import { PostForm } from "../post-form";

export const metadata = { title: "New article" };

export default async function NewPostPage() {
  await requireAdminPage("content:manage");
  const categories = await db.resourceCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="New article" />
      <PostForm categories={categories} />
    </div>
  );
}
