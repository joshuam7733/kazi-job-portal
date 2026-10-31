import Link from "next/link";
import { cn } from "@/lib/utils";

/** Live metric tile. `value` must come from a real query — never a placeholder. */
export function StatCard({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: string;
  value: number | string;
  hint?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular">{typeof value === "number" ? value.toLocaleString("en") : value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </>
  );
  const cls = cn("block rounded-[14px] border border-line bg-surface p-5", href && "transition-colors hover:border-line-strong", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
