"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function MobileMenu({
  items,
  signedIn,
  dashboardHref,
}: {
  items: { href: string; label: string }[];
  signedIn: boolean;
  dashboardHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close the menu after navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-2 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </DialogTrigger>
      <SheetContent title="Menu" side="auto">
        <nav aria-label="Mobile" className="grid gap-1 p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-12 items-center rounded-[10px] px-3 text-base font-semibold hover:bg-surface-2",
                pathname.startsWith(item.href) && "bg-accent-soft text-accent-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="grid gap-2 border-t border-line p-4">
          {signedIn ? (
            <Button asChild size="lg">
              <Link href={dashboardHref ?? "/dashboard"}>Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signin">Sign In</Link>
              </Button>
            </>
          )}
          <div className="mt-2 flex items-center justify-between rounded-[10px] bg-surface-2 px-3 py-2 text-sm font-semibold">
            Appearance
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Dialog>
  );
}
