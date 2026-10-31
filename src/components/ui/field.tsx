import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted/80 transition-colors duration-150 hover:border-ink/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/25";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(control, "h-11", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />,
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-11 cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  ),
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-semibold text-ink", className)} {...props} />;
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-sm font-medium text-danger" role="alert">
      {children}
    </p>
  );
}

type FieldProps = {
  label: string;
  hint?: React.ReactNode;
  error?: string | string[];
  optional?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
};

/** Visible label + hint + error, wired with aria-describedby. */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const err = Array.isArray(error) ? error[0] : error;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = err ? `${id}-err` : undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </Label>
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: Boolean(err) })}
      {hint && !err && (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      <FieldError id={errId}>{err}</FieldError>
    </div>
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("size-[18px] shrink-0 cursor-pointer rounded-[5px] border-line-strong accent-[var(--accent)]", className)}
      {...props}
    />
  );
}

export function Switch({
  checked,
  onCheckedChange,
  name,
  defaultChecked,
  label,
  id,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  name?: string;
  label: string;
  id?: string;
}) {
  return (
    <span className="relative inline-flex">
      <input
        id={id}
        type="checkbox"
        role="switch"
        name={name}
        aria-label={label}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
      />
      <span
        aria-hidden
        className="h-6 w-11 rounded-full bg-line-strong transition-colors duration-150 peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-150 peer-checked:after:translate-x-5"
      />
    </span>
  );
}
