"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Briefcase, Building2 } from "lucide-react";
import { Checkbox, Field, FieldError, Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { signUpAction } from "@/server/auth-actions";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "JOB_SEEKER", label: "I'm looking for work", hint: "Find jobs and apply", icon: Briefcase },
  { value: "EMPLOYER", label: "I'm hiring", hint: "Post jobs and manage applicants", icon: Building2 },
] as const;

export function SignUpForm({ defaultRole }: { defaultRole: "JOB_SEEKER" | "EMPLOYER" }) {
  const [state, action] = useActionState(signUpAction, {});
  const [role, setRole] = useState<string>(state.values?.role || defaultRole);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormMessage state={state} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Account type</legend>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-1 rounded-[14px] border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                role === value ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:border-ink/30",
              )}
            >
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              <Icon className={cn("size-5", role === value ? "text-accent-ink" : "text-muted")} aria-hidden />
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Full name" error={state.fieldErrors?.name}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="name" autoComplete="name" required defaultValue={state.values?.name} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <Field label={role === "EMPLOYER" ? "Work email" : "Email"} error={state.fieldErrors?.email}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <Field label="Password" hint="At least 8 characters, with a letter and a number." error={state.fieldErrors?.password}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="password" type="password" autoComplete="new-password" required aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <div>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <Checkbox name="acceptTerms" className="mt-0.5" aria-invalid={Boolean(state.fieldErrors?.acceptTerms)} />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-ink underline underline-offset-2" target="_blank">
              Terms of use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-ink underline underline-offset-2" target="_blank">
              Privacy policy
            </Link>
            .
          </span>
        </label>
        <FieldError>{state.fieldErrors?.acceptTerms?.[0]}</FieldError>
      </div>
      <SubmitButton size="lg" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
