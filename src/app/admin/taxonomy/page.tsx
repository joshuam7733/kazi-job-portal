import { PageHeader } from "@/components/ui/misc";
import { CATEGORY_ICON_NAMES } from "@/components/category-icon";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/session";
import { AddIndustryForm, AddLocationForm, CategoryEditor, TaxonomyToggle } from "./forms";

export const metadata = { title: "Categories & places" };

export default async function TaxonomyPage() {
  await requireAdminPage("taxonomy:manage");
  const [categories, industries, locations] = await Promise.all([
    db.jobCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { jobs: true } } } }),
    db.industry.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { companies: true } } } }),
    db.location.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }], include: { _count: { select: { jobs: true } } } }),
  ]);
  return (
    <div className="grid gap-8">
      <PageHeader title="Categories & places" description="Inactive items disappear from filters and forms; existing jobs keep them." />

      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Job categories</h2>
        <ul className="mt-4 divide-y divide-line">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              <CategoryEditor category={{ id: c.id, name: c.name, icon: c.icon ?? "", sortOrder: c.sortOrder }} icons={CATEGORY_ICON_NAMES} />
              <span className="text-sm text-muted sm:w-24">{c._count.jobs} jobs</span>
              <TaxonomyToggle kind="category" id={c.id} field="isActive" value={c.isActive} label="Active" />
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="mb-2 text-sm font-semibold">Add a category</h3>
          <CategoryEditor icons={CATEGORY_ICON_NAMES} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-sans text-lg font-bold tracking-normal">Industries</h2>
          <AddIndustryForm />
          <ul className="mt-4 divide-y divide-line">
            {industries.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  <span className="font-semibold">{i.name}</span> <span className="text-sm text-muted">{i._count.companies} companies</span>
                </span>
                <TaxonomyToggle kind="industry" id={i.id} field="isActive" value={i.isActive} label="Active" />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-sans text-lg font-bold tracking-normal">Locations</h2>
          <AddLocationForm />
          <ul className="mt-4 divide-y divide-line">
            {locations.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span>
                  <span className="font-semibold">{l.city}</span> <span className="text-sm text-muted">{l.country}, {l._count.jobs} jobs</span>
                </span>
                <span className="flex gap-4">
                  <TaxonomyToggle kind="location" id={l.id} field="isFeatured" value={l.isFeatured} label="Homepage" />
                  <TaxonomyToggle kind="location" id={l.id} field="isActive" value={l.isActive} label="Active" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
