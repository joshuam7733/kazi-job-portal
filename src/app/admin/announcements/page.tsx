import { Megaphone } from "lucide-react";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";
import { AnnouncementForm } from "./announcement-form";

export const metadata = { title: "Announcements" };
const AUDIENCE = { ALL: "Everyone", JOB_SEEKERS: "Job seekers", EMPLOYERS: "Employers" } as const;

export default async function AnnouncementsPage() {
  await requireAdminPage("announcements:send");
  const past = await db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { createdBy: { select: { name: true } } } });
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Announcements" description="Sends an in-app notification to every active user in the audience." />
      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <AnnouncementForm />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Sent</h2>
        {past.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements sent yet" />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
            {past.map((a) => (
              <li key={a.id} className="p-5">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {a.title} <Badge>{AUDIENCE[a.audience]}</Badge>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink/85">{a.body}</p>
                <p className="mt-2 text-xs text-muted">
                  Sent {formatDate(a.createdAt, "d MMM yyyy, HH:mm")} by {a.createdBy?.name ?? "an admin"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
