"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus } from "@prisma/client";
import { Avatar } from "@/components/ui/misc";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { PIPELINE, PIPELINE_LABEL } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { moveApplicationAction } from "@/server/employer-actions";

type Card = { id: string; status: ApplicationStatus; name: string; headline: string | null; location: string | null; appliedAt: string; notes: number };

const COLUMNS: ApplicationStatus[] = [...PIPELINE, "REJECTED"];

/**
 * Kanban pipeline. Moving works by drag-and-drop on desktop and by the "Move to" menu on every
 * card (keyboard and touch accessible).
 */
export function PipelineBoard({ applications }: { applications: Card[] }) {
  const [cards, applyMove] = useOptimistic(applications, (state, move: { id: string; to: ApplicationStatus }) =>
    state.map((c) => (c.id === move.id ? { ...c, status: move.to } : c)),
  );
  const [, start] = useTransition();
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  const move = (id: string, to: ApplicationStatus) => {
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === to || card.status === "WITHDRAWN") return;
    start(async () => {
      applyMove({ id, to });
      const res = await moveApplicationAction(id, to);
      if (res.error) toast.error(res.error);
      else toast.success(`${card.name} moved to ${PIPELINE_LABEL[to]}`);
    });
  };

  const withdrawn = cards.filter((c) => c.status === "WITHDRAWN");

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <div className="grid min-w-max auto-cols-[260px] grid-flow-col gap-3">
          {COLUMNS.map((col) => {
            const list = cards.filter((c) => c.status === col);
            return (
              <section
                key={col}
                aria-label={`${PIPELINE_LABEL[col]}, ${list.length} candidates`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col);
                }}
                onDragLeave={() => setDragOver((d) => (d === col ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  move(e.dataTransfer.getData("text/plain"), col);
                }}
                className={cn("flex min-h-64 min-w-0 flex-col rounded-[14px] bg-surface-2/70 p-2 transition-colors", dragOver === col && "bg-accent-soft ring-2 ring-accent")}
              >
                <h2 className="flex items-center justify-between px-2 py-2 font-sans text-sm font-bold tracking-normal">
                  {PIPELINE_LABEL[col]}
                  <span className="rounded-full bg-surface px-2 text-xs tabular text-muted">{list.length}</span>
                </h2>
                {/* minmax(0,1fr) stops truncated text from widening the column into its neighbour */}
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                  {list.map((c) => (
                    <li
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      className="cursor-grab rounded-[12px] border border-line bg-surface p-3 shadow-[0_1px_0_var(--line)] active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar name={c.name} size={32} />
                        <div className="min-w-0 flex-1">
                          <Link href={`/employer/applicants/${c.id}`} className="block truncate font-semibold hover:underline">
                            {c.name}
                          </Link>
                          {c.headline && <p className="truncate text-xs text-muted">{c.headline}</p>}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                        <span>
                          {timeAgo(c.appliedAt)}
                          {c.notes > 0 && (
                            <span className="ml-2 inline-flex items-center gap-0.5" title={`${c.notes} private notes`}>
                              <MessageSquareText className="size-3" aria-hidden /> {c.notes}
                            </span>
                          )}
                        </span>
                        <MoveMenu current={c.status} name={c.name} onMove={(to) => move(c.id, to)} />
                      </div>
                    </li>
                  ))}
                  {list.length === 0 && <li className="rounded-[12px] border border-dashed border-line-strong p-4 text-center text-xs text-muted">Drop candidates here</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
      {withdrawn.length > 0 && (
        <div className="mt-2">
          <button type="button" className="text-sm font-semibold text-muted hover:text-ink" onClick={() => setShowWithdrawn((s) => !s)} aria-expanded={showWithdrawn}>
            {showWithdrawn ? "Hide" : "Show"} {withdrawn.length} withdrawn {withdrawn.length === 1 ? "application" : "applications"}
          </button>
          {showWithdrawn && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {withdrawn.map((c) => (
                <li key={c.id}>
                  <Link href={`/employer/applicants/${c.id}`} className="inline-flex rounded-full border border-line px-3 py-1 text-sm text-muted hover:text-ink">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MoveMenu({ current, name, onMove }: { current: ApplicationStatus; name: string; onMove: (to: ApplicationStatus) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 font-semibold text-ink hover:bg-surface-2" aria-label={`Move ${name} to another stage`}>
        Move <ChevronDown className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {PIPELINE.filter((s) => s !== current).map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onMove(s)}>
            {PIPELINE_LABEL[s]}
          </DropdownMenuItem>
        ))}
        {current !== "REJECTED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onMove("REJECTED")}>
              Reject
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
