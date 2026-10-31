"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { changePasswordAction, resendVerificationAction, signOutEverywhereAction } from "@/server/auth-actions";
import { deleteAccountAction, saveEmailPreferencesAction } from "@/server/account-actions";

export function ResendVerification() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="link"
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await resendVerificationAction();
          if (res.error) toast.error(res.error);
          else toast.success(res.message ?? "Sent");
        })
      }
    >
      Send confirmation email
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:max-w-md" noValidate>
      <FormMessage state={{ error: state.error }} />
      <Field label="Current password" error={fe.current}>
        {({ id, invalid }) => <Input id={id} name="current" type="password" autoComplete="current-password" aria-invalid={invalid} />}
      </Field>
      <Field label="New password" hint="At least 8 characters, with a letter and a number." error={fe.password}>
        {({ id, describedBy, invalid }) => <Input id={id} name="password" type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid} />}
      </Field>
      <Field label="Confirm new password" error={fe.confirm}>
        {({ id, invalid }) => <Input id={id} name="confirm" type="password" autoComplete="new-password" aria-invalid={invalid} />}
      </Field>
      <SubmitButton className="justify-self-start" pendingText="Changing…">
        Change password
      </SubmitButton>
    </form>
  );
}

export function EmailPreferencesForm({ values, role }: { values: Record<string, boolean>; role: string }) {
  const [state, action] = useActionState(saveEmailPreferencesAction, {});
  const rows = [
    { name: "emailApplicationUpdates", label: role === "EMPLOYER" ? "New applications and candidate updates" : "Application status changes and interview invitations" },
    { name: "emailMessages", label: "New messages" },
    ...(role === "JOB_SEEKER" ? [{ name: "emailJobAlerts", label: "Job alert matches" }] : []),
    { name: "emailMarketing", label: "Occasional product news and career tips" },
  ];
  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      {rows.map((r) => (
        <label key={r.name} className="flex items-center justify-between gap-4 text-[15px]">
          {r.label}
          <Switch name={r.name} defaultChecked={values[r.name]} label={r.label} />
        </label>
      ))}
      <SubmitButton size="sm" className="justify-self-start" pendingText="Saving…">
        Save email preferences
      </SubmitButton>
    </form>
  );
}

export function SignOutEverywhere() {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" loading={pending} onClick={() => start(() => signOutEverywhereAction())}>
      Sign out of all devices
    </Button>
  );
}

export function DeleteAccountForm({ hasPassword, role }: { hasPassword: boolean; role: string }) {
  const [state, action] = useActionState(deleteAccountAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:max-w-md" noValidate>
      {role === "EMPLOYER" && <p className="text-sm text-muted">If you&apos;re the only member of your company, the company profile and all its jobs are deleted too.</p>}
      <FormMessage state={{ error: state.error }} />
      {hasPassword && (
        <Field label="Your password" error={fe.password}>
          {({ id, invalid }) => <Input id={id} name="password" type="password" autoComplete="current-password" aria-invalid={invalid} />}
        </Field>
      )}
      <Field label="Type DELETE to confirm" error={fe.confirm}>
        {({ id, invalid }) => <Input id={id} name="confirm" autoComplete="off" aria-invalid={invalid} />}
      </Field>
      <SubmitButton variant="danger" className="justify-self-start" pendingText="Deleting…">
        Delete my account
      </SubmitButton>
    </form>
  );
}
