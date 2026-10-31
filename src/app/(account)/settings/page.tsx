import { PageHeader } from "@/components/ui/misc";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/lib/db";
import { smtpConfigured } from "@/lib/mail";
import { requirePageUser } from "@/lib/session";
import { ChangePasswordForm, DeleteAccountForm, EmailPreferencesForm, ResendVerification, SignOutEverywhere } from "./forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const sessionUser = await requirePageUser();
  const user = await db.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { email: true, emailVerified: true, passwordHash: true, role: true, emailApplicationUpdates: true, emailMessages: true, emailJobAlerts: true, emailMarketing: true, accounts: { select: { provider: true } } },
  });
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Settings" description="Manage your sign-in, notifications and account." />

      <Section title="Account">
        <dl className="grid gap-3 text-[15px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">Email</dt>
            <dd className="flex items-center gap-3 font-semibold">
              {user.email}
              {user.emailVerified ? <span className="text-sm font-semibold text-accent-ink dark:text-accent">Confirmed</span> : <ResendVerification />}
            </dd>
          </div>
          {user.accounts.length > 0 && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Connected sign-in</dt>
              <dd className="font-semibold capitalize">{user.accounts.map((a) => a.provider).join(", ")}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">Appearance</dt>
            <dd>
              <ThemeToggle />
            </dd>
          </div>
        </dl>
        {!smtpConfigured() && process.env.NODE_ENV !== "production" && (
          <p className="mt-4 rounded-[10px] bg-surface-2 p-3 text-sm text-muted">
            Email delivery isn&apos;t configured in this environment. Messages are saved locally and viewable at <a href="/dev/mail" className="font-semibold underline">/dev/mail</a>.
          </p>
        )}
      </Section>

      {user.passwordHash && (
        <Section title="Password" description="You'll be signed out on all devices after changing it.">
          <ChangePasswordForm />
        </Section>
      )}

      <Section title="Email notifications" description="In-app notifications are always on. Choose what we also email you.">
        <EmailPreferencesForm
          values={{
            emailApplicationUpdates: user.emailApplicationUpdates,
            emailMessages: user.emailMessages,
            emailJobAlerts: user.emailJobAlerts,
            emailMarketing: user.emailMarketing,
          }}
          role={user.role}
        />
      </Section>

      <Section title="Sessions" description="Signed in on a shared or lost device? Sign out everywhere, including here.">
        <SignOutEverywhere />
      </Section>

      <Section title="Your data" description="Download a copy of the personal information KAZI holds about you, as a JSON file.">
        <a href="/api/account/export" className="inline-flex h-11 items-center rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2">
          Download my data
        </a>
      </Section>

      <Section title="Delete account" description="Permanently deletes your profile, CVs, applications, saved jobs and alerts. This can't be undone." danger>
        <DeleteAccountForm hasPassword={Boolean(user.passwordHash)} role={user.role} />
      </Section>
    </div>
  );
}

function Section({ title, description, children, danger }: { title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={`rounded-[14px] border bg-surface p-5 sm:p-6 ${danger ? "border-danger/40" : "border-line"}`}>
      <h2 className="font-sans text-lg font-bold tracking-normal">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
