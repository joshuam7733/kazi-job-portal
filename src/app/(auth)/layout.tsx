import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { SITE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-ink-contrast lg:flex dark:bg-surface dark:text-ink">
        <Logo className="text-ink-contrast dark:text-ink" />
        <div className="max-w-md">
          <p className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.03em]">{SITE.tagline}</p>
          <p className="mt-5 text-base leading-relaxed opacity-75">
            Every employer on KAZI is reviewed before their listings carry a verified mark, and new listings are screened for common scam patterns.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm opacity-70">
          <ShieldCheck className="size-4" aria-hidden /> We never ask job seekers to pay to apply.
        </p>
      </aside>
      <main id="main" className="flex flex-col px-4 py-8 sm:px-8">
        <Logo className="lg:hidden" />
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
