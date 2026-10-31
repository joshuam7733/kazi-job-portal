import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdminPage } from "@/lib/session";

export const metadata = { title: "Audit log" };
const PAGE_SIZE = 40;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage("audit:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim().slice(0, 60);
  const where: Prisma.AdminAuditLogWhereInput = q
    ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { entityType: { contains: q, mode: "insensitive" } }] }
    : {};
  const [rows, total] = await Promise.all([
    db.adminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { actor: { select: { name: true, email: true } } } }),
    db.adminAuditLog.count({ where }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader title="Audit log" description="Every administrative action, newest first. Entries can't be edited or deleted from the app." />
      <form className="flex gap-2" role="search" aria-label="Filter audit log">
        <label htmlFor="a-q" className="sr-only">
          Action, entity or summary
        </label>
        <input id="a-q" name="q" defaultValue={q} placeholder="e.g. job.remove, Company, user.suspend" className="h-10 flex-1 rounded-[10px] border border-line-strong bg-surface px-3" />
        <button className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-ink-contrast">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2 text-xs font-semibold text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">When</th>
              <th scope="col" className="px-4 py-3">Who</th>
              <th scope="col" className="px-4 py-3">Action</th>
              <th scope="col" className="px-4 py-3">Target</th>
              <th scope="col" className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-muted tabular">{formatDate(r.createdAt, "d MMM yyyy, HH:mm")}</td>
                <td className="px-4 py-3">{r.actor ? `${r.actor.name} (${r.actor.email})` : "System"}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
                <td className="px-4 py-3">
                  <span className="text-muted">{r.entityType}</span> {r.summary}
                </td>
                <td className="px-4 py-3 text-muted">{r.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/audit?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`} />
    </div>
  );
}
