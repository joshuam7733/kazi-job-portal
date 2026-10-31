import { Bell } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { MarkAllRead, NotificationItem } from "./notification-item";

export const metadata = { title: "Notifications" };
const PAGE_SIZE = 25;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const user = await requirePageUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const unreadOnly = sp.filter === "unread";
  const where = { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) };
  const [items, total, unread] = await Promise.all([
    db.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={unread > 0 ? <MarkAllRead /> : undefined}
      />
      <div className="flex gap-2">
        <a href="/notifications" aria-current={!unreadOnly ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${!unreadOnly ? "border-ink bg-ink text-ink-contrast" : "border-line-strong"}`}>
          All
        </a>
        <a href="/notifications?filter=unread" aria-current={unreadOnly ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${unreadOnly ? "border-ink bg-ink text-ink-contrast" : "border-line-strong"}`}>
          Unread
        </a>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Bell} title={unreadOnly ? "No unread notifications" : "No notifications yet"} description="Application updates, messages and job alerts will show up here." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
          {items.map((n) => (
            <NotificationItem key={n.id} n={{ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: Boolean(n.readAt), at: n.createdAt.toISOString() }} />
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(p) => `/notifications?${unreadOnly ? "filter=unread&" : ""}page=${p}`} />
    </div>
  );
}
