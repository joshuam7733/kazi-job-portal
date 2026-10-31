"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/misc";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; subject: string; preview: string; at: string; unread: boolean };

/** On mobile the list and the open thread are separate screens; on desktop they sit side by side. */
export function ConversationList({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const openId = pathname.split("/")[2];
  return (
    <nav aria-label="Conversations" className={cn("border-line md:border-r", openId && "hidden md:block")}>
      <ul className="divide-y divide-line">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              aria-current={openId === c.id ? "page" : undefined}
              className={cn("flex gap-3 px-4 py-3.5 hover:bg-surface-2/60", openId === c.id && "bg-surface-2")}
            >
              <Avatar name={c.title} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate", c.unread ? "font-bold" : "font-semibold")}>{c.title}</p>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(c.at)}</span>
                </div>
                <p className="truncate text-xs text-muted">{c.subject}</p>
                <p className={cn("truncate text-sm", c.unread ? "text-ink" : "text-muted")}>{c.preview}</p>
              </div>
              {c.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
