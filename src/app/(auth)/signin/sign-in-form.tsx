"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { signInAction } from "@/server/auth-actions";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(signInAction, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormMessage state={state} />
      <Field label="Email" error={state.fieldErrors?.email}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      <Field label="Password" error={state.fieldErrors?.password}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="password" type="password" autoComplete="current-password" required aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-sm font-semibold text-accent-ink underline-offset-4 hover:underline dark:text-accent">
          Forgot password?
        </Link>
      </div>
      <SubmitButton size="lg" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
