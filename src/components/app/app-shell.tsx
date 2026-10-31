import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/site/user-menu";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { NavItem } from "./nav-icons";
import { BottomNav, SidebarNav } from "./sidebar-nav";

export async function AppShell({
  nav,
  areaLabel,
  children,
  banner,
}: {
  nav: NavItem[];
  areaLabel: string;
  children: React.ReactNode;
  banner?: React.ReactNode;
}) {
  const user = await getSessionUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="flex items-center justify-between px-3">
          <Logo />
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{areaLabel}</span>
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">
          <SidebarNav items={nav} label={`${areaLabel} navigation`} />
        </div>
        <div className="flex items-center justify-between border-t border-line px-2 pt-4">
          <Link href="/" className="text-sm font-semibold text-muted hover:text-ink">
            View site
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Logo className="lg:hidden" />
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/notifications"
              className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-2"
              aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            >
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-accent ring-2 ring-canvas" aria-hidden />}
            </Link>
            {user && <UserMenu user={{ name: user.name ?? "", email: user.email ?? "", role: user.role }} />}
          </div>
        </header>
        {banner}
        <main id="main" className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
      <BottomNav items={nav} />
    </div>
  );
}
