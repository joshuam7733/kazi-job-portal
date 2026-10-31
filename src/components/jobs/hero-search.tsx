import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Plain GET form: works before hydration and without JavaScript. */
export function HeroSearch({ locations }: { locations: { slug: string; city: string; country: string }[] }) {
  return (
    <form action="/jobs" method="get" role="search" aria-label="Search jobs" className="rounded-[20px] border border-line-strong bg-surface p-2 shadow-[0_20px_50px_-30px_rgb(15_27_45/0.35)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[12px] px-3 focus-within:bg-surface-2">
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Job title, keyword or skill</span>
          <input
            name="q"
            type="search"
            placeholder="Job title, keyword or skill"
            autoComplete="off"
            className="h-12 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted md:h-14"
          />
        </label>
        <span className="hidden h-8 w-px bg-line md:block" aria-hidden />
        <label className="relative flex items-center gap-3 rounded-[12px] px-3 focus-within:bg-surface-2 md:w-44">
          <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Location</span>
          <select name="loc" defaultValue="" className="h-12 w-full cursor-pointer appearance-none bg-transparent text-base outline-none md:h-14">
            <option value="">Anywhere</option>
            {locations.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.city}
                {l.country !== "Uganda" ? `, ${l.country}` : ""}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="lg" className="h-12 md:h-14 md:px-7">
          Search Jobs
        </Button>
      </div>
    </form>
  );
}
