"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import type { PlatformSettings } from "@/lib/settings";
import { runAlertsNowAction, saveSettingsAction } from "@/server/admin-actions";

export function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const [state, action] = useActionState(saveSettingsAction, {});
  const fe = state.fieldErrors ?? {};
  const toggles = [
    { name: "requireJobApproval", label: "Review every job before it publishes", hint: "Off: only unverified companies and flagged listings are reviewed." },
    { name: "allowEmployerSignup", label: "Allow new employer sign-ups" },
    { name: "allowSeekerSignup", label: "Allow new job seeker sign-ups" },
  ] as const;
  return (
    <form action={action} className="grid gap-6" noValidate>
      <FormMessage state={state} />
      <section className="grid gap-4 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Trust and access</h2>
        {toggles.map((t) => (
          <label key={t.name} className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-[15px] font-semibold">{t.label}</span>
              {"hint" in t && <span className="text-sm text-muted">{t.hint}</span>}
            </span>
            <Switch name={t.name} defaultChecked={settings[t.name]} label={t.label} />
          </label>
        ))}
        <Field label="Risk score threshold" hint="Listings scoring at or above this go to manual review (10–100)." error={fe.riskThreshold}>
          {({ id, describedBy, invalid }) => <Input id={id} name="riskThreshold" type="number" min={10} max={100} defaultValue={settings.riskThreshold} className="max-w-32" aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Support email" error={fe.supportEmail}>
          {({ id, invalid }) => <Input id={id} name="supportEmail" type="email" defaultValue={settings.supportEmail} aria-invalid={invalid} />}
        </Field>
      </section>
      <section className="grid gap-4 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Homepage content</h2>
        <Field label="Hero headline" error={fe.heroHeadline}>
          {({ id, invalid }) => <Input id={id} name="heroHeadline" maxLength={80} defaultValue={settings.heroHeadline} aria-invalid={invalid} />}
        </Field>
        <Field label="Hero supporting text" error={fe.heroSubtext}>
          {({ id, invalid }) => <Textarea id={id} name="heroSubtext" rows={3} maxLength={220} defaultValue={settings.heroSubtext} aria-invalid={invalid} />}
        </Field>
        <Field label="Popular searches" hint="Comma-separated, up to 8." error={fe.popularSearches}>
          {({ id, describedBy, invalid }) => <Input id={id} name="popularSearches" defaultValue={settings.popularSearches.join(", ")} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Site-wide banner" optional hint="Shown above the public navigation. Leave empty to hide." error={fe.maintenanceBanner}>
          {({ id, describedBy, invalid }) => <Input id={id} name="maintenanceBanner" maxLength={200} defaultValue={settings.maintenanceBanner} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <p className="text-sm text-muted">Featured jobs and companies are chosen from Job moderation and Companies.</p>
      </section>
      <SubmitButton className="justify-self-start" size="lg" pendingText="Saving…">
        Save settings
      </SubmitButton>
    </form>
  );
}

export function RunAlerts() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await runAlertsNowAction();
          if (res.error) toast.error(res.error);
          else toast.success(res.message ?? "Done");
        })
      }
    >
      Run job alerts now
    </Button>
  );
}
