"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { deletePostAction, savePostAction } from "@/server/admin-actions";

type Post = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  categoryId?: string;
  coverImageUrl?: string;
  readingMinutes?: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
  status?: "DRAFT" | "PUBLISHED";
  coverPreview?: string | null;
};

export function PostForm({ post = {}, categories, saved }: { post?: Post; categories: { id: string; name: string }[]; saved?: boolean }) {
  const [state, action] = useActionState(savePostAction, {});
  const v = { ...post, ...(state.values ?? {}) } as Post;
  const fe = state.fieldErrors ?? {};
  const [content, setContent] = useState(post.content ?? "");
  const [deleting, startDelete] = useTransition();
  const toasted = useRef(false);
  useEffect(() => {
    if (saved && !toasted.current) {
      toasted.current = true;
      toast.success("Article saved");
    }
  }, [saved]);
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const published = post.status === "PUBLISHED";

  return (
    <form action={action} className="grid gap-6" noValidate encType="multipart/form-data">
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="status" value={post.status ?? "DRAFT"} />
      <FormMessage state={{ error: state.error }} />
      <section className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <Field label="Title" error={fe.title}>
          {({ id, invalid }) => <Input id={id} name="title" maxLength={140} defaultValue={v.title} aria-invalid={invalid} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-[1fr_200px_120px]">
          <Field label="URL slug" optional hint="Leave blank to generate from the title." error={fe.slug}>
            {({ id, describedBy }) => <Input id={id} name="slug" defaultValue={v.slug} aria-describedby={describedBy} />}
          </Field>
          <Field label="Category">
            {({ id }) => (
              <Select id={id} name="categoryId" defaultValue={v.categoryId ?? ""}>
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Minutes to read" error={fe.readingMinutes}>
            {({ id }) => <Input id={id} name="readingMinutes" type="number" min={1} max={60} defaultValue={v.readingMinutes ?? String(Math.max(1, Math.round(words / 200)))} />}
          </Field>
        </div>
        <Field label="Excerpt" hint="Shown in lists and used as the default search description." error={fe.excerpt}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="excerpt" rows={2} maxLength={300} defaultValue={v.excerpt} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Article" hint={`Markdown supported: ## headings, **bold**, - lists, > quotes, [links](https://…). ${words.toLocaleString("en")} words.`} error={fe.content}>
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} name="content" rows={20} maxLength={50000} value={content} onChange={(e) => setContent(e.target.value)} className="font-mono text-sm" aria-describedby={describedBy} aria-invalid={invalid} />
          )}
        </Field>
      </section>

      <section className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Image and search</h2>
        {post.coverPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverPreview} alt="" className="aspect-[16/9] w-full max-w-md rounded-[12px] object-cover" />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Featured image" optional hint="PNG, JPG or WebP, up to 3 MB.">
            {({ id, describedBy }) => (
              <input id={id} type="file" name="coverImage" accept="image/png,image/jpeg,image/webp" aria-describedby={describedBy} className="block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:font-semibold" />
            )}
          </Field>
          <Field label="…or image address" optional error={fe.coverImageUrl}>
            {({ id, invalid }) => <Input id={id} name="coverImageUrl" inputMode="url" defaultValue={v.coverImageUrl} placeholder="https://" aria-invalid={invalid} />}
          </Field>
        </div>
        <Field label="Search title" optional hint="Up to 70 characters. Defaults to the article title." error={fe.seoTitle}>
          {({ id, describedBy }) => <Input id={id} name="seoTitle" maxLength={70} defaultValue={v.seoTitle} aria-describedby={describedBy} />}
        </Field>
        <Field label="Search description" optional hint="Up to 170 characters. Defaults to the excerpt." error={fe.seoDescription}>
          {({ id, describedBy }) => <Textarea id={id} name="seoDescription" rows={2} maxLength={170} defaultValue={v.seoDescription} aria-describedby={describedBy} />}
        </Field>
        <label className="flex items-center gap-2 text-[15px]">
          <Checkbox name="isFeatured" defaultChecked={v.isFeatured} /> Feature on the homepage and resources page
        </label>
      </section>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-surface/95 p-4 backdrop-blur lg:bottom-4">
        <div>
          {post.id && (
            <Button
              type="button"
              variant="ghost"
              className="text-danger"
              loading={deleting}
              onClick={() => {
                if (confirm("Delete this article permanently?")) startDelete(async () => void (await deletePostAction(post.id!)));
              }}
            >
              Delete article
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {published ? (
            <>
              <SubmitButton name="intent" value="unpublish" variant="secondary" pendingText="Saving…">
                Unpublish
              </SubmitButton>
              <SubmitButton name="intent" value="publish" variant="accent" pendingText="Saving…">
                Update article
              </SubmitButton>
            </>
          ) : (
            <>
              <SubmitButton name="intent" value="save" variant="secondary" pendingText="Saving…">
                Save draft
              </SubmitButton>
              <SubmitButton name="intent" value="publish" variant="accent" pendingText="Publishing…">
                Publish article
              </SubmitButton>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
