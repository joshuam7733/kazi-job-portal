import { cva, type VariantProps } from "class-variance-authority";
import { cn, initials } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-ink",
        accent: "bg-accent-soft text-accent-ink",
        sun: "bg-sun-soft text-[#7a5200] dark:text-sun",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        outline: "border border-line-strong text-muted",
        ink: "bg-ink text-ink-contrast",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[14px] border border-line bg-surface", className)} {...props} />;
}

export function Avatar({ name, src, size = 40, className }: { name?: string | null; src?: string | null; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent-ink", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden={!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Company logo with a brand-coloured monogram fallback. */
export function CompanyLogo({
  name,
  logoUrl,
  brandColor,
  size = 44,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-[10px] border border-line bg-white object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const letters = name
    .replace(/[^A-Za-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[10px] font-display font-bold text-white", className)}
      style={{ width: size, height: size, background: brandColor ?? "#0F1B2D", fontSize: size * 0.36 }}
    >
      {letters || "?"}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-[8px] bg-surface-2 before:absolute before:inset-0 before:-translate-x-full before:animate-[kazi-shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent dark:before:via-white/5",
        className,
      )}
    />
  );
}

export function Progress({ value, className, label }: { value: number; className?: string; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease)]" style={{ width: `${v}%` }} />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[14px] border border-dashed border-line-strong px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-5" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge tone="outline" className={cn("font-medium", className)} title="Demonstration content — not a real listing">
      Sample data
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
