import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { ConversationList } from "./conversation-list";

export const metadata = { title: "Messages" };

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["JOB_SEEKER", "EMPLOYER"], "/messages");
  const participations = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          participants: { where: { userId: { not: user.id } }, include: { user: { select: { name: true } } } },
          application: { select: { job: { select: { company: { select: { name: true } } } } } },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });
  const items = participations.map((p) => {
    const last = p.conversation.messages[0];
    const other = user.role === "JOB_SEEKER" ? (p.conversation.application?.job.company.name ?? "Employer") : (p.conversation.participants[0]?.user.name ?? "Candidate");
    return {
      id: p.conversationId,
      title: other,
      subject: p.conversation.subject,
      preview: last?.body ?? "No messages yet",
      at: (last?.createdAt ?? p.conversation.createdAt).toISOString(),
      unread: Boolean(last && last.senderId !== user.id && (!p.lastReadAt || last.createdAt > p.lastReadAt)),
    };
  });

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-3xl font-semibold">Messages</h1>
      {items.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line-strong px-6 py-14 text-center">
          <MessageSquare className="mx-auto size-6 text-muted" aria-hidden />
          <p className="mt-3 font-semibold">No conversations yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {user.role === "EMPLOYER" ? (
              <>
                Start a conversation from an applicant&apos;s page in{" "}
                <Link href="/employer/applicants" className="font-semibold underline">
                  Applicants
                </Link>
                .
              </>
            ) : (
              "When an employer messages you about an application, the conversation appears here."
            )}
          </p>
        </div>
      ) : (
        <div className="grid min-h-[60dvh] overflow-hidden rounded-[14px] border border-line bg-surface md:grid-cols-[320px_minmax(0,1fr)]">
          <ConversationList items={items} />
          <div className="min-w-0">{children}</div>
        </div>
      )}
    </div>
  );
}
