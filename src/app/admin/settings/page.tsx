import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { smtpConfigured } from "@/lib/mail";
import { requireAdminPage } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { RunAlerts, SettingsForm } from "./settings-form";

export const metadata = { title: "Platform settings" };

export default async function SettingsPage() {
  await requireAdminPage("settings:manage");
  const [settings, subscribers, alerts] = await Promise.all([getSettings(), db.newsletterSubscriber.count(), db.jobAlert.count({ where: { isActive: true } })]);
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Platform settings" description="Changes apply immediately across the site." />
      <SettingsForm settings={settings} />
      <section className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Integrations and jobs</h2>
        <dl className="mt-4 grid gap-3 text-[15px]">
          <Row label="Email delivery">{smtpConfigured() ? "SMTP configured" : "Not configured — emails are saved locally"}</Row>
          <Row label="Google sign-in">{process.env.AUTH_GOOGLE_ID ? "Enabled" : "Disabled (set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET)"}</Row>
          <Row label="File storage">{process.env.STORAGE_DRIVER === "s3" ? "S3-compatible bucket" : "Local disk"}</Row>
          <Row label="Active job alerts">{alerts.toLocaleString("en")}</Row>
          <Row label="Newsletter subscribers">{subscribers.toLocaleString("en")}</Row>
        </dl>
        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-3 text-sm text-muted">Daily and weekly alerts run when your scheduler calls /api/cron/job-alerts. You can also run them now.</p>
          <RunAlerts />
        </div>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}
