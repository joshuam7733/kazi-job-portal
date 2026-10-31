"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchState } from "./search-state";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type Facets = {
  categories: { value: string; label: string; count: number }[];
  industries: { value: string; label: string }[];
  companies: { value: string; label: string }[];
};

const TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];
const WORKPLACE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];
const EXPERIENCE_OPTIONS = [
  { value: "entry", label: "Entry level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Manager" },
  { value: "executive", label: "Executive" },
];
const EDUCATION_OPTIONS = [
  { value: "none", label: "No formal requirement" },
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
];
const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];
const SALARY_OPTIONS = [
  { value: "", label: "Any salary" },
  { value: "500000", label: "UGX 500k+ / month" },
  { value: "1000000", label: "UGX 1M+ / month" },
  { value: "2500000", label: "UGX 2.5M+ / month" },
  { value: "5000000", label: "UGX 5M+ / month" },
  { value: "8000000", label: "UGX 8M+ / month" },
];

function CheckGroup({ legend, param, options }: { legend: string; param: string; options: { value: string; label: string }[] }) {
  const { params, update } = useSearchState();
  const selected = new Set((params.get(param) ?? "").split(",").filter(Boolean));
  return (
    <fieldset className="border-b border-line py-4 first:pt-0">
      <legend className="mb-2.5 text-sm font-bold">{legend}</legend>
      <div className="grid gap-1">
        {options.map((o) => (
          <label key={o.value} className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[8px] px-1 text-[15px] hover:bg-surface-2">
            <Checkbox
              checked={selected.has(o.value)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(o.value);
                else next.delete(o.value);
                update({ [param]: [...next] });
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SelectGroup({ legend, param, options }: { legend: string; param: string; options: { value: string; label: string }[] }) {
  const { params, update } = useSearchState();
  return (
    <div className="border-b border-line py-4">
      <label className="grid gap-2">
        <span className="text-sm font-bold">{legend}</span>
        <select
          value={params.get(param) ?? ""}
          onChange={(e) => update({ [param]: e.target.value || null })}
          className="h-10 w-full cursor-pointer rounded-[10px] border border-line-strong bg-surface px-3 text-[15px]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const FILTER_KEYS = ["type", "wp", "exp", "edu", "salary", "posted", "cat", "ind", "company", "loc"];

export function FilterPanel({ facets, className }: { facets: Facets; className?: string }) {
  const { params, update } = useSearchState();
  const active = FILTER_KEYS.some((k) => params.get(k));
  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-base font-bold tracking-normal">Filters</h2>
        {active && (
          <button
            type="button"
            className="text-sm font-semibold text-accent-ink hover:underline dark:text-accent"
            onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))}
          >
            Clear all
          </button>
        )}
      </div>
      <CheckGroup legend="Job type" param="type" options={TYPE_OPTIONS} />
      <CheckGroup legend="Work arrangement" param="wp" options={WORKPLACE_OPTIONS} />
      <SelectGroup legend="Salary" param="salary" options={SALARY_OPTIONS} />
      <CheckGroup legend="Experience level" param="exp" options={EXPERIENCE_OPTIONS} />
      <SelectGroup legend="Date posted" param="posted" options={POSTED_OPTIONS} />
      <SelectGroup
        legend="Category"
        param="cat"
        options={[{ value: "", label: "All categories" }, ...facets.categories.map((c) => ({ value: c.value, label: `${c.label} (${c.count})` }))]}
      />
      <SelectGroup legend="Industry" param="ind" options={[{ value: "", label: "All industries" }, ...facets.industries]} />
      <SelectGroup legend="Company" param="company" options={[{ value: "", label: "All companies" }, ...facets.companies]} />
      <CheckGroup legend="Education required" param="edu" options={EDUCATION_OPTIONS} />
    </div>
  );
}

export function MobileFilters({ facets, activeCount }: { facets: Facets; activeCount: number }) {
  const [open, setOpen] = useState(false);
  const { pending } = useSearchState();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="lg:hidden">
          <SlidersHorizontal /> Filters
          {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white dark:text-ink-contrast">{activeCount}</span>}
        </Button>
      </DialogTrigger>
      <SheetContent title="Filter jobs">
        <FilterPanel facets={facets} className="p-5" />
        <div className={cn("sticky bottom-0 border-t border-line bg-surface p-4")}>
          <Button className="w-full" size="lg" onClick={() => setOpen(false)} loading={pending}>
            Show results
          </Button>
        </div>
      </SheetContent>
    </Dialog>
  );
}
