import Link from "next/link";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { alertFilters, alertSearchUrl } from "@/lib/alerts";
import { filtersToSearchParams } from "@/lib/jobs/filters";
import { requirePageUser } from "@/lib/session";
import { AlertRow } from "./alert-row";

export const metadata = { title: "Job alerts" };

function describe(filters: ReturnType<typeof alertFilters>, names: { cats: Map<string, string>; locs: Map<string, string> }) {
  const parts: string[] = [];
  if (filters.q) parts.push(`“${filters.q}”`);
  if (filters.cat) parts.push(names.cats.get(filters.cat) ?? filters.cat);
  if (filters.loc) parts.push(`in ${names.locs.get(filters.loc) ?? filters.loc}`);
  if (filters.wp.length) parts.push(filters.wp.join(" or "));
  if (filters.type.length) parts.push(filters.type.join(", "));
  if (filters.exp.length) parts.push(`${filters.exp.join(", ")} level`);
  if (filters.salary) parts.push(`UGX ${filters.salary.toLocaleString("en")}+ per month`);
  return parts.length ? parts.join(", ") : "All new jobs";
}

export default async function AlertsPage() {
  const user = await requirePageUser(["JOB_SEEKER"]);
  const [alerts, cats, locs] = await Promise.all([
    db.jobAlert.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.jobCategory.findMany({ select: { slug: true, name: true } }),
    db.location.findMany({ select: { slug: true, city: true } }),
  ]);
  const names = { cats: new Map(cats.map((c) => [c.slug, c.name])), locs: new Map(locs.map((l) => [l.slug, l.city])) };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Job alerts"
        description="Get notified when new jobs match a search. Alerts arrive in your notifications and, if you allow it, by email."
        actions={
          <Button asChild>
            <Link href="/jobs">Create from a search</Link>
          </Button>
        }
      />
      {alerts.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No alerts yet"
          description="Search for jobs, set your filters, then choose “Create job alert”."
          action={
            <Button asChild>
              <Link href="/jobs">Search jobs</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {alerts.map((a) => {
            const f = alertFilters(a);
            return (
              <AlertRow
                key={a.id}
                alert={{ id: a.id, name: a.name, frequency: a.frequency, isActive: a.isActive, lastSentAt: a.lastSentAt?.toISOString() ?? null }}
                description={describe(f, names)}
                searchUrl={alertSearchUrl(a)}
                query={filtersToSearchParams(f).toString()}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
