import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { homeForRole } from "@/lib/permissions";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

export const PUBLIC_NAV = [
  { href: "/jobs", label: "Find Jobs" },
  { href: "/companies", label: "Explore Companies" },
  { href: "/resources", label: "Career Resources" },
  { href: "/employers", label: "For Employers" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        <NavLinks items={PUBLIC_NAV} className="hidden lg:flex" />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/notifications"
                className="relative hidden size-10 items-center justify-center rounded-full text-ink hover:bg-surface-2 sm:inline-flex"
                aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-white dark:text-ink-contrast">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
                <Link href={homeForRole(user.role)}>Dashboard</Link>
              </Button>
              <UserMenu user={{ name: user.name ?? "", email: user.email ?? "", role: user.role }} />
            </>
          ) : (
            <>
              <Link href="/signin" className="hidden rounded-[10px] px-3 py-2 text-sm font-semibold hover:bg-surface-2 sm:inline-flex">
                Sign In
              </Link>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
          <MobileMenu items={PUBLIC_NAV} signedIn={Boolean(user)} dashboardHref={user ? homeForRole(user.role) : undefined} />
        </div>
      </div>
    </header>
  );
}
