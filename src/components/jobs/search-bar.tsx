"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, List, Loader2, MapPin, Search, X } from "lucide-react";
import { useSearchState } from "./search-state";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;

export function SearchBar({ locations }: { locations: { slug: string; label: string }[] }) {
  const { params, update, pending } = useSearchState();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(params.get("q") ?? "");

  // Keep the input in sync when the URL changes from elsewhere (back button, chips).
  useEffect(() => {
    const urlQ = params.get("q") ?? "";
    if (urlQ !== lastSent.current) {
      lastSent.current = urlQ;
      setQ(urlQ);
    }
  }, [params]);

  const send = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    const trimmed = value.trim();
    if (trimmed === lastSent.current) return;
    lastSent.current = trimmed;
    update({ q: trimmed || null });
  };

  const onChange = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => send(value), DEBOUNCE_MS);
  };

  return (
    <form
      role="search"
      aria-label="Search jobs"
      onSubmit={(e) => {
        e.preventDefault();
        send(q);
      }}
      className="flex flex-col gap-2 rounded-[14px] border border-line-strong bg-surface p-1.5 sm:flex-row sm:items-center"
    >
      <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] px-3 focus-within:bg-surface-2">
        {pending ? <Loader2 className="size-[18px] shrink-0 animate-spin text-muted" aria-hidden /> : <Search className="size-[18px] shrink-0 text-muted" aria-hidden />}
        <span className="sr-only">Job title, company, keyword or skill</span>
        <input
          type="search"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Job title, company, keyword or skill"
          className="h-11 w-full min-w-0 bg-transparent outline-none placeholder:text-muted"
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={() => onChange("")} className="rounded-full p-1 text-muted hover:text-ink" aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
      </label>
      <span className="hidden h-7 w-px bg-line sm:block" aria-hidden />
      <label className="relative flex items-center gap-2.5 rounded-[10px] px-3 focus-within:bg-surface-2 sm:w-52">
        <MapPin className="size-[18px] shrink-0 text-muted" aria-hidden />
        <span className="sr-only">Location</span>
        <select
          value={params.get("loc") ?? ""}
          onChange={(e) => update({ loc: e.target.value || null })}
          className="h-11 w-full cursor-pointer appearance-none bg-transparent outline-none"
        >
          <option value="">Anywhere</option>
          {locations.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="h-11 rounded-[10px] bg-ink px-5 text-sm font-semibold text-ink-contrast hover:bg-ink/90">
        Search
      </button>
    </form>
  );
}

export function ResultsToolbar({ total }: { total: number }) {
  const { params, update } = useSearchState();
  const view = params.get("view") === "grid" ? "grid" : "list";
  const sort = params.get("sort") ?? "newest";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        <span className="font-semibold text-ink tabular">{total.toLocaleString("en")}</span> {total === 1 ? "job" : "jobs"} found
      </p>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sort by</span>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
            className="h-9 cursor-pointer rounded-[8px] border border-line-strong bg-surface px-2 text-sm font-semibold"
          >
            <option value="newest">Newest</option>
            <option value="relevance">Featured first</option>
            <option value="salary">Highest salary</option>
            <option value="deadline">Closing soon</option>
          </select>
        </label>
        <div className="hidden rounded-[10px] border border-line-strong bg-surface p-0.5 md:flex" role="group" aria-label="Layout">
          {(["list", "grid"] as const).map((v) => {
            const Icon = v === "list" ? List : LayoutGrid;
            return (
              <Tooltip key={v} content={v === "list" ? "List view" : "Grid view"}>
                <button
                  type="button"
                  aria-pressed={view === v}
                  aria-label={v === "list" ? "List view" : "Grid view"}
                  onClick={() => update({ view: v === "list" ? null : "grid" }, { keepPage: true })}
                  className={cn("inline-flex size-8 items-center justify-center rounded-[8px] text-muted", view === v && "bg-surface-2 text-ink")}
                >
                  <Icon className="size-4" />
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
