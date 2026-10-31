"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({ children, pendingText, loading, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending || loading} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

export function FormMessage({ state, className }: { state: { error?: string; message?: string; ok?: boolean }; className?: string }) {
  if (state.error)
    return (
      <div role="alert" className={cn("flex gap-2.5 rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger", className)}>
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {state.error}
      </div>
    );
  if (state.ok && state.message)
    return (
      <div role="status" className={cn("flex gap-2.5 rounded-[10px] bg-accent-soft px-3.5 py-3 text-sm font-medium text-accent-ink", className)}>
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        {state.message}
      </div>
    );
  return null;
}
