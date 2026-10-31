import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-baseline gap-0.5 font-display text-[26px] font-bold leading-none tracking-[-0.04em]", className)}>
      <span>kazi</span>
      <span aria-hidden className="inline-block size-[7px] translate-y-[-1px] rounded-[2px] bg-accent" />
      <span className="sr-only">KAZI Job Portal home</span>
    </Link>
  );
}
