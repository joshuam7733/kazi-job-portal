import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { adminCan, type AdminPermission } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "./app-shell";
import type { NavItem } from "./nav-icons";

const ADMIN_NAV: (NavItem & { perm?: AdminPermission })[] = [
  { href: "/admin", label: "Overview", icon: "analytics", exact: true, mobile: true, perm: "analytics:view" },
  { href: "/admin/verification", label: "Verification", icon: "verification", mobile: true, perm: "companies:verify" },
  { href: "/admin/jobs", label: "Job moderation", icon: "moderation", mobile: true, perm: "jobs:moderate" },
  { href: "/admin/reports", label: "Reports", icon: "reports", perm: "reports:review" },
  { href: "/admin/users", label: "Users", icon: "users", mobile: true, perm: "users:manage" },
  { href: "/admin/companies", label: "Companies", icon: "company", perm: "companies:verify" },
  { href: "/admin/taxonomy", label: "Categories & places", icon: "taxonomy", perm: "taxonomy:manage" },
  { href: "/admin/content", label: "Career resources", icon: "content", perm: "content:manage" },
  { href: "/admin/announcements", label: "Announcements", icon: "announcements", perm: "announcements:send" },
  { href: "/admin/settings", label: "Platform settings", icon: "settings", perm: "settings:manage" },
  { href: "/admin/audit", label: "Audit log", icon: "audit", perm: "audit:view" },
];

/** Renders the app shell with navigation for the signed-in user's role. */
export async function RoleShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  if (user.role === "ADMIN") {
    const [pendingVerifications, pendingJobs, openReports] = await Promise.all([
      db.companyVerification.count({ where: { status: "PENDING" } }),
      db.job.count({ where: { status: "PENDING_REVIEW" } }),
      db.report.count({ where: { status: "OPEN" } }),
    ]);
    const badges: Record<string, number> = { "/admin/verification": pendingVerifications, "/admin/jobs": pendingJobs, "/admin/reports": openReports };
    const nav = ADMIN_NAV.filter((i) => !i.perm || adminCan(user.adminRole, i.perm)).map((i) => ({ ...i, badge: badges[i.href] }));
    return (
      <AppShell nav={[...nav, { href: "/notifications", label: "Notifications", icon: "notifications" }]} areaLabel="Admin">
        {children}
      </AppShell>
    );
  }

  // Count conversations with messages newer than the participant's lastReadAt.
  const participations = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    select: { lastReadAt: true, conversation: { select: { messages: { where: { senderId: { not: user.id } }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } } },
  });
  const unreadThreads = participations.filter((p) => {
    const last = p.conversation.messages[0]?.createdAt;
    return last && (!p.lastReadAt || last > p.lastReadAt);
  }).length;

  if (user.role === "EMPLOYER") {
    const profile = await db.employerProfile.findUnique({ where: { userId: user.id }, include: { company: true } });
    const company = profile?.company;
    const newApplicants = company ? await db.application.count({ where: { job: { companyId: company.id }, status: "SUBMITTED" } }) : 0;
    const nav: NavItem[] = [
      { href: "/employer", label: "Overview", icon: "overview", exact: true, mobile: true },
      { href: "/employer/jobs", label: "Jobs", icon: "jobs", mobile: true },
      { href: "/employer/applicants", label: "Applicants", icon: "pipeline", mobile: true, badge: newApplicants },
      { href: "/employer/company", label: "Company profile", icon: "company" },
      { href: "/messages", label: "Messages", icon: "messages", mobile: true, badge: unreadThreads },
      { href: "/notifications", label: "Notifications", icon: "notifications" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ];
    const banner =
      company && company.verificationStatus !== "VERIFIED" ? (
        <div className="flex items-start gap-2 border-b border-line bg-sun-soft px-4 py-2.5 text-sm text-[#6b4700] sm:px-6 lg:px-8 dark:text-sun">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {company.verificationStatus === "PENDING"
              ? "Your company verification is being reviewed. Jobs you submit will be checked by our team before they go live."
              : company.verificationStatus === "REJECTED"
                ? "Your verification request was not approved. Update your details and request verification again."
                : "Verify your company so your jobs can publish without manual review."}{" "}
            {company.verificationStatus !== "PENDING" && (
              <Link href="/employer/company#verification" className="font-semibold underline">
                Request verification
              </Link>
            )}
          </p>
        </div>
      ) : null;
    return (
      <AppShell nav={nav} areaLabel="Employer" banner={banner}>
        {children}
      </AppShell>
    );
  }

  const applications = await db.application.count({ where: { candidateId: user.id, status: { in: ["INTERVIEW", "OFFER"] } } });
  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "overview", exact: true, mobile: true },
    { href: "/dashboard/applications", label: "Applications", icon: "applications", mobile: true, badge: applications },
    { href: "/dashboard/saved", label: "Saved jobs", icon: "saved", mobile: true },
    { href: "/dashboard/profile", label: "My profile", icon: "profile" },
    { href: "/dashboard/alerts", label: "Job alerts", icon: "alerts" },
    { href: "/messages", label: "Messages", icon: "messages", mobile: true, badge: unreadThreads },
    { href: "/notifications", label: "Notifications", icon: "notifications" },
    { href: "/settings", label: "Settings", icon: "settings" },
    { href: "/jobs", label: "Find jobs", icon: "jobs" },
  ];
  return (
    <AppShell nav={nav} areaLabel="Job seeker">
      {children}
    </AppShell>
  );
}
