"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ items, className }: { items: { href: string; label: string }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={cn("items-center gap-1", className)}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-[10px] px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink",
              active && "text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-accent",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
