"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavItem } from "./nav-icons";

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SidebarNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="grid gap-0.5">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink",
              active && "bg-surface-2 text-ink",
            )}
          >
            <Icon className={cn("size-[18px]", active && "text-accent")} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-white tabular dark:text-ink-contrast">{item.badge > 99 ? "99+" : item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar: up to four primary items plus a "More" sheet with everything else. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const primary = items.filter((i) => i.mobile).slice(0, 4);
  const rest = items.filter((i) => !primary.includes(i));
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {primary.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active ? "text-ink" : "text-muted")}>
                <Icon className={cn("size-5", active && "text-accent")} aria-hidden />
                {item.label}
                {item.badge ? <span className="absolute right-[calc(50%-18px)] top-2.5 size-2 rounded-full bg-accent" aria-label={`${item.badge} new`} /> : null}
              </Link>
            </li>
          );
        })}
        <li>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted">
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </DialogTrigger>
            <SheetContent title="More">
              <div className="p-3" onClick={() => setOpen(false)}>
                <SidebarNav items={rest} label="More" />
              </div>
            </SheetContent>
          </Dialog>
        </li>
      </ul>
    </nav>
  );
}
