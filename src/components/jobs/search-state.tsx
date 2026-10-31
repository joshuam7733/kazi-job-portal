"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Updates = Record<string, string | string[] | null | undefined>;
type Ctx = { pending: boolean; update: (updates: Updates, opts?: { keepPage?: boolean }) => void; params: URLSearchParams };

const SearchCtx = createContext<Ctx | null>(null);

/** Owns URL-persisted search state: every filter change is a `router.replace` with the new query string. */
export function SearchStateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  // Controls reflect the requested filters immediately; the URL (and results) catch up in a transition.
  const urlQuery = searchParams.toString();
  const [params, setParams] = useState(() => new URLSearchParams(urlQuery));
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery);
    setParams(new URLSearchParams(urlQuery));
  }

  const update = useCallback(
    (updates: Updates, opts?: { keepPage?: boolean }) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        const v = Array.isArray(value) ? value.join(",") : value;
        if (v === null || v === undefined || v === "") next.delete(key);
        else next.set(key, v);
      }
      if (!opts?.keepPage) next.delete("page");
      setParams(next);
      const qs = next.toString();
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, params],
  );

  return <SearchCtx.Provider value={{ pending, update, params }}>{children}</SearchCtx.Provider>;
}

export function useSearchState() {
  const ctx = useContext(SearchCtx);
  if (!ctx) throw new Error("useSearchState must be used inside SearchStateProvider");
  return ctx;
}

/** Dims results while a new query is loading, and announces it to screen readers. */
export function PendingRegion({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useSearchState();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)}>
      {children}
    </div>
  );
}
