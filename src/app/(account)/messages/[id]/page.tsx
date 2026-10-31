import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requirePageUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Composer } from "./composer";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(["JOB_SEEKER", "EMPLOYER"]);
  const convo = await db.conversation.findFirst({
    where: { id, participants: { some: { userId: user.id } } },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true } } } },
      application: { select: { id: true, status: true, job: { select: { title: true, company: { select: { name: true } } } } } },
    },
  });
  if (!convo) notFound();
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: convo.id, userId: user.id } }, data: { lastReadAt: new Date() } });

  const appLink = convo.application ? (user.role === "EMPLOYER" ? `/employer/applicants/${convo.application.id}` : `/dashboard/applications/${convo.application.id}`) : null;
  const closed = convo.application?.status === "WITHDRAWN";

  return (
    <div className="flex h-full min-h-[60dvh] flex-col">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Link href="/messages" className="-ml-2 inline-flex size-9 items-center justify-center rounded-full hover:bg-surface-2 md:hidden" aria-label="Back to conversations">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h2 className="truncate font-sans text-base font-bold tracking-normal">{convo.subject}</h2>
          {appLink && (
            <Link href={appLink} className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
              View application
            </Link>
          )}
        </div>
      </header>
      <ol className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-label="Messages">
        {convo.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-[16px] px-4 py-2.5 sm:max-w-[70%]", mine ? "rounded-br-[6px] bg-ink text-ink-contrast" : "rounded-bl-[6px] bg-surface-2")}>
                {!mine && <p className="mb-0.5 text-xs font-semibold opacity-75">{m.sender?.name ?? "Deleted user"}</p>}
                <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>
                <p className={cn("mt-1 text-[11px]", mine ? "opacity-70" : "text-muted")}>{formatDate(m.createdAt, "d MMM, HH:mm")}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {closed ? (
        <p className="border-t border-line p-4 text-center text-sm text-muted">This application was withdrawn, so the conversation is closed.</p>
      ) : (
        <Composer conversationId={convo.id} />
      )}
    </div>
  );
}
