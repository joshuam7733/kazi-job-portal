"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, BellRing, Briefcase, CalendarClock, CheckCheck, FileText, Megaphone, MessageSquare, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { NotificationType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { cn, safeInternalPath } from "@/lib/utils";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/account-actions";

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  APPLICATION_RECEIVED: FileText,
  APPLICATION_STATUS: FileText,
  INTERVIEW_INVITE: CalendarClock,
  MESSAGE: MessageSquare,
  JOB_ALERT: BellRing,
  COMPANY_VERIFICATION: ShieldCheck,
  JOB_MODERATION: Briefcase,
  ANNOUNCEMENT: Megaphone,
  SYSTEM: Bell,
};

export function NotificationItem({ n }: { n: { id: string; type: NotificationType; title: string; body: string | null; link: string | null; read: boolean; at: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const Icon = ICONS[n.type] ?? Bell;
  const open = () =>
    start(async () => {
      if (!n.read) await markNotificationReadAction(n.id);
      if (n.link) router.push(safeInternalPath(n.link, "/notifications"));
      else router.refresh();
    });
  return (
    <li>
      <button type="button" onClick={open} disabled={pending} className={cn("flex w-full gap-3 px-5 py-4 text-left hover:bg-surface-2/60", !n.read && "bg-accent-soft/40")}>
        <span className={cn("mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full", n.read ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent-ink")}>
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block", n.read ? "font-medium" : "font-bold")}>{n.title}</span>
          {n.body && <span className="mt-0.5 line-clamp-2 block whitespace-pre-line text-sm text-muted">{n.body}</span>}
          <span className="mt-1 block text-xs text-muted">{timeAgo(n.at)}</span>
        </span>
        {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
      </button>
    </li>
  );
}

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          await markAllNotificationsReadAction();
          toast.success("All notifications marked as read");
        })
      }
    >
      <CheckCheck /> Mark all as read
    </Button>
  );
}
