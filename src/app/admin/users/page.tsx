import type { Prisma, Role } from "@prisma/client";
import { Badge, PageHeader } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { ADMIN_ROLE_LABEL } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { adminCan } from "@/lib/permissions";
import { requireAdminPage } from "@/lib/session";
import { InviteAdmin, UserRowActions } from "./user-actions";

export const metadata = { title: "Users" };
const PAGE_SIZE = 25;
const ROLES: Role[] = ["JOB_SEEKER", "EMPLOYER", "ADMIN"];
const ROLE_LABEL: Record<Role, string> = { JOB_SEEKER: "Job seeker", EMPLOYER: "Employer", ADMIN: "Admin" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage("users:manage");
  const sp = await searchParams;
  const role = ROLES.includes(sp.role as Role) ? (sp.role as Role) : undefined;
  const q = sp.q?.trim().slice(0, 80);
  const status = sp.status === "SUSPENDED" ? "SUSPENDED" : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { employerProfile: { include: { company: { select: { name: true } } } }, _count: { select: { applications: true } } },
    }),
    db.user.count({ where }),
  ]);
  const canManageAdmins = adminCan(admin.adminRole, "admins:manage");
  const href = (p: number) => {
    const qs = new URLSearchParams();
    if (role) qs.set("role", role);
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    if (p > 1) qs.set("page", String(p));
    return `/admin/users${qs.toString() ? `?${qs}` : ""}`;
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Users" description="Job seekers, employers and administrators." actions={canManageAdmins ? <InviteAdmin /> : undefined} />
      <form className="grid gap-2 sm:grid-cols-[1fr_180px_160px_auto]" role="search" aria-label="Filter users">
        <label htmlFor="u-q" className="sr-only">
          Name or email
        </label>
        <input id="u-q" name="q" defaultValue={q} placeholder="Name or email" className="h-10 rounded-[10px] border border-line-strong bg-surface px-3" />
        <label htmlFor="u-role" className="sr-only">
          Role
        </label>
        <select id="u-role" name="role" defaultValue={role ?? ""} className="h-10 rounded-[10px] border border-line-strong bg-surface px-3">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <label htmlFor="u-status" className="sr-only">
          Status
        </label>
        <select id="u-status" name="status" defaultValue={status ?? ""} className="h-10 rounded-[10px] border border-line-strong bg-surface px-3">
          <option value="">Any status</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-ink-contrast">Filter</button>
      </form>
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink tabular">{total.toLocaleString("en")}</span> users
      </p>
      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-2 text-xs font-semibold text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">User</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3">Activity</th>
              <th scope="col" className="px-4 py-3">Joined</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {u.name ?? "—"} {u.isSample && <Badge tone="outline">Sample</Badge>}
                  </p>
                  <p className="text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={u.role === "ADMIN" ? "ink" : "neutral"}>{ROLE_LABEL[u.role]}</Badge>
                    {u.adminRole && <Badge tone="info">{ADMIN_ROLE_LABEL[u.adminRole]}</Badge>}
                    {u.status === "SUSPENDED" && <Badge tone="danger">Suspended</Badge>}
                    {!u.emailVerified && <Badge tone="outline">Email unconfirmed</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {u.role === "JOB_SEEKER" && `${u._count.applications} applications`}
                  {u.role === "EMPLOYER" && (u.employerProfile?.company?.name ?? "No company yet")}
                  <br />
                  {u.lastLoginAt ? `Last sign-in ${timeAgo(u.lastLoginAt)}` : "Never signed in"}
                </td>
                <td className="px-4 py-3 text-muted tabular">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== admin.id && (
                    <UserRowActions user={{ id: u.id, name: u.name ?? u.email, role: u.role, status: u.status, adminRole: u.adminRole }} canManageAdmins={canManageAdmins} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={href} />
    </div>
  );
}
